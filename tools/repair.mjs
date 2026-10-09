import fs from 'node:fs';
import path from 'node:path';
import { readJson,writeJson } from './lib/io.mjs';
import { validateParticle } from './lib/validate.mjs';
import { inspectPng } from './lib/texture.mjs';
import { diffJson } from './lib/report.mjs';
export function repairParticle(original,{texturePath=null,textureBytes=null,fitFlipbook=false}={}) {
  const json=structuredClone(original),c=json.particle_effect.components;
  if(texturePath) {
    if(!textureBytes)throw new Error('A verified replacement PNG is required');
    inspectPng(textureBytes);
    json.particle_effect.description.basic_render_parameters.texture=texturePath;
  }
  const uv=c['minecraft:particle_appearance_billboard']?.uv,f=uv?.flipbook;
  if(fitFlipbook && f) {
    const values=[uv.texture_width,uv.texture_height,...f.base_UV,...f.size_UV,...f.step_UV];
    if(values.some(v=>typeof v!=='number' || !Number.isFinite(v)))throw new Error('Cannot repair expression-driven UV coordinates automatically');
    const fits=i=>{const x=f.base_UV[0]+i*f.step_UV[0],y=f.base_UV[1]+i*f.step_UV[1];return x>=0 && y>=0 && x+f.size_UV[0]<=uv.texture_width && y+f.size_UV[1]<=uv.texture_height;};
    let frames=0;while(frames<4096 && fits(frames))frames++;
    if(frames===0 || frames===4096)throw new Error('Flipbook has no finite safe linear frame range');
    f.max_frame=frames;
  }
  const report=validateParticle(json,{texture:textureBytes?inspectPng(textureBytes):null});
  return {json,changes:diffJson(original,json),report,limitation:'Only explicit verified texture substitution and constant linear UV capacity are corrected. MoLang intent is never guessed.'};
}
if(process.argv[1]?.endsWith('repair.mjs')) {
  const args=process.argv.slice(2),option=flag=>args[args.indexOf(flag)+1];
  try {
    if(!args[0] || !args.includes('--out'))throw new Error('Usage: node tools/repair.mjs input.json --out repaired.json [--texture-path textures/particle/name --texture png] [--fit-flipbook]');
    const result=repairParticle(readJson(args[0]),{texturePath:args.includes('--texture-path')?option('--texture-path'):null,textureBytes:args.includes('--texture')?fs.readFileSync(option('--texture')):null,fitFlipbook:args.includes('--fit-flipbook')});
    if(path.resolve(args[0])===path.resolve(option('--out')))throw new Error('Repair writes a reviewable copy; output must differ from input');
    writeJson(option('--out'),result.json);writeJson(option('--out')+'.report.json',{changes:result.changes,report:result.report});
    console.log(JSON.stringify({ok:result.report.ok,changes:result.changes},null,2));if(!result.report.ok)process.exitCode=1;
  }catch(e){console.error(e.message);process.exitCode=1;}
}
