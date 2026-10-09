import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {walk} from '../tools/lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),args=process.argv.slice(2);
const base=args.includes('--target')?args[args.indexOf('--target')+1]:path.join(process.env.CODEX_HOME || path.join(os.homedir(),'.codex'),'skills');
const plan=[];
for(const name of fs.readdirSync(path.join(repository,'skills'))) {
  const source=path.join(repository,'skills',name),target=path.join(base,name);
  let text=fs.readFileSync(path.join(source,'SKILL.md'),'utf8');
  text=text.replace(/\]\(\.\.\/\.\.\/([^)]+)\)/g,(_,link)=>`](${path.join(repository,link).replaceAll('\\','/')})`);
  text+=`\nInstalled repository: \`${repository}\`. Shared commands must run with that working directory. Use this skill's scripts/particle.mjs helper to locate and invoke the CLI from any working directory.\n`;
  const previous=fs.existsSync(path.join(target,'SKILL.md'))?fs.readFileSync(path.join(target,'SKILL.md'),'utf8'):null;
  plan.push({name,source,target,text,status:previous===null?'new':previous===text?'unchanged':'differs'});
}
if(args.includes('--apply') && plan.some(p=>p.status==='differs') && !args.includes('--replace'))throw new Error('Differing existing skills found; inspect the plan before choosing --replace');
if(args.includes('--apply'))for(const item of plan) {
  // Supporting modes remain local to the installed skill. Shared repository
  // links become absolute, including links inside those supporting documents.
  for(const sourceFile of walk(item.source)) {
    const relative=path.relative(item.source,sourceFile),targetFile=path.join(item.target,relative);
    fs.mkdirSync(path.dirname(targetFile),{recursive:true});
    if(relative==='SKILL.md'){fs.writeFileSync(targetFile,item.text);continue;}
    if(sourceFile.endsWith('.md')) {
      const body=fs.readFileSync(sourceFile,'utf8').replace(/\]\(([^)]+)\)/g,(original,link)=>{
        if(/^(https?:|#)/.test(link))return original;
        const resolved=path.resolve(path.dirname(sourceFile),link),local=path.relative(item.source,resolved);
        return local.startsWith('..') || path.isAbsolute(local)?`](${resolved.replaceAll('\\','/')})`:original;
      });fs.writeFileSync(targetFile,body);
    }else fs.copyFileSync(sourceFile,targetFile);
  }
  fs.writeFileSync(path.join(item.target,'.particle-master.json'),JSON.stringify({repository,version:'1.0.0'},null,2)+'\n');
}
console.log(JSON.stringify({applied:args.includes('--apply'),repository,skills:plan.map(({name,target,status})=>({name,target,status}))},null,2));
