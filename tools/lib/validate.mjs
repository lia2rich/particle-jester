import Ajv from 'ajv';
import { schema, components } from './spec.mjs';
import { extractExpressions, variableDependencies } from './molang.mjs';
import { uvMetadata } from './texture.mjs';
const validator = new Ajv({ allErrors: true, strict: false }).compile(schema);
const numeric = value => typeof value === 'number' && Number.isFinite(value);
function upperBound(value,bounds) {
  if(numeric(value))return value;
  if(typeof value!=='string')return null;
  const match=value.match(/^\s*(\d+(?:\.\d+)?)\s*\*\s*\(\s*(variable\.[a-z_0-9]+)\s*\?\?\s*(\d+(?:\.\d+)?)\s*\)\s*$/i);
  if(!match || !Array.isArray(bounds[match[2]]) || bounds[match[2]].length!==2 || !bounds[match[2]].every(numeric))return null;
  return Number(match[1])*Math.max(...bounds[match[2]],Number(match[3]));
}
export function estimatePerformance(components,parameterBounds={}) {
  const rawSteady = components['minecraft:emitter_rate_steady'], rawInstant = components['minecraft:emitter_rate_instant'];
  const steady=rawSteady?{spawn_rate:upperBound(rawSteady.spawn_rate,parameterBounds),max_particles:upperBound(rawSteady.max_particles,parameterBounds)}:null;
  const instant=rawInstant?{num_particles:upperBound(rawInstant.num_particles,parameterBounds)}:null;
  const life = components['minecraft:particle_lifetime_expression']?.max_lifetime;
  const active = components['minecraft:emitter_lifetime_once']?.active_time;
  let live = null, total = null;
  if (instant && numeric(instant.num_particles)) live = total = instant.num_particles;
  if (steady && numeric(steady.spawn_rate) && numeric(life)) live = Math.ceil(steady.spawn_rate * Math.min(life, numeric(active) ? active : life));
  if (steady && numeric(steady.spawn_rate) && numeric(active)) total = Math.ceil(steady.spawn_rate * active);
  if (live !== null && numeric(steady?.max_particles)) live = Math.min(live, steady.max_particles);
  return { estimatedPeakLive: live, estimatedTotal: total, uncappedSteadyLive: steady && numeric(steady.spawn_rate) && numeric(life) ? Math.ceil(steady.spawn_rate * life) : null, parameterBounds, looping: !!components['minecraft:emitter_lifetime_looping'], collision: !!components['minecraft:particle_motion_collision'], limitation: 'Per-emitter estimate only; supports constants and rate * (variable ?? fallback) with explicit bounds. Other dynamic expressions, chained effects, actors, concurrent spawns and overdraw are not bounded.' };
}
export function validateParticle(json, { texture = null, external = [], maxLive = 1000, parameterBounds={} } = {}) {
  const structurallyValid = validator(json), diagnostics = (validator.errors || []).map(e => ({ severity: 'error', code: 'SCHEMA', path: e.instancePath, message: e.message, params: e.params }));
  const effect = json?.particle_effect, c = effect?.components || {};
  const add = (code, severity, message, path = '') => diagnostics.push({ code, severity, message, path });
  for (const group of ['emitter_rate_', 'emitter_shape_', 'emitter_lifetime_']) {
    const names = Object.keys(c).filter(x => x.includes(group) && !x.endsWith('_events'));
    if (names.length > 1) add('COMPONENT_CONFLICT', 'error', `${names.join(', ')} are competing alternatives`);
  }
  if (c['minecraft:particle_motion_dynamic'] && c['minecraft:particle_motion_parametric']?.relative_position) add('MOTION_CONFLICT', 'warning', 'Dynamic translation and parametric relative_position need engine verification; do not assume their positions add');
  if (!Object.keys(c).some(x => x.includes('emitter_lifetime_') && !x.endsWith('_events'))) add('EMITTER_LIFETIME_UNSPECIFIED', 'warning', 'Emitter termination is not explicitly specified');
  if (c['minecraft:emitter_lifetime_looping']) add('LOOPING_EMITTER', 'warning', 'Use controller state ownership or an explicit termination strategy; repeated keyframes can accumulate emitters');
  for (const [key, component] of Object.entries(c)) {
    if (!components[key]) continue;
    if (!component || typeof component !== 'object') continue;
    for (const [field, value] of Object.entries(component)) if (numeric(value) && ['active_time','max_lifetime','spawn_rate','num_particles','max_particles','radius','linear_drag_coefficient','rotation_drag_coefficient'].includes(field) && (value < 0 || ['max_lifetime','max_particles'].includes(field) && value === 0)) add('RANGE', 'error', `${field} has a nonphysical value ${value}`, `/${key}/${field}`);
  }
  const expressions = extractExpressions({ components: c, curves: effect?.curves || {}, events: effect?.events || {} });
  for (const e of expressions) diagnostics.push(...e.issues.map(issue => ({ ...issue, path: e.path })));
  const variables = variableDependencies(expressions, effect?.curves, external);
  for (const name of variables.unknown) add('VARIABLE_PRODUCER_UNKNOWN', 'warning', `${name} has no proven local/script producer`);
  const definedEvents = new Set(Object.keys(effect?.events || {}));
  function checkNames(value, path) {
    for (const name of Array.isArray(value) ? value : [value]) if (typeof name === 'string' && !definedEvents.has(name)) add('EVENT_MISSING', 'error', `Event ${name} is not defined`, path);
  }
  for (const [key, component] of Object.entries(c)) {
    if (key.endsWith('lifetime_events')) {
      for (const name of ['creation_event','expiration_event']) if (component?.[name]) checkNames(component[name], `/${key}/${name}`);
      for (const name of ['timeline','travel_distance_events']) for (const [time, events] of Object.entries(component?.[name] || {})) {
        if (!Number.isFinite(Number(time)) || Number(time) < 0) add('EVENT_TIME', 'error', `Invalid event time/distance ${time}`);
        checkNames(events, `/${key}/${name}/${time}`);
      }
      for (const item of component?.looping_travel_distance_events || []) checkNames(item.effects, `/${key}/looping_travel_distance_events`);
    }
    if (key.endsWith('motion_collision') && component?.events) for (const item of Array.isArray(component.events) ? component.events : [component.events]) checkNames(item.event, `/${key}/events`);
  }
  const uv = uvMetadata(c['minecraft:particle_appearance_billboard'], texture);
  diagnostics.push(...uv.issues);
  const performance = estimatePerformance(c,parameterBounds);
  if (performance.estimatedPeakLive !== null && performance.estimatedPeakLive > maxLive) add('PARTICLE_BUDGET', 'warning', `Estimated live count ${performance.estimatedPeakLive} exceeds review threshold ${maxLive}`);
  if (performance.estimatedPeakLive === null) add('PERFORMANCE_UNKNOWN', 'warning', 'Dynamic/default rate or lifetime prevents a count estimate');
  const steady = c['minecraft:emitter_rate_steady'];
  if (numeric(steady?.max_particles) && performance.uncappedSteadyLive > steady.max_particles) add('STEADY_CAP', 'warning', 'Steady emitter reaches its cap; density/timing may change');
  if (texture?.alpha.partial && effect?.description?.basic_render_parameters?.material === 'particles_alpha') add('ALPHA_CUTOFF', 'warning', 'Texture has partial alpha; cutout material can destroy smooth fades');
  const errors = diagnostics.filter(x => x.severity === 'error');
  const review = diagnostics.some(x => ['VARIABLE_PRODUCER_UNKNOWN','MOLANG_UNSUPPORTED','MOLANG_QUERY_CONTEXT','DYNAMIC_UV','PERFORMANCE_UNKNOWN'].includes(x.code));
  return { identifier: effect?.description?.identifier ?? null, ok: errors.length === 0, structurallyValid: !!structurallyValid, staticChecksPassed: errors.length === 0 && !review, staticScope: 'Conservative schema, supported MoLang subset, constant UV bounds and lexical variable producers', diagnostics, expressions, variables, uv, performance, previewVerified: false, minecraftRuntimeVerified: false };
}
