# Preserve the effect while controlling cost

For a constant steady emitter, expected live children are approximately `rate * min(particleLifetime, emissionElapsed)`, capped by `max_particles`. Total emission for a finite effect is approximately `rate * activeTime`. Instant bursts use their count. Sum overlapping layer timelines and simultaneous actors; a per-emitter cap does not cap the world. Long tails can overlap the next attack.

The estimator understands numeric values and the original `rate * (variable ?? default)` pattern when parameter bounds are explicit. Other expressions produce unknown estimates; it does not sample one random value and pretend that value is a maximum. `config/parameters.json` declares the demo quality bound. Mobile recommendations need device profiling; there is no universal safe count.

Rendering cost also depends on billboard screen area, overlap, alpha blending, texture fetches, collision checks and shader/graphics mode. One large translucent smoke quad can cover more pixels than many small sparks. A 17-definition pack can still be expensive if spawned repeatedly. Visible silhouette layers should survive quality reductions; decorative motes are often more scalable.

Use `tools/optimize.mjs input.json output.json 0.5` to scale rates, caps and instant counts in a reviewable copy. It preserves lifetime, shapes, velocity, timing, color and UV. This is a candidate optimization, not a claim of visual equivalence. Keep the shockwave's one-ring silhouette and portal's main ring/core; scale snow and accents. Preview both at identical cameras/times and test the lowest quality for readability.

The blizzard intentionally uses two depth scales: numerous drifting flakes plus sparse longer gust streaks. Lower density should preserve both distributions rather than deleting wind entirely. The boss sequence should retain warning, impact and aftermath timing at every tier. Never reduce fidelity by silently substituting a tiny puff for the requested large ability.

For runtime profiling, record device, render distance, graphics mode, simultaneous actors, worst-case repetitions, frame-time behavior, server tick impact and cleanup after the tail. Avoid broad per-tick script scans; cached entity references require validity checks and lifecycle removal. Prefer one event dispatcher and finite timeout lists to many unbounded intervals.
