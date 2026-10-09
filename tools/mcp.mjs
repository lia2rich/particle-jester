import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema,CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { scan,trace } from './lib/scan.mjs';
import { readJson,writeJson } from './lib/io.mjs';
import { validateParticle } from './lib/validate.mjs';
import { inspectPng } from './lib/texture.mjs';
import { searchIndex } from './lib/report.mjs';
import { capturePreview } from './preview.mjs';
const args=process.argv.slice(2),defaultRoot=fileURLToPath(new URL('..',import.meta.url));
const workspace=fs.realpathSync(args.includes('--root')?args[args.indexOf('--root')+1]:defaultRoot);
function contained(value,{existing=true}={}) {
  const absolute=path.resolve(workspace,value),relative=path.relative(workspace,absolute);
  if(relative.startsWith('..') || path.isAbsolute(relative))throw new Error('Path leaves configured workspace');
  if(existing){const real=fs.realpathSync(absolute),rel=path.relative(workspace,real);if(rel.startsWith('..') || path.isAbsolute(rel))throw new Error('Symlink leaves configured workspace');}
  else {let ancestor=path.dirname(absolute);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);const real=fs.realpathSync(ancestor),rel=path.relative(workspace,real);if(rel.startsWith('..') || path.isAbsolute(rel))throw new Error('Output ancestor leaves workspace');}
  return absolute;
}
const string={type:'string'},tool=(name,description,properties,required)=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false}});
const definitions=[
  tool('particle_scan','Inspect a pack/archive, PNG pixels, definitions and dependency graph; reports uncertainty. Nested archives and JSONC require explicit opt-in.',{input:string,output:string,nested:{type:'boolean'},jsonc:{type:'boolean'},external:{type:'array',items:string}},['input']),
  tool('particle_validate','Conservative structural/MoLang/UV validation; never asserts runtime validity.',{input:string,texture:string,external:{type:'array',items:string}},['input']),
  tool('particle_trace','Trace identifier relationships from a saved catalog.',{catalog:string,identifier:string},['catalog','identifier']),
  tool('particle_search','Search a source catalog or knowledge index.',{index:string,query:string},['index','query']),
  tool('particle_preview','Render actual Wintersky frames. Visual approval remains a separate inspection.',{pack:string,effect:string,output:string,times:{type:'array',items:{type:'number'},minItems:1,maxItems:12},camera:{type:'array',items:{type:'number'},minItems:3,maxItems:3}},['pack','effect','output'])
];
const server=new Server({name:'mcbe-particle-master-ai',version:'1.0.0'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:definitions}));
server.setRequestHandler(CallToolRequestSchema,async request=>{
  const {name,arguments:a={}}=request.params;
  try {
    let result;
    if(name==='particle_scan'){result=scan(contained(a.input),{external:a.external,nested:a.nested===true,jsonc:a.jsonc===true});if(a.output)writeJson(contained(a.output,{existing:false}),result);}
    else if(name==='particle_validate')result=validateParticle(readJson(contained(a.input)),{texture:a.texture?inspectPng(fs.readFileSync(contained(a.texture))):null,external:a.external});
    else if(name==='particle_trace')result=trace(readJson(contained(a.catalog)),a.identifier);
    else if(name==='particle_search')result=searchIndex(readJson(contained(a.index)),a.query);
    else if(name==='particle_preview')result=await capturePreview({pack:contained(a.pack),effect:a.effect,out:contained(a.output,{existing:false}),times:a.times,camera:a.camera});
    else throw new Error(`Unknown tool ${name}`);
    return {content:[{type:'text',text:JSON.stringify(result)}]};
  }catch(e){return {isError:true,content:[{type:'text',text:JSON.stringify({ok:false,error:e.message})}]};}
});
await server.connect(new StdioServerTransport());
