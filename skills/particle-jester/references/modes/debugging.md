# Particle Jester: debugging

Use when an effect is missing, broken, stuck, wrongly shaped or produces Content Log errors. Inspect the actual file/identifier and classify the failure before rewriting it. Scan the entire responsible resource slice, including texture pixels, callers and overlays.

Use field-level validation, UV enumeration, variable-producer evidence and reverse traces. Inspect source/version disagreements instead of deleting unfamiliar components. The repair tool corrects only explicit texture substitutions and finite linear UV capacity; malformed math needs design intent, not an invented replacement.

Write a reviewable change/diff, validate again and preview the corrected output. Preserve before/after captures where the symptom is visual. Do not suppress errors or promote unperformed preview/runtime steps to success.

Read [detailed engineering guidance](../../../../references/debugging.md) for the relevant contracts and examples. Common compatibility, tool and verification rules are in [Particle Jester](../../SKILL.md).
