# Build and verification report

Built one Particle Jester Codex skill with the 11 original capabilities, the particle CLI/graph/PNG/MoLang tools, 18 original definitions, eight original textures, four composed sequences, a preview studio and the five-tool stdio MCP bridge.

- 26 engineering tests passed; saved JUnit report: evidence/engineering-tests.xml.
- 10/10 artifact evaluations passed. Nine have approved preview evidence; the dependency-trace case has no visual test requirement. No unseen-prompt model benchmark was performed.
- 24 capture sets (96 frames) were actually rendered and manually inspected. One rejected shockwave series and initial revision galleries document defects and corrections separately.
- Original scripts pass stable API 2.9.0 type checks. No dependency vulnerabilities were reported by the saved npm audit.
- Local stdio MCP initialization and actual validation/render/path-boundary calls passed. Blockbench and Snowstorm editor connections were not established; the custom Wintersky bridge provides the tested fallback.
- Pack archives were validated, created and reopened.
- Minecraft runtime verification remains pending.

Source inventory: 1,575 files, 856 particles, 417 decoded PNGs and 2,269 graph edges. 845 particle texture paths resolve; 11 do not. Source versions/licenses and incomplete actor ownership remain explicit. No raw supplied assets are redistributed. See references/source-index/corpus-findings.md for measured diagnostics and limits.

Particle Jester was installed into this app's existing user skill location and passed Codex skill metadata validation. Installed helpers locate this checkout. Keep it at this path or reinstall after moving it. Current portable skill-location guidance and MCP setup are in references/setup.md.

Start with README.md, examples/original-vfx/DEMONSTRATION.md and evidence/build-report.json. Original examples are engineering starting points with the listed limits, not certification of runtime or hardware compatibility.
