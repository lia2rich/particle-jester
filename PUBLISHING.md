# Publishing Particle Jester on GitHub

Use the public repository export: `node scripts/export.mjs --public --out ../particle-jester-github.zip`. Extract it and upload the contents of its top-level repository folder. The private working checkout retains local-use source evidence; the public export excludes that detailed catalog, local configuration, installed metadata, dependencies and scratch work, and sanitizes personal paths in reports and documentation.

The public repository contains one `particle-jester` skill, its ten supporting mode guides, all original engineering tools and examples, recorded verification evidence, the MIT license and third-party notices. Keep `LICENSE` and `THIRD_PARTY_NOTICES.md`. The sample packs and generated textures are original; the supplied unknown-license assets are not included.

From a fresh checkout, run `npm ci`, `npm run check` and `npm run typecheck`. GitHub Actions runs these checks and validates example packaging. The checks audit saved visual evidence; CI does not conduct a new visual inspection or a Minecraft runtime test. In-game verification remains pending, so describe the release as a tested particle engineering toolkit with original example effects, rather than a guarantee of production compatibility on every device.

Install with `node scripts/install-skills.mjs --apply`. This copies the single skill and rewrites shared-resource links to that checkout. Keep the complete checkout: installing only `skills/particle-jester` with a generic skill downloader does not install its supporting engineering runtime. Configure the optional MCP bridge using `config/mcp.example.toml`; a configuration entry alone is not an active connection.

The earlier eleven skills were combined into one entry. Their specialist guidance remains under `skills/particle-jester/references/modes`; the old separate skill folders are no longer part of the published repository. Invoke `$particle-jester` or let Codex select it for matching Bedrock particle requests.

The public repository is [dotmcworld/particle-jester](https://github.com/dotmcworld/particle-jester). Use the sanitized public export for subsequent uploads. The export and skill installer themselves do not create or update a remote repository.
