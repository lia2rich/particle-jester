# Water splash

One droplet burst; add a horizontal ring and mist for a layered splash.

## Formula

v0 outward; y(age)=y0+vy*age-0.5*g*age^2 without drag.

## Implementation

Make droplets small and fast with gravity. Use a separate ripple instead of forcing one droplet definition to also be a ring. Compare the source atlas ripple technique to an original procedural annulus without copying artwork.

## Performance

Avoid huge blended droplets; sparse high-contrast droplets can read better than dense mist.

## Limits

The sample is a droplet layer; water-surface placement and ripple orientation need real terrain/context.

## Original examples

- `examples/original-vfx/RP/particles/water.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
