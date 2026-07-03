# Playwright Review

Phase 1 ships with a Playwright smoke suite that:

- Visits every route: `/`, `/gallery/`, `/about/`, `/databases/{sqlite,postgresql,mariadb,lancedb,qdrant}/`
- Asserts each page's H1 heading is visible
- Asserts each page renders at least one `svg[role="img"]`
- Captures a full-page screenshot per page under `test-results/*.png`
- Asserts no console errors on the home page
- Asserts the GitHub source link is present in the footer
- Asserts navigation between Home and Gallery works

## Running

```bash
pnpm install
pnpm run build
pnpm run preview &           # serves dist/ on http://localhost:4321/datahall/
PLAYWRIGHT_BASE_URL=http://localhost:4321 pnpm exec playwright test
```

In CI the workflow runs the same commands sequentially.

## Captured screenshots

The 7 PNGs under `test-results/` are produced by the test run that ships in
the build. They serve as visual evidence of the rendered output:

- `home.png` — landing page
- `gallery.png` — all 5 exhibits in a grid
- `sqlite.png`, `postgresql.png`, `mariadb.png`, `lancedb.png`, `qdrant.png`
  — one full-page capture per database exhibit

The captures are full-page, dark-mode, retina-friendly.
