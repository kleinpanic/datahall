# Roadmap

## Phase 1 — Project Initialization

- Astro 5 scaffold
- Plain-TS exhibit data + Zod schema
- 5 exhibits: SQLite, PostgreSQL, MariaDB, LanceDB, Qdrant
- Dark-mode UI with hand-drawn SVG diagrams
- Vitest schema tests + Playwright smoke tests
- GitHub Actions CI + Pages deploy

## Phase 2 — Content Expansion (current)

- Three more exhibits (the family-level gaps from `docs/database-taxonomy.md`)
- `prefers-reduced-motion` block
- ~~Search/filter on the gallery page~~ — shipped (paradigm/family chips +
  URL state)
- A consistent references block in `Section`

### Shipped ahead of plan

- **GPU visual system** — `gpu-scene` WebGPU animation via
  [vgpu](https://vgpu.sh) with a guaranteed static storyboard fallback, plus
  the `gpu-metrics`, `time-series`, `index-stats`, and `query-plan` telemetry
  kinds (see `docs/vgpu-visuals.md`). Qdrant ships the scene + build
  telemetry; PostgreSQL ships the planner/index visuals.
- Dependency automation — Dependabot alerts at zero, auto-merge for green PRs,
  daily repo hygiene gate.

## Phase 3 — TUI Consumer

- Port the exhibit data layer to a Rust or Go terminal application
- Share the Zod schema (or a translation thereof)
- `< Tab >` to flip between exhibits, `d` for the diagram, `c` for the code

## Phase 4 — Comparison View

- Side-by-side storage / concurrency / index tables
- A visual diff between two databases
- Exportable as a one-page PDF

## Phase 5 — Community

- Add a `contribute.md` walkthrough
- Integrate an editorial review checklist into the PR template
