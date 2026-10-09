# Layered magical portal

Three definitions started together; controller ownership for an attached persistent portal.

## Formula

Ring plane xy; motes=(r*cos(phi),centerY+r*sin(phi),depthOscillation).

## Implementation

Use a dark/translucent core for depth, an original rune ring for silhouette and orbiting motes for motion. Place layers at separate depth offsets. Keep color palette and fade clocks coherent. Preview each independently and all three together.

## Performance

Preserve ring/core at low quality; reduce motes first. Large overlapping quads dominate overdraw.

## Limits

A billboard portal has a preferred plane. Crossing it or rotating an attached portal requires engine/actor tests.

## Original examples

- `examples/original-vfx/RP/particles/portal_ring.particle.json`
- `examples/original-vfx/RP/particles/portal_core.particle.json`
- `examples/original-vfx/RP/particles/portal_motes.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
