# Sword slash and trail

A finite slash billboard plus a world-space trail; animation locator or bounded script sampling for attachment.

## Formula

theta=theta0+omega*age; alpha=1-t; trailSampleSpacing≈speed/sampleRate.

## Implementation

The original arc rotates through a finite sweep; it is an authored silhouette, not a true ribbon mesh. Attach to a verified sword locator/keyframe, leave old trail children in world space and synchronize the hit moment.

## Performance

Keep samples spatially spaced rather than spawning each server tick indiscriminately.

## Limits

Detached demo particles do not follow a real sword. Test animation geometry and controller/keyframe context.

## Original examples

- `examples/original-vfx/RP/particles/slash.particle.json`
- `examples/original-vfx/RP/particles/trail.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
