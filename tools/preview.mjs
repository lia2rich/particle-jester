import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { previewPayload,startPreviewServer } from './preview/server.mjs';
import { readJson,writeJson,hash } from './lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url));
export async function capturePreview({pack=path.join(repository,'examples/original-vfx/RP'),effect='pm:shockwave',cues=null,times=[0.05,0.35,0.6,0.95],camera=[13,12,15],target=[0,1,0],out=path.join(repository,'work/preview'),variables={'variable.quality':1},seed=47,executablePath=null}={}) {
  fs.mkdirSync(out,{recursive:true});
  const server=await startPreviewServer({pack});
  const failures=[];let browser=null;
  try {
    const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
    const executable=executablePath || process.env.PARTICLE_BROWSER || (fs.existsSync(edge)?edge:fs.existsSync(chrome)?chrome:undefined);
    browser=await chromium.launch({headless:true,executablePath:executable,args:['--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1100,height:850}});
    page.on('pageerror',e=>failures.push(e.message));
    await page.goto(server.url);
    await page.waitForFunction(()=>!!window.particlePreview,{timeout:30000});
    await page.evaluate(()=>window.previewBoot);
    const payload=previewPayload(pack,cues || effect,variables,seed);
    await page.evaluate(async data=>window.particlePreview.load(data),payload);
    await page.evaluate(({camera,target})=>window.particlePreview.camera(camera,target),{camera,target});
    const captures=[];
    for(const [i,time] of times.entries()) {
      const state=await page.evaluate(async time=>window.particlePreview.seek(time),time);
      const data=await page.evaluate(()=>window.particlePreview.screenshot());
      const file=`frame-${i}-${time.toFixed(2)}.png`,bytes=Buffer.from(data.split(',')[1],'base64');
      fs.writeFileSync(path.join(out,file),bytes);
      const image=PNG.sync.read(bytes),background=[12,20,36];let changed=0;
      for(let j=0;j<image.data.length;j+=4)if(background.some((c,k)=>Math.abs(image.data[j+k]-c)>35))changed++;
      captures.push({file,time,...state,sha256:hash(bytes),changedPixels:changed});
    }
    const report={schemaVersion:1,engine:'Wintersky 1.3.3 / Three.js r134',source:'https://github.com/JannisX11/wintersky',effect,cues:payload.cues,seed,variables,camera,target,captures,definitionHashes:Object.fromEntries(Object.entries(payload.definitions).map(([id,json])=>[id,hash(Buffer.from(JSON.stringify(json)))])),textureHashes:Object.fromEntries(Object.entries(payload.textures).map(([name,data])=>[name,hash(Buffer.from(data.split(',')[1],'base64'))])),browserErrors:failures,rendered:failures.length===0 && captures.every(c=>c.textureLoaded),previewVerified:false,minecraftRuntimeVerified:false,inspection:'Rendered images still require shape/motion/timing review. This capture command does not automatically approve visual quality.',limitations:['No block collisions or entity query/binding runtime','60 Hz preview differs from engine timing','Wintersky is an approximation, not the Minecraft engine','Seed controls this browser simulation, not Minecraft randomness']};
    writeJson(path.join(out,'capture-report.json'),report);return report;
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.server.close(resolve));}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),option=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
  if(args.includes('--help'))console.log('node tools/preview.mjs --effect pm:shockwave --times 0.05,0.35,0.6,0.95 --camera 13,12,15 --out work/preview [--pack RP] [--sequence sequences.json --name portal] [--browser browser.exe]');
  else {
    try {
      const sequenceFile=option('--sequence',null),name=option('--name',null);
      const report=await capturePreview({pack:option('--pack',undefined),effect:option('--effect','pm:shockwave'),cues:sequenceFile?readJson(sequenceFile)[name]:null,times:option('--times','0.05,0.35,0.6,0.95').split(',').map(Number),camera:option('--camera','13,12,15').split(',').map(Number),target:option('--target','0,1,0').split(',').map(Number),out:option('--out',undefined),executablePath:option('--browser',null)});
      console.log(JSON.stringify({rendered:report.rendered,captures:report.captures,out:option('--out','work/preview'),previewVerified:false,minecraftRuntimeVerified:false},null,2));if(!report.rendered)process.exitCode=1;
    }catch(error){console.error(JSON.stringify({rendered:false,previewVerified:false,error:error.message}));process.exitCode=1;}
  }
}
