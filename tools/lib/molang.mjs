import { builtinVariables, mathFunctions } from './spec.mjs';

const aliases = text => text.replace(/\bv\./gi, 'variable.').replace(/\bt\./gi, 'temp.').replace(/\bq\./gi, 'query.').replace(/\bc\./gi, 'context.');
export function analyzeExpression(expression) {
  if (typeof expression === 'number') return { expression, reads: [], writes: [], functions: [], issues: [], parser: 'constant' };
  const text = aliases(String(expression)).toLowerCase(), issues = [], reads = new Set(), writes = new Set(), functions = new Set();
  const pattern = /\s+|'[^']*'|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-z_][a-z_0-9]*(?:\.[a-z_0-9]+)*|\?\?|&&|\|\||==|!=|<=|>=|[+*/%(){};,?:=!<>-]/gy;
  const tokens = [];
  let offset = 0;
  while (offset < text.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(text);
    if (!match) { issues.push({ code: 'MOLANG_TOKEN', severity: 'error', message: `Unexpected token at ${offset}` }); break; }
    offset = pattern.lastIndex;
    if (!/^\s+$/.test(match[0])) tokens.push(match[0]);
  }
  let cursor = 0;
  const precedence = { '=': 1, '??': 2, '||': 3, '&&': 4, '==': 5, '!=': 5, '<': 6, '>': 6, '<=': 6, '>=': 6, '+': 7, '-': 7, '*': 8, '/': 8, '%': 8 };
  const peek = () => tokens[cursor];
  function take(value) { if (peek() !== value) throw new Error(`Expected ${value}, got ${peek() ?? 'end'}`); cursor++; }
  function atom() {
    const token = tokens[cursor++];
    if (token === undefined) throw new Error('Incomplete expression');
    if (['!', '-', '+'].includes(token)) { atom(); return null; }
    if (token === '(') { parse(0); take(')'); return null; }
    if (token === '{') { statements('}'); take('}'); return null; }
    if (/^(?:\d|\.)/.test(token) || token.startsWith("'") || ['true', 'false'].includes(token)) return null;
    if (!/^[a-z_]\w*(?:\.[a-z_0-9]+)*$/.test(token)) throw new Error(`Expected value, got ${token}`);
    if (peek() === '(') {
      functions.add(token); cursor++;
      if (peek() !== ')') { parse(0); while (peek() === ',') { cursor++; parse(0); } }
      take(')');
    } else reads.add(token);
    return token;
  }
  function parse(min) {
    const left = atom();
    while (precedence[peek()] >= min) {
      const op = tokens[cursor++];
      if (op === '=') {
        if (!left || !/^(variable|temp)\./.test(left)) throw new Error('Assignment needs a writable variable');
        writes.add(left); reads.delete(left);
      }
      parse(precedence[op] + (op === '=' ? 0 : 1));
    }
    if (min === 0 && peek() === '?') { cursor++; parse(0); if (peek() === ':') { cursor++; parse(0); } }
  }
  function statements(end) {
    while (cursor < tokens.length && peek() !== end) {
      if (peek() === 'return') cursor++;
      if (['break', 'continue'].includes(peek())) cursor++;
      else parse(0);
      if (peek() === ';') cursor++;
      else if (cursor < tokens.length && peek() !== end) throw new Error(`Missing operator or semicolon before ${peek()}`);
    }
  }
  let parser = 'supported-subset';
  if (/\b(loop|for_each|this)\b|->|\[/.test(text)) {
    parser = 'unsupported';
    issues.push({ code: 'MOLANG_UNSUPPORTED', severity: 'warning', message: 'Loops, arrays, this and arrow contexts need the engine parser; this checker does not establish their validity' });
    for (const match of text.matchAll(/\b(variable|temp|query|context)\.[a-z_0-9.]+/g)) reads.add(match[0]);
  } else if (!issues.length) {
    try { statements(undefined); } catch (error) { issues.push({ code: 'MOLANG_SYNTAX', severity: 'error', message: error.message }); }
  }
  for (const fn of functions) {
    if (fn.startsWith('math.') && !mathFunctions.includes(fn.slice(5))) issues.push({ code: 'MOLANG_FUNCTION', severity: 'error', message: `Unknown math function ${fn}` });
    else if (!fn.startsWith('math.') && !fn.startsWith('query.')) issues.push({ code: 'MOLANG_FUNCTION_CONTEXT', severity: 'warning', message: `Function ${fn} requires context verification` });
  }
  if (/\bquery\./.test(text)) issues.push({ code: 'MOLANG_QUERY_CONTEXT', severity: 'warning', message: 'Entity queries may be unavailable to detached emitters; verify each query in target version and trigger context' });
  return { expression, normalized: text, reads: [...reads].sort(), writes: [...writes].sort(), functions: [...functions].sort(), parser, issues };
}
const nonExpressions = new Set(['identifier','material','texture','type','mode','facing_camera_mode','effect','event','event_name','creation_event','expiration_event','log','direction','plane_normal']);
export function extractExpressions(value, prefix = '') {
  const result = [];
  function visit(item, at, key) {
    if (typeof item === 'string') {
      if ((!nonExpressions.has(key) && !/\.(timeline|travel_distance_events)\./.test(at) && !item.startsWith('#') && !at.includes('expire_if_')) || /\b(variable|v|temp|t|math|query|q|context|c)\./i.test(item)) result.push({ path: at, ...analyzeExpression(item) });
    } else if (Array.isArray(item)) item.forEach((child, i) => visit(child, `${at}/${i}`, key));
    else if (item && typeof item === 'object') for (const [name, child] of Object.entries(item)) {
      if (['timeline','travel_distance_events'].includes(name)) continue;
      visit(child, `${at}/${name}`, name);
    }
  }
  visit(value, prefix, '');
  return result;
}
export function variableDependencies(expressions, curves = {}, external = []) {
  const defined = new Set([...builtinVariables, ...Object.keys(curves).map(aliases), ...external.map(aliases), ...expressions.flatMap(x => x.writes)]);
  const unknown = [...new Set(expressions.flatMap(x => x.reads).filter(x => x.startsWith('variable.') && !defined.has(x)))].sort();
  return { builtin: builtinVariables, defined: [...defined].sort(), external, unknown, limitation: 'Lexical writes establish possible producers only, not execution order, branches or scope; parent-event variables do not propagate automatically.' };
}
