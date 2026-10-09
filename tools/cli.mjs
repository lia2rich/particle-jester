#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as yaml } from 'yaml';
import { scan,trace } from './lib/scan.mjs';
import { readJson,writeJson,packageDirectory,walk } from './lib/io.mjs';
import { validateParticle } from './lib/validate.mjs';
import { inspectPng } from './lib/texture.mjs';
import { schema,components } from './lib/spec.mjs';
import { analyzeExpression } from './lib/molang.mjs';
import { buildKnowledgeIndex,searchIndex,diffJson,inspectionReport } from './lib/report.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const [command,...args]=process.argv.slice(2);
const value=(flag,fallback=null)=>{const i=args.indexOf(flag);if(i<0)return fallback;if(!args[i+1] || args[i+1].startsWith('--'))throw new Error(`Missing value for ${flag}`);return args[i+1];};
const all=flag=>args.flatMap((arg,i)=>arg===flag?[args[i+1]]:[]);
const positional=args.filter((arg,i)=>!arg.startsWith('--') && (i===0 || !args[i-1].startsWith('--')));
const print=result=>console.log(JSON.stringify(result,null,2));
const requireArg=(i=0)=>{if(!positional[i])throw new Error('Missing positional argument; use help');return positional[i];};
function doctor() {
  const issues=[];
  for(const file of walk(path.join(root,'skills')).filter(f=>f.endsWith('SKILL.md'))) {
    const text=fs.readFileSync(file,'utf8'),match=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if(!match){issues.push({file,problem:'Missing frontmatter'});continue;}
    const meta=yaml(match[1]);
    if(meta.name!==path.basename(path.dirname(file)) || !meta.description || meta.name.length>64)issues.push({file,problem:'Invalid skill metadata'});
    for(const link of text.matchAll(/\]\(([^)]+)\)/g)) if(!/^(https?:|#)/.test(link[1]) && !fs.existsSync(path.resolve(path.dirname(file),link[1])))issues.push({file,problem:`Missing link ${link[1]}`});
  }
  return {ok:issues.length===0,node:process.version,componentNames:Object.keys(components).length,skills:fs.readdirSync(path.join(root,'skills')).length,issues,preview:'Run node scripts/mcp-smoke.mjs --preview to verify actual browser rendering',minecraftRuntimeVerified:false};
}
try {
  switch(command) {
    case 'scan': {
      const result=scan(requireArg(),{overlays:all('--overlay'),license:value('--license'),origin:value('--origin'),external:all('--external'),parameterBounds:value('--bounds')?readJson(value('--bounds')):{}});
      const out=value('--out', 'work/catalog.json');writeJson(out,result);
      const report=value('--report');if(report){fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,inspectionReport(result));}
      print({output:out,summary:result.summary,verification:result.verification});
      if(args.includes('--strict') && !Object.values(result.verification).slice(0,3).every(Boolean))process.exitCode=1;
      break;
    }
    case 'validate': {
      const result=validateParticle(readJson(requireArg()),{texture:value('--texture')?inspectPng(fs.readFileSync(value('--texture'))):null,external:all('--external'),maxLive:Number(value('--max-live',1000)),parameterBounds:value('--bounds')?readJson(value('--bounds')):{}});
      if(value('--out'))writeJson(value('--out'),result);print(result);if(!result.ok || args.includes('--strict') && !result.staticChecksPassed)process.exitCode=1;break;
    }
    case 'texture':print(inspectPng(fs.readFileSync(requireArg())));break;
    case 'molang':{const result=analyzeExpression(requireArg());print(result);if(result.issues.some(x=>x.severity==='error'))process.exitCode=1;break;}
    case 'trace':print(trace(readJson(requireArg()),requireArg(1)));break;
    case 'diff':print(diffJson(readJson(requireArg()),readJson(requireArg(1))));break;
    case 'index':print({records:buildKnowledgeIndex(requireArg(),value('--out','data/knowledge-index.json')).records.length});break;
    case 'search':print(searchIndex(readJson(requireArg()),positional.slice(1).join(' '),Number(value('--limit',20))));break;
    case 'schema':writeJson(value('--out','schemas/particle.schema.json'),schema);print({ok:true,components:Object.keys(components).length});break;
    case 'package': {
      const result=scan(requireArg());
      if(!result.verification.structurallyValid || result.problems.some(x=>x.severity==='error') || result.summary.unresolvedTextures || result.duplicates.length || result.particles.some(p=>!p.analysis.ok))throw new Error('Pack validation failed; inspect a scan report before packaging');
      print(packageDirectory(requireArg(),requireArg(1)));break;
    }
    case 'route': {
      const routes=readJson(path.join(root,'data/routing.json')),query=positional.join(' ').toLowerCase();
      const matches=routes.filter(r=>r.keywords.some(k=>query.includes(k))).sort((a,b)=>b.priority-a.priority);
      print({primary:'particle-jester',mode:matches[0]?.mode || 'complete',reference:matches[0]?.reference || 'skills/particle-jester/SKILL.md',support:matches.slice(1,4).map(r=>r.mode),scope:'Keyword routing aid for supporting modes within the single Particle Jester skill'});break;
    }
    case 'doctor': {const result=doctor();print(result);if(!result.ok)process.exitCode=1;break;}
    default: console.log(`Particle Master CLI — run from repository root
scan <pack|zip|mcpack> [--overlay <root>] [--external variable.name] [--license <label>] [--out catalog.json] [--report report.md] [--strict]
validate <particle.json> [--texture texture.png] [--external variable.name] [--strict] [--out report.json]
texture <png> | molang <quoted-expression>
trace <catalog.json> <particle:identifier>
diff <before.json> <after.json>
index <references-directory> [--out index.json]
search <index-or-catalog.json> <terms> [--limit 20]
schema [--out schema.json] | route <task words> | doctor
package <pack-root> <output.mcpack>
See tools/preview.mjs, generate-examples.mjs, repair.mjs, optimize.mjs, evaluate.mjs and mcp.mjs.
Exit codes: 0 completed within stated scope; 1 check/operation failed. Scan without --strict inventories broken sources and reports failures without treating them as a CLI crash.`);
      if(command && command!=='help' && command!=='--help')process.exitCode=1;
  }
} catch(error){console.error(JSON.stringify({ok:false,error:error.message}));process.exitCode=1;}
