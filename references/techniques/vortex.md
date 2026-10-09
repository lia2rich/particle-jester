# Vortex, tornado and helix

One parametric definition for motes; add debris/cloud layers for a full tornado.

## Formula

phi=phi0+360*f*age; r=r0+(R-r0)*t; xyz=(r*cos(phi),H*t,r*sin(phi)).

## Implementation

Use a fixed particle_random phase and an age-derived angle. Separate vertical drift from radial widening. For a funnel, set r(y) to a designed profile and distribute vertical starting positions; the supplied original demonstrates an expanding rising spiral, not volumetric fluid simulation.

## Performance

Use fewer distinct sprites for the outer silhouette and denser tiny motes; avoid per-tick server motion.

## Limits

A particle path is deterministic conditional on its random seed; Minecraft seeds need not match preview seeds.

## Original examples

- `examples/original-vfx/RP/particles/vortex.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
