import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const metadata=new URL('../.particle-master.json',import.meta.url);
const repository=fs.existsSync(metadata)?JSON.parse(fs.readFileSync(metadata,'utf8')).repository:fileURLToPath(new URL('../../../',import.meta.url));
if(process.argv[2]==='--where'){console.log(repository);process.exit(0);}
const result=spawnSync(process.execPath,[repository+'/tools/cli.mjs',...process.argv.slice(2)],{cwd:repository,stdio:'inherit'});
process.exit(result.status ?? 1);
