import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { capturePreview } from './preview.mjs';
import { readJson,writeJson } from './lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),pack=path.join(repository,'examples/original-vfx/RP');
const cases=[
 ['shockwave',[0.05,0.35,0.75,0.95],[13,12,15],[0,1,0]],
 ['flame',[0.1,0.8,1.7,2.9],[2.8,1.8,3],[0,0.7,0]],
 ['vortex',[0.1,0.8,1.8,2.7],[9,7,12],[0,3.2,0]],
 ['blizzard_snow',[0.1,2,4.5,8.1],[24,17,27],[0,5,0]],
 ['blizzard_gust',[0.1,2,4.5,6.6],[24,17,27],[0,5,0]],
 ['portal_ring',[0.1,1.3,2.5,4.1],[6,5,10],[0,3,0]],
 ['portal_core',[0.1,1.3,2.5,4.1],[6,5,10],[0,3,0]],
 ['portal_motes',[0.1,1.3,2.5,4.1],[6,5,10],[0,3,0]],
 ['lightning',[0.02,0.08,0.16,0.3],[9,7,13],[0,3,0]],
 ['beam',[0.05,0.18,0.35,0.6],[8,6,8],[0,1,0]],
 ['explosion_sparks',[0.05,0.3,0.6,1.1],[8,6,10],[0,1,0]],
 ['explosion_smoke',[0.1,0.8,1.6,2.4],[8,6,10],[0,1,0]],
 ['debris',[0.1,0.5,1.1,1.7],[8,6,10],[0,1,0]],
 ['slash',[0.02,0.1,0.2,0.4],[5,3,7],[0,1.4,0]],
 ['trail',[0.05,0.2,0.5,0.9],[2.8,1.8,3],[0,0.5,0]],
 ['water',[0.05,0.3,0.8,1.3],[5,3,7],[0,0.5,0]],
 ['dust',[0.1,0.8,2,3.8],[6,3,8],[0,0.5,0]],
 ['cinematic',[0.05,0.35,1,2.6],[13,12,15],[0,1,0]]
];
const summaries=[];
const only=process.argv.includes('--only')?process.argv[process.argv.indexOf('--only')+1].split(','):null;
for(const [name,times,camera,target] of cases) {
  if(only && !only.includes(name))continue;
  const out=name==='shockwave'?path.join(repository,'evidence/demo/final'):path.join(repository,'evidence/previews',name);
  const report=await capturePreview({pack,effect:'pm:'+name,times,camera,target,out});
  summaries.push({name,out:path.relative(repository,out).replaceAll('\\','/'),rendered:report.rendered,particles:report.captures.map(c=>c.particles),previewVerified:false});
  console.log(JSON.stringify(summaries.at(-1)));
}
const sequences=readJson(path.join(repository,'examples/original-vfx/sequences.json'));
for(const [name,cues] of Object.entries(sequences)) {
  if(only && !only.includes(name+'-combined'))continue;
  const times=name==='portal'?[0.1,1.3,2.5,4.1]:name==='blizzard'?[0.1,2,4.5,8.1]:name==='boss'?[0.1,1.55,1.9,4.2]:[0.05,0.35,1,2.6];
  const out=path.join(repository,'evidence/previews',name+'-combined');
  const report=await capturePreview({pack,effect:name,cues,times,camera:name==='blizzard'?[24,17,27]:[13,12,15],target:name==='blizzard'?[0,5,0]:[0,2,0],out});
  summaries.push({name:name+'-combined',out:path.relative(repository,out).replaceAll('\\','/'),rendered:report.rendered,particles:report.captures.map(c=>c.particles),previewVerified:false});console.log(JSON.stringify(summaries.at(-1)));
}
const summaryFile=path.join(repository,'evidence/preview-summary.json');
const previous=fs.existsSync(summaryFile)?readJson(summaryFile).captures:[];
writeJson(summaryFile,{captures:[...previous.filter(x=>!summaries.some(y=>y.name===x.name)),...summaries],minecraftRuntimeVerified:false});
