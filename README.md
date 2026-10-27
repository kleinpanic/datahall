# datahall

> An interactive web museum for database internals.

datahall teaches the storage engines, transaction models, and query evaluators
behind 25 production databases, from **SQLite**, **PostgreSQL**, and
**MariaDB** to **RocksDB**, **ClickHouse**, **LanceDB**, and **Qdrant** (one
file per exhibit under `src/data/exhibits/`). Each exhibit is a static page with
hand-authored SVG diagrams, executable schema, and short annotated walk-throughs.

The site is statically generated and deployed to GitHub Pages.

## Tech stack

- [Astro 7](https://astro.build/) — static-site framework
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- [Zod](https://zod.dev/) — runtime schema for exhibit data
- [vgpu](https://vgpu.sh) — WebGPU runtime behind the animated GPU scenes
- [Vitest](https://vitest.dev/) — unit tests

## GPU-accelerated visuals (vgpu)

Exhibits can carry two classes of GPU visuals:

- **`gpu-scene`** — a live WebGPU animation via [vgpu](https://vgpu.sh). The
  Qdrant exhibit renders its HNSW graph as an animated layered point field: a
  static SVG storyboard is server-rendered first, then the canvas fades in
  when the browser exposes WebGPU and the visitor has not requested reduced
  motion. Without WebGPU (or with `prefers-reduced-motion`), the static
  storyboard remains — nothing breaks, nothing flickers.
- **`gpu-flow` layer** — the data diagrams themselves are vgpu-accelerated:
  pipeline and WAL-timeline diagrams mount a WebGPU packet-flow canvas
  beneath their SVG, so data packets stream through the engine stages when
  WebGPU is available. The SVG stays authoritative; without WebGPU or with
  reduced motion the static diagram is the whole story.
- **Telemetry kinds** — `gpu-metrics` (VRAM / utilization / power / temp
  snapshot), `time-series` (multi-series line chart), `index-stats`, and
  `query-plan` are server-rendered SVG/HTML with no client JavaScript.

See [docs/vgpu-visuals.md](docs/vgpu-visuals.md) for the mount contract,
shader layout, and how to add a new scene.

## Run locally

Requires Node.js ≥ 22.22 (Astro 7's minimum; `.nvmrc` pins 24) and pnpm. CI
uses pnpm 9.

```bash
pnpm install
pnpm run dev          # http://localhost:4321/datahall/
```

> **Build scripts note:** pnpm 9 and 10 only run the dependency build scripts
> listed in `package.json` → `pnpm.onlyBuiltDependencies` (`esbuild`, `sharp`)
> and print a warning that `@vgpu/adapter-node` and `webgpu` were skipped.
> That is expected: the site, unit tests, and e2e tests don't need them. Only
> `pnpm run test:gpu` (headless Dawn rendering) does — run
> `pnpm approve-builds` first if you want it. The `allowBuilds` entry in
> `pnpm-workspace.yaml` is only read by pnpm 11.

## Build for deploy

```bash
pnpm run build        # outputs to dist/
pnpm run preview      # serves dist/ at http://localhost:4321/datahall/
```

## Test

```bash
pnpm run lint
pnpm run typecheck    # astro check
pnpm run test:unit    # vitest, schema + registry validation
```

The Playwright e2e suite runs against a built site served by `preview`; it has
no `webServer` config, so start the server yourself:

```bash
pnpm exec playwright install chromium   # first time only
pnpm run build
pnpm run preview &                      # leave running
pnpm run test:e2e
```

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. Configure the
repo settings → Pages → Source: GitHub Actions.

The site base path defaults to `/datahall/`. Override at build time:

```bash
SITE_BASE=/ SITE_URL=https://yourname.github.io pnpm run build
```

## Project layout

```
src/
├── components/
│   ├── diagrams/         # legacy SVG diagram components (Astro)
│   ├── visuals/          # visual-system components, one per kind
│   │   └── VisualModuleRenderer.astro  # mounts any visual by kind
│   ├── ExhibitCard.astro
│   ├── GalleryFilter.astro
│   ├── SiteHeader.astro
│   └── SiteFooter.astro
├── data/
│   └── exhibits/         # plain-TS exhibit data (one file per database)
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── schema.ts         # Zod schema + DatabaseEntry + Visual union
│   ├── exhibits.ts       # load + iterate exhibits
│   ├── visuals.ts        # kind -> renderer registry
│   └── visuals-legacy.ts # legacy diagram component shim
├── pages/
│   ├── index.astro
│   ├── gallery.astro
│   ├── about.astro
│   └── databases/
│       └── [slug].astro
└── styles/
    └── global.css        # Tailwind v4 + design tokens
tests/
├── unit/                 # schema, filter, visual registry
└── e2e/
    └── smoke.spec.ts
```

## License

MIT.
