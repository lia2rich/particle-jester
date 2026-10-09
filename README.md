# Particle Jester

A Codex skill and toolkit for Minecraft Bedrock particles: design, textures, MoLang, debugging, previews and layered VFX.

## Install

Requires Node.js 22+ and Codex.

```sh
git clone https://github.com/dotmcworld/particle-jester.git
cd particle-jester
npm ci
node scripts/install-skills.mjs --apply
```

Keep the checkout available after installation. See [setup](references/setup.md) for other skill locations and optional tools.

## Try it

- “Use $particle-jester to make a purple portal with swirling sparks and a soft opening burst.”
- “Use $particle-jester to fix this particle: it spawns but its texture is invisible.”
- “Use $particle-jester to make a three-stage boss attack with a warning ring, beam and impact.”

[More prompts](PROMPTS.md) · [Sample effects](examples/original-vfx/DEMONSTRATION.md) · [Downloads](https://github.com/dotmcworld/particle-jester/releases) · [Tool reference](references/tooling.md)

Examples include reviewed browser previews. Minecraft runtime testing remains pending. [Verification details](BUILD_REPORT.md).

MIT. Dependency notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
