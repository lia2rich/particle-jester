# Particle Jester: scripting

Use for script spawn calls, abilities, dynamic inputs or synchronized sequences. Read the target BP manifest and exact module type definitions. Prefer stable APIs and direct Dimension.spawnParticle; do not invent an emitter handle or attachment method.

Keep one subscription/dispatcher per used event, filter immediately and schedule finite cues. Revalidate cached/delayed actors and loaded locations; cancel pending jobs on owner lifecycle changes. Avoid broad tick scans and hidden gameplay exceptions.

Use JSON for motion/fade/size and scripts for gameplay selection/positions/inputs. Verify MolangVariableMap expansion names and declare custom parameter bounds. Type-check against the exact dependency and inspect the script-to-particle catalog links. Browser sequence preview does not prove server ticks or multiplayer behavior.

Read [detailed engineering guidance](../../../../references/scripting.md) for the relevant contracts and examples. Common compatibility, tool and verification rules are in [Particle Jester](../../SKILL.md).
