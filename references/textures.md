# Textures, alpha and atlas mapping

Resolve the texture from `basic_render_parameters.texture`, through the actual RP root and explicit overlays, to a PNG. Windows case-insensitive existence is insufficient; the scanner matches the archive path exactly and reports a case-only candidate without silently fixing it. An absent vanilla texture can be explained only by a verified overlay, not by assuming the engine provides everything.

The PNG inspector decodes pixels with CRC validation and records dimensions, SHA-256, alpha histogram, visible bounding box and unique visible colors. Fully transparent RGB can hide edge-color problems; test linear sampling and mip behavior in the target engine. A static PNG can contain many sprite cells: animation is determined by the definition's UV/flipbook configuration, not by detecting a long image shape.

An N-cell vertical strip with frame pixels `(fw,fh)` has PNG size `(fw,N*fh)`. When UV units match pixels, `base_UV=[0,0]`, `size_UV=[fw,fh]`, `step_UV=[0,fh]`. Follow the pinned frame-count convention described in [compatibility](official/compatibility.md). A grid requires an expression or multiple strips; a linear horizontal step does not wrap rows automatically.

For any declared dimensions D and real pixels P, multiply each coordinate by P/D. Negative steps are legal if every frame remains inside the declared UV rectangle. Add gaps/padding to avoid neighboring-frame bleed. `stretch_to_lifetime` synchronizes traversal to each particle's life; a fixed FPS controls absolute speed. Looping an atlas does not loop the emitter.

`particles_alpha` cuts transparency; blended soft sprites need `particles_blend`. Additive materials create luminous overlap and can saturate at large densities; confirm the engine material definition and active graphics mode. The inspector can warn on partial-alpha/cutout mismatch but cannot judge the intended art style. Use RGB-white textures for flexible tinting; colored flame atlases generally need white RGB tint.

Billboard half extents describe the rectangle, not its visible artwork. For a centered ring whose painted radius is a fraction s of the half-width, visible radius is `billboardHalfWidth*s`. The shockwave example compensates by dividing its half extent by 0.85. Without that step, the mathematically correct size expression still produces the wrong apparent scale.

Original textures are created by `tools/generate-examples.mjs` using direct RGBA formulas, so atlas dimensions and visible radii can be reproduced exactly. These assets are original, have transparent backgrounds and require no unknown-license source art. For hand-painted/generated art, inspect the returned dimensions, alpha and visible margins before wiring UVs.

For a texture change, compare the pixel bounds and atlas frame rectangles, then preview the effect. Never repair missing artwork by guessing the intended texture filename. `tools/repair.mjs` accepts only an explicit replacement texture path plus a decodable PNG; it writes a reviewable copy.
