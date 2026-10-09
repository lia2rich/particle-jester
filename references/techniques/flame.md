# Animated flame

One finite steady emitter with original eight-frame vertical atlas.

## Formula

Frame pixels=(32,32); PNG=(32,256); step=(0,32); max_frame=8; fps=10.

## Implementation

Use white tint on the painted flame atlas, upward speed/acceleration and shrinking/fading children. Rate and cap scale together with quality. Validate each mapped cell and preview animation differences; one screenshot does not prove frame order.

## Performance

Preserve core flame shape while scaling accents; blended overlap can become opaque at high rates.

## Limits

Use pinned frame-count semantics; tutorial wording differs. Light emission is not created just by a bright texture.

## Original examples

- `examples/original-vfx/RP/particles/flame.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
