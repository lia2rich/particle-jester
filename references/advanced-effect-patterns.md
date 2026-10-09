# Advanced effect patterns

Read for new source bundles, layered auras, combat cues, configurable emitters or variable-driven atlases. Use these patterns to design original effects. Static checks establish structure; previews and Minecraft tests establish visual and runtime behavior.

## Identify what was actually supplied

A ZIP can contain multiple RP/BP pairs even when its filename names one product. Inspect nested archive names, manifest UUIDs, module types, dependencies and localized pack names. A localized name can disagree with the filename or the companion pack. A matching dependency UUID/version is stronger pairing evidence than a similar title; retain the naming discrepancy.

Use `scan bundle.zip --nested --jsonc --out work/catalog.json --report work/inspection.md` when inspection requires both options. Nested expansion is opt-in, in memory, with two levels and one aggregate 50,000-file/512-MiB budget, including containers. Every container has its own path prefix. Unexpanded archives keep coverage incomplete and prevent complete reference/static verification. Protected or unreadable entries remain unavailable; do not invent an analysis of them.

JSON remains strict by default. JSONC inspection accepts comments/trailing commas only when requested, records `jsonDialect` and `JSONC_ACCEPTED`, preserves the original file/hash, and rejects partial parser recovery. It does not silently repair files or prove Bedrock accepts that dialect for every resource type. Microsoft documents the parser's requirement to check its error list in the [JSONC parser reference](https://github.com/microsoft/node-jsonc-parser).

BP and RP entity definitions commonly share an identifier: classify duplicates by resource kind. Multiple particle definitions with the same ID remain ambiguous. A bundle is an inventory, not a declared simultaneously active pack stack. Analyze each dependency-linked pair for actual integration; do not borrow a similarly named texture from an unrelated pack to suppress a missing path.

## Separate animation ownership from the visible effect

Combat examples combine timed geometry animation, named locators, client particle aliases and a particle definition. Record the keyframe and caller owner before trying to reproduce an impact. A short effect may emit several visual layers at different locators; a repeated animation can accidentally restart every layer.

Use animation/controller ownership for attached effects and bounded script orchestration for gameplay cues. Inspect wrapper functions too: `dimension.spawnParticle(id, position, map)` may be hidden behind a helper receiving those arguments. The current AST scanner marks dynamic member calls; it does not resolve arbitrary helper calls or perform interprocedural data-flow analysis. Trace helper arguments and variable maps manually. Broad empty catch blocks are source behavior to review, not an implementation pattern to adopt.

## Moving emitter, moving particles and event children

An aura can move the emission origin with emitter age while each emitted particle follows its own lifetime curve. These are different clocks. A child-age formula controls the sprite path; an emitter-age offset controls where new sprites appear. Choose intentionally so an aura does not become a synchronized rigid sheet.

Separate silhouette, glow and loose motes when they need different materials or timing. A short parent timeline can start child emitters once; repeated parent activation and looping children can accumulate. Derive emitter activity plus the longest particle tail for total disappearance time. Validate every named event and target identifier.

Some sources stage assignments in event sequences and use child pre-effect expressions. Their presence is not evidence of universal parent-variable inheritance or evaluation order. Follow the exact event contract, trace each child's inputs, provide independent defaults where appropriate, and test the actual trigger path.

## Configurable shape, atlas and color inputs

One reusable definition can receive size, lifetime, count, shape parameters, sprite selection and gradient colors from a script variable map. For each external input record its setter, map object, spawn call, default, unit and valid range. A `setFloat` or `setColorRGB` found somewhere in a script is only a potential producer until the same map reaches the relevant spawn call.

Treat count and duration as performance inputs. Bound user settings before constructing the map. Validate positive lifetimes and nonzero divisors. Parametric spirals with reciprocals require a proven denominator lower bound across the whole input/time domain; a source formula alone does not establish one.

For a regular atlas with cell size `(cw,ch)` and `columns=floor(W/cw)`, derive a cell index independently: `i=clamp(floor(selection),0,columns*rows-1)`, `u=(i % columns)*cw`, `v=floor(i/columns)*ch`. Animated sheets need an additional frame dimension: prove every selected cell and frame stays within the image. Atlas coordinate units can differ from physical PNG resolution, so retain their scale factors. Inspect source defaults and all allowed settings before declaring a dynamic UV range safe.

RGB tint multiplies painted RGB. Use independently authored white/neutral artwork for broad recoloring. Keep color channels within their intended normalized range, and treat material alpha behavior separately from RGB variation. A six-stop gradient is a design choice, not a required particle format.

## Budget short bursts correctly

A steady emitter with a very brief active time is still a burst-like source. Its maximum cap can be far larger than expected occupancy. For bounded rate `r`, activity `a` and lifetime `l`, use `min(cap, r*min(a,l))` as a rough peak envelope, with sampling/discrete-spawn qualifications. If random rates or unsupported formulas prevent a bound, leave it unknown. Include every child layer and concurrent actor when estimating cost. Small icons, soft smoke and large additive quads have different overdraw costs even at equal counts.

