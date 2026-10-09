# Particle Jester: textures

Use for PNG/atlas art, UV or missing-texture work. Resolve the exact render path and casing from the RP root and explicit overlays. Decode pixels, dimensions, alpha and visible margins before changing UVs.

Distinguish a static sprite sheet from configured flipbook playback. Map declared UV units proportionally to real PNG pixels; do not require equal dimensions. Enumerate every constant frame rectangle, including negative steps and gaps. Follow the pinned frame-count convention and document legacy-target disagreements.

Create original textures, preserve transparency and choose material/tint intentionally. For a ring, compensate billboard extents for the painted radius. Use the repair tool only with a proven PNG substitution or finite linear atlas capacity; never guess missing source art. Inspect frame transitions and edge bleed in preview and engine.

Read [detailed engineering guidance](../../../../references/textures.md) for the relevant contracts and examples. Common compatibility, tool and verification rules are in [Particle Jester](../../SKILL.md).
