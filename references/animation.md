# Animation/controller/effect routing

Trace the complete chain: BP trigger/event → client animation alias or controller → active state/animation → particle keyframe/entry → client entity `particle_effects` alias → actual particle identifier → texture. Controller transition queries and pre-effect expressions are part of the trigger evidence; file presence alone does not prove they execute.

Animation keyframes use the local effect alias. A client entity map connects that alias to a namespaced particle ID. A controller state can hold particle effects for the state's lifetime. A direct `/particle` command uses the actual identifier. A script spawn likewise uses the identifier. Preserve this distinction when renaming: changing a file's basename cannot fix a missing client alias.

For an attached effect, find the geometry locator, its parent bone, the exported animation locator string and binding choice. Positions in model geometry use model coordinates. A character turn should carry an attached aura; an exhaust trail should preserve emitted world-space particles. Test moving, rotating, unloading and re-entering the state.

Use an animation/controller to synchronize bone motion with the effect when the animation already owns the action. Use a state for sustained loops. Use bounded one-shot keyframes for sparks/slashes. Repeated clips firing indefinite loops accumulate emitters. A controller re-entry can also restart an effect; inspect transition behavior and conditions, not only clip timestamps.

Secondary particle events can create `emitter`, `emitter_bound`, `particle` and `particle_with_velocity` effects. The last two require a manual-rate target. Named event references must resolve within the definition. Sequential event nodes execute together in order, not with implicit delays. Schedule stages using timeline entries or a script/animation clock.

The scanner resolves aliases only when it can associate an animation/controller with a client entity owner and its declared map. Missing owners remain unresolved. Multiple owner contexts produce candidate edges; they do not establish a globally unique runtime path. Script-driven dynamic expressions are marked as dynamic rather than evaluated.

Sources: [particle entity integration](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/particleentityintegration?view=minecraft-bedrock-stable), [effect events](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/particleeffectevents?view=minecraft-bedrock-stable), pinned Mojang samples. Blockbench's particle keyframes/export tools assist authoring but do not automatically create every controller/BP trigger.
