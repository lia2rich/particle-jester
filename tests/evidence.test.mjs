import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {zipSync} from 'fflate';
import {readJson,writeJson,readAssets} from '../tools/lib/io.mjs';
import {auditPreviewEvidence,auditRuntimeEvidence} from '../tools/lib/evidence.mjs';
import {catalogSchema,evaluationSchema,inspectionSchema} from '../tools/lib/contracts.mjs';
import {scan} from '../tools/lib/scan.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),rp=path.join(repository,'examples/original-vfx/RP');
test('visual evidence audit approves reviewed frames and rejects changed pixels',()=>{
 const out=path.join(repository,'work/evidence-test');fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(repository,'evidence/demo/final'),out,{recursive:true});
 assert.equal(auditPreviewEvidence(out,rp).previewVerified,true);
 const report=readJson(path.join(out,'capture-report.json'));fs.appendFileSync(path.join(out,report.captures[0].file),'tamper');assert.equal(auditPreviewEvidence(out,rp).previewVerified,false);
});
test('cinematic evidence is invalidated by a changed child definition',()=>{
 const modified=path.join(repository,'work/evidence-child-RP');fs.mkdirSync(modified,{recursive:true});fs.cpSync(rp,modified,{recursive:true});
 const file=path.join(modified,'particles/explosion_sparks.particle.json'),j=readJson(file);j.particle_effect.components['minecraft:emitter_rate_instant'].num_particles=93;writeJson(file,j);
 const result=auditPreviewEvidence(path.join(repository,'evidence/previews/cinematic'),modified);assert.equal(result.previewVerified,false);assert.ok(result.issues.some(x=>x.includes('pm:explosion_sparks')));
});
test('missing runtime evidence remains unperformed',()=>{
 assert.equal(auditRuntimeEvidence(path.join(repository,'work/nonexistent-runtime.json')).minecraftRuntimeVerified,false);
});
test('normalized duplicate ZIP paths are rejected',()=>{
 const file=path.join(repository,'work/duplicate-path.zip');fs.writeFileSync(file,zipSync({'a/b.txt':Buffer.from('a'),'a\\b.txt':Buffer.from('b')}));assert.throws(()=>readAssets(file),/Duplicate archive path/);
});
test('source and inspection reports satisfy independent metadata contracts',()=>{
 const ajv=new Ajv({strict:false,allErrors:true});for(const [schema,file] of [[catalogSchema,'data/user-evidence/catalog.json'],[inspectionSchema,'evidence/demo/final/inspection.json']]){const validator=ajv.compile(schema),full=path.join(repository,file),value=fs.existsSync(full)?readJson(full):scan(rp,{external:['variable.quality'],parameterBounds:{'variable.quality':[0.4,1.5]}});assert.equal(validator(value),true,JSON.stringify(validator.errors?.slice(0,5)));}
 const invalid={schemaVersion:1,scope:'fixture',results:[],summary:{total:0,regressionPassed:0,previewVerified:0,minecraftRuntimeVerified:0}};assert.equal(ajv.compile(evaluationSchema)(invalid),false);
});
