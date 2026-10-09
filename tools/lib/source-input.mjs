import {parse as parseJsonc,printParseErrorCode} from 'jsonc-parser';
import {readAssets,hash} from './io.mjs';

export const sourceLimits={files:50000,bytes:512*1024*1024,entry:64*1024*1024};

export function parseSourceJson(bytes,{jsonc=false}={}) {
  const text=bytes.toString('utf8').replace(/^\uFEFF/,'');
  try{return {value:JSON.parse(text),dialect:'json'};}
  catch(strictError){
    if(!jsonc)throw strictError;
    const errors=[],value=parseJsonc(text,errors,{disallowComments:false,allowTrailingComma:true});
    if(errors.length)throw new Error(errors.map(e=>`${printParseErrorCode(e.error)} at offset ${e.offset}`).join('; '));
    return {value,dialect:'jsonc',strictError:strictError.message};
  }
}

export function sourceAssets(input,{nested=false,maxDepth=2,limits=sourceLimits,budget={files:0,bytes:0}}={}) {
  const result=new Map(),archives=[];
  const remaining=()=>({files:limits.files-budget.files,bytes:limits.bytes-budget.bytes,entry:limits.entry});
  function merge(entries,prefix='',depth=0){
    for(const [name,bytes] of entries){
      const key=prefix+name;
      if(result.has(key))throw new Error(`Nested archive path collision: ${key}`);
      budget.files++;budget.bytes+=bytes.length;
      if(budget.files>limits.files || budget.bytes>limits.bytes || bytes.length>limits.entry)throw new Error('Aggregate source asset limits exceeded');
      result.set(key,bytes);
    }
    for(const [name,bytes] of entries){
      if(!/\.(zip|mcpack|mcaddon|mcworld)$/i.test(name))continue;
      const key=prefix+name,expand=nested && depth<maxDepth;
      archives.push({path:key,sha256:hash(bytes),depth:depth+1,expanded:expand,reason:expand?null:nested?'depth-limit':'opt-in-required'});
      if(expand)merge(readAssets(bytes,remaining()),key+'/',depth+1);
    }
  }
  merge(readAssets(input,remaining()));
  return {assets:result,archives};
}
