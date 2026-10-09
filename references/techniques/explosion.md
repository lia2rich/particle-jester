# Debris, smoke and sparks explosion

Four definitions with staggered cues; particle events can own a simpler fixed sequence.

## Formula

Impact at 0; debris at 0.08 s; smoke at 0.15 s; totalTail=max(cue+childLife).

## Implementation

Keep a readable sharp impact before the slow smoke rise. Sparks move outward and drag; debris uses gravity/collision; smoke grows and fades. Each material/motion layer owns its finite lifetime.

## Performance

Reduce accents without removing the impact silhouette. Collision debris requires block-world profiling.

## Limits

Preview disables real block collisions. No gameplay explosion/damage is performed by the VFX sample.

## Original examples

- `examples/original-vfx/RP/particles/shockwave.particle.json`
- `examples/original-vfx/RP/particles/explosion_sparks.particle.json`
- `examples/original-vfx/RP/particles/debris.particle.json`
- `examples/original-vfx/RP/particles/explosion_smoke.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
