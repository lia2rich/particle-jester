# Particle-event cinematic

A zero-child root emitter with timeline events; scripts/animations for actor-aware/gameplay stages.

## Formula

timeline keys are absolute emitter seconds; sequence event nodes execute together, not as delays.

## Implementation

Use named events pointing to actual identifiers and explicit type emitter. Child variables do not automatically inherit root inputs. Keep root emission finite and child tails bounded. Verify every secondary edge and preview the whole chain.

## Performance

Sum overlapping child counts and tails; the zero-child root still creates emitters.

## Limits

Audio and actor-binding require context; this original event sequence contains no sound or inherited parameter assumptions.

## Original examples

- `examples/original-vfx/RP/particles/cinematic.particle.json`
- `examples/original-vfx/RP/particles/shockwave.particle.json`
- `examples/original-vfx/RP/particles/explosion_sparks.particle.json`
- `examples/original-vfx/RP/particles/explosion_smoke.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
