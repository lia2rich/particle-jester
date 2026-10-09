import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { writeJson } from '../tools/lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url));
const transport=new StdioClientTransport({command:process.execPath,args:[path.join(repository,'tools/mcp.mjs'),'--root',repository],cwd:repository,stderr:'pipe'});
const client=new Client({name:'particle-master-smoke',version:'1.0.0'});
const report={connected:false,tools:[],validation:false,pathBoundary:false,rendered:false,previewVerified:false,minecraftRuntimeVerified:false};
try {
  await client.connect(transport);report.connected=true;
  report.tools=(await client.listTools()).tools.map(t=>t.name);
  const validation=await client.callTool({name:'particle_validate',arguments:{input:'examples/original-vfx/RP/particles/shockwave.particle.json',texture:'examples/original-vfx/RP/textures/particle/pm/ring.png'}});
  report.validation=!validation.isError && JSON.parse(validation.content[0].text).ok;
  const forbidden=await client.callTool({name:'particle_scan',arguments:{input:'../'}});report.pathBoundary=forbidden.isError===true;
  if(process.argv.includes('--preview')) {
    const capture=await client.callTool({name:'particle_preview',arguments:{pack:'examples/original-vfx/RP',effect:'pm:shockwave',output:'evidence/mcp-preview',times:[0.05,0.35,0.75,0.95],camera:[13,12,15]}},undefined,{timeout:60000});
    report.rendered=!capture.isError && JSON.parse(capture.content[0].text).rendered===true;
  }
  report.ok=report.connected && report.tools.length===5 && report.validation && report.pathBoundary && (!process.argv.includes('--preview') || report.rendered);
  writeJson(path.join(repository,'evidence/mcp-smoke.json'),report);console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
} finally {await client.close();}
