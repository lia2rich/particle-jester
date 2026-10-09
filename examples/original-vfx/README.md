# Original VFX packs

See the [sample gallery and commands](SHOWCASE.md), or [download the packaged samples](https://github.com/dotmcworld/particle-jester/releases).

18 definitions, eight reproducibly generated RGBA textures, four script/compositor sequences and an event-chained cinematic. Assets/code are original MIT resources. Target: Bedrock 1.26.50; stable server module 2.9.0. In-game verification is pending.

RP paths are relative to `RP/`. Each texture is referenced directly; no item/terrain atlas registration is required for these particle textures. `pm:flame` uses a 32×256 eight-cell atlas. `pm:shockwave` uses a 128×128 annulus with an explicit painted-radius correction. The portal contains ring, core and motes; blizzard contains flakes and gust streaks; explosion contains impact, sparks, debris and smoke.

Activate the RP to use `/particle pm:shockwave ~ ~1 ~` (or another actual ID). Activate both RP and BP for `/scriptevent pm:vfx portal`, `blizzard`, `explosion` or `boss`. The event needs an entity source. `pm:cinematic` demonstrates a self-contained particle timeline: `/particle pm:cinematic ~ ~1 ~`.

The BP snapshots the actor's origin, prevents overlapping sequence jobs per owner, validates delayed references and cancels pending work on leave/death. Rate/cap quality defaults to 1 for standalone commands. `playSequence` accepts a guarded quality input; it does not change colors/lifetimes or spawn gameplay damage.

Standalone beam/lightning/slash are explicitly planar visual examples. They are not complete arbitrary-endpoint beam/lightning solvers or attached sword mechanics. Connect them to verified animation locators/script inputs for those contexts. The trace fixtures used by evaluations are structural tests, not gameplay entities.

Generate with `npm run examples`, check with `npm run check`/`npm run typecheck`, capture with `npm run preview:all`, and package with `npm run package:examples`. After regenerating any assets, all old inspection reports must be checked for staleness.
