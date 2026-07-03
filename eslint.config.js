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
      // We document the one escape hatch (DIAGRAM_MAP) with a named type alias,
      // but we still allow `any` for genuine boundary cases like JSON schema
      // types from third-party APIs that don't expose a runtime type.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
