import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { readAssets,hash } from '../tools/lib/io.mjs';
import {publicBytes} from './lib/public-export.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),args=process.argv.slice(2);
const publicExport=args.includes('--public'),output=args.includes('--out')?path.resolve(args[args.indexOf('--out')+1]):path.join(repository,'..',publicExport?'mcbe-particle-master-ai-public.zip':'mcbe-particle-master-ai.zip');
const assets=readAssets(repository),files={};
for(const [name,bytes] of assets) {
  if(name==='config/sources.local.json' || name==='config/preview.local.json' || name.endsWith('.log'))continue;
  if(publicExport && (name.startsWith('data/user-evidence/') || name==='references/source-index/user-inspection.md' || name==='references/source-index/corpus-findings.md' || name==='data/knowledge-index.json'))continue;
  // Public cards keep original recipes but remove all local collection metadata.
  if(publicExport && name==='data/pattern-cards.json') {
    const cards=JSON.parse(bytes.toString());for(const card of cards.cards)card.evidence=[];files['mcbe-particle-master-ai/'+name]=Buffer.from(JSON.stringify(cards,null,2)+'\n');continue;
  }
  if(publicExport && name.startsWith('references/techniques/') && name.endsWith('.md')) {
    const text=bytes.toString().split('## Source evidence')[0]+'## Source evidence\n\nLocal evidence was excluded from this public export. Use verified official contracts and the original examples.\n';files['mcbe-particle-master-ai/'+name]=Buffer.from(text);continue;
  }
  files['mcbe-particle-master-ai/'+name]=bytes;
}
if(publicExport)for(const name of Object.keys(files))files[name]=publicBytes(name.replace(/^mcbe-particle-master-ai\//,''),files[name],repository);
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,zipSync(files,{level:6}));
const reopened=readAssets(output);if(reopened.size!==Object.keys(files).length)throw new Error('Export reopen verification failed');
console.log(JSON.stringify({output,files:reopened.size,sha256:hash(fs.readFileSync(output)),public:publicExport,nodeModulesIncluded:false,rawSuppliedAssetsIncluded:false},null,2));
