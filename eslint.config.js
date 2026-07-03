import astroPlugin from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'eslint.config.js',
    ],
  },
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Pragmatic: avoid noisy refactors in the scaffold; tighten per file as
      // we add more exhibits and TS surface area.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
