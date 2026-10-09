import { startPreviewServer } from './preview/server.mjs';
const args=process.argv.slice(2),option=(key,def)=>args.includes(key)?args[args.indexOf(key)+1]:def;
const result=await startPreviewServer({pack:option('--pack',undefined),port:Number(option('--port',47833))});
console.log(`Particle Master Studio: ${result.url}`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>result.server.close(()=>process.exit(0)));
