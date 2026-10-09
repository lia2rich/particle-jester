# Animated symbols and glyphs

One rune definition for rotation/pulse; a flipbook for changing symbol frames; multiple layers for independent symbols.

## Formula

phi=omega*age; atlasCell=floor(fps*age) subject to the verified count/loop rule.

## Implementation

Use an original high-contrast transparent glyph and preserve its reading plane. Separate glyph scale from aura glow. If changing symbols, generate known-size atlas cells rather than inferring them from an arbitrary tall PNG.

## Performance

Keep symbols readable at the intended distance; aggressive alpha fades can erase small strokes.

## Limits

The original rune animates rotation/fade. A changing glyph atlas is a derived variant, not an untested included asset.

## Original examples

- `examples/original-vfx/RP/particles/portal_ring.particle.json`

## Source evidence

Local evidence was excluded from this public export. Use verified official contracts and the original examples.
