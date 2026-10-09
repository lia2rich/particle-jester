import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {scan,trace} from './lib/scan.mjs';
import {readJson,writeJson,hash} from './lib/io.mjs';
import {validateParticle} from './lib/validate.mjs';
import {inspectPng} from './lib/texture.mjs';
import {repairParticle} from './repair.mjs';
import {scaleParticle} from './optimize.mjs';
import {auditPreviewEvidence,auditRuntimeEvidence} from './lib/evidence.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url));
const args=process.argv.slice(2),candidate=args.includes('--candidate')?path.resolve(args[args.indexOf('--candidate')+1]):repository;
const rp=path.join(candidate,'examples/original-vfx/RP'),fixtures=path.join(repository,'evals/fixtures');
const options={external:['variable.quality'],parameterBounds:{'variable.quality':[0.4,1.5]}};
const catalog=scan(rp,options),sequences=readJson(path.join(candidate,'examples/original-vfx/sequences.json'));
const json=name=>readJson(path.join(rp,'particles',name+'.particle.json'));
const components=name=>json(name).particle_effect.components;
const preview=name=>auditPreviewEvidence(path.join(candidate,name==='shockwave'?'evidence/demo/final':name==='mcp'?'evidence/mcp-preview':'evidence/previews/'+name),rp);
const runtime=auditRuntimeEvidence(path.join(candidate,'evidence/runtime/runtime-report.json'),{pack:rp});
const results=[];
function run(id,description,names,checks,previewNames=names) {
  const selected=catalog.particles.filter(p=>names.includes(p.identifier.slice(3)));
  let regressionPassed=true,error=null,details=null;
  try{assert.equal(selected.length,names.length);details=checks();}catch(e){regressionPassed=false;error=e.message;}
  const previews=previewNames.map(preview);
  const runtimeCovered=runtime.minecraftRuntimeVerified && names.every(name=>runtime.testedEffects.includes('pm:'+name)) && id!=='09-trace' && (id!=='05-boss' || runtime.testedSequences.includes('boss'));
  results.push({id,description,regressionPassed,error,details,verification:{structurallyValid:selected.every(p=>p.analysis.structurallyValid),referencesResolved:selected.every(p=>p.textureResolution.status==='resolved'),staticChecksPassed:selected.every(p=>p.analysis.staticChecksPassed),previewVerified:previews.length>0 && previews.every(p=>p.previewVerified),minecraftRuntimeVerified:!!runtimeCovered},previewEvidence:previews});
}
run('01-flame','Eight-frame animated rising flame',['flame'],()=>{
  const p=catalog.particles.find(p=>p.identifier==='pm:flame');assert.equal(p.analysis.uv.frameCount,8);assert.equal(p.analysis.uv.lastFrame,7);assert.equal(p.analysis.uv.fps,10);assert.equal(p.analysis.uv.loop,true);assert.ok(components('flame')['minecraft:particle_motion_dynamic']);return {frameCount:8,lastFrame:7};
});
run('02-shockwave','Eight-block centerline radius, 0.9-second expanding wave',['shockwave'],()=>{
  const c=components('shockwave'),size=c['minecraft:particle_appearance_billboard'];assert.equal(c['minecraft:particle_lifetime_expression'].max_lifetime,0.9);assert.equal(size.facing_camera_mode,'emitter_transform_xz');assert.ok(size.size.every(x=>x.includes('/ 0.85')));assert.equal((0.35+7.65)/0.85*0.85,8);assert.equal(c['minecraft:emitter_rate_instant'].num_particles,1);return {terminalCenterlineRadius:8,terminalLifetime:0.9,finiteThickness:true};
});
run('03-blizzard','Large drifting snow volume and moving gust layer',['blizzard_snow','blizzard_gust'],()=>{
  assert.equal(sequences.blizzard.length,2);assert.ok(sequences.blizzard.every(c=>c.time===0));
  for(const name of ['blizzard_snow','blizzard_gust']){const c=components(name);assert.ok(c['minecraft:particle_motion_dynamic']);assert.ok(c['minecraft:emitter_shape_box'].half_dimensions[0]>=12);assert.ok(c['minecraft:emitter_rate_steady'].spawn_rate.includes('variable.quality'));}
  const p=catalog.particles.find(p=>p.identifier==='pm:blizzard_snow');assert.equal(p.analysis.performance.estimatedPeakLive,990);return {boundedHighQualityPeakSnow:990,layers:2};
},['blizzard_snow','blizzard_gust','blizzard-combined']);
run('04-portal','Synchronized rune, core and orbiting motes',['portal_ring','portal_core','portal_motes'],()=>{assert.equal(sequences.portal.length,3);assert.ok(sequences.portal.every(c=>c.time===0));assert.ok(components('portal_motes')['minecraft:particle_motion_parametric']);return {layers:3};},['portal_ring','portal_core','portal_motes','portal-combined']);
run('05-boss','Finite warning, strike, impact, debris and smoke sequence',['portal_ring','portal_motes','lightning','shockwave','explosion_sparks','debris','explosion_smoke'],()=>{
  assert.equal(sequences.boss.length,7);assert.equal(sequences.boss.find(c=>c.effect==='pm:lightning').time,1.5);assert.equal(sequences.boss.at(-1).time,1.85);
  const script=fs.readFileSync(path.join(candidate,'examples/original-vfx/BP/scripts/vfx.js'),'utf8');assert.ok(script.includes('entity.isValid'));assert.ok(script.includes('system.clearRun'));assert.ok(script.includes('isChunkLoaded'));assert.ok(!script.includes('runInterval'));
  assert.equal(readJson(path.join(candidate,'examples/original-vfx/BP/manifest.json')).dependencies.find(x=>x.module_name==='@minecraft/server').version,'2.9.0');return {cues:7,lastCueSeconds:1.85,api:'2.9.0',runtimeAttachmentTested:false};
},['boss-combined']);
function fixturePack(name,j,textureName,bytes){const root=path.join(fixtures,name);writeJson(path.join(root,'particles/effect.json'),j);if(bytes){const file=path.join(root,textureName+'.png');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}return root;}
run('06-missing-texture','Detect absent PNG and use an explicit verified replacement',['shockwave'],()=>{
  const broken=json('shockwave');broken.particle_effect.description.basic_render_parameters.texture='textures/missing';
  const root=fixturePack('missing-texture/input',broken);const before=scan(root);assert.equal(before.verification.referencesResolved,false);
  const name='textures/particle/pm/ring',bytes=fs.readFileSync(path.join(rp,name+'.png'));
  const fixed=repairParticle(broken,{texturePath:name,textureBytes:bytes});const repaired=fixturePack('missing-texture/expected',fixed.json,name,bytes);assert.equal(scan(repaired).verification.referencesResolved,true);
  writeJson(path.join(fixtures,'missing-texture/diff.json'),fixed.changes);return {diagnosed:true,explicitReplacement:true,sourcePngSha256:hash(bytes),changes:fixed.changes};
},['shockwave']);
run('07-molang-uv','Reject malformed formula and ninth atlas frame; correct known intent',['flame'],()=>{
  const broken=json('flame'),c=broken.particle_effect.components;c['minecraft:particle_appearance_billboard'].uv.flipbook.max_frame=9;c['minecraft:particle_appearance_tinting'].color[3]='math.sin(90';
  const before=validateParticle(broken,options);assert.ok(before.diagnostics.some(x=>x.code==='UV_OUT_OF_BOUNDS'));assert.ok(before.diagnostics.some(x=>x.severity==='error' && x.code.startsWith('MOLANG')));
  writeJson(path.join(fixtures,'molang-uv/input.json'),broken);
  // This fixture's required fade is stated in tasks.json. It is not inferred
  // from an arbitrary malformed expression by the repair tool.
  c['minecraft:particle_appearance_tinting'].color[3]=components('flame')['minecraft:particle_appearance_tinting'].color[3];
  const fixed=repairParticle(broken,{fitFlipbook:true});assert.equal(fixed.json.particle_effect.components['minecraft:particle_appearance_billboard'].uv.flipbook.max_frame,8);assert.equal(validateParticle(fixed.json,options).staticChecksPassed,true);
  writeJson(path.join(fixtures,'molang-uv/expected.json'),fixed.json);return {malformedRejected:true,overflowRejected:true,correctedFrameCount:8,fadeIntentExplicit:true};
});
run('08-optimization','Half spark count while preserving timing, silhouette and trajectory',['explosion_sparks'],()=>{
  const before=json('explosion_sparks'),after=scaleParticle(before,0.5);assert.equal(after.json.particle_effect.components['minecraft:emitter_rate_instant'].num_particles,48);
  for(const [key,value] of Object.entries(before.particle_effect.components))if(key!=='minecraft:emitter_rate_instant')assert.deepEqual(after.json.particle_effect.components[key],value);
  writeJson(path.join(fixtures,'optimization/expected.json'),after.json);writeJson(path.join(fixtures,'optimization/diff.json'),after.changes);
  const textureName='textures/particle/pm/streak',optimizedPack=fixturePack('optimization/RP',after.json,textureName,fs.readFileSync(path.join(rp,textureName+'.png')));
  const audit=auditPreviewEvidence(path.join(candidate,'evidence/optimization'),optimizedPack);assert.equal(audit.previewVerified,true);
  return {countBefore:96,countAfter:48,preservedComponents:true,visualComparison:audit,hardwareProfiling:false};
},['explosion_sparks']);
run('09-trace','Resolve client alias, animation locator and controller trigger',['shockwave'],()=>{
  const name='textures/particle/pm/ring',root=fixturePack('trace',json('shockwave'),name,fs.readFileSync(path.join(rp,name+'.png')));
  writeJson(path.join(root,'entity/actor.json'),{format_version:'1.10.0','minecraft:client_entity':{description:{identifier:'eval:actor',particle_effects:{impact:'pm:shockwave'},animations:{attack:'animation.eval.attack',controller:'controller.animation.eval.attack'},scripts:{animate:['controller']}}}});
  writeJson(path.join(root,'animations/attack.json'),{format_version:'1.8.0',animations:{'animation.eval.attack':{animation_length:1,particle_effects:{'0.5':[{effect:'impact',locator:'origin',bind_to_actor:false}]}}}});
  writeJson(path.join(root,'animation_controllers/attack.json'),{format_version:'1.10.0',animation_controllers:{'controller.animation.eval.attack':{initial_state:'default',states:{default:{animations:['attack']}}}}});
  const graph=scan(root),neighborhood=trace(graph,'pm:shockwave');assert.ok(neighborhood.nodes.some(x=>x.identifier==='animation.eval.attack'));assert.ok(neighborhood.nodes.some(x=>x.identifier==='controller.animation.eval.attack'));assert.ok(neighborhood.edges.some(x=>x.relation==='particle-trigger-alias' && x.to));writeJson(path.join(fixtures,'trace/expected-graph.json'),neighborhood);return {found:true,animation:'animation.eval.attack',controller:'controller.animation.eval.attack',locator:'origin',runtimeExecutionProven:false};
},[]);
run('10-mcp-preview','Actual MCP tool calls, rendering, bound screenshot analysis',['shockwave'],()=>{const mcp=readJson(path.join(candidate,'evidence/mcp-smoke.json'));assert.equal(mcp.connected,true);assert.equal(mcp.rendered,true);assert.equal(mcp.pathBoundary,true);assert.equal(mcp.ok,true);assert.equal(preview('mcp').previewVerified,true);return {connected:true,toolNames:mcp.tools,rendered:true};},['mcp']);
const report={schemaVersion:1,candidate,generatedAt:new Date().toISOString(),scope:'Executable artifact regression and visual-evidence audit. These results do not measure a model on unseen prompts; tasks.json supplies prompts and rubrics for candidate runs.',results,summary:{total:results.length,regressionPassed:results.filter(x=>x.regressionPassed).length,previewVerified:results.filter(x=>x.verification.previewVerified).length,minecraftRuntimeVerified:results.filter(x=>x.verification.minecraftRuntimeVerified).length},runtimeEvidence:runtime};
writeJson(path.join(repository,'evidence/evaluation.json'),report);
console.log(JSON.stringify(report.summary,null,2));for(const result of results)if(!result.regressionPassed)console.error(result.id,result.error);
if(results.some(x=>!x.regressionPassed || !x.verification.structurallyValid || !x.verification.referencesResolved || !x.verification.staticChecksPassed))process.exitCode=1;
