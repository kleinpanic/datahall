# Content Model

Every exhibit is a TypeScript file under `src/data/exhibits/` exporting an
`exhibit` value of type `DatabaseEntry` (see `src/lib/schema.ts`).

## DatabaseEntry

| Field            | Type              | Purpose                                                                 |
| ---------------- | ----------------- | ----------------------------------------------------------------------- |
| `slug`           | kebab-case string | URL segment: `/databases/<slug>/`                                       |
| `name`           | string            | Display title                                                           |
| `tagline`        | string ≤140 chars | One-line elevator pitch (appears on cards and detail header)            |
| `summary`        | string ≥40 chars  | One-paragraph plain-language summary                                    |
| `paradigm`       | enum              | embedded-sql / client-server / server / embedded-vector / server-vector |
| `concurrency`    | enum              | MVCC variant used by the engine                                         |
| `storage`        | enum              | primary storage layout                                                  |
| `language`       | string            | implementation language                                                 |
| `initialRelease` | year              | sort key                                                                |
| `license`        | string            | license name (freeform)                                                 |
| `accent`         | hex color         | used as the card / detail-page accent                                   |
| `highlights`     | Highlight[]       | 2-8 label-value stat cards                                              |
| `features`       | Feature[]         | 2-8 short feature blurbs                                                |
| `sections`       | Section[]         | 2-6 narrative sections, each with paragraphs / bullets / code           |
| `visuals`        | Visual[]          | 2-8 data-driven visuals (see below)                                     |

## Visual kinds

`visuals` is a discriminated union on `kind` (Zod-validated in `schema.ts`).
Every kind has a renderer registered in `src/lib/visuals.ts` and is mounted by
`src/components/visuals/VisualModuleRenderer.astro`, which supplies the panel
frame, kind badge, title, and caption — components render only the body.

| kind              | data                                            | renderer                                            |
| ----------------- | ----------------------------------------------- | --------------------------------------------------- |
| `diagram`         | legacy `component` name                         | shim into `src/components/diagrams/` (frozen set)   |
| `pipeline`        | read/write mode + database                      | `AnatomyPipeline.astro`                             |
| `page-microscope` | storage mode + complexity                       | `PageMicroscope.astro`                              |
| `wal-timeline`    | storage mode + crash moment                     | `WalTimeline.astro`                                 |
| `vector-index`    | index mode (hnsw / ivf-pq)                      | `VectorIndexPlayground.astro`                       |
| `family-map`      | —                                               | `DatabaseFamilyMap.astro`                           |
| `legend`          | —                                               | `LegendPanel.astro`                                 |
| `gpu-scene`       | scene, points, seed, fps                        | `GpuScene.astro` (vgpu WebGPU + static fallback)    |
| `gpu-metrics`     | vram / utilization / powerW / temperatureC      | `GpuMetrics.astro` (server-rendered cards)          |
| `time-series`     | up to 4 named series of `{t, v}` points + unit  | `TimeSeries.astro` (server-rendered SVG line chart) |
| `index-stats`     | levels (nodes/fanout), cardinality, selectivity | `IndexStats.astro` (proportional bars + stat cards) |
| `query-plan`      | ordered steps with optional cost / rows         | `QueryPlan.astro` (EXPLAIN-style waterfall)         |

The GPU-side kinds (`gpu-scene` plus the telemetry kinds) are documented in
[`vgpu-visuals.md`](vgpu-visuals.md).

## Validation

`schema.ts` rejects malformed entries with explicit, field-level error
messages. To add an exhibit:

1. Copy an existing exhibit file under `src/data/exhibits/`.
2. Update the values.
3. If you need a new visual kind, add the component under
   `src/components/visuals/`, register it in `src/lib/visuals.ts` and
   `src/lib/visuals-registry.ts`, and extend the Zod union in `schema.ts`.
4. Run `pnpm run test:unit`. It must pass (the registry test asserts every
   declared kind parses and has a renderer).
5. Open a PR — the CI workflow will rebuild and re-test.

## Future: TUI consumer

Because the data is plain TypeScript, a future TUI can `import { exhibits }`
without any framework, parser, or runtime dependencies.
