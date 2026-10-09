# Advanced VFX design and pattern selection

Start with intended world scale, silhouette, material/color, plane/volume, motion, warning/impact/tail timing, trigger ownership and observer distance. Select the smallest design that preserves those requirements. One billboard can create a precise ring; a blizzard needs flake and wind distributions; a portal needs distinct depth/material layers. Scripts are for gameplay clocks/inputs, not replacing client particle motion.

- [Precise expanding shockwave](techniques/shockwave.md): One definition: a horizontal annulus billboard. Multiple definitions only for dust/debris accompaniment.
- [Vortex, tornado and helix](techniques/vortex.md): One parametric definition for motes; add debris/cloud layers for a full tornado.
- [Large directional blizzard](techniques/blizzard.md): Two definitions and a simultaneous sequence: drifting flakes plus sparse wind streaks.
- [Electrical arcs and lightning](techniques/lightning.md): One authored jagged sprite for a vertical flash; multiple oriented definitions/scripts for arbitrary endpoints.
- [Layered magical portal](techniques/portal.md): Three definitions started together; controller ownership for an attached persistent portal.
- [Energy beam](techniques/beam.md): One planar energy sprite; crossed planes or oriented segments for a beam visible from more directions.
- [Debris, smoke and sparks explosion](techniques/explosion.md): Four definitions with staggered cues; particle events can own a simpler fixed sequence.
- [Sword slash and trail](techniques/slash.md): A finite slash billboard plus a world-space trail; animation locator or bounded script sampling for attachment.
- [Projectile trail and impact](techniques/projectile.md): One trail definition plus a hit definition and a projectile animation or script lifecycle.
- [Staged boss ability](techniques/boss.md): Seven cues via bounded Script API sequence; animation synchronization may be a better owner in a real boss.
- [Animated symbols and glyphs](techniques/glyphs.md): One rune definition for rotation/pulse; a flipbook for changing symbol frames; multiple layers for independent symbols.
- [Animated flame](techniques/flame.md): One finite steady emitter with original eight-frame vertical atlas.
- [Water splash](techniques/water.md): One droplet burst; add a horizontal ring and mist for a layered splash.
- [Smoke growth and fade](techniques/smoke.md): One finite burst/steady definition; additional density layers for depth.
- [Environmental dust](techniques/dust.md): A broad low-height steady volume with finite exposure; state-owned looping variant for ambient environments.
- [Particle-event cinematic](techniques/cinematic.md): A zero-child root emitter with timeline events; scripts/animations for actor-aware/gameplay stages.

## Evidence-driven reproduction

Search data/user-evidence/catalog.json and data/pattern-cards.json. Inspect the actual matching source definition, mapped PNG dimensions/alpha/UV and caller edges. A technique candidate does not establish its appearance. Preserve missing owners/textures and unknown licenses. Derive new formulas and paint/generate original art.

The source archive demonstrates flipbooks, curves, randomized UV selections, parametric orbits and layered events, but it lacks manifests and complete caller ownership. The original pack uses those general techniques with new textures, namespaces, scales and bounded clocks. It is not a renamed copy of source assets.

## Visual iteration

Validate each layer with the actual PNG and parameter bounds. Capture early, middle, peak and end at the intended camera, then inspect shape, palette, world scale, depth, opacity, density and stage timing. Compare layers separately and all together. Revise measured defects and recapture; do not approve a composition solely from particle count or JSON syntax.

An effect can be mathematically precise yet visually wrong because texture margins change its silhouette. The demonstration corrects this for the ring. A screen ellipse from perspective is normal for a world circle; a camera-facing circle floating vertically is a different defect.

Quality variants preserve the main silhouette, timing and palette while adjusting accent density/caps. Use actual target-device profiling before claiming console/mobile budgets. Preview approval and Minecraft runtime approval remain separate.
