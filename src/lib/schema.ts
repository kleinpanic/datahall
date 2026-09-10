/**
 * Zod schema for datahall exhibit entries.
 *
 * Every file in src/data/exhibits/*.ts must export an `exhibit` value that
 * satisfies `DatabaseEntry`. Validation is enforced:
 *   - at test time by tests/unit/schema.test.ts
 *   - at render time by src/lib/exhibits.ts (which throws on import if any
 *     entry is invalid, so a broken build fails fast).
 *
 * Visuals are a typed discriminated union keyed by `kind`. Each kind maps to
 * a component registered in src/lib/visuals.ts. The legacy `kind: "diagram"`
 * variant is preserved so older exhibits and zero-prop SVG components keep
 * working -- see src/components/diagrams/*.astro.
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

/* ----------------------------------------------------------------------- */
/*  Taxonomy                                                                */
/* ----------------------------------------------------------------------- */

export const DatabaseFamily = z.enum([
  'relational',
  'key-value',
  'document',
  'wide-column',
  'graph',
  'time-series',
  'search',
  'vector',
  'olap-columnar',
  'lsm-log-structured',
]);
export type DatabaseFamily = z.infer<typeof DatabaseFamily>;

export const DeploymentModel = z.enum(['embedded', 'client-server', 'server', 'distributed']);
export type DeploymentModel = z.infer<typeof DeploymentModel>;

export const StorageEngine = z.enum([
  'single-file-btree',
  'heap-btree',
  'columnar',
  'log-structured',
  'vector-columnar',
  'lsm-tree',
  'b-plus-tree',
]);
export type StorageEngine = z.infer<typeof StorageEngine>;

export const IndexType = z.enum([
  'btree',
  'hash',
  'gin',
  'gist',
  'brin',
  'hnsw',
  'ivf-pq',
  'rtree',
  'full-text',
  'bitmap',
]);
export type IndexType = z.infer<typeof IndexType>;

export const Workload = z.enum([
  'oltp',
  'olap',
  'hybrid',
  'embedded',
  'rag',
  'semantic-search',
  'time-series',
  'analytics',
]);
export type Workload = z.infer<typeof Workload>;

/* ----------------------------------------------------------------------- */
/*  Common content shapes                                                   */
/* ----------------------------------------------------------------------- */

export const Feature = z.object({
  title: z.string().min(1).max(80),
  detail: z.string().min(1).max(400),
});

export const Highlight = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const Section = z.object({
  heading: z.string().min(1).max(120),
  paragraphs: z.array(z.string().min(1).max(1200)).min(1).max(8),
  bullets: z.array(z.string().min(1).max(200)).max(12).optional(),
  /** Optional inline code reference, e.g. "PRAGMA journal_mode = WAL". */
  code: z.string().max(2000).optional(),
  codeLanguage: z.string().max(20).optional(),
});

export const SourceRef = z.object({
  label: z.string().min(1).max(120),
  href: z.url(),
});
export type SourceRef = z.infer<typeof SourceRef>;

/* ----------------------------------------------------------------------- */
/*  Visual module registry -- discriminated union keyed by `kind`           */
/* ----------------------------------------------------------------------- */

/**
 * Each visual `kind` is rendered by a registered Astro component. The union
 * is open -- adding a new kind means adding a member here, registering the
 * component in src/lib/visuals.ts, and the test suite will catch missing
 * registrations automatically.
 */

