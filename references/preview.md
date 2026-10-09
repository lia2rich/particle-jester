# Visual integration and evidence

## Investigated options, in requested order

Snowstorm's inspected repository at `f70fbb58b7399f973441c93cf0766bddabcbc5d8` has no bundled MCP server. A web search for Snowstorm MCP also returned SNOMED clinical terminology servers, which are unrelated to Minecraft particles. This is a bounded investigation, not proof that no third-party particle MCP can ever exist.

**Blockbench MCP:** inspected plugin `d0271716c6434add875fd024e9ea6b474bc0ca09` and its particle skill. Actual registered operations include `list_particle_presets`, `create_particle_effect`, `update_particle_effect`, `manage_particle_keyframes`, `list_particle_effects`, `export_particle_pack`, locator creation, animation timeline control and screenshot capture. The source distinguishes desktop rendering from file-only headless tools. Port 3000 was not accepting a local connection during the build, so no Blockbench MCP connection is claimed. The config points to its documented `/bb-mcp` HTTP endpoint.

**Snowstorm through Playwright MCP:** the UI's documented flow supports importing JSON, choosing a custom PNG in the Texture section, manipulating the preview camera and using playback/screenshot controls. The editor's source exposes `loadFileFromParentEffect`, but that internal global is not treated as a maintained automation API. Its UI/state is not a stable unattended capture contract. Use real accessibility snapshots and available file-input controls; recheck selectors after an update. This repository provides a manual/assisted workflow and Playwright configuration; it does not claim a Snowstorm UI capture was performed.

**Implemented fallback:** original local browser bridge using MIT Wintersky 1.3.3, the renderer imported by Snowstorm's `src/emitter.js`, and compatible Three.js r134. The public API documents Scene, Config, Emitter, `start`, `tick`, `jumpTo` and camera-facing rotation. The bridge controls its own interface rather than inventing Snowstorm editor methods. Event texture/sub-effect fetching follows verified Wintersky/Snowstorm source. Snowstorm's GPL editor code is neither copied nor modified.

## Repeatable capture

Start `npm run studio` to inspect interactively, or use `tools/preview.mjs` for capture. Specify the intended camera and target, simulation seed, parameter values and explicit times. Each seek resets the simulation and advances fixed steps; it does not rely on a wall-clock sleep to approximate a timestamp. Keep camera/distance identical for comparison.

Captures record PNG hashes, JSON hashes, texture hashes, times, live particle counts and browser errors. The command reports `rendered:true` only after real browser rendering and texture loading. It leaves `previewVerified:false`. Review shape, color, motion, scale, opacity, density and timing, then write `inspection.json` bound to the capture report hash. `tools/lib/evidence.mjs` detects stale assets/screenshots. That gate audits evidence consistency, not artistic judgment by itself.

Capture beginning, midpoint, peak and tail/end. For layers, capture each independently and then `--sequence sequences.json --name portal` (or blizzard/explosion/boss). A blank frame at the end can be expected; a blank midpoint is not an acceptable preview just because the renderer ran. Check silhouette, perspective, frame transitions, tint, margins, overlap and the longest tail.

The bridge disables ground collision. It does not simulate real block collisions, actor locators, entity queries, graphics modes, chunk loading or multiplayer. The seed stabilizes this browser's random sequence, not Minecraft. Scripts schedule in ticks and the local compositor schedules in seconds. Even an approved preview leaves `minecraftRuntimeVerified:false`.

Wintersky 1.3.3 requires two explicit adapters found during real iteration: dispose only root emitters because they delete their children recursively; suppress timeline replay after a once-only root emits `end`. Its installed distribution uses `end`, although its packaged source says `expire`. The adapter continues ticking surviving children. Interactive seeks are serialized to prevent overlapping image-load resets. See the demonstration for the measured cinematic counts before and after correction. Steady-emission sampling can also produce different live counts from the analytic Bedrock estimate.

## Bedrock runtime checklist

Activate the original RP/BP on the target version. Enable Content Log. Test `/particle pm:shockwave ~ ~1 ~` and the four `/scriptevent pm:vfx` sequence names from an entity. Check intended camera distance, terrain collision/debris, lighting/graphics mode, simultaneous actors, script cancellation on death/leave/dimension changes, repeated casts and full termination. Record exact version/device, screenshots, Content Log and reviewer narrative in a runtime evidence manifest. Start from `config/runtime-evidence.example.json`, retaining false flags until real tests are reviewed. Bind evidence and tested RP bytes with hashes and list tested effect/sequence IDs. Do not fill this manifest from a browser preview; it is reviewer-attested evidence, not an automated game harness.

Sources: [Snowstorm source](https://github.com/JannisX11/snowstorm/tree/f70fbb58b7399f973441c93cf0766bddabcbc5d8), [Blockbench plugin](https://github.com/jasonjgardner/blockbench-mcp-plugin/tree/d0271716c6434add875fd024e9ea6b474bc0ca09), [particle skill](https://github.com/jasonjgardner/blockbench-mcp-project/tree/e9c29a93e54bdd9aaa8a308196dfd4147e47d88c/skills/blockbench-particles), [Playwright MCP](https://playwright.dev/docs/getting-started-mcp), [Wintersky API](https://github.com/JannisX11/wintersky).
