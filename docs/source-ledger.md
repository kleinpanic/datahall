# Source & Correction Ledger

Consequential corrections and provenance decisions for datahall content.
Format: date · exhibit/visual · what changed · why. Newest first.

## 2026-10-13

- **qdrant / gpu-metrics** — Removed the claim “Measured on RTX 4090, 1 M 768-d
  vectors. vgpu.sh telemetry.” and the “Peak VRAM… while building the HNSW graph”
  description; values are now labeled **illustrative** in the title, description,
  and caption. Removed the `vgpu.sh` sourceRef as provenance. **Why:** no
  measurement provenance existed for these numbers, and a rendering-library
  citation is not evidence for database performance. vgpu.sh renders this page's
  animations; it is not the source of database telemetry.

- **qdrant / time-series** — Retitled “Index build throughput over time” →
  “…, illustrative shape”; removed the caption asserting measured causality
  (“Dips correspond to layer promotions in the HNSW graph”). **Why:** the series
  is synthetic; asserting a causal mechanism for invented dips amplifies an
  inaccuracy with a more convincing chart.

- **qdrant+lancedb / vector-index (VectorIndexPlayground)** — Replaced preset
  `highlight` “top-k” flags, the arbitrary orbiting query marker, and the
  hardcoded traversal path with state derived from an actual deterministic toy
  search (`src/lib/vector-search.ts`): real HNSW layer assignment (geometric,
  seeded), SEARCH-layered greedy descent + ef-beam base search, brute-force
  exact baseline with recall, and node identity preserved across layers.
  Filtered search now models Qdrant’s documented behavior — the walk traverses
  non-matching nodes while only matching nodes enter the result beam.
  **Why:** the previous highlights predetermined the result independent of the
  drawn path; approximate results were shown without an exact baseline; 2-D
  toy-model simplifications were not disclosed.

- **postgresql / mvcc** — The static `MvccTimeline` legacy diagram was replaced
  by an interactive `walkthrough (mvcc-commit)` trace with an explicit model
  statement (xmin-only simplification; the commit-waits-for-WAL-flush rule is
  the part shown exactly). **Why:** an upgrade in fidelity with the
  simplification disclosed, per the source policy.

- **New exhibits (rocksdb, mongodb, neo4j, clickhouse)** — All numeric shapes
  (level counts, index trees, granule layouts) are labeled **illustrative**;
  every engine-behavior claim carries a vendor-docs or paper sourceRef.
  ClickHouse’s query-plan visual states its units are illustrative relative
  weights, not measured latency, and directs readers to EXPLAIN PIPELINE.
  **Why:** planner cost must not read as elapsed time; unmeasured shapes must
  not read as benchmarks.

## Standing policy references

- `docs/source-policy.md` — what counts as an acceptable source.
- The GPU components render **ambience only**; no GPU visual claims database
  performance. vgpu.sh (https://vgpu.sh) is the WebGPU runtime library used for
  animation; it is cited as such, never as a data source.
