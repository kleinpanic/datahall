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
| `diagrams`       | DiagramRef[]      | 1-4 component refs to `src/components/diagrams/*.astro`                 |

## Validation

`schema.ts` rejects malformed entries with explicit, field-level error
messages. To add an exhibit:

1. Copy an existing exhibit file under `src/data/exhibits/`.
2. Update the values.
3. If you need a new diagram, add it under `src/components/diagrams/` and
   register the component name in `src/pages/databases/[slug].astro`'s
   `DIAGRAM_MAP`.
4. Run `pnpm run test:unit`. It must pass.
5. Open a PR — the CI workflow will rebuild and re-test.

## Future: TUI consumer

Because the data is plain TypeScript, a future TUI can `import { exhibits }`
without any framework, parser, or runtime dependencies.
