import { MolangVariableMap, system } from '@minecraft/server';
import { sequences } from './sequences.js';
const running = new Map();
export function playSequence(entity, name, quality = 1) {
  const sequence = sequences[name];
  if (!entity?.isValid || !sequence || running.has(entity.id)) return;
  const ownerId = entity.id;
  const dimension = entity.dimension;
  const origin = { ...entity.location };
  const jobs = [];
  running.set(ownerId, jobs);
  for (const cue of sequence) jobs.push(system.runTimeout(() => {
    if (!entity.isValid || entity.dimension.id !== dimension.id || !dimension.isChunkLoaded(origin)) return;
    const variables = new MolangVariableMap();
    variables.setFloat('variable.quality', Math.max(0.4, Math.min(1.5, quality)));
    dimension.spawnParticle(cue.effect, origin, variables);
  }, Math.round(cue.time * 20)));
  jobs.push(system.runTimeout(() => running.delete(ownerId), Math.ceil((Math.max(...sequence.map(c => c.time)) + 5) * 20)));
}
export function cancelOwner(ownerId) {
  const jobs = running.get(ownerId);
  if (!jobs) return;
  for (const id of jobs) system.clearRun(id);
  running.delete(ownerId);
}
