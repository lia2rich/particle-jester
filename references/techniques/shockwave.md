# Precise expanding shockwave

One definition: a horizontal annulus billboard. Multiple definitions only for dust/debris accompaniment.

## Formula

t=clamp(age/life,0,1); r=r0+(R-r0)*(1-(1-t)^2); billboardHalfExtent=r/paintedRadiusFraction.

## Implementation

Use emitter_transform_xz, one instant child, zero speed and a finite 0.9 s child lifetime. The original texture paints radius at 0.85, so divide half extents by 0.85. Fade alpha independently; do not move particles radially to approximate a continuous ring.

## Performance

One large blended quad can cause overdraw despite one-particle count; check ground offset and distant readability.

## Limits

The original demonstration targets an eight-block ring centerline radius; raster antialiasing gives it finite thickness. Preview perspective turns a world circle into a screen ellipse.

## Original examples

- `examples/original-vfx/RP/particles/shockwave.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
