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
- [Vitest](https://vitest.dev/) — unit tests
- [Playwright](https://playwright.dev/) — end-to-end tests

## Run locally

```bash
pnpm install
pnpm run dev          # http://localhost:4321
```

## Build for deploy

```bash
pnpm run build        # outputs to dist/
pnpm run preview      # serves dist/ locally
```

## Test

```bash
pnpm run test:unit          # vitest, schema validation
pnpm run test:e2e           # playwright, requires `pnpm run preview` running
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
│   ├── diagrams/         # SVG diagram components (Astro)
│   ├── ExhibitCard.astro
│   ├── SiteHeader.astro
│   └── SiteFooter.astro
├── data/
│   └── exhibits/         # Plain-TS exhibit data (one file per database)
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── schema.ts         # Zod schema + DatabaseEntry type
│   └── exhibits.ts       # load + iterate exhibits
├── pages/
│   ├── index.astro
│   ├── gallery.astro
│   ├── about.astro
│   └── databases/
│       └── [slug].astro
└── styles/
    └── global.css        # Tailwind v4 + design tokens
tests/
├── unit/
│   └── schema.test.ts
└── e2e/
    └── smoke.spec.ts
```

## License

MIT.
