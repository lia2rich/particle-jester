import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readAssets } from '../lib/io.mjs';
import { scan } from '../lib/scan.mjs';
const repository=fileURLToPath(new URL('../..',import.meta.url));
export function previewPayload(pack, effects, variables={}, seed=47) {
  const assets=readAssets(pack),definitions={},textures={};
  for(const [name,bytes] of assets)if(name.endsWith('.json')){
    const json=JSON.parse(bytes.toString('utf8'));
    if(json.particle_effect)definitions[json.particle_effect.description.identifier]=json;
  }
  const cues=Array.isArray(effects)?effects:[{time:0,effect:effects}];
  for(const cue of cues)if(!definitions[cue.effect])throw new Error(`Missing particle ${cue.effect}`);
  for(const json of Object.values(definitions)){
    const texture=json.particle_effect.description.basic_render_parameters.texture;
    const bytes=assets.get(texture.endsWith('.png')?texture:texture+'.png');
    if(bytes)textures[texture]='data:image/png;base64,'+bytes.toString('base64');
  }
  for(const cue of cues){const texture=definitions[cue.effect].particle_effect.description.basic_render_parameters.texture;if(!textures[texture])throw new Error(`Missing preview texture ${texture}`);}
  return {definitions,textures,cues,variables,seed};
}
export async function startPreviewServer({pack=path.join(repository,'examples/original-vfx/RP'),port=0}={}) {
  const result=await build({entryPoints:[path.join(repository,'tools/preview/browser.mjs')],bundle:true,write:false,format:'esm',platform:'browser'});
  const bundle=result.outputFiles[0].contents;
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Particle Master Studio</title><style>*{box-sizing:border-box}body{margin:0;background:#080f1b;color:#e7eef9;font:15px system-ui}header{padding:18px 28px;border-bottom:1px solid #293a52;display:flex;align-items:center;gap:20px}h1{font-size:20px;margin:0}main{max-width:1020px;margin:24px auto}canvas{display:block;width:100%;aspect-ratio:8/5;border-radius:12px;border:1px solid #293a52}section{display:flex;align-items:center;gap:14px;margin:18px 0}select,button{background:#192b44;color:#e7eef9;border:1px solid #45617f;padding:9px 14px;border-radius:7px}input{flex:1}p{color:#a6bad4;line-height:1.6}.tag{color:#69d5d7}footer{font-size:13px;color:#91a5c0}</style><header><h1>Particle Master Studio</h1><span class="tag">Wintersky preview</span></header><main><section><label for="effects">Effect</label><select id="effects"></select><button id="restart">Restart</button><button id="capture">Save image</button></section><canvas width="960" height="600"></canvas><section><label for="scrub">Time</label><input id="scrub" type="range" min="0" max="8" step="0.05" value="0.45"><span id="time"></span></section><p>Drag to orbit. Scroll to change distance. Inspect early, middle, peak and end frames, then review the effect in Minecraft at its intended scale.</p><footer>This renderer approximates Bedrock. Collisions, lighting, query contexts, actor binding and engine limits require an in-game check.</footer></main><script type="module" src="/preview.js"></script></html>`;
  const catalog=scan(pack),names=catalog.particles.map(p=>p.identifier);
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost');
    const allowed=new Set(['127.0.0.1','localhost','[::1]']);
    const host=request.headers.host?.split(':')[0];
    if(!allowed.has(host)){response.writeHead(403);response.end();return;}
    if(request.method!=='GET'){response.writeHead(405);response.end();return;}
    response.setHeader('Cache-Control','no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    if(url.pathname==='/'){response.setHeader('Content-Type','text/html; charset=utf-8');response.end(html);}
    else if(url.pathname==='/preview.js'){response.setHeader('Content-Type','text/javascript');response.end(bundle);}
    else if(url.pathname==='/effects'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify(names));}
    else if(url.pathname==='/effect'){
      const name=url.searchParams.get('name');
      if(!names.includes(name)){response.writeHead(404);response.end();return;}
      response.setHeader('Content-Type','application/json');
      try{response.end(JSON.stringify(previewPayload(pack,name,{'variable.quality':1})));}catch(e){response.writeHead(422);response.end(JSON.stringify({error:e.message}));}
    } else {response.writeHead(404);response.end();}
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  return {server,url:`http://127.0.0.1:${server.address().port}`};
}
