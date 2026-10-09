# Smoke growth and fade

One finite burst/steady definition; additional density layers for depth.

## Formula

halfSize=s0+growth*t; alpha=a0*(1-t); drag damps drift.

## Implementation

Use a soft original sprite with blended alpha and a deliberate dark/light palette. Size growth and fade are separate; do not compensate a missing fade by shortening every lifetime. Keep old smoke in world space.

## Performance

Large overlapping translucent billboards can dominate cost even at low counts.

## Limits

The bridge approximates lighting/materials; visibility against terrain and sky needs Bedrock checks.

## Original examples

- `examples/original-vfx/RP/particles/explosion_smoke.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
