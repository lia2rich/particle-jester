# Large directional blizzard

Two definitions and a simultaneous sequence: drifting flakes plus sparse wind streaks.

## Formula

v=(6,-2,1) blocks/s; lateral a=A*sin(w*age+phi); density≈rate*life.

## Implementation

Emit across a broad box; place the upstream volume to create arrival time. Use small near/far flakes and a second material/shape layer for gust readability. Both density/caps use a bounded quality input, defaulting to standard.

## Performance

At standard quality flakes approach 660 alive per emitter; high quality approaches 990, before concurrent actors. Profile large transparent volumes.

## Limits

No true wind field or terrain occlusion is simulated. Detached script sequence origins remain fixed.

## Original examples

- `examples/original-vfx/RP/particles/blizzard_snow.particle.json`
- `examples/original-vfx/RP/particles/blizzard_gust.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
