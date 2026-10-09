import { system, world } from '@minecraft/server';
import { playSequence, cancelOwner } from './vfx.js';
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'pm:vfx' || !event.sourceEntity?.isValid) return;
  playSequence(event.sourceEntity, event.message.trim());
});
world.afterEvents.playerLeave.subscribe(event => cancelOwner(event.playerId));
world.afterEvents.entityDie.subscribe(event => cancelOwner(event.deadEntity.id));
