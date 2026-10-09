# Projectile trail and impact

One trail definition plus a hit definition and a projectile animation or script lifecycle.

## Formula

spacing=v/f; finiteChildTail<cleanupDelay; impactTime=observedHitEvent.

## Implementation

Use a short-lived world-space trail; avoid local position following for old particles. Subscribe to the exact projectile-hit event in the target module, filter managed projectiles and spawn one impact.

## Performance

Cache managed projectiles if sampling is necessary; prune invalid references and bound cadence.

## Limits

The repository supplies particle layers and integration guidance; it does not create a new gameplay projectile entity.

## Original examples

- `examples/original-vfx/RP/particles/trail.particle.json`
- `examples/original-vfx/RP/particles/explosion_sparks.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
