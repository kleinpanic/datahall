# datahall

> An interactive web museum for database internals.

datahall teaches the storage engines, transaction models, and query evaluators
behind five production-grade databases: **SQLite**, **PostgreSQL**,
**MariaDB**, **LanceDB**, and **Qdrant**. Each exhibit is a static page with
hand-authored SVG diagrams, executable schema, and short annotated walk-throughs.

The site is statically generated and deployed to GitHub Pages.

## Tech stack

- [Astro 5](https://astro.build/) — static-site framework
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

```bash
pnpm install
pnpm run dev          # http://localhost:4321
```

> **pnpm ≥ 10 note:** local installs may prompt to approve dependency build
> scripts (`@vgpu/adapter-node`, `webgpu`, `esbuild`). The approvals are
> already recorded in `pnpm-workspace.yaml` (`allowBuilds`), so a plain
> `pnpm install` is enough. CI pins pnpm 9, which ignores that field.

## Build for deploy

```bash
pnpm run build        # outputs to dist/
pnpm run preview      # serves dist/ locally
```

## Test

```bash
pnpm run test:unit    # vitest, schema + registry validation
pnpm run test:e2e     # browser layout + smoke checks (CI runs these; needs `pnpm run preview` locally)
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
