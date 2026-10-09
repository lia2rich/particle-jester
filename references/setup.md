# Setup, installation and usage

Install Node.js 22+ and Git. `npm ci` reproduces exact package versions/integrities; `npm run check` verifies tools/skills/examples and evaluates cases. `npm run typecheck` validates the original BP against stable server 2.9.0. No global npm packages are needed.

`node scripts/install-skills.mjs` prints its plan; `--apply` installs. Installed skill frontmatter remains valid and links point to this repository's actual shared files. `--replace` is required only to overwrite a differing installed skill; unrelated skills are untouched. Keep this checkout, or re-install after moving it.

The installer defaults to the configured CODEX_HOME/skills location, or ~/.codex/skills for compatibility. Current [official OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills) also documents ~/.agents/skills and repository .agents/skills. Use --target to select the location your host scans. Avoid duplicate installations. Codex detects changes automatically; restart if the skill does not appear.

`config/mcp.example.toml` is configuration, not evidence of an active connection. Our stdio bridge launches with `node tools/mcp.mjs --root <workspace>`. Its five tools are scan, validate, trace, search and preview. Paths cannot leave that configured workspace (including symlink ancestors). For another pack elsewhere on disk, choose that pack's containing workspace deliberately.

Run `node scripts/mcp-smoke.mjs` to initialize a local MCP client, list tools and call validation. It also calls a render capture when `--preview` is passed. This proves a direct local protocol connection. A running Codex client still needs the config entry and a reload to expose those tools. Blockbench's connection needs its desktop plugin; Playwright MCP is a separate optional UI integration.

For a pinned private Mojang working copy, `node tools/research-sync.mjs --source bedrock-samples --out work/upstreams/bedrock-samples` clones/checks out the lock's exact SHA. It does not run upstream code. `--verify` compares an existing checkout to the recorded SHA. Do not ship that working copy under this repository's MIT license.

Original examples are in `examples/original-vfx/RP` and `BP`. Import their packaged mcpack/mcaddon files or, when explicitly requested, install into development packs. On this user's machine, development packs mean the shared Roaming Minecraft Bedrock `com.mojang` directory recorded in AGENTS.md. Generation/packaging does not imply authorization to activate an existing world or replace its packs.

For a public source ZIP, `node scripts/export.mjs --public` excludes local user-evidence metadata and its inspection report, node_modules, work and repository state. The full user-delivery ZIP includes derived source evidence but no raw supplied assets. Both exports remain editable and use `npm ci` after extraction.
