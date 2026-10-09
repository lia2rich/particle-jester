# Environmental dust

A broad low-height steady volume with finite exposure; state-owned looping variant for ambient environments.

## Formula

Density≈rate*life; lateral drift plus a low alpha envelope.

## Implementation

Keep scale small enough to read as dust while distributing across the scene. Use local/world ownership appropriate to a moving environment. Maintain a finite default to avoid leaving endless ambient emitters after a command.

## Performance

Scale density by area and observer distance; avoid repeatedly spawn a whole volume for every player tick.

## Limits

No automatic biome/weather trigger is added. Connect through existing environment ownership.

## Original examples

- `examples/original-vfx/RP/particles/dust.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
