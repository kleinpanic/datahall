# vGPU Visual System

datahall's GPU story has two halves: a live WebGPU animation runtime
([vgpu](https://vgpu.sh)) and a set of static telemetry visuals. Both are
driven by plain data in the exhibit files — no visual requires a hand-built
asset.

## gpu-scene: WebGPU with a guaranteed static fallback

`GpuScene.astro` (`src/components/visuals/`) renders the `gpu-scene` kind:

1. **Server:** a static SVG storyboard is rendered from the same deterministic
   hash layout the WGSL shader uses (`hash(n, seed)` mirrored in TypeScript
   and WGSL), so every visitor sees the same point field before any script
   runs.
2. **Client:** the boot script looks for `[data-gpu-scene]` mounts. It only
   initializes the vgpu runtime when the browser exposes `navigator.gpu` and
   the visitor has **not** set `prefers-reduced-motion: reduce`.
3. On success the canvas fades in over the storyboard; on failure or absence
   of WebGPU the storyboard simply remains. The e2e smoke test asserts both
   paths (`canvas` attached, `svg[role="img"]` visible when the scene is off).

The shipped scene is `hnsw-layers` (Qdrant): a full-screen fragment
background shader (subtle grid + query pulse ring) plus an instanced point
field whose layer visibility cycles over a 12 s loop
(amber L2 → violet L1 → dense teal L0). Uniforms: `time`, `qx`, `qy` — the
query marker orbits on a Lissajous path computed on the CPU.

### Schema

| field        | type            | notes                                               |
| ------------ | --------------- | --------------------------------------------------- |
| `scene`      | `'hnsw-layers'` | scene selector consumed by the boot script          |
| `points`     | number (≥ 32)   | instance count for the point field                  |
| `seed`       | number          | shared by the TS storyboard and the WGSL hash       |
| `fps`        | number (≥ 8)    | frame-loop cap                                      |
| `sourceRefs` | `SourceRef[]`   | provenance; asserted present by the unit test suite |

## Telemetry kinds (server-rendered, zero client JS)

- `gpu-metrics` — VRAM (used/free/total), utilization, power draw, and
  temperature as stat cards. Temperature is severity-colored
  (accent below 65 °C, warn to 80 °C, rose above).
- `time-series` — up to 4 series over `{t, v}` points as an SVG line chart
  with a value grid, axis labels, per-series colors, and a unit badge.
- `index-stats` — per-level node counts as proportional bars (fanout shown
  when > 1) plus cardinality and selectivity stat cards.
- `query-plan` — EXPLAIN-style numbered steps with cost bars relative to the
  most expensive step and a total estimated cost footer.

The Qdrant exhibit ships `gpu-metrics` + `time-series` (index-build
telemetry); PostgreSQL ships `query-plan` + `index-stats`.

## Local development

- pnpm ≥ 10 will ask to approve dependency build scripts. The approvals are
  committed in `pnpm-workspace.yaml` (`allowBuilds: @vgpu/adapter-node,
esbuild, webgpu`), so `pnpm install` just works; CI pins pnpm 9, which
  ignores the field.
- To see the static storyboard only: enable reduced motion or use a browser
  without WebGPU. To verify the animated path, check that the `<canvas>`
  inside `[data-gpu-scene]` reaches non-zero opacity.

## Adding a new scene

1. Extend the `VisualGpuScene` schema (`src/lib/schema.ts`) `scene` literal.
2. Add the storyboard branch in `GpuScene.astro` (server SVG).
3. Add the WGSL and mount handling in the same component's `<script>` block.
4. Keep the reduced-motion / no-WebGPU fallback unconditional.
5. Add exhibit data with `sourceRefs` and extend the unit-test invariants
   (`tests/unit/visuals.test.ts`).
