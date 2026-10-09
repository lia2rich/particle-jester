# Target contracts and documented disagreements

Research date: 2026-10-09. Example target: Minecraft Bedrock **1.26.50**, stable Script API **2.9.0**. Mojang sample revision: `46ba6ea985fb5a92d79a9419198f10dda14c199d`, tagged source version `1.26.50.4` in `version.json`. The resource-pack manifest declares `[1,26,50]`. This target is pinned evidence, not detection of the user's installed game.

Particle JSON `format_version:"1.10.0"` remains present in that sample collection. Do not replace it with the game version. The schema also recognizes the metadata's `1.21.10` contract. Format support in the checker does not prove that every target client accepts every field.

## Flipbook frames

The [billboard component reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/particlecomponents/minecraftparticle_appearance_billboard?view=minecraft-bedrock-stable) calls the first frame 1 and describes `max_frame` as the maximum frame number. The [tutorial](https://learn.microsoft.com/en-us/minecraft/creator/documents/particleeffects?view=minecraft-bedrock-stable) describes zero-based indexing and uses 7 for eight smoke cells. Pinned [basic_smoke.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/particles/basic_smoke.json) uses 8. Wintersky 1.3.3 wraps when its internal zero-based frame reaches `max_frame`.

Our original eight-frame flame uses `max_frame:8`. The checker enumerates UV cells 0 through 7. It preserves the source value and labels its interpretation. If repairing a legacy target, compare its working sample and in-game animation before changing this field. A claimed bad source frame based solely on older tutorial wording is insufficient evidence.

UV width/height are a coordinate system, not necessarily PNG pixels. Map `(u,v,w,h)` to pixels by multiplying horizontal values by PNG width/declared width and vertical values by PNG height/declared height. Constant out-of-bounds UVs are errors; expression-driven UVs require parameter values and remain unproven. Linear `step_UV` does not automatically wrap to the next atlas row.

## Direction mode spelling

The billboard documentation says `custom_direction` as a mode in its prose/example; the pinned Mojang metadata `particle_appearance_billboard direction_settings_mode.json`, working source definitions and Wintersky use **`mode:"custom"`**, with the vector in **`custom_direction`**. This repository follows the pinned implementation evidence. The documentation also contains a commented `face_camera_mode` typo; implemented definitions use **`facing_camera_mode`**.

## Script module

[1.26.40 update notes](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.40?view=minecraft-bedrock-stable) establish release of 2.9.0. Current Microsoft module pages expose later versions and sometimes discuss beta game builds even under a stable view. The examples depend on 2.9.0 and are type-checked with that exact npm package. Do not infer the installed client's support from a moving `latest` page.

Microsoft and [Jayly's MolangVariableMap reference](https://jaylydev.github.io/scriptapi-docs/latest/classes/_minecraft_server.MolangVariableMap.html) agree on `setFloat`, `setVector3`, `setColorRGB`, `setColorRGBA` and `setSpeedAndDirection`. A vector expands into `.x/.y/.z`; speed-and-direction expands into `.speed/.direction_x/.direction_y/.direction_z`. A script spawn creates an emitter at a world location; it does not establish a live attachment to an actor.

The conservative schema is original and deliberately stricter about unknown keys than some permissive Mojang metadata. New valid keys need a documented target-specific update; they should not be silently stripped. Full runtime compatibility remains a separate test.
