import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { PNG } from 'pngjs';
import { scan,trace } from '../tools/lib/scan.mjs';
import { readJson,writeJson,readAssets,hash,packageDirectory } from '../tools/lib/io.mjs';
import { analyzeExpression } from '../tools/lib/molang.mjs';
import { validateParticle } from '../tools/lib/validate.mjs';
import { inspectPng,uvMetadata } from '../tools/lib/texture.mjs';
import { repairParticle } from '../tools/repair.mjs';
import { scaleParticle } from '../tools/optimize.mjs';
import { diffJson,buildKnowledgeIndex,searchIndex } from '../tools/lib/report.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),temp=path.join(repository,'work','test-fixtures');
fs.mkdirSync(temp,{recursive:true});
const rp=path.join(repository,'examples/original-vfx/RP'),shockwave=readJson(path.join(rp,'particles/shockwave.particle.json'));
const pngBytes=fs.readFileSync(path.join(rp,'textures/particle/pm/ring.png'));
export function traceFixture(root=path.join(temp,'trace')) {
  fs.mkdirSync(root,{recursive:true});
  writeJson(path.join(root,'particles/shockwave.json'),shockwave);
  fs.mkdirSync(path.join(root,'textures/particle/pm'),{recursive:true});fs.writeFileSync(path.join(root,'textures/particle/pm/ring.png'),pngBytes);
  writeJson(path.join(root,'entity/demo.json'),{format_version:'1.10.0','minecraft:client_entity':{description:{identifier:'test:actor',particle_effects:{impact:'pm:shockwave'},animations:{attack:'animation.test.attack',controller:'controller.animation.test.attack'},scripts:{animate:['controller']}}}});
  writeJson(path.join(root,'animations/attack.json'),{format_version:'1.8.0',animations:{'animation.test.attack':{animation_length:1,particle_effects:{'0.5':[{effect:'impact',locator:'origin',bind_to_actor:false}]}}}});
  writeJson(path.join(root,'animation_controllers/attack.json'),{format_version:'1.10.0',animation_controllers:{'controller.animation.test.attack':{initial_state:'default',states:{default:{animations:['attack']}}}}});
  return root;
}
test('original pack contracts, all PNG paths and declared quality bounds agree',()=>{
  const c=scan(rp,{external:['variable.quality'],parameterBounds:{'variable.quality':[0.4,1.5]}});
  assert.equal(c.particles.length,18);assert.equal(c.textures.length,8);assert.equal(c.verification.structurallyValid,true);assert.equal(c.verification.referencesResolved,true);assert.equal(c.verification.staticChecksPassed,true);assert.equal(c.verification.minecraftRuntimeVerified,false);
});
test('component invention and wrong field types fail with actionable paths',()=>{
  const j=structuredClone(shockwave);j.particle_effect.components['minecraft:particle_magic']={power:1};j.particle_effect.components['minecraft:particle_lifetime_expression'].max_lifetime=[];
  const r=validateParticle(j);assert.equal(r.ok,false);assert.ok(r.diagnostics.some(x=>x.code==='SCHEMA' && x.params.additionalProperty==='minecraft:particle_magic'));assert.ok(r.diagnostics.some(x=>x.path.includes('max_lifetime')));
});
test('conflicting emission alternatives are rejected',()=>{
  const j=structuredClone(shockwave);j.particle_effect.components['minecraft:emitter_rate_steady']={spawn_rate:10,max_particles:100};assert.ok(validateParticle(j).diagnostics.some(x=>x.code==='COMPONENT_CONFLICT'));
});
test('malformed MoLang and invented math fail; aliases normalize',()=>{
  assert.ok(analyzeExpression('math.sin(90').issues.some(x=>x.severity==='error'));assert.ok(analyzeExpression('math.magic(1)').issues.some(x=>x.code==='MOLANG_FUNCTION'));
  const r=analyzeExpression('v.radius = 2; return v.radius * math.cos(v.particle_age * 360);');assert.deepEqual(r.writes,['variable.radius']);assert.ok(r.reads.includes('variable.particle_age'));assert.equal(r.issues.length,0);
});
test('operator omission and untrusted JavaScript tokens fail',()=>{
  assert.ok(analyzeExpression('1 2').issues.some(x=>x.severity==='error'));assert.ok(analyzeExpression('process.exit()').issues.length>0);assert.ok(analyzeExpression('variable.x + @').issues.some(x=>x.code==='MOLANG_TOKEN'));
});
test('unknown custom producers and unsupported loops remain unverified',()=>{
  const j=structuredClone(shockwave);j.particle_effect.components['minecraft:particle_initial_speed']='variable.missing';const r=validateParticle(j);assert.equal(r.staticChecksPassed,false);assert.ok(r.variables.unknown.includes('variable.missing'));
  assert.equal(analyzeExpression('loop(3, { variable.x = 1; });').parser,'unsupported');
});
test('PNG alpha and painted bounds are measured from pixels',()=>{
  const p=inspectPng(pngBytes);assert.equal(p.width,128);assert.equal(p.height,128);assert.ok(p.alpha.transparent>10000);assert.ok(p.alpha.partial>0);assert.equal(p.sha256,hash(pngBytes));assert.ok(p.visibleBounds[0]>0);
});
test('scaled UV coordinates are legal; frame count fits eight cells',()=>{
  const uv=uvMetadata({uv:{texture_width:16,texture_height:128,flipbook:{base_UV:[0,0],size_UV:[16,16],step_UV:[0,16],max_frame:8}}},{width:32,height:256});
  assert.equal(uv.frameCount,8);assert.equal(uv.lastFrame,7);assert.equal(uv.issues.length,0);assert.deepEqual(uv.frames[7].pixels,[0,224,32,32]);
});
test('overflowing and negative-step UVs are handled correctly',()=>{
  const overflow=uvMetadata({uv:{texture_width:32,texture_height:256,flipbook:{base_UV:[0,0],size_UV:[32,32],step_UV:[0,32],max_frame:9}}});assert.ok(overflow.issues.some(x=>x.code==='UV_OUT_OF_BOUNDS'));
  const reverse=uvMetadata({uv:{texture_width:64,texture_height:16,flipbook:{base_UV:[48,0],size_UV:[16,16],step_UV:[-16,0],max_frame:4}}});assert.equal(reverse.issues.length,0);
});
test('missing named particle events fail',()=>{
  const j=structuredClone(shockwave);j.particle_effect.components['minecraft:particle_lifetime_events']={expiration_event:'missing'};assert.ok(validateParticle(j).diagnostics.some(x=>x.code==='EVENT_MISSING'));
});
test('source animation aliases and controller edges resolve by owner',()=>{
  const c=scan(traceFixture());const graph=trace(c,'pm:shockwave');assert.equal(graph.found,true);assert.ok(graph.edges.some(e=>e.relation==='particle-trigger-alias' && e.to));assert.ok(graph.edges.some(e=>e.relation==='controller-animation' && e.to));assert.ok(graph.nodes.some(n=>n.kind==='client-entity'));assert.ok(graph.edges.some(e=>e.triggerDetails?.locator==='origin'));
});
test('texture casing mismatch is reported without silently resolving',()=>{
  const root=path.join(temp,'case');writeJson(path.join(root,'particles/test.json'),shockwave);fs.mkdirSync(path.join(root,'textures/particle/pm'),{recursive:true});fs.writeFileSync(path.join(root,'textures/particle/pm/Ring.png'),pngBytes);assert.equal(scan(root).particles[0].textureResolution.status,'case-mismatch');
});
test('explicit overlay resolves a missing texture and records scope',()=>{
  const root=path.join(temp,'missing');writeJson(path.join(root,'particles/test.json'),shockwave);const c=scan(root,{overlays:[rp]});assert.equal(c.particles[0].textureResolution.status,'resolved');assert.equal(c.particles[0].textureResolution.chosen.scope,'explicit-overlay');
});
test('duplicate identifiers are preserved as ambiguity',()=>{
  const root=traceFixture(path.join(temp,'duplicate'));writeJson(path.join(root,'particles/copy.json'),shockwave);const c=scan(root);assert.equal(c.duplicates.length,1);assert.ok(c.graph.edges.some(e=>e.confidence==='ambiguous'));
});
test('safe archive inventory and roundtrip packaging work',()=>{
  const output=path.join(temp,'original.mcpack');const report=packageDirectory(rp,output);assert.ok(report.files>20);assert.equal(readAssets(output).size,readAssets(rp).size);
});
test('archive traversal, corrupted PNGs and malformed JSON fail honestly',()=>{
  const bad=path.join(temp,'bad.zip');fs.writeFileSync(bad,zipSync({'../outside.json':Buffer.from('{}')}));assert.throws(()=>readAssets(bad),/Unsafe/);assert.throws(()=>inspectPng(Buffer.from('not png')));
  const root=path.join(temp,'bad-json');fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'broken.json'),'{');assert.ok(scan(root).problems.some(x=>x.code==='JSON_PARSE'));
});
test('Script API literal and dynamic spawn calls are differentiated',()=>{
  const root=traceFixture(path.join(temp,'script'));fs.mkdirSync(path.join(root,'scripts'),{recursive:true});fs.writeFileSync(path.join(root,'scripts/spawn.js'),"dimension.spawnParticle('pm:shockwave', origin); dimension.spawnParticle(cue.effect, origin);");const c=scan(root);assert.ok(c.graph.edges.some(e=>e.relation==='script-spawn' && e.to));assert.ok(c.graph.edges.some(e=>e.relation==='script-spawn' && e.confidence==='dynamic-expression'));
});
test('quality upper bounds estimate density, while absent bounds remain unknown',()=>{
  const flame=readJson(path.join(rp,'particles/flame.particle.json'));const a=validateParticle(flame,{external:['variable.quality'],parameterBounds:{'variable.quality':[0.4,1.5]}});assert.equal(a.performance.estimatedPeakLive,29);assert.equal(a.staticChecksPassed,true);const b=validateParticle(flame,{external:['variable.quality']});assert.equal(b.performance.estimatedPeakLive,null);assert.equal(b.staticChecksPassed,false);
});
test('safe repair fits the atlas without changing MoLang intent',()=>{
  const flame=readJson(path.join(rp,'particles/flame.particle.json'));flame.particle_effect.components['minecraft:particle_appearance_billboard'].uv.flipbook.max_frame=200;const r=repairParticle(flame,{fitFlipbook:true});assert.equal(r.json.particle_effect.components['minecraft:particle_appearance_billboard'].uv.flipbook.max_frame,8);assert.equal(r.changes.length,1);
});
test('density scaling preserves shape, timing, colors and motion',()=>{
  const source=readJson(path.join(rp,'particles/explosion_sparks.particle.json'));const r=scaleParticle(source,0.5);assert.equal(r.json.particle_effect.components['minecraft:emitter_rate_instant'].num_particles,48);assert.deepEqual(r.json.particle_effect.components['minecraft:particle_motion_dynamic'],source.particle_effect.components['minecraft:particle_motion_dynamic']);assert.equal(r.changes.length,1);assert.equal(r.previewVerified,false);
});
test('knowledge retrieval finds source-linked pattern text and diff reports changes',()=>{
  const index=buildKnowledgeIndex(path.join(repository,'references'));assert.ok(searchIndex(index,'shockwave').length>0);assert.deepEqual(diffJson({a:1},{a:2})[0],{path:'/a',before:1,after:2,change:'modified'});
});
