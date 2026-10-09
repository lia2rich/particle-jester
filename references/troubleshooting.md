# Troubleshooting

**npm ci fails:** use Node 22+, read the actual dependency error, and preserve package-lock.json. Do not solve version incompatibility by blindly deleting the lock or upgrading Three.js: Wintersky 1.3.3 documents compatibility with r134.

**No browser executable:** set `PARTICLE_BROWSER` to an installed Edge/Chrome path, pass `--browser`, or install Playwright Chromium. Run capture again; do not mark preview verified because the preview HTML exists.

**WebGL unavailable:** inspect browser errors/driver policy. The capture launcher enables software rendering where supported. A blank screenshot is not a successful visual test. Reduce the scene to a known original effect and confirm a real particle count and visible pixels.

**Blockbench refuses connection:** open the app, install/enable the intended plugin and verify its configured localhost port and `/bb-mcp` route. Headless bbmodel tools edit files but cannot provide desktop particle screenshots. Do not relabel headless success as a preview.

**Snowstorm UI changed:** obtain a fresh accessibility snapshot, locate the actual File import/texture controls and playback/screenshot actions. Preserve the user's existing work. Do not use an undocumented global based on a remembered editor version.

**Missing corpus aliases:** the provided archive has no manifests or complete client entity stack. Preserve unresolved edges, look for the real owner pack, and supply it explicitly. Inferring an owner from a matching basename can connect unrelated merged collections.

**Missing textures:** inspect exact case and overlay roots. Eleven source paths are missing from the supplied archive. Some resemble vanilla paths; add a pinned vanilla overlay only after confirming it contains the exact asset. Never silently create a replacement source texture.

**Static checks partial:** inspect unsupported MoLang/query contexts, custom variable producers and dynamic performance/UV expressions. Provide proven parameter ranges where the estimator supports them; otherwise record unknowns and test the target engine. A warning suppression does not create evidence.

**Wrong frame count/direction mode:** read the documented disagreements in `official/compatibility.md`. Compare the pinned sample and target client. Avoid applying the tutorial's zero-based `max_frame` interpretation to every source.

**Stale preview inspection:** any changed JSON, PNG, camera, variables, sequence or screenshot needs a new capture and inspection. The evidence auditor rejects changed hashes. In-game verification stays false until actual Bedrock evidence is reviewed.
