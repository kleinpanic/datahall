# Roadmap

## Phase 1 — Project Initialization (current)

- Astro 5 scaffold
- Plain-TS exhibit data + Zod schema
- 5 exhibits: SQLite, PostgreSQL, MariaDB, LanceDB, Qdrant
- Dark-mode UI with hand-drawn SVG diagrams
- Vitest schema tests + Playwright smoke tests
- GitHub Actions CI + Pages deploy

## Phase 2 — Content Expansion

- Three more exhibits (the family-level gaps from `docs/database-taxonomy.md`)
- `prefers-reduced-motion` block
- Search/filter on the gallery page
- A consistent references block in `Section`

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
