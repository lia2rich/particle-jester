import fs from 'node:fs';
import path from 'node:path';
import { writeJson, walk, readJson } from './io.mjs';
export function inspectionReport(catalog) {
  const s = catalog.summary;
  const lines = ['# Particle source inspection', '', `Inspected ${s.files} files, ${s.particles} particle definitions and ${s.textures} decodable textures.`, '', `Texture resolution: ${s.resolvedTextures} resolved, ${s.unresolvedTextures} missing/ambiguous. Duplicate identifiers: ${s.duplicateIdentifiers}. Parse/analysis problems: ${s.parseProblems}.`, '', 'The catalog records static evidence. Preview and Minecraft runtime checks have not been performed for the source collection.', '', 'Unknown licenses prevent copying source assets into original examples. A missing manifest means pack identity, load order and source version are unknown.', '', '| Identifier | File | Texture | Resolution | Technique candidates |', '| --- | --- | --- | --- | --- |'];
  const clean = value => String(value ?? '').replaceAll('|','\\|').replaceAll('\n',' ');
  if(catalog.coverage){const at=lines.indexOf('| Identifier | File | Texture | Resolution | Technique candidates |');lines.splice(at,0,`Source coverage: nested expansion ${catalog.coverage.nestedExpansion?'enabled':'disabled'}; ${catalog.coverage.archives.filter(a=>a.expanded).length} archives expanded, ${catalog.coverage.archives.filter(a=>!a.expanded).length} uninspected; JSONC ${catalog.coverage.jsonc?'enabled':'disabled'}. Uninspected archives prevent complete static/reference verification.`,'');}
  for (const p of catalog.particles) lines.push(`| ${clean(p.identifier)} | ${clean(p.file)} | ${clean(p.render.texture)} | ${clean(p.textureResolution.status)} | ${p.techniqueCandidates.join(', ')} |`);
  lines.push('', '## Parse problems', '', ...catalog.problems.map(x=>`- ${x.code}: ${clean(x.file)} — ${clean(x.message)}`), '', '## Duplicate identifiers', '', ...catalog.duplicates.map(x=>`- ${x.identifier}: ${x.files.join(', ')}`));
  return lines.join('\n')+'\n';
}
export function buildKnowledgeIndex(root, out) {
  const records = walk(root).filter(file=>/\.(md|json)$/.test(file)).map(file=>({path:path.relative(root,file).replaceAll('\\','/'),text:fs.readFileSync(file,'utf8')}));
  const index = { schemaVersion:1, root:path.resolve(root), records };
  if(out) writeJson(out,index);
  return index;
}
export function searchIndex(index, query, limit=20) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const records = index.records || index.particles?.map(p=>({path:p.file,text:JSON.stringify(p),identifier:p.identifier})) || [];
  return records.map(record=>{
    const lower=record.text.toLowerCase(), matches=terms.filter(term=>lower.includes(term));
    const score=matches.length + terms.filter(t=>record.path.toLowerCase().includes(t) || record.identifier?.toLowerCase().includes(t)).length*2;
    const i=lower.indexOf(matches[0] || '');
    return {path:record.path,identifier:record.identifier,score,snippet:record.text.slice(Math.max(0,i-90),i+350).replace(/\s+/g,' ')};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || a.path.localeCompare(b.path)).slice(0,limit);
}
export function diffJson(before,after,at='') {
  if(JSON.stringify(before)===JSON.stringify(after)) return [];
  if(before && after && typeof before==='object' && typeof after==='object' && Array.isArray(before)===Array.isArray(after)) return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(key=>diffJson(before[key],after[key],`${at}/${key}`));
  return [{path:at,before:before??null,after:after??null,change:before===undefined?'added':after===undefined?'removed':'modified'}];
}
