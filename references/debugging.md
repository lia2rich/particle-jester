# Debug by ownership and evidence

Classify the symptom before changing counts or textures.

| Symptom | Evidence to inspect | Typical correction |
| --- | --- | --- |
| Nothing renders | Actual identifier, RP activation, exact texture path, material, lifetime, alpha and scale | Fix the proven failed link, then use a simple diagnostic spawn |
| Checkerboard | PNG path/case, overlay selection and decoder result | Supply explicit existing PNG; don't guess a vanilla fallback |
| Wrong atlas cell | UV coordinate system, step, count convention, random UV expressions | Enumerate mapped rectangles and compare pixels |
| Persistent effect | Rate/lifetime alternatives, looping keyframes, controller ownership | Bound both emitter duration and particle tail |
| Jittering spiral | Random call evaluation frequency, stable phase variables, local space | Use fixed particle random phase; keep motion parametric |
| Flat/faint or black | Tint multiplication, alpha material, texture margin, camera distance | Match art/material and measure visible radius |
| Wrong following behavior | Locator, local position/rotation, keyframe actor binding | Fix the responsible attachment layer |
| Source checker passes but game fails | Exact engine/API versions, Content Log, query context, resource stack | Reproduce in target client; don't equate syntax with runtime |

`node tools/cli.mjs validate file.json --texture image.png` produces field-level diagnostics. `scan` checks relationships and records unresolved/ambiguous aliases. `trace` shows a neighborhood, including reverse trigger edges. It does not turn an undirected neighborhood into a verified chronological trigger chain.

The safe repair utility can fit a **constant linear flipbook** to available cells, or substitute a verified PNG at an explicitly requested path. It writes a different output and a diff. It cannot infer intended frame order, repair unknown custom variables, rewrite malformed math to an assumed meaning, or replace missing source artwork. For those cases, derive a correction from the design and source evidence, then validate and preview.

Do not remove an unfamiliar component to obtain a green report. Check it against target docs/metadata and extend the independently authored schema when justified. A conflicting document or permissive source metadata is a compatibility question, not permission to invent a key.

Use screenshot hashes and exact JSON hashes for every correction cycle. An old preview is stale after JSON, texture, parameter, material, camera or sequence changes. The runtime evidence auditor checks that required evidence is present; a reviewer still determines whether the symptoms were reproduced and resolved.
