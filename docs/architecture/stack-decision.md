# Stack Decision

## Why Astro 5

- Static-first: the output is just files, perfect for GitHub Pages.
- Content-aware: built-in content collections and routing.
- Type-safe: TypeScript is the default; types flow from import to render.
- Future-proof: the same framework can grow into islands if a diagram needs
  real interactivity later.

## Why plain-TS data (not Markdown/MDX)

The exhibit content is intended to be consumed by a future terminal UI that
imports the same modules. Markdown would force that consumer to ship a parser
or duplicate the data. Plain TS objects are versioned, type-checked, and
portable.

## Why Zod

Provides runtime validation in addition to the TypeScript types. Allows the
same schema to be enforced by:

- the loader (`src/lib/exhibits.ts`, fail-fast on build),
- unit tests (`tests/unit/schema.test.ts`),
- the dev server (e.g. a future /admin route to author new entries).

## Why Tailwind v4 + @tailwindcss/vite

Tailwind v4 is the current major and the `@tailwindcss/vite` plugin is the
officially supported Astro integration path. v4's CSS-first config (`@theme`)
keeps design tokens in CSS, not in a JS config file, which fits the dark-mode
single-theme Phase 1 plan.

## Why SVG-first diagrams

- Inline SVG: zero network requests, accessible, copy-pasteable.
- Hand-authored: full control over colors, labels, animation.
- Animations: CSS keyframes only. D3 reserved for diagrams that need runtime
  geometry (none in Phase 1).

## Why vitest + Playwright

- Vitest: fast, ESM-native, no TS transpile step needed.
- Playwright: the actual deployed site is what we want to test, not a mock;
  full-page screenshots serve as visual evidence per build.
