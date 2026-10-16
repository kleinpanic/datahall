import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'duckdb',
  name: 'DuckDB',
  tagline: 'An in-process analytical SQL database: columnar, vectorized, one file, zero servers.',
  summary:
    'DuckDB is an embedded OLAP database — what SQLite is to OLTP. It runs in-process, stores everything in a single columnar file, executes queries over fixed-size vector batches, and speaks plain SQL with Postgres-style semantics. No server, no daemon, no setup: the library IS the database.',
  paradigm: 'embedded-sql',
  concurrency: 'mvcc',
  storage: 'columnar',
  families: ['olap-columnar', 'relational'],
  deploymentModel: 'embedded',
  storageEngines: ['columnar'],
  indexTypes: ['btree', 'hash'],
  workloads: ['olap', 'analytics'],
  language: 'C++',
  initialRelease: 2018,
  license: 'MIT',
  accent: '#fff100',
  highlights: [
    { label: 'Model', value: 'full SQL over columnar storage' },
    { label: 'Execution', value: 'vectorized (2048-value batches)' },
    { label: 'Embedded', value: 'in-process, single file' },
    { label: 'Interop', value: 'zero-copy pandas/Arrow/DataFrame' },
  ],
  features: [
    {
      title: 'SQLite ergonomics, OLAP engine',
      detail:
        'No server, no config: import the library, open a file, run analytical SQL. ACID transactions with MVCC snapshot isolation.',
    },
    {
      title: 'Vectorized execution',
      detail:
        'Operators process fixed 2048-value vectors, keeping data in CPU caches and letting the compiler vectorize inner loops — the engine-level reason for its throughput.',
    },
    {
      title: 'Direct file queries',
      detail:
        'Reads CSV, Parquet, and JSON files directly as tables — SELECT * FROM "data.parquet" — and exchanges data zero-copy with pandas, Arrow, and R data frames.',
    },
    {
      title: 'Single-file storage',
      detail:
        'One .duckdb file holds the whole database with ACID semantics. Checkpointing folds the write-ahead log into the file.',
    },
  ],
  sections: [
    {
      heading: 'Embedded analytics: the SQLite lesson, applied to OLAP',
      paragraphs: [
        'DuckDB proves a server is not required for analytical SQL. Running in-process removes the network hop, serialization layer, and daemon management — queries read the file at memory speed with no round trips.',
        'The engine is columnar and vectorized: columns compress and scan sequentially, and operators consume 2048-value batches. That combination is why aggregates over millions of rows run in milliseconds on a laptop.',
      ],
      code: "SELECT region, sum(bytes) AS total\nFROM read_parquet('events/*.parquet')\nWHERE day >= DATE '2026-10-01'\nGROUP BY region\nORDER BY total DESC;",
      codeLanguage: 'sql',
    },
    {
      heading: 'The execution model is the product',
      paragraphs: [
        'Unlike ClickHouse, there is no cluster story — DuckDB is deliberately single-node, competing on developer experience rather than scale-out. Data skipping comes from zone maps (min/max per block) much like granule pruning in bigger columnar engines.',
        'The walkthrough below runs the columnar execution loop — column pruning, block skipping, batch predicates, mergeable aggregation — the exact mechanics DuckDB implements with its own vectorized operator set.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'gpu-scene',
      title: 'DuckDB — vector batch field (live GPU scene)',
      description:
        'A live WebGPU particle field tinted to this exhibit. Plays only with WebGPU and no reduced-motion preference; a static storyboard renders for everyone else.',
      scene: 'hnsw-layers',
      points: 420,
      seed: 4286,
      fps: 30,
      hue: 80,
    },
    {
      kind: 'wal-timeline',
      mode: 'generic',
      showCrashMoment: true,
      title: 'WAL + checkpoint: the single-file durability story',
      description:
        'Writes append to the WAL; checkpointing folds committed transactions into the .duckdb file. Crash recovery replays the log into the last checkpoint.',
      caption:
        'Generic WAL/checkpoint timeline — DuckDB applies it to the single-file database image.',
      concepts: ['WAL', 'checkpoint', 'recovery'],
      sourceRefs: [
        { label: 'DuckDB docs: Storage', href: 'https://duckdb.org/docs/stable/internals/storage' },
      ],
    },
    {
      kind: 'pipeline',
      mode: 'read',
      database: 'generic',
      title: 'Query path: parse → bind → vectorized pipeline over columnar file',
      description:
        'SQL binds against the catalog, the optimizer builds a pipeline of vectorized operators, and blocks stream from the single-file columnar storage.',
      caption: 'In-process: no wire protocol, no daemon — the library is the server.',
      concepts: ['vectorized operators', 'zone maps', 'in-process'],
      sourceRefs: [{ label: 'DuckDB: Why DuckDB', href: 'https://duckdb.org/why_duckdb' }],
    },
    {
      kind: 'walkthrough',
      mode: 'columnar-scan',
      variant: 'default',
      title: 'Columnar scan: pruning, skipping, batch predicates',
      description:
        'One analytical query traced step by step: column pruning, key-range block skipping, vectorized predicate evaluation, and mergeable aggregation with honest row counters.',
      caption:
        'Generic columnar mechanics on a toy granule layout; DuckDB specifics (2048-vectors, ART indexes, zone maps) live in its docs.',
      concepts: ['column pruning', 'data skipping', 'vectorization', 'aggregation'],
      sourceRefs: [{ label: 'DuckDB: Execution model', href: 'https://duckdb.org/why_duckdb' }],
    },
  ],
  sourceRefs: [
    { label: 'duckdb.org — Why DuckDB', href: 'https://duckdb.org/why_duckdb' },
    { label: 'DuckDB docs: Storage', href: 'https://duckdb.org/docs/stable/internals/storage' },
    {
      label: 'Raasveldt & Mühleisen (2019), DuckDB — an Embeddable Analytical Database',
      href: 'https://duckdb.org/pdf/CIDR2020-raasveldt-muehleisen-duckdb.pdf',
    },
  ],
};
