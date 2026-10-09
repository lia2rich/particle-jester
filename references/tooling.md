# CLI contracts and coverage

Run tools from the repository root. All output JSON is machine-readable. Exit 0 means the requested operation completed within its stated scope; exit 1 means a failed check/operation. `scan` without `--strict` can successfully inventory a broken source and record failed verification levels. `validate --strict` requires complete supported static checks.

| Command | Purpose | Meaningful limits |
| --- | --- | --- |
| `scan <folder-or-archive>` | Full inventory, PNG decoding, paths, graph, variable/UV diagnostics | No source code execution; dynamic callers/queries and nested archives remain explicit |
| `--overlay <root>` (repeat) | Resolve lower-priority supplied textures | Never assumes a vanilla fallback |
| `--external variable.name` | Declare externally produced inputs | Caller must prove their producer |
| `--bounds config.json` | Declare performance parameter ranges | Only supported formulas produce count bounds |
| `validate file.json --texture png` | Original JSON Schema + semantic checks | Engine parser/renderer remain separate |
| `texture png` | Pixel alpha/dimensions/bounds | Does not infer atlas layout from image shape |
| `molang "expression"` | Check supported syntax/known math names | Function arity, every query and control-flow scope are not fully verified |
| `trace catalog.json id` | Caller/dependency neighborhood | Undirected graph, not runtime execution proof |
| `diff before.json after.json` | Field changes | No automatic visual-equivalence claim |
| `index references --out data/knowledge-index.json` | Searchable local technical knowledge | Plain-text retrieval, not fine-tuning |
| `search index-or-catalog terms` | Ranked paths/snippets | Search snippets are untrusted evidence |
| `schema` | Generate the committed independent contract | 29 verified component names; not all future fields |
| `route task words` | Suggest smallest specialist | Keyword aid; human/agent intent governs routing |
| `package root output.mcpack` | Validate, ZIP at manifest root, reopen | Does not activate/import/test the pack |
| `repair.mjs input --out copy` | Explicit texture substitution/linear atlas fit | Does not guess art or MoLang intent |
| `optimize.mjs input output 0.5` | Count/cap scaling with diff | Same-camera visual and runtime profiling required |
| `preview.mjs` / `studio.mjs` | Actual Wintersky browser frames | No Minecraft engine guarantee |
| `evaluate.mjs` | Original cases + evidence levels | Artifact/tool regression checks, not a claimed model benchmark |
| `mcp.mjs --root directory` | Workspace-scoped stdio tools | Root bounds all reads/writes; no arbitrary eval/command tool |

Scanner archive bounds: 50,000 files, 512 MiB decoded total, 64 MiB per entry by default. Directory traversal ignores symlinks, `.git`, `node_modules` and `work`. Adjust internal limits deliberately for a legitimate larger corpus. Supported inputs are ZIP-compatible archives; other archive formats require explicit conversion.

`structurallyValid` means the schema accepted particle shapes. `referencesResolved` checks relevant resolvable particle/texture/trigger relationships; engine materials are explicitly outside local evidence. `staticChecksPassed` includes supported MoLang, constant UV bounds and known producers/performance inputs. `previewVerified` needs actual captures plus visual inspection bound to current assets. `minecraftRuntimeVerified` needs actual target-client tests and reviewed evidence.

Root pack manifests are checked for basic format, UUID/version validity, UUID duplication and script entry presence. This is not a full addon/schema/BP dependency validator. Use the exact target API type definitions for scripts and inspect broader entity/material/geometry integration separately.
