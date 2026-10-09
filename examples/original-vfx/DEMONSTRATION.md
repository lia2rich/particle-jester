# From request to corrected shockwave pack

## Request and evidence

Create an original cyan ground shockwave, expanding from a 0.35-block painted centerline radius to eight blocks in 0.9 seconds, with smooth outward easing and a clean fade. The ring is a mathematical sprite, not borrowed artwork.

The source catalog records `spark_vfx:lava_splash_ripple` as a vertical 20 × 200 ten-frame atlas with a custom direction; `cyd_mgspl:spell_cast_blue_1` demonstrates random phase, trigonometric motion and alpha curves. These are implementation evidence, not game-tested claims about the supplied packs. See `references/community/observed-patterns.md`, `data/pattern-cards.json` and `references/techniques/shockwave.md` for hashes, uncertainty and reproduction rules. No supplied PNG or JSON was copied into the example.

## Design and generation

Let `t=clamp(particle_age/particle_lifetime,0,1)` and `r=0.35+7.65*(1-(1-t)^2)`. Use one instantaneous particle, zero speed, a 0.9-second life, the XZ emitter plane and alpha `(1-t)^0.6`. `tools/generate-examples.mjs` generates a 128 × 128 transparent annulus whose painted centerline lies at normalized radius 0.85, along with the matching JSON, seven other original sprite designs, and pack manifests.

The PNG is decoded and its dimensions, alpha histogram, painted bounds and hash are measured. Static UVs select the whole sprite. The source-independent schema checks the real component keys, field shapes, supported MoLang syntax and event/path references. The pack scan passes with `variable.quality` and its bounds declared for other definitions in the pack. There are eight generated textures in total.

## Actual preview and correction

The first implementation incorrectly used `r` as billboard half-size. Because the annulus is painted at 0.85 of the sprite radius, the displayed centerline approached 6.8 blocks instead of eight. `evidence/demo/before` contains actual browser renders at 0.05, 0.35, 0.75 and 0.95 seconds. Inspection rejected scale.

The corrected billboard size is `r/0.85`. The final captures in `evidence/demo/final` use the same seed 47, camera `[13,12,15]`, target `[0,1,0]` and times. They show a wider expanding ring with preserved tint and fade, then no particle at 0.95 seconds. `evidence/demo/comparison.png` places the before series above the final series. `correction.json` records the real JSON diff. The eight-block contract describes the centerline at terminal normalized age; finite stroke thickness, discrete preview ticks and fading prevent a claim of pixel-exact outer-edge measurement from the screenshots.

The broader review also corrected the vortex's missing vertical distribution, increased portal-core readability, enlarged near/far snowflakes, added gust motion and visible wind streaks, moved the fixed beam into a horizontal plane, and widened the lightning camera. Before galleries and observations are saved in `evidence/iterations`. Every layer and combined sequence has four real render captures. These are reusable engineering examples; the included planar lightning/beam/slash sprites are not volumetric ray solvers or combat mechanics.

## Preview integration defects found and fixed

The Wintersky scene's emitter list includes children; deleting both roots and that flat list disposed child materials twice. The bridge now deletes roots, which recursively delete children. Wintersky 1.3.3's installed distribution also resets emitter age on `end` and reevaluates timeline events on a disabled root. A per-root once-emitter adapter suppresses timeline replay while surviving particles and children continue ticking. The installed distribution uses the `end` event, although its packaged source tree says `expire`. The cinematic now has counts `[1,121,30,0]` at `[0.05,0.35,1,2.6]`. These are explicit preview-library adaptations, not changes to Minecraft's particle schema.

## Finished pack and remaining verification

`npm run package:examples` validates and reopens the RP/BP archives and combined add-on. `dist/particle-master-vfx.mcaddon` contains the original effects and bounded event-driven sequence driver. The resource pack is independently usable with `/particle pm:shockwave ~ ~ ~`; the behavior pack accepts `/scriptevent pm:vfx portal`, `blizzard`, `explosion` or `boss` from a player. Stable API 2.9.0 types were checked.

Minecraft runtime verification is pending. Use the intended target version, enable the content log, check commands and Script API contexts, inspect scale next to blocks, test actor binding and multiplayer visibility, and profile mobile/console overdraw. Save content-log and screenshot hashes plus version, device and reviewer observations under `evidence/runtime`. Preview approval and static checks do not replace that process.
