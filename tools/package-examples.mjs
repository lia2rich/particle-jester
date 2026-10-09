import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { scan } from './lib/scan.mjs';
import { readJson,writeJson,readAssets,packageDirectory,hash } from './lib/io.mjs';
const repository=fileURLToPath(new URL('..',import.meta.url)),rp=path.join(repository,'examples/original-vfx/RP'),bp=path.join(repository,'examples/original-vfx/BP'),out=path.join(repository,'dist');
const source=scan(rp,{external:['variable.quality'],parameterBounds:readJson(path.join(repository,'config/parameters.json'))});
if(!source.verification.structurallyValid || !source.verification.referencesResolved || !source.verification.staticChecksPassed)throw new Error('Original RP checks failed');
const behavior=scan(bp);if(behavior.problems.some(x=>x.severity==='error'))throw new Error('BP source checks failed');
const r=readJson(path.join(rp,'manifest.json')),b=readJson(path.join(bp,'manifest.json'));
if(!b.dependencies.some(d=>d.uuid===r.header.uuid && JSON.stringify(d.version)===JSON.stringify(r.header.version)))throw new Error('BP-to-RP dependency mismatch');
fs.mkdirSync(out,{recursive:true});
const resource=packageDirectory(rp,path.join(out,'particle-master-vfx.mcpack')),behaviorPack=packageDirectory(bp,path.join(out,'particle-master-driver.mcpack'));
const addon=path.join(out,'particle-master-vfx.mcaddon');
fs.writeFileSync(addon,zipSync({'particle-master-vfx.mcpack':fs.readFileSync(resource.output),'particle-master-driver.mcpack':fs.readFileSync(behaviorPack.output)},{level:6}));
for(const [name,bytes] of readAssets(addon)){if(!name.endsWith('.mcpack') || !Object.keys((await import('fflate')).unzipSync(bytes)).includes('manifest.json'))throw new Error('Nested mcpack verification failed');}
const report={rp:resource,bp:behaviorPack,addon:{output:addon,sha256:hash(fs.readFileSync(addon))},checks:{structurallyValid:true,referencesResolved:true,staticChecksPassed:true,minecraftRuntimeVerified:false},note:'Script API typecheck and preview inspections have separate reports; packaging does not run Minecraft.'};
writeJson(path.join(repository,'evidence/packaging.json'),report);console.log(JSON.stringify(report,null,2));
