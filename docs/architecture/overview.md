# Architecture Overview

datahall is a statically generated site. There is no server runtime — the
result is a directory of HTML, CSS, JS, and SVG files that any static host
(GitHub Pages, Netlify, Cloudflare Pages, S3 + CloudFront) can serve.

## Component model

```
src/
├── components/         # Astro presentational components (no state)
├── data/exhibits/      # Plain TS modules exporting a DatabaseEntry
├── layouts/            # HTML shell around every page
├── lib/                # Validation + loader (schema.ts, exhibits.ts)
├── pages/              # File-based router
└── styles/             # Tailwind v4 entry + design tokens
```

Astro renders any `.astro` file under `src/pages/` at build time. Pages can
import components, exhibit data, and helper utilities and produce HTML with
zero client JS by default. Islands (interactive components) are not used in
Phase 1; the SVG diagrams are static.

## Data flow

```
data/exhibits/<slug>.ts ─┐
                         ├─► lib/exhibits.ts ─► pages/databases/[slug].astro
lib/schema.ts (Zod) ─────┘
```

`lib/exhibits.ts` eagerly validates every exhibit at module load. A schema
violation throws immediately, so a broken entry fails the build rather than
silently rendering.

## Output

Astro emits a directory per route (config: `build.format: 'directory'`):

```
dist/
├── index.html                         → /
├── gallery/index.html                 → /gallery/
├── about/index.html                   → /about/
└── databases/<slug>/index.html        → /databases/<slug>/
```

Routes are prefixed with the configured `SITE_BASE` (default `/datahall/`),
which means the site works under any GitHub Pages subpath.

## Build pipeline

- `astro build` → static HTML
- `vitest run` → schema validation
- `playwright test` → 6 smoke tests against the preview server
- `astro check` → type-check
- `prettier --check .` → format
- `eslint .` → lint
