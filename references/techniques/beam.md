# Energy beam

One planar energy sprite; crossed planes or oriented segments for a beam visible from more directions.

## Formula

D=B-A; length=sqrt(D·D); center=(A+B)/2; normalized direction=D/length.

## Implementation

The original example is a fixed plane strip. Arbitrary endpoints need an oriented animation/locator or verified direction input. Size is half the visible length after sprite margins. Add a separate impact definition; do not scale rate to control beam length.

## Performance

A few long quads may cover much of the screen. Test oblique and rear viewpoints before promising a cylindrical beam.

## Limits

The included fixed-plane example is not a fully dynamic endpoint beam; its limitation is explicit.

## Original examples

- `examples/original-vfx/RP/particles/beam.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
