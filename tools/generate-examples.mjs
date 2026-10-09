import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { writeJson } from './lib/io.mjs';

const repository=fileURLToPath(new URL('..',import.meta.url));
const root=path.join(repository,'examples','original-vfx');
const rp=path.join(root,'RP'), bp=path.join(root,'BP');
export const age='math.clamp(variable.particle_age / variable.particle_lifetime, 0, 1)';
function sprite(name,width,height,pixel) {
  const png=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const color=pixel(x,y),i=(y*width+x)*4;
    for(let k=0;k<4;k++)png.data[i+k]=Math.max(0,Math.min(255,Math.round(color[k])));
  }
  const file=path.join(rp,'textures','particle','pm',name+'.png');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,PNG.sync.write(png));
}
const rgba=(a,r=255,g=255,b=255)=>[r,g,b,a*255];
export function generateExamples() {
  sprite('soft',32,32,(x,y)=>{const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);return rgba(Math.pow(Math.max(0,1-r),1.7));});
  sprite('ring',128,128,(x,y)=>{const r=Math.hypot((x-63.5)/63.5,(y-63.5)/63.5);return rgba(Math.max(0,1-Math.abs(r-0.85)/0.052));});
  sprite('snow',16,16,(x,y)=>{const dx=x-7.5,dy=y-7.5;return rgba(Math.max(0,1-Math.hypot(dx,dy)/6)*(Math.abs(dx)<1.5 || Math.abs(dy)<1.5 || Math.abs(Math.abs(dx)-Math.abs(dy))<1 ? 1 : 0.15));});
  sprite('streak',16,64,(x,y)=>rgba(Math.max(0,1-Math.abs(x-7.5)/6)*Math.sin(Math.PI*(y+0.5)/64)));
  sprite('flame',32,256,(x,y)=>{const frame=Math.floor(y/32),row=y%32,t=row/31,c=15.5+3*Math.sin(t*6+frame*Math.PI/4),w=2+10*t,r=Math.abs(x-c)/w;return rgba(Math.max(0,1-r)*Math.sin(Math.PI*t),255,120+135*(1-t),55+200*(1-t));});
  sprite('rune',128,128,(x,y)=>{const dx=(x-63.5)/63.5,dy=(y-63.5)/63.5,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),ring=Math.max(0,1-Math.abs(r-0.87)/0.027),inner=Math.max(0,1-Math.abs(r-0.67)/0.015),spoke=r>0.67 && r<0.87 && Math.abs(Math.sin(6*a))<0.08?1:0;return rgba(Math.max(ring,inner,spoke));});
  sprite('arc',64,128,(x,y)=>{const center=31.5+14*Math.sin(Math.floor(y/9)*2.19),distance=Math.abs(x-center);return rgba(Math.max(0,1-distance/2.5));});
  sprite('slash',128,128,(x,y)=>{const dx=(x-63.5)/63.5,dy=(y-63.5)/63.5,r=Math.hypot(dx,dy),theta=Math.atan2(dy,dx),a=Math.max(0,1-Math.abs(r-0.8)/0.07)*Math.max(0,Math.cos(theta*0.65));return rgba(a);});
  writeJson(path.join(rp,'manifest.json'),{format_version:2,header:{name:'Particle Master Original VFX',description:'Original particle examples; target 1.26.50, in-game verification pending',uuid:'03d7857a-294a-4fdd-b771-9cc2046c9a72',version:[1,0,0],min_engine_version:[1,26,50]},modules:[{type:'resources',uuid:'5767e757-ea69-4755-a46e-ae6317be651b',version:[1,0,0]}]});
  const definitions={};
  function effect(name,{texture='soft',material='particles_blend',count=1,rate=null,active=0.01,lifetime=1,size=[0.2,0.2],facing='lookat_xyz',color=[1,1,1,1],shape=null,motion=null,speed=0,extra={},uv=null}) {
    const components={
      ...(rate===null?{'minecraft:emitter_rate_instant':{num_particles:count}}:{'minecraft:emitter_rate_steady':{spawn_rate:rate,max_particles:Math.ceil(rate*(typeof lifetime==='number'?lifetime:3)+16)}}),
      'minecraft:emitter_lifetime_once':{active_time:active},
      [shape?.key || 'minecraft:emitter_shape_point']:shape?.value || {offset:[0,0,0],direction:[0,1,0]},
      'minecraft:particle_lifetime_expression':{max_lifetime:lifetime},
      'minecraft:particle_initial_speed':speed,
      ...(motion?{[motion.key]:motion.value}:{}),
      'minecraft:particle_appearance_billboard':{size,facing_camera_mode:facing,uv:uv || {texture_width:texture==='streak'?16:texture==='arc'?64:texture==='snow'?16:texture==='soft'?32:128,texture_height:texture==='streak'?64:texture==='arc'?128:texture==='snow'?16:texture==='soft'?32:128,uv:[0,0],uv_size:[texture==='streak'?16:texture==='arc'?64:texture==='snow'?16:texture==='soft'?32:128,texture==='streak'?64:texture==='arc'?128:texture==='snow'?16:texture==='soft'?32:128]}},
      'minecraft:particle_appearance_tinting':{color},...extra
    };
    const json={format_version:'1.10.0',particle_effect:{description:{identifier:'pm:'+name,basic_render_parameters:{material,texture:'textures/particle/pm/'+texture}},components}};
    definitions[name]=json;writeJson(path.join(rp,'particles',name+'.particle.json'),json);return json;
  }
  const fade=['0.35','0.85','1',`math.sin(180 * ${age})`];
  const ringSize=`(0.35 + 7.65 * (1 - math.pow(1 - ${age}, 2))) / 0.85`;
  effect('shockwave',{texture:'ring',lifetime:0.9,size:[ringSize,ringSize],facing:'emitter_transform_xz',shape:{key:'minecraft:emitter_shape_point',value:{offset:[0,0.06,0],direction:[0,1,0]}},color:[0.28,0.85,1,`math.pow(1 - ${age}, 0.6)`]});
  effect('flame',{texture:'flame',rate:24,active:2,lifetime:0.8,size:[`0.16 * (1 - 0.6 * ${age})`,`0.28 * (1 - 0.4 * ${age})`],speed:1.1,color:[1,1,1,`1 - ${age}`],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,0.8,0],linear_drag_coefficient:0.3}},uv:{texture_width:32,texture_height:256,flipbook:{base_UV:[0,0],size_UV:[32,32],step_UV:[0,32],frames_per_second:10,max_frame:8,stretch_to_lifetime:false,loop:true}}});
  const height=`(5 * variable.particle_random_2 + 1.5 * ${age})`;
  effect('vortex',{count:96,lifetime:2.5,size:[0.11,0.18],color:fade,motion:{key:'minecraft:particle_motion_parametric',value:{relative_position:[`(0.35 + 0.28 * ${height}) * math.cos(360 * variable.particle_random_1 + 540 * variable.particle_age)`,height,`(0.35 + 0.28 * ${height}) * math.sin(360 * variable.particle_random_1 + 540 * variable.particle_age)`]}}});
  effect('blizzard_snow',{texture:'snow',rate:220,active:5,lifetime:3,size:['0.12 + 0.13 * variable.particle_random_3','0.12 + 0.13 * variable.particle_random_3'],speed:[6,-2,1],shape:{key:'minecraft:emitter_shape_box',value:{offset:[-10,7,0],half_dimensions:[12,7,12],direction:[1,-0.3,0.2]}},color:[0.88,0.94,1,`0.95 * math.sin(180 * ${age})`],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:['1.5 * math.sin(variable.particle_age * 110 + variable.particle_random_1 * 360)',0,'1.2 * math.cos(variable.particle_age * 90 + variable.particle_random_2 * 360)'],linear_drag_coefficient:0.08}}});
  effect('blizzard_gust',{texture:'streak',rate:12,active:5,lifetime:1.4,size:[1.8,0.10],facing:'lookat_xyz',speed:[9,-1,0.8],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,0,0]}},shape:{key:'minecraft:emitter_shape_box',value:{offset:[-10,7,0],half_dimensions:[12,7,12],direction:[1,-0.1,0.1]}},color:[0.7,0.86,1,`0.65 * math.sin(180 * ${age})`]});
  effect('portal_ring',{texture:'rune',lifetime:4,size:[2.7,2.7],facing:'emitter_transform_xy',color:[0.38,0.25,1,`math.sin(180 * ${age})`],motion:{key:'minecraft:particle_motion_parametric',value:{relative_position:[0,3,0],rotation:'variable.particle_age * 24'}}});
  effect('portal_motes',{count:72,lifetime:4,size:[0.09,0.09],color:[0.45,0.7,1,`math.sin(180 * ${age})`],motion:{key:'minecraft:particle_motion_parametric',value:{relative_position:['2.6 * math.cos(variable.particle_random_1 * 360 + variable.particle_age * 120)','3 + 2.6 * math.sin(variable.particle_random_1 * 360 + variable.particle_age * 120)','0.15 * math.sin(variable.particle_age * 180 + variable.particle_random_2 * 360)']}}});
  effect('portal_core',{lifetime:4,size:[2.6,2.6],facing:'emitter_transform_xy',shape:{key:'minecraft:emitter_shape_point',value:{offset:[0,3,0.03],direction:[0,1,0]}},color:[0.32,0.18,0.8,`0.8 * math.sin(180 * ${age})`]});
  effect('lightning',{texture:'arc',lifetime:0.22,size:[0.8,3.5],facing:'lookat_y',shape:{key:'minecraft:emitter_shape_point',value:{offset:[0,3.5,0],direction:[0,1,0]}},color:[0.5,0.7,1,`1 - ${age}`]});
  effect('beam',{texture:'streak',lifetime:0.45,size:[0.16,4],facing:'emitter_transform_xz',shape:{key:'minecraft:emitter_shape_point',value:{offset:[0,1.5,0],direction:[0,1,0]}},color:[0.4,0.85,1,`math.sin(180 * ${age})`]});
  effect('explosion_sparks',{count:96,lifetime:0.9,size:[0.06,0.16],texture:'streak',facing:'direction_y',speed:'3 + variable.particle_random_2 * 7',shape:{key:'minecraft:emitter_shape_sphere',value:{radius:0.3,direction:'outwards',surface_only:true}},color:[1,0.6,0.12,`1 - ${age}`],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,-6,0],linear_drag_coefficient:0.9}}});
  effect('explosion_smoke',{count:24,lifetime:2.2,size:[`0.4 + 1.3 * ${age}`,`0.4 + 1.3 * ${age}`],speed:1.8,shape:{key:'minecraft:emitter_shape_sphere',value:{radius:1,direction:'outwards'}},color:[0.22,0.24,0.28,`0.5 * (1 - ${age})`],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,0.5,0],linear_drag_coefficient:1.2}}});
  effect('debris',{count:20,texture:'snow',lifetime:1.5,size:[0.09,0.09],speed:6,shape:{key:'minecraft:emitter_shape_sphere',value:{radius:0.4,direction:'outwards'}},color:[0.55,0.35,0.18,1],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,-9.8,0]}},extra:{'minecraft:particle_motion_collision':{collision_radius:0.07,coefficient_of_restitution:0.3,collision_drag:0.8,expire_on_contact:false}}});
  effect('slash',{texture:'slash',lifetime:0.28,size:[2.2,2.2],facing:'emitter_transform_xy',color:[0.5,0.8,1,`1 - ${age}`],motion:{key:'minecraft:particle_motion_parametric',value:{relative_position:[0,1.4,0],rotation:'-80 + variable.particle_age * 320'}}});
  effect('trail',{rate:36,active:0.2,lifetime:0.55,size:[`0.14 * (1 - ${age})`,`0.14 * (1 - ${age})`],color:[0.3,0.75,1,`1 - ${age}`]});
  effect('water',{count:40,lifetime:1.1,size:[0.04,0.09],speed:3,shape:{key:'minecraft:emitter_shape_sphere',value:{radius:0.2,direction:'outwards'}},color:[0.4,0.7,1,`1 - ${age}`],motion:{key:'minecraft:particle_motion_dynamic',value:{linear_acceleration:[0,-5,0]}}});
  effect('dust',{rate:20,active:2,lifetime:1.6,size:[`0.12 + 0.2 * ${age}`,`0.12 + 0.2 * ${age}`],speed:[1,0.4,0],shape:{key:'minecraft:emitter_shape_box',value:{half_dimensions:[3,0.1,3],offset:[0,0.2,0],direction:[1,0.2,0]}},color:[0.6,0.45,0.28,`0.3 * math.sin(180 * ${age})`]});
  const cinematic=effect('cinematic',{count:0,active:0.8,lifetime:0.1});
  cinematic.particle_effect.events={wave:{particle_effect:{effect:'pm:shockwave',type:'emitter'}},sparks:{particle_effect:{effect:'pm:explosion_sparks',type:'emitter'}},smoke:{particle_effect:{effect:'pm:explosion_smoke',type:'emitter'}}};
  cinematic.particle_effect.components['minecraft:emitter_lifetime_events']={timeline:{'0.0':'wave','0.08':'sparks','0.2':'smoke'}};
  writeJson(path.join(rp,'particles','cinematic.particle.json'),cinematic);
  const sequences={
    portal:[{time:0,effect:'pm:portal_ring'},{time:0,effect:'pm:portal_core'},{time:0,effect:'pm:portal_motes'}],
    blizzard:[{time:0,effect:'pm:blizzard_snow'},{time:0,effect:'pm:blizzard_gust'}],
    explosion:[{time:0,effect:'pm:shockwave'},{time:0,effect:'pm:explosion_sparks'},{time:0.08,effect:'pm:debris'},{time:0.15,effect:'pm:explosion_smoke'}],
    boss:[{time:0,effect:'pm:portal_ring'},{time:0,effect:'pm:portal_motes'},{time:1.5,effect:'pm:lightning'},{time:1.6,effect:'pm:shockwave'},{time:1.6,effect:'pm:explosion_sparks'},{time:1.7,effect:'pm:debris'},{time:1.85,effect:'pm:explosion_smoke'}]
  };
  writeJson(path.join(root,'sequences.json'),sequences);
  writeJson(path.join(root,'quality.json'),{low:{rateMultiplier:0.4,instantMultiplier:0.6},standard:{rateMultiplier:1,instantMultiplier:1},high:{rateMultiplier:1.5,instantMultiplier:1.35},preserve:['lifetimes','motion formulas','ring silhouettes','timing','colors'],note:'Rates scale together with caps. Benchmark overdraw in game; these are art presets, not measured device guarantees.'});
  writeJson(path.join(bp,'manifest.json'),{format_version:2,header:{name:'Particle Master VFX Demonstration',description:'Event-driven bounded VFX sequence driver',uuid:'167fd4d7-f0cb-46ad-8a05-296651fba57a',version:[1,0,0],min_engine_version:[1,26,50]},modules:[{type:'data',uuid:'3df5d972-33ac-4314-92f3-31ac7aef8de0',version:[1,0,0]},{type:'script',language:'javascript',entry:'scripts/main.js',uuid:'80fc446e-01c1-412d-a389-f72f21098a37',version:[1,0,0]}],dependencies:[{uuid:'03d7857a-294a-4fdd-b771-9cc2046c9a72',version:[1,0,0]},{module_name:'@minecraft/server',version:'2.9.0'}]});
  fs.mkdirSync(path.join(bp,'scripts'),{recursive:true});
  fs.writeFileSync(path.join(bp,'scripts','sequences.js'),`export const sequences = ${JSON.stringify(sequences,null,2)};\n`);
  fs.writeFileSync(path.join(bp,'scripts','vfx.js'),`import { MolangVariableMap, system } from '@minecraft/server';
import { sequences } from './sequences.js';
const running = new Map();
export function playSequence(entity, name, quality = 1) {
  const sequence = sequences[name];
  if (!entity?.isValid || !sequence || running.has(entity.id)) return;
  const ownerId = entity.id;
  const dimension = entity.dimension;
  const origin = { ...entity.location };
  const jobs = [];
  running.set(ownerId, jobs);
  for (const cue of sequence) jobs.push(system.runTimeout(() => {
    if (!entity.isValid || entity.dimension.id !== dimension.id || !dimension.isChunkLoaded(origin)) return;
    const variables = new MolangVariableMap();
    variables.setFloat('variable.quality', Math.max(0.4, Math.min(1.5, quality)));
    dimension.spawnParticle(cue.effect, origin, variables);
  }, Math.round(cue.time * 20)));
  jobs.push(system.runTimeout(() => running.delete(ownerId), Math.ceil((Math.max(...sequence.map(c => c.time)) + 5) * 20)));
}
export function cancelOwner(ownerId) {
  const jobs = running.get(ownerId);
  if (!jobs) return;
  for (const id of jobs) system.clearRun(id);
  running.delete(ownerId);
}
`);
  fs.writeFileSync(path.join(bp,'scripts','main.js'),`import { system, world } from '@minecraft/server';
import { playSequence, cancelOwner } from './vfx.js';
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'pm:vfx' || !event.sourceEntity?.isValid) return;
  playSequence(event.sourceEntity, event.message.trim());
});
world.afterEvents.playerLeave.subscribe(event => cancelOwner(event.playerId));
world.afterEvents.entityDie.subscribe(event => cancelOwner(event.deadEntity.id));
`);
  // Quality is a real script parameter, with a standalone-command fallback.
  for(const name of ['blizzard_snow','blizzard_gust','flame','dust','trail']) {
    const j=definitions[name],s=j.particle_effect.components['minecraft:emitter_rate_steady'],baseRate=s.spawn_rate,cap=s.max_particles;
    s.spawn_rate=`${baseRate} * (variable.quality ?? 1)`;s.max_particles=`${cap} * (variable.quality ?? 1)`;
    writeJson(path.join(rp,'particles',name+'.particle.json'),j);
  }
  return {root,particleDefinitions:Object.keys(definitions).length,textures:8,api:'2.9.0',target:'1.26.50',previewVerified:false,minecraftRuntimeVerified:false};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(generateExamples(),null,2));
