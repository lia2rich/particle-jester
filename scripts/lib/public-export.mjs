import path from 'node:path';
export function publicBytes(name,bytes,repository) {
  if(!/\.(md|json|xml|toml|ya?ml|txt)$/.test(name))return bytes;
  const root=path.resolve(repository).replaceAll('\\','/').replace(/\/$/,''),userPrefix=root.match(/^([A-Za-z]:\/Users\/[^/]+)/)?.[1];
  const sanitize=text=>{
    let value=text.replaceAll(root+'/', '').replaceAll(root, '<repository>');
    const windowsRoot=root.replaceAll('/','\\');
    value=value.replaceAll(windowsRoot+'\\','').replaceAll(windowsRoot,'<repository>');
    if(userPrefix)value=value.replaceAll(userPrefix,'<user-home>').replaceAll(userPrefix.replaceAll('/','\\'),'<user-home>');
    return value;
  };
  if(name.endsWith('.json')) {
    const json=JSON.parse(bytes.toString('utf8'));let changed=false;
    function visit(value){
      if(typeof value==='string'){const result=sanitize(value);changed ||= result!==value;return result;}
      if(Array.isArray(value))return value.map(visit);
      if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item)]));
      return value;
    }
    const result=visit(json);return changed?Buffer.from(JSON.stringify(result,null,2)+'\n'):bytes;
  }
  let text=bytes.toString('utf8');
  if(name==='AGENTS.md')text=text.replace(/When the user asks for development packs on this machine[^\n]*/, 'For development-pack installation, use the location supplied by the user or resolve their active com.mojang development pack folders. Do not install a pack merely because it was generated.');
  if(name==='references/setup.md')text=text.replace(/This app session supplies its user skills[^\n]*/, 'The installer defaults to the configured CODEX_HOME/skills location, or ~/.codex/skills for compatibility. Current [official OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills) also documents ~/.agents/skills and repository .agents/skills. Use --target to select the location your host scans. Avoid duplicate installations. Codex detects changes automatically; restart if the skill does not appear.');
  if(name==='README.md'){
    text=text.replace('node tools/cli.mjs search data/user-evidence/catalog.json spiral','node tools/cli.mjs search work/catalog.json shockwave').replace('node tools/cli.mjs trace data/user-evidence/catalog.json cyd_mgspl:spell_cast_blue_1','node tools/cli.mjs trace work/catalog.json pm:shockwave');
  }
  return Buffer.from(sanitize(text));
}
