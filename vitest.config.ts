import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Generate a stub .astro file that vitest can import without running the
// real Astro compiler (which expects the `astro` package and produces JSX
// that node can't parse raw). The stub is a plain default-export factory.
function ensureAstroStub(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const stubDir = join(here, '.vitest-stubs');
  const stubFile = join(stubDir, 'astro-component.mjs');
  if (!existsSync(stubDir)) mkdirSync(stubDir, { recursive: true });
  // We make a tiny `.mjs` file. Vitest's resolve.alias will redirect any
  // `*.astro` import to it.
  writeFileSync(
    stubFile,
    `// vitest stub for Astro components
export default function AstroComponentStub() { return null; }
`,
  );
  return stubFile;
}

const astroStub = ensureAstroStub();

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: [
      { find: /^.*\.astro$/, replacement: astroStub },
      { find: '~', replacement: new URL('./src', import.meta.url).pathname },
    ],
  },
});
