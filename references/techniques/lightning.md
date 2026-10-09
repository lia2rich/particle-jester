# Electrical arcs and lightning

One authored jagged sprite for a vertical flash; multiple oriented definitions/scripts for arbitrary endpoints.

## Formula

Segment P_i=A+(B-A)*i/n + perpendicularOffset_i; offset endpoints=0.

## Implementation

The original vertical flash uses a jagged white texture with a finite 0.22 s tail. For arbitrary endpoints, compute a stable basis and author segment direction/length inputs or a verified locator/animation orientation. Avoid treating a stretched straight streak as a bent 3D arc.

## Performance

Sparse bright flashes read strongly; additive overlap can saturate. Cap concurrent arc segments.

## Limits

The example is a static jagged billboard flash, not a general arbitrary-endpoint 3D lightning solver.

## Original examples

- `examples/original-vfx/RP/particles/lightning.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
