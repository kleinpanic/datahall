# vGPU Visual System

datahall's GPU story has three halves: a live WebGPU animation runtime
([vgpu](https://vgpu.sh)) for full scenes, a WebGPU flow layer that augments
otherwise-static data diagrams, and a set of static telemetry visuals. All are
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

## gpu-flow: WebGPU packet flow beneath data diagrams

`GpuFlow.astro` is a **slot wrapper**, not a visual kind: it wraps an existing
diagram component's SVG so the data diagrams themselves get vgpu-accelerated.
It currently backs `AnatomyPipeline.astro` (read/write/crash pipelines for
SQLite, PostgreSQL, MariaDB, LanceDB, Qdrant) and `WalTimeline.astro`
(durability timelines).

1. **Server:** the diagram renders exactly as before — the SVG sits on top
   (`z-10`) and is the complete, accessible content. A `<canvas>` sits beneath
   it (`z-0`, `opacity-0`, `aria-hidden`).
2. **Client:** the boot script attaches to `[data-gpu-flow]` mounts only when
   `navigator.gpu` exists and reduced motion is **not** requested. The canvas
   fades in and renders two passes:
   - a backdrop shader — panel-dark vignette + faint grid + pulsing vertical
     gate lines at each stage boundary (`stages` uniform), and
   - an instanced packet field — ~140 data packets streaming left-to-right in
     lanes, tinted per stage segment (teal / violet / amber / rose),
     brightening as they cross a gate, deterministic per diagram `seed`.
3. Without WebGPU or with reduced motion the canvas never becomes visible and
   the static diagram is the whole story — no content ever depends on the GPU.

Because stage boxes are drawn with ~13% alpha fills, the packets remain
visible _through_ the boxes: the flow reads as data moving through the engine
stages rather than past them.

### Mount contract

| attribute       | meaning                                     |
| --------------- | ------------------------------------------- |
| `data-gpu-flow` | marks the mount; boot script scans for it   |
| `data-stages`   | stage/column count → gate spacing + tinting |
| `data-seed`     | deterministic per-diagram hash seed         |
| `data-fps`      | frame-loop cap (default 30)                 |

### Wrapping another diagram

```astro
<GpuFlow stages={columns.length} seed={stableSeedFromKey}>
  <svg ...>...</svg>
</GpuFlow>
```

Keep the SVG as the root content (role="img", aria-label) and compute the seed
from a stable string (e.g. the preset key) so server and client agree across
rebuilds.

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
