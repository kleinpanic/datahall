# Contributing

datahall accepts exhibits for any database family not yet covered, plus
improvements to existing exhibits (corrections, deeper walks, additional
diagrams).

## Workflow

1. Open an issue describing the exhibit you want to add or the correction.
2. Fork the repo and branch off `main`.
3. Add or modify one file under `src/data/exhibits/<slug>.ts`. Do not edit
   templates, layouts, or styles unless your exhibit genuinely requires it.
4. If you need a new diagram, add one `.astro` file under
   `src/components/diagrams/` and register it in the `DIAGRAM_MAP` inside
   `src/pages/databases/[slug].astro`.
5. Run `pnpm run format:check && pnpm run lint && pnpm run typecheck &&
pnpm run test:unit && pnpm run test:e2e`. All must pass.
6. Open a PR. Reference the issue.

## Content bar

A new exhibit must:

- Have a primary-source citation for every non-trivial claim.
- Cover at least: storage engine, concurrency model, query evaluator.
- Include at least one SVG diagram.
- Pass `DatabaseEntry.safeParse()` (run by `pnpm run test:unit`).

## Diagram bar

A new diagram must:

- Be hand-authored SVG (no Mermaid, no screenshot-from-tool).
- Use `role="img"` and a meaningful `aria-label` describing the visual.
- Animate only via CSS keyframes (no JS islands in Phase 1).
- Have a one-sentence caption at the top of the figure.

## Code excerpts

If you include a code excerpt, it should be:

- Less than 20 lines.
- Runnable against a real install (no `...` placeholders).
- Independently verified against the current docs.

## Out of scope

TUI-only entry points, benchmarks, integration code, and any feature that
would require a server runtime.
