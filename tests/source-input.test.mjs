import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {zipSync} from 'fflate';
import {readAssets,hash} from '../tools/lib/io.mjs';
import {sourceAssets,parseSourceJson} from '../tools/lib/source-input.mjs';
import {scan} from '../tools/lib/scan.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),temp=path.join(root,'work/source-input-tests');
fs.mkdirSync(temp,{recursive:true});
const pack=zipSync(Object.fromEntries(readAssets(path.join(root,'examples/original-vfx/RP'))));
function archive(name,entries){const file=path.join(temp,name);fs.writeFileSync(file,zipSync(entries));return file;}

test('uninspected nested packs cannot pass complete static/reference verification',()=>{
 const file=archive('uninspected.zip',{'sample.mcpack':pack}),result=scan(file);
 assert.equal(result.particles.length,0);assert.equal(result.coverage.complete,false);
 assert.equal(result.verification.staticChecksPassed,false);assert.equal(result.verification.referencesResolved,false);
 assert.ok(result.problems.some(p=>p.code==='NESTED_ARCHIVE_UNINSPECTED'));
});
test('explicit nested scan preserves manifest roots, texture paths and original hashes',()=>{
 const file=archive('nested.zip',{'sample.mcpack':pack}),result=scan(file,{nested:true,external:['variable.quality'],parameterBounds:{'variable.quality':[0.4,1.5]}});
 assert.equal(result.particles.length,18);assert.equal(result.coverage.complete,true);
 assert.equal(result.contexts[0].root,'sample.mcpack/');assert.equal(result.summary.resolvedTextures,18);
 assert.equal(result.verification.staticChecksPassed,true);assert.equal(result.files.find(f=>f.path==='sample.mcpack').sha256,hash(pack));
});
test('nested archive traversal and prefix collisions are rejected without extraction',()=>{
 const bad=zipSync({'../outside.json':Buffer.from('{}')});
 assert.throws(()=>sourceAssets(archive('traversal.zip',{'bad.mcpack':bad}),{nested:true}),/Unsafe/);
 assert.throws(()=>sourceAssets(archive('collision.zip',{'sample.mcpack':pack,'sample.mcpack/manifest.json':Buffer.from('{}')}),{nested:true}),/collision/);
});
test('nested depth and total decoded byte/file budgets are shared across archives',()=>{
 const inner=zipSync({'leaf.json':Buffer.from('{}')}),middle=zipSync({'inner.zip':inner});
 const file=archive('depth.zip',{'middle.zip':middle});
 const limited=sourceAssets(file,{nested:true,maxDepth:1});assert.ok(limited.archives.some(a=>a.reason==='depth-limit'));
 const two=archive('budget.zip',{'a.zip':inner,'b.zip':inner});
 assert.throws(()=>sourceAssets(two,{nested:true,limits:{files:3,bytes:1024*1024,entry:1024*1024}}),/limits|too|limit/i);
 const bytes=2*inner.length+3;
 assert.throws(()=>sourceAssets(two,{nested:true,limits:{files:10,bytes,entry:1024*1024}}),/limits|too|limit/i);
});
test('JSONC mode preserves string contents and rejects partial parses or JavaScript',()=>{
 const text=Buffer.from('{ /* note */ "url":"https://example.com/a//b", "literal":"/*text*/", "items":[1,2,], }');
 assert.throws(()=>parseSourceJson(text));const result=parseSourceJson(text,{jsonc:true});
 assert.equal(result.dialect,'jsonc');assert.equal(result.value.url,'https://example.com/a//b');assert.equal(result.value.literal,'/*text*/');
 assert.throws(()=>parseSourceJson(Buffer.from('{"a":1 "b":2}'),{jsonc:true}));
 assert.throws(()=>parseSourceJson(Buffer.from('{"a":process.exit()}'),{jsonc:true}));
});
test('JSONC inventory records dialect and immutable source hash instead of rewriting files',()=>{
 const bytes=Buffer.from('{ // author comment\n"particle_effect":{"description":{"identifier":"test:source"},"components":{},},}');
 const file=archive('jsonc.zip',{'particles/example.json':bytes});
 assert.equal(scan(file).particles.length,0);const result=scan(file,{jsonc:true});
 assert.equal(result.particles.length,1);assert.equal(result.files[0].sha256,hash(bytes));assert.equal(result.files[0].jsonDialect,'jsonc');
 assert.ok(result.problems.some(p=>p.code==='JSONC_ACCEPTED'));assert.deepEqual(readAssets(file).get('particles/example.json'),bytes);
});
test('matching BP and RP entity identifiers are counterparts, not duplicate definitions',()=>{
 const file=archive('entity-pair.zip',{'entity/client.json':Buffer.from(JSON.stringify({'minecraft:client_entity':{description:{identifier:'test:actor'}}})),'entities/server.json':Buffer.from(JSON.stringify({'minecraft:entity':{description:{identifier:'test:actor'}}}))});
 const result=scan(file);assert.equal(result.duplicates.length,0);assert.equal(result.graph.nodes.filter(n=>n.identifier==='test:actor').length,2);
});
