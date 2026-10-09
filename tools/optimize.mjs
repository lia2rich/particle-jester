import path from 'node:path';
import { readAssets,writeJson } from './lib/io.mjs';
import { diffJson } from './lib/report.mjs';
export function scaleParticle(original,multiplier) {
  if(!Number.isFinite(multiplier) || multiplier<0.1 || multiplier>3)throw new Error('Multiplier must be 0.1 to 3');
  const json=structuredClone(original),c=json.particle_effect.components;
  for(const key of ['minecraft:emitter_rate_steady','minecraft:emitter_rate_instant','minecraft:emitter_rate_manual']) {
    const component=c[key];if(!component)continue;
    for(const field of ['spawn_rate','max_particles','num_particles'])if(component[field]!==undefined) {
      const value=component[field];
      component[field]=typeof value==='number'?Math.max(1,Math.round(value*multiplier)):`(${value}) * ${multiplier}`;
    }
  }
  return {json,changes:diffJson(original,json),previewVerified:false,limitation:'Counts/caps only. Appearance equivalence requires side-by-side preview and runtime profiling.'};
}
if(process.argv[1]?.endsWith('optimize.mjs')) {
  const [input,out,multiplier]=process.argv.slice(2);
  if(!out)throw new Error('Usage: node tools/optimize.mjs input.json output.json 0.5');
  const result=scaleParticle(JSON.parse([...readAssets(path.dirname(input))].find(([p])=>p===path.basename(input))[1].toString()),Number(multiplier));
  if(path.resolve(input)===path.resolve(out))throw new Error('Output must differ from input');
  writeJson(out,result.json);writeJson(out+'.report.json',{changes:result.changes,previewVerified:false,limitation:result.limitation});console.log(JSON.stringify({changes:result.changes},null,2));
}