/** Legacy: zero-prop hand-drawn SVG diagrams under src/components/diagrams/. */
const VisualDiagram = z.object({
  kind: z.literal('diagram'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  /** PascalCase component name in src/components/diagrams/. */
  component: z.string().min(1).max(80),
});

/** Reusable pipeline diagram (read/write/query/crash) with staged nodes. */
const VisualPipeline = z.object({
  kind: z.literal('pipeline'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  /** Pipeline intent. */
  mode: z.enum(['read', 'write', 'query', 'crash-recovery', 'ann-search', 'filtered-search']),
  /** Optional database flavoring for stage labels. */
  database: z
    .enum(['sqlite', 'postgresql', 'mariadb', 'lancedb', 'qdrant', 'generic'])
    .default('generic'),
  /** A short caption that explains simplifications. */
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Page/block anatomy microscope (sqlite, postgres, innodb). */
const VisualMicroscope = z.object({
  kind: z.literal('page-microscope'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  mode: z.enum(['sqlite', 'postgres', 'innodb']),
  complexity: z.enum(['basic', 'full']).default('basic'),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Generic WAL / durability timeline (sqlite-wal, postgres-wal, innodb-redo, qdrant-wal). */
const VisualWalTimeline = z.object({
  kind: z.literal('wal-timeline'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  mode: z.enum(['sqlite', 'postgres', 'innodb', 'qdrant', 'generic']),
  showCrashMoment: z.boolean().default(true),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Vector index schematic -- HNSW layered graph + payload + top-k. */
const VisualVectorIndex = z.object({
  kind: z.literal('vector-index'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  mode: z.enum(['hnsw', 'ivf-pq', 'flat']).default('hnsw'),
  showPayloadFilter: z.boolean().default(false),
  showTopK: z.boolean().default(true),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** GPU metrics snapshot (VRAM, utilization, power, temp) for exhibits that run on accelerators. */
const VisualGpuMetrics = z.object({
  kind: z.literal('gpu-metrics'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  vram: z.object({ free: z.number(), used: z.number(), total: z.number() }).optional(),
  utilization: z.number().min(0).max(100).optional(),
  powerW: z.number().min(0).optional(),
  temperatureC: z.number().min(0).optional(),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Time-series metrics (ops/s, latency, throughput over time). */
const VisualTimeSeries = z.object({
  kind: z.literal('time-series'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  series: z
    .array(
      z.object({
        name: z.string(),
        points: z.array(z.object({ t: z.number(), v: z.number() })),
      }),
    )
    .min(1)
    .max(4),
  unit: z.string().default('ops/s'),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Index statistics (levels, fanout, cardinality, selectivity). */
const VisualIndexStats = z.object({
  kind: z.literal('index-stats'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  levels: z
    .array(z.object({ level: z.number(), nodes: z.number(), fanout: z.number() }))
    .optional(),
  cardinality: z.number().optional(),
  selectivity: z.number().min(0).max(1).optional(),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Query plan / execution breakdown. */
const VisualQueryPlan = z.object({
  kind: z.literal('query-plan'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  steps: z
    .array(
      z.object({
        step: z.string(),
        cost: z.number().optional(),
        rows: z.number().optional(),
      }),
    )
    .min(1),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

/** Museum-lobby database family map. Used on the homepage and as a wide visual on each exhibit. */
const VisualFamilyMap = z.object({
  kind: z.literal('family-map'),
  title: z.string().min(1).max(120).default('Database family map'),
  description: z
    .string()
    .min(1)
    .max(300)
    .default('A taxonomy of database families. Click an exhibit card to drill in.'),
  /** Restrict the highlighted families. Defaults to all on the lobby. */
  families: z.array(DatabaseFamily).optional(),
  caption: z.string().max(280).optional(),
});

/** Legend panel explaining the color/layer taxonomy. */
const VisualLegend = z.object({
  kind: z.literal('legend'),
  title: z.string().min(1).max(120).default('Visual legend'),
  description: z
    .string()
    .min(1)
    .max(300)
    .default('Colors and patterns used throughout datahall exhibits.'),
  categories: z
    .array(
      z.object({
        key: z.enum([
          'storage',
          'execution',
          'index',
          'memory',
          'durability',
          'concurrency',
          'network',
        ]),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        label: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(7)
    .default([
      { key: 'storage', color: '#00ffe1', label: 'storage' },
      { key: 'execution', color: '#7c5cff', label: 'execution' },
      { key: 'index', color: '#5cffb1', label: 'index' },
      { key: 'memory', color: '#ffb347', label: 'memory / cache' },
      { key: 'durability', color: '#f5a623', label: 'durability / recovery' },
      { key: 'concurrency', color: '#ff5d8f', label: 'concurrency' },
      { key: 'network', color: '#7c5cff', label: 'network / distribution' },
    ]),
});

/** GPU-accelerated animated scene (WebGPU via the `vgpu` library) with a static SVG fallback. */
const VisualGpuScene = z.object({
  kind: z.literal('gpu-scene'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  /** Which animated scene to play. `hnsw-layers` is the only one today. */
  scene: z.literal('hnsw-layers').default('hnsw-layers'),
  /** Point count for the instanced field. */
  points: z.number().int().min(32).max(4096).default(320),
  /** Deterministic layout seed shared by the WGSL scene and the SVG storyboard. */
  seed: z.number().int().min(0).max(65535).default(7),
  /** Frame cap. Reduced-motion visitors always get the static storyboard. */
  fps: z.number().int().min(8).max(60).default(30),
  caption: z.string().max(280).optional(),
  concepts: z.array(z.string().min(1).max(80)).max(12).optional(),
  sourceRefs: z.array(SourceRef).max(6).optional(),
});

export const Visual = z.discriminatedUnion('kind', [
  VisualDiagram,
  VisualPipeline,
  VisualMicroscope,
  VisualWalTimeline,
  VisualVectorIndex,
  VisualFamilyMap,
  VisualLegend,
  VisualGpuScene,
  VisualGpuMetrics,
  VisualTimeSeries,
  VisualIndexStats,
  VisualQueryPlan,
]);
export type Visual = z.infer<typeof Visual>;
export type VisualKind = Visual['kind'];

export type VisualDiagram = z.infer<typeof VisualDiagram>;
export type VisualPipeline = z.infer<typeof VisualPipeline>;
export type VisualMicroscope = z.infer<typeof VisualMicroscope>;
export type VisualWalTimeline = z.infer<typeof VisualWalTimeline>;
export type VisualVectorIndex = z.infer<typeof VisualVectorIndex>;
export type VisualFamilyMap = z.infer<typeof VisualFamilyMap>;
export type VisualLegend = z.infer<typeof VisualLegend>;
export type VisualGpuScene = z.infer<typeof VisualGpuScene>;
export type VisualGpuMetrics = z.infer<typeof VisualGpuMetrics>;
export type VisualTimeSeries = z.infer<typeof VisualTimeSeries>;
export type VisualIndexStats = z.infer<typeof VisualIndexStats>;
export type VisualQueryPlan = z.infer<typeof VisualQueryPlan>;

/* ----------------------------------------------------------------------- */
/*  Database entry                                                          */
/* ----------------------------------------------------------------------- */

/**
 * Normalize a raw input entry: `diagrams` is treated as an alias for
 * `visuals` so legacy content keeps validating without renaming fields.
 */
function normalizeEntry(input: unknown): unknown {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.diagrams) && !obj.visuals) {
      return { ...obj, visuals: obj.diagrams };
    }
  }
  return input;
}

export const DatabaseEntry = z.preprocess(
  normalizeEntry,
  z.object({
    slug: z
      .string()
      .min(1)
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
    name: z.string().min(1).max(60),
    tagline: z.string().min(1).max(140),
    summary: z.string().min(40).max(600),
    /* Legacy enums preserved for back-compat. */
    paradigm: Paradigm,
    concurrency: ConcurrencyModel,
    storage: StorageModel,
    /* New taxonomy. All optional with safe defaults. */
    families: z.array(DatabaseFamily).min(1).max(6).optional(),
    deploymentModel: DeploymentModel.optional(),
    storageEngines: z.array(StorageEngine).min(1).max(6).optional(),
    indexTypes: z.array(IndexType).min(1).max(8).optional(),
    workloads: z.array(Workload).min(1).max(6).optional(),
    /* Content. */
    language: z.string().min(1).max(40),
    initialRelease: z.number().int().min(1950).max(2100),
    license: z.string().min(1).max(60),
    highlights: z.array(Highlight).min(2).max(8),
    features: z.array(Feature).min(2).max(8),
    sections: z.array(Section).min(2).max(6),
    /* Visuals -- typed discriminated union. */
    visuals: z.array(Visual).min(1).max(8),
    /* Optional accent color (CSS) used in the card and header. */
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'accent must be a hex color like #00ffe1')
      .default('#00ffe1'),
    sourceRefs: z.array(SourceRef).max(8).optional(),
  }),
);

export type DatabaseEntry = z.infer<typeof DatabaseEntry>;
export type Section = z.infer<typeof Section>;
