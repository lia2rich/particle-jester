# Sources and redistribution

All executable repository code and generated textures/examples were independently authored. Research references are linked and commit-pinned, not copied as source implementations.

- **User archive** `merged_particle_assets.zip`: no license or manifest found. Analysis only. `data/user-evidence` contains derived hashes, identifiers, relationship metadata and MoLang evidence. Do not distribute that catalog publicly without resolving the sources' terms. No original PNG or particle JSON is included in the distributable examples.
- **Mojang bedrock-samples**: files are governed by the Minecraft EULA, as stated in that repository's LICENSE. This project records hashes and names and can fetch a private pinned working copy. It does not relicence or ship the original vanilla pack.
- **Snowstorm**: GPL-3.0-or-later. Its source was inspected. This project does not copy or modify its editor bundle. Our original bridge uses Wintersky's public API.
- **Wintersky 1.3.3**: MIT; installed through npm. It includes fallback vanilla texture data inside the upstream dependency. The bridge supplies original custom textures. Retain its npm license when bundling/distributing that dependency; this project's source archive excludes node_modules.
- **Three.js r134, molangjs, tinycolor2, pngjs, fflate, acorn, acorn-walk, Ajv, YAML and esbuild**: retain npm license files when distributing installed dependencies.
- **Playwright and MCP TypeScript SDK**: retain their upstream Apache/MIT notices as supplied by the installed packages. Exact packages and integrity hashes are in package-lock.json.
- **Blockbench MCP plugin/project, mcbejsonuimasterAI, official/community documentation and Codex**: source-level research and links only; their code, skills and examples were not copied into this repository. Check their actual licenses before redistribution of any optional downloaded upstream file.

The source archive is editable project code, not a redistribution of installed dependency binaries. `npm ci` reproduces the pinned npm graph.
