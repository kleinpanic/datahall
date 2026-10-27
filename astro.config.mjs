// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';

// GitHub Pages serves the site at the repo path. Override at build time with
// SITE_BASE, e.g. `SITE_BASE=/ my-org/my-site pnpm build`. Default is the
// placeholder `/datahall/` until the repo is created.
const base = process.env.SITE_BASE || '/datahall/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  base,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss(), wgslVitePlugin()],
  },
  // Redirect destinations are emitted verbatim (Astro does not prefix `base`),
  // so build the target from the base path ourselves.
  redirects: {
    '/databases': `${base.replace(/\/?$/, '/')}gallery`,
  },
});
