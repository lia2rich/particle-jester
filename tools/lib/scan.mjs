import path from 'node:path';
import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { readAssets, hash, slash } from './io.mjs';
import { inspectPng } from './texture.mjs';
import { validateParticle } from './validate.mjs';

function visit(value, callback, at = '') {
  callback(value, at);
  if (Array.isArray(value)) value.forEach((x, i) => visit(x, callback, `${at}/${i}`));
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) visit(child, callback, `${at}/${key}`);
}
function techniques(c) {
  const found = [];
  if (c['minecraft:particle_appearance_billboard']?.uv?.flipbook) found.push('flipbook');
  if (c['minecraft:particle_motion_parametric']) found.push('parametric-motion');
  if (c['minecraft:particle_motion_collision']) found.push('collision');
  if (c['minecraft:emitter_shape_disc']) found.push('disc-emission');
  if (c['minecraft:particle_appearance_tinting']?.color?.gradient) found.push('color-gradient');
  if (/math\.(sin|cos)/.test(JSON.stringify(c))) found.push('trigonometric-motion-candidate');
  if (c['minecraft:emitter_lifetime_events'] || c['minecraft:particle_lifetime_events']) found.push('event-sequence');
  return found;
}
export function scan(input, options = {}) {
  const sources = [input, ...(options.overlays || [])].map((root, i) => ({ root, id: `source-${i}`, assets: readAssets(root) }));
  const files = [], nodes = [], edges = [], problems = [], particles = [], pngs = new Map(), parsed = new Map(), contexts = [];
  const uuids=new Map();
  const idFor = (s, file) => `${s.id}:${file}`;
  for (const source of sources) {
    const manifests = [];
    for (const [file, bytes] of source.assets) {
      const ext = path.posix.extname(file).toLowerCase();
      const record = { source: source.id, path: file, size: bytes.length, sha256: hash(bytes), extension: ext };
      files.push(record);
      if (ext === '.json' || ext === '.material') {
        try {
          const json = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
          parsed.set(idFor(source, file), json);
          if (path.posix.basename(file) === 'manifest.json') {
            const packRoot=path.posix.dirname(file)==='.'?'':path.posix.dirname(file)+'/';
            manifests.push({file,root:packRoot,json});
            if(json.format_version!==2 || !json.header || !Array.isArray(json.modules))problems.push({code:'MANIFEST_STRUCTURE',severity:'error',file:idFor(source,file),message:'Expected pack manifest format 2, header and modules'});
            for(const record of [json.header,...(json.modules || [])].filter(Boolean)) {
              if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(record.uuid || ''))problems.push({code:'MANIFEST_UUID',severity:'error',file:idFor(source,file),message:'Invalid/missing UUID'});
              else if(uuids.has(record.uuid))problems.push({code:'MANIFEST_UUID_DUPLICATE',severity:'error',file:idFor(source,file),message:`UUID also declared in ${uuids.get(record.uuid)}`});
              else uuids.set(record.uuid,idFor(source,file));
              if(!Array.isArray(record.version) || record.version.length!==3 || !record.version.every(x=>Number.isInteger(x) && x>=0))problems.push({code:'MANIFEST_VERSION',severity:'error',file:idFor(source,file),message:'Expected a three-integer version'});
              if(record.type==='script' && (!record.entry || !source.assets.has(packRoot+record.entry)))problems.push({code:'SCRIPT_ENTRY_MISSING',severity:'error',file:idFor(source,file),message:`Script entry ${record.entry} is missing`});
            }
          }
        } catch (e) { problems.push({ code: 'JSON_PARSE', severity: 'error', file: idFor(source, file), message: e.message }); }
      }
      if (ext === '.png') {
        try { pngs.set(idFor(source, file), inspectPng(bytes)); }
        catch (e) { problems.push({ code: 'PNG_DECODE', severity: 'error', file: idFor(source, file), message: e.message }); }
      }
    }
    const roots = manifests.length ? manifests.sort((a,b) => b.root.length-a.root.length) : [{ file: null, root: '', json: null }];
    source.roots = roots;
    for (const root of roots) contexts.push({ source: source.id, root: root.root, manifest: root.file, name: root.json?.header?.name ?? 'loose-assets', version: root.json?.header?.version ?? null, engine: root.json?.header?.min_engine_version ?? null, license: options.license || 'unknown; analysis only', confidence: root.json ? 'high' : 'inferred-root' });
    for (const [file] of source.assets) {
      const json = parsed.get(idFor(source, file));
      if (!json) continue;
      const root = roots.find(r => file.startsWith(r.root));
      const e = json.particle_effect;
      if (e?.description?.identifier) {
        const node = { id: idFor(source, file), kind: 'particle', identifier: e.description.identifier, source: source.id, file, root: root?.root || '', sha256: hash(source.assets.get(file)) };
        nodes.push(node);
        particles.push({ ...node, render: e.description.basic_render_parameters || {}, json, techniqueCandidates: techniques(e.components || {}), sourceVersion: root?.json?.header?.version ?? null, sourceLicense: options.license || 'unknown; do not redistribute', sourceOrigin: options.origin || 'user-supplied-local', confidence: 'definition-confirmed' });
      } else {
        const kinds = [['animations','animation'],['animation_controllers','controller'],['minecraft:client_entity','client-entity'],['minecraft:entity','behavior-entity'],['minecraft:attachable','attachable'],['render_controllers','render-controller'],['materials','material']];
        for (const [key, kind] of kinds) if (json[key]) {
          if (key.startsWith('minecraft:')) nodes.push({ id: idFor(source,file), kind, source: source.id, file, identifier: json[key]?.description?.identifier || null });
          else for (const identifier of Object.keys(json[key])) nodes.push({ id: `${idFor(source,file)}#${identifier}`, kind, source: source.id, file, identifier });
        }
      }
    }
  }
  const byIdentifier = new Map();
  for (const node of nodes) if (node.identifier) { const list = byIdentifier.get(node.identifier) || []; list.push(node); byIdentifier.set(node.identifier, list); }
  function link(from, target, relation, where, candidates = null) {
    const matches = candidates || byIdentifier.get(target) || [];
    edges.push({ from, to: matches.length === 1 ? matches[0].id : null, target, relation, path: where, confidence: matches.length === 1 ? 'resolved' : matches.length ? 'ambiguous' : 'unresolved', candidates: matches.map(x => x.id) });
  }
  const duplicates = [...byIdentifier].filter(([, list]) => list.length > 1).map(([identifier, list]) => ({ identifier, files: list.map(x=>x.id), crossSource: new Set(list.map(x=>x.source)).size > 1 }));
  for (const particle of particles) {
    const source = sources.find(s=>s.id===particle.source), texture = particle.render.texture;
    let resolution = { status: 'missing', chosen: null, candidates: [] };
    if (typeof texture === 'string' && !safeTexture(texture)) problems.push({ code: 'TEXTURE_PATH', severity: 'error', file: particle.id, message: `Unsafe or non-pack texture path ${texture}` });
    else if (typeof texture === 'string') {
      const relative = texture.endsWith('.png') ? texture : texture + '.png';
      // Primary pack first, then explicit overlays in supplied priority order.
      const primary = `${particle.root}${relative}`;
      const candidates = [];
      if (source.assets.has(primary)) candidates.push({ source: source.id, file: primary, id: idFor(source,primary), scope: 'own-pack' });
      for (const overlay of sources.slice(1)) {
        if (overlay.id === source.id) continue;
        const local = overlay.roots.filter(r=>overlay.assets.has(r.root + relative)).map(r=>({ source:overlay.id, file:r.root+relative, id:idFor(overlay,r.root+relative), scope:'explicit-overlay' }));
        if (local.length > 1) resolution.status = 'ambiguous-overlay';
        candidates.push(...local);
      }
      resolution = { status: resolution.status === 'ambiguous-overlay' ? resolution.status : candidates.length ? 'resolved' : 'missing', chosen: candidates[0] || null, candidates };
      if (!candidates.length) {
        const caseOnly = [...source.assets.keys()].filter(p=>p.toLowerCase()===primary.toLowerCase());
        if (caseOnly.length) resolution = { ...resolution, status: 'case-mismatch', caseCandidates: caseOnly };
      }
      if (resolution.chosen) nodes.push({ id: resolution.chosen.id, kind: 'texture', file: resolution.chosen.file, source: resolution.chosen.source });
      edges.push({ from: particle.id, to: resolution.status === 'resolved' ? resolution.chosen?.id : null, target: texture, relation: 'texture', confidence: resolution.status, candidates: candidates.map(x=>x.id) });
    }
    particle.textureResolution = resolution;
    particle.textureInspection = resolution.chosen ? pngs.get(resolution.chosen.id) || null : null;
    particle.analysis = validateParticle(particle.json, { texture: particle.textureInspection, external: options.external || [], parameterBounds: options.parameterBounds || {} });
    particle.verifiedComponentNames = Object.keys(particle.json.particle_effect.components || {}).filter(x=>!particle.analysis.diagnostics.some(d=>d.code==='SCHEMA' && d.params?.additionalProperty===x));
    particle.limitations = ['Static source inspection; neither editor preview nor Minecraft runtime establishes behavior here'];
    if (resolution.status !== 'resolved') particle.limitations.push(`Texture ${resolution.status}`);
    visit(particle.json.particle_effect.events || {}, (value, at) => {
      if (value?.particle_effect?.effect) link(particle.id, value.particle_effect.effect, 'secondary-effect', '/events'+at+'/particle_effect');
      if (value?.sound_effect?.event_name) link(particle.id, value.sound_effect.event_name, 'sound-event', '/events'+at+'/sound_effect');
    });
    const materials = nodes.filter(n=>n.kind==='material' && (n.identifier===particle.render.material || n.identifier?.split(':')[0]===particle.render.material));
    if (materials.length) link(particle.id, particle.render.material, 'material', '/description/basic_render_parameters', materials);
    else edges.push({ from: particle.id, to: null, target: particle.render.material, relation: 'material', confidence: 'engine-or-unavailable', candidates: [] });
  }
  for (const source of sources) for (const [file, bytes] of source.assets) {
    const fileId = idFor(source,file), json = parsed.get(fileId);
    if (json && !json.particle_effect) {
      const owner = json['minecraft:client_entity']?.description || json['minecraft:attachable']?.description;
      if (owner) {
        for (const [alias, target] of Object.entries(owner.particle_effects || {})) if (typeof target==='string') link(fileId, target, 'particle-alias', `/description/particle_effects/${alias}`);
        for (const [alias,target] of Object.entries(owner.animations || {})) if (typeof target==='string') link(fileId,target,'animation-alias',`/description/animations/${alias}`);
        for (const [time, entry] of Object.entries(owner.scripts || {})) visit(entry,(v,at)=>{ if(typeof v==='string' && owner.animations?.[v]) link(fileId,owner.animations[v],'script-animation',`/description/scripts/${time}${at}`); });
      }
      visit(json, (value, at) => {
        if (!value?.particle_effects || typeof value.particle_effects !== 'object' || at.endsWith('/description')) return;
        const effectEntries = Array.isArray(value.particle_effects) ? value.particle_effects : Object.values(value.particle_effects).flat();
        const animationId = at.match(/^\/(animations|animation_controllers)\/([^/]+)/)?.[2];
        const from = animationId ? `${fileId}#${animationId}` : fileId;
        for (const entry of effectEntries) {
          const effect = typeof entry==='string' ? entry : entry?.effect;
          if (!effect) continue;
          if (effect.includes(':')) {link(from,effect,'particle-trigger',at);edges.at(-1).triggerDetails=typeof entry==='object'?entry:{effect:entry};}
          else {
            const owners = [];
            for (const [id, candidate] of parsed) {
              const d = candidate['minecraft:client_entity']?.description || candidate['minecraft:attachable']?.description;
              if (d?.particle_effects?.[effect] && (animationId ? Object.values(d.animations || {}).includes(animationId) : true)) owners.push({ id, identifier: d.particle_effects[effect] });
            }
            if (owners.length) for (const o of owners) {link(from,o.identifier,'particle-trigger-alias',at,byIdentifier.get(o.identifier) || []);edges.at(-1).triggerDetails={owner:o.id,alias:effect,...(typeof entry==='object'?entry:{effect:entry})};}
            else edges.push({ from,to:null,target:effect,relation:'particle-trigger-alias',path:at,confidence:'unresolved-alias',candidates:[] });
          }
        }
      });
      // Controllers can call animations by entity-local alias.
      for (const [controllerId, controller] of Object.entries(json.animation_controllers || {})) for (const [state, data] of Object.entries(controller.states || {})) {
        for (const entry of data.animations || []) for (const alias of typeof entry==='string' ? [entry] : Object.keys(entry)) {
          const owners = [...parsed.values()].map(p=>p['minecraft:client_entity']?.description || p['minecraft:attachable']?.description).filter(d=>d && Object.values(d.animations || {}).includes(controllerId) && d.animations[alias]);
          if (owners.length) for (const d of owners) link(`${fileId}#${controllerId}`,d.animations[alias],'controller-animation',`/states/${state}/animations`);
          else edges.push({from:`${fileId}#${controllerId}`,to:null,target:alias,relation:'controller-animation',path:`/states/${state}/animations`,confidence:'unresolved-alias',candidates:[]});
        }
      }
    }
    if (/\.(m?js|ts)$/.test(file)) {
      nodes.push({ id:fileId,kind:'script',file,source:source.id });
      if (file.endsWith('.ts')) { problems.push({code:'TYPESCRIPT_STATIC_SCOPE',severity:'warning',file:fileId,message:'TypeScript needs transpilation for AST analysis'}); continue; }
      try {
        const ast = parse(bytes.toString('utf8'),{ecmaVersion:'latest',sourceType:'module',locations:true});
        simple(ast,{CallExpression(node) {
          const member = node.callee;
          if (member.type==='MemberExpression' && member.property.name==='spawnParticle') {
            const arg = node.arguments[0];
            if (arg?.type==='Literal' && typeof arg.value==='string') link(fileId,arg.value,'script-spawn',`line:${node.loc.start.line}`);
            else edges.push({from:fileId,to:null,target:bytes.toString('utf8').slice(arg?.start || 0,arg?.end || 0),relation:'script-spawn',path:`line:${node.loc.start.line}`,confidence:'dynamic-expression',candidates:[]});
          }
        }});
      } catch(e) { problems.push({code:'SCRIPT_PARSE',severity:'error',file:fileId,message:e.message}); }
    }
    if (file.endsWith('.mcfunction')) for (const [i,line] of bytes.toString('utf8').split(/\r?\n/).entries()) {
      const match = line.match(/(?:^|\s)particle\s+([a-z0-9_.-]+:[a-z0-9_./-]+)/i);
      if (match) link(fileId,match[1],'command-spawn',`line:${i+1}`);
    }
  }
  for (const p of particles) {
    p.associatedSources = edges.filter(e=>e.to===p.id || e.candidates?.includes(p.id)).map(e=>({file:e.from,relation:e.relation,confidence:e.confidence,path:e.path}));
    delete p.json;
  }
  const textureRecords = [...pngs].map(([id,metadata])=>({id,...metadata}));
  const uniqueNodes = [...new Map(nodes.map(n=>[n.id,n])).values()];
  return { schemaVersion:1, sourceInventoryHash: hash(Buffer.from(files.map(f=>f.sha256).join('\n'))), generatedAt:new Date().toISOString(), contexts, files, particles, textures:textureRecords, graph:{nodes:uniqueNodes,edges}, duplicates, problems, summary:{files:files.length,particles:particles.length,textures:pngs.size,manifests:contexts.filter(c=>c.manifest).length,resolvedTextures:particles.filter(p=>p.textureResolution.status==='resolved').length,unresolvedTextures:particles.filter(p=>p.textureResolution.status!=='resolved').length,duplicateIdentifiers:duplicates.length,parseProblems:problems.length,graphEdges:edges.length}, provenance:{input:slash(path.resolve(input)),priority:'own pack, then explicit overlays in supplied order',licenses:options.license || 'unknown',rawAssetsRedistributed:false}, verification:{structurallyValid:particles.every(p=>p.analysis.structurallyValid),referencesResolved:particles.every(p=>p.textureResolution.status==='resolved') && !edges.some(e=>['secondary-effect','particle-trigger','particle-trigger-alias','controller-animation'].includes(e.relation) && !e.to),staticChecksPassed:particles.every(p=>p.analysis.staticChecksPassed) && !problems.some(p=>p.severity==='error'),previewVerified:false,minecraftRuntimeVerified:false} };
}
function safeTexture(value) { return !value.includes('\\') && !value.startsWith('/') && !value.includes(':') && !value.split('/').includes('..'); }
export function trace(catalog, identifier) {
  const roots = catalog.graph.nodes.filter(n=>n.identifier===identifier), visited = new Set(roots.map(n=>n.id)), edges=[];
  let frontier = [...visited];
  while (frontier.length) {
    const next=[];
    for (const edge of catalog.graph.edges) if (frontier.includes(edge.from) || frontier.includes(edge.to)) {
      if (!edges.includes(edge)) edges.push(edge);
      for(const id of [edge.from,edge.to].filter(Boolean)) if(!visited.has(id)) { visited.add(id); next.push(id); }
    }
    frontier=next;
  }
  return { identifier, found:roots.length>0, roots, nodes:catalog.graph.nodes.filter(n=>visited.has(n.id)),edges,limitation:'Undirected dependency neighborhood; candidates and context-sensitive aliases remain explicitly uncertain. This is not proof of runtime execution.' };
}
