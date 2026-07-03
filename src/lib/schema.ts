/**
 * Zod schema for datahall exhibit entries.
 *
 * Every file in `src/data/exhibits/*.ts` must export an `exhibit` value that
 * satisfies `DatabaseEntry`. Validation is enforced:
 *   - at test time by `tests/unit/schema.test.ts`
 *   - at render time by `src/lib/exhibits.ts` (which throws on import if any
 *     entry is invalid, so a broken build fails fast).
 */

import { z } from 'zod';

export const Paradigm = z.enum([
  'embedded-sql',
  'client-server',
  'server',
  'embedded-vector',
  'server-vector',
]);
export type Paradigm = z.infer<typeof Paradigm>;

export const ConcurrencyModel = z.enum([
  'single-writer-mvcc',
  'multi-process-mvcc',
  'mvcc',
  'snapshot-isolation',
  'lock-free',
]);
export type ConcurrencyModel = z.infer<typeof ConcurrencyModel>;

export const StorageModel = z.enum([
  'single-file-btree',
  'heap-btree',
  'columnar',
  'log-structured',
  'vector-columnar',
]);
export type StorageModel = z.infer<typeof StorageModel>;

export const Feature = z.object({
  title: z.string().min(1).max(80),
  detail: z.string().min(1).max(400),
});

export const Highlight = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const DiagramRef = z.object({
  /** Component name in src/components/diagrams/. PascalCase. */
  component: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
});

export const Section = z.object({
  heading: z.string().min(1).max(120),
  paragraphs: z.array(z.string().min(1).max(1200)).min(1).max(8),
  bullets: z.array(z.string().min(1).max(200)).max(12).optional(),
  /** Optional inline code reference, e.g. "PRAGMA journal_mode = WAL". */
  code: z.string().max(2000).optional(),
  codeLanguage: z.string().max(20).optional(),
});

export const DatabaseEntry = z.object({
  slug: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1).max(60),
  tagline: z.string().min(1).max(140),
  summary: z.string().min(40).max(600),
  paradigm: Paradigm,
  concurrency: ConcurrencyModel,
  storage: StorageModel,
  language: z.string().min(1).max(40),
  initialRelease: z.number().int().min(1950).max(2100),
  license: z.string().min(1).max(60),
  highlights: z.array(Highlight).min(2).max(8),
  features: z.array(Feature).min(2).max(8),
  sections: z.array(Section).min(2).max(6),
  diagrams: z.array(DiagramRef).min(1).max(4),
  /** Optional accent color (CSS) used in the card and header. */
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'accent must be a hex color like #00ffe1')
    .default('#00ffe1'),
});

export type DatabaseEntry = z.infer<typeof DatabaseEntry>;
export type Section = z.infer<typeof Section>;
export type DiagramRef = z.infer<typeof DiagramRef>;
