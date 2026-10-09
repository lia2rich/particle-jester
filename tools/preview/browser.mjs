import * as THREE from 'three';
import Wintersky from 'wintersky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const canvas=document.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(960,600,false);renderer.setClearColor(0x0c1424);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,960/600,0.05,200);
camera.position.set(13,12,15);camera.lookAt(0,1,0);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1,0);controls.update();
const grid=new THREE.GridHelper(32,32,0x39516c,0x1c2a3d);grid.position.y=-0.04;scene.add(grid);
let data=null,sky=null,emitters=[],time=0,started=new Set(),randomState=1;
const originalRandom=Math.random;
const seedRandom=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
function count(){return sky ? sky.emitters.reduce((sum,e)=>sum+e.particles.length,0):0;}
function render(){if(sky)sky.updateFacingRotation(camera);renderer.render(scene,camera);document.querySelector('#time').textContent=`${time.toFixed(2)} s · ${count()} particles`;}
async function reset() {
  // Root deletion recursively disposes children; deleting the flat scene list
  // would dispose child materials twice.
  if(sky){for(const e of [...sky.emitters].filter(e=>!e.parent_emitter))e.delete();scene.remove(sky.space);}
  randomState=data.seed || 47;Math.random=seedRandom;
  sky=new Wintersky.Scene({tick_rate:60,max_emitter_particles:3000,ground_collision:false,fetchTexture:config=>data.textures[config.particle_texture_path],fetchParticleFile:identifier=>data.definitions[identifier]});
  scene.add(sky.space);emitters=[];time=0;started=new Set();
  const configs={};
  for(const [identifier,json] of Object.entries(data.definitions)) {
    const config=new Wintersky.Config(sky,json);
    await new Promise((resolve,reject)=>{
      if(config.texture.image.complete && config.texture.image.naturalWidth)resolve();
      else {config.texture.image.addEventListener('load',resolve,{once:true});config.texture.image.addEventListener('error',()=>reject(new Error('Texture load failed')),{once:true});}
    });
    configs[identifier]=config;
  }
  // Preload subeffect configs using the verified child_configs cache in the
  // pinned Wintersky source; this avoids asynchronous texture races at capture.
  Object.assign(sky.child_configs,configs);
  for(const cue of data.cues) {
    const emitter=new Wintersky.Emitter(sky,configs[cue.effect],{loop_mode:'once',parent_mode:'world'});
    // Wintersky 1.3.3 resets age on expiration but still evaluates timeline
    // events on disabled emitters. Suppress replay for once-only root emitters,
    // while continuing to tick their surviving particles and children.
    emitter.config=Object.assign(Object.create(emitter.config),{emitter_events_timeline:{...emitter.config.emitter_events_timeline}});
    // The installed 1.3.3 distribution emits "end" (its source tree says
    // "expire"); use the distribution actually executed by this bridge.
    emitter.on('end',()=>{if(emitter.config.emitter_lifetime_mode==='once')emitter.config.emitter_events_timeline={};});
    // Wintersky exposes the parser's documented global variables for Script API
    // preview inputs. Explicit values are stored in the capture manifest.
    Object.assign(emitter.Molang.global_variables,data.variables || {});
    emitters.push({emitter,cue});
  }
  for(const {emitter,cue} of emitters)if(cue.time===0){emitter.start();started.add(emitter);}
  render();
}
async function seek(target) {
  if(!Number.isFinite(target) || target<0 || target>60)throw new Error('Preview time must be between 0 and 60 seconds');
  await reset();
  const ticks=Math.round(target*60);
  for(let tick=0;tick<ticks;tick++) {
    time=tick/60;
    for(const {emitter,cue} of emitters)if(!started.has(emitter) && cue.time<=time+1e-7){emitter.start();started.add(emitter);}
    // Root ticks advance their child emitters. Do not double tick children.
    for(const {emitter} of emitters)if(started.has(emitter))emitter.tick(false);
  }
  time=ticks/60;render();
  return {time,particles:count(),emitters:sky.emitters.map(e=>({age:e.age,enabled:e.enabled,particles:e.particles.length,mode:e.config.emitter_lifetime_mode,identifier:e.config.identifier})),camera:camera.position.toArray(),target:controls.target.toArray(),textureLoaded:emitters.every(x=>x.emitter.config.texture.image.naturalWidth>0)};
}
window.particlePreview={
  async load(payload){data=payload;await reset();return {loaded:true,effects:emitters.length};},
  seek,
  camera(position,target=[0,1,0]){camera.position.fromArray(position);controls.target.fromArray(target);controls.update();render();},
  screenshot(){render();return canvas.toDataURL('image/png');},
  state(){return {time,particles:count(),effects:emitters.length,engine:'Wintersky 1.3.3',minecraftRuntimeVerified:false};}
};
controls.addEventListener('change',render);
// Serialize interactive seeks so image-loading resets cannot overlap when
// the user drags the slider quickly. Automated captures await seek directly.
let uiQueue=Promise.resolve();
const enqueue=job=>{uiQueue=uiQueue.then(job).catch(error=>{document.querySelector('#time').textContent=error.message;});};
document.querySelector('#scrub').addEventListener('input',e=>{const value=Number(e.target.value);enqueue(()=>seek(value));});
document.querySelector('#restart').onclick=()=>enqueue(()=>seek(0));
document.querySelector('#capture').onclick=()=>{const a=document.createElement('a');a.href=window.particlePreview.screenshot();a.download='particle-preview.png';a.click();};
const select=document.querySelector('#effects');
async function choose(name){const response=await fetch('/effect?name='+encodeURIComponent(name));await window.particlePreview.load(await response.json());await seek(0.45);}
window.previewBoot=fetch('/effects').then(r=>r.json()).then(names=>{for(const name of names){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}if(names.length)return choose(names[0]);});
select.onchange=()=>{const value=select.value;enqueue(()=>choose(value));};
render();
