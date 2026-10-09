import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readJson } from './lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
const source=readJson(path.join(repository,'config/research-lock.json')).repositories.find(s=>s.id===value('--source'));
if(!source)throw new Error('Choose a registered --source from config/research-lock.json');
const out=path.resolve(value('--out'));
function git(arguments_) {const r=spawnSync('git',arguments_,{encoding:'utf8',shell:false});if(r.status!==0)throw new Error(r.stderr || r.error?.message || 'Git failed');return r.stdout.trim();}
if(args.includes('--verify')){
  const actual=git(['-C',out,'rev-parse','HEAD']);if(actual!==source.commit)throw new Error(`Source revision differs: ${actual}`);console.log(JSON.stringify({verified:true,source:source.id,commit:actual}));
}else {
  if(fs.existsSync(out))throw new Error('Destination exists; verify it or choose another directory');
  fs.mkdirSync(path.dirname(out),{recursive:true});git(['clone','--no-checkout',source.url,out]);git(['-C',out,'checkout','--detach',source.commit]);
  console.log(JSON.stringify({source:source.id,commit:git(['-C',out,'rev-parse','HEAD']),license:source.license,upstreamCodeExecuted:false}));
}
