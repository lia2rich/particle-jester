import fs from 'node:fs';
import path from 'node:path';
import { readJson,hash,readAssets } from './io.mjs';
import { previewPayload } from '../preview/server.mjs';
export function auditPreviewEvidence(directory,pack) {
  const issues=[],captureFile=path.join(directory,'capture-report.json'),inspectionFile=path.join(directory,'inspection.json');
  if(!fs.existsSync(captureFile) || !fs.existsSync(inspectionFile))return {previewVerified:false,issues:['Capture or inspection report missing']};
  const capture=readJson(captureFile),inspection=readJson(inspectionFile);
  if(!capture.rendered || capture.browserErrors.length)issues.push('Renderer did not complete cleanly');
  if(inspection.captureReportSha256!==hash(fs.readFileSync(captureFile)))issues.push('Inspection does not bind the current capture report');
  if(!inspection.reviewer || !inspection.reviewedAt || !inspection.criteria || !['shape','color','motion','scale','opacity','density','timing'].every(key=>inspection.criteria[key]?.passed===true && inspection.criteria[key]?.notes))issues.push('Visual criteria/notes are incomplete');
  for(const item of capture.captures || []) {
    const file=path.resolve(directory,item.file),rel=path.relative(directory,file);
    if(rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(file) || hash(fs.readFileSync(file))!==item.sha256)issues.push(`Screenshot missing/changed: ${item.file}`);
  }
  const payload=previewPayload(pack,capture.cues,capture.variables,capture.seed);
  const cueIds=new Set(capture.cues.map(c=>c.effect));
  function children(value) {
    if(!value || typeof value!=='object')return;
    const id=value.particle_effect?.effect;
    if(id && !cueIds.has(id)){cueIds.add(id);children(payload.definitions[id]?.particle_effect.events);}
    for(const child of Object.values(value))children(child);
  }
  for(const id of [...cueIds])children(payload.definitions[id]?.particle_effect.events);
  for(const id of cueIds) {
    const json=payload.definitions[id];
    if(!json){issues.push(`Subeffect missing: ${id}`);continue;}
    if(capture.definitionHashes[id]!==hash(Buffer.from(JSON.stringify(json))))issues.push(`Definition changed after capture: ${id}`);
    const name=json.particle_effect.description.basic_render_parameters.texture;
    if(!payload.textures[name]){issues.push(`Texture missing: ${name}`);continue;}
    if(capture.textureHashes?.[name]!==hash(Buffer.from(payload.textures[name].split(',')[1],'base64')))issues.push(`Texture changed/unbound after capture: ${name}`);
  }
  if((capture.captures || []).length<4)issues.push('Need beginning, middle, peak and end captures');
  return {previewVerified:issues.length===0,issues,engine:capture.engine,inspection:inspectionFile,minecraftRuntimeVerified:false};
}
export function auditRuntimeEvidence(evidenceFile,{pack=null}={}) {
  if(!fs.existsSync(evidenceFile))return {minecraftRuntimeVerified:false,evidencePresent:false,issues:['No Minecraft runtime evidence supplied']};
  const evidence=readJson(evidenceFile),issues=[],base=path.dirname(evidenceFile);
  if(!evidence.version || !evidence.device || !evidence.reviewer || !evidence.testNarrative || evidence.reviewPassed!==true)issues.push('Version/device/reviewer/test narrative/pass judgment required');
  if(evidence.performedInMinecraft!==true || !evidence.testedEffects?.length)issues.push('Explicit performed-in-game attestation and tested effect IDs required');
  if(pack)for(const [name,bytes] of readAssets(pack))if(evidence.artifactHashes?.[name]!==hash(bytes))issues.push(`Runtime artifact missing/changed: ${name}`);
  for(const name of [evidence.contentLog,...(evidence.screenshots || [])]) {
    if(!name){issues.push('Required evidence path missing');continue;}
    const file=path.resolve(base,name),relative=path.relative(base,file);
    if(relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(file)){issues.push('Evidence path missing or outside evidence folder');continue;}
    if(evidence.hashes?.[name]!==hash(fs.readFileSync(file)))issues.push(`Runtime evidence hash missing/changed: ${name}`);
  }
  if(!evidence.screenshots?.length)issues.push('No runtime screenshots supplied');
  return {minecraftRuntimeVerified:issues.length===0,evidencePresent:true,issues,testedEffects:evidence.testedEffects || [],testedSequences:evidence.testedSequences || [],scope:'Reviewer-attested runtime evidence bound to supplied artifacts; this auditor is not the game and does not infer unlisted behaviors from file presence'};
}
