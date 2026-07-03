import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'sqlite',
  name: 'SQLite',
  tagline:
    'The most-deployed database in the world: a single-file SQL engine with WAL, MVCC, and zero ops.',
  summary:
    'SQLite is a serverless, transactional, self-contained SQL engine that runs in-process and stores the entire database in a single cross-platform file. It implements most of SQL-92, supports B-tree and r-tree indexes, materialized views, JSON, full-text search, and ACID transactions across both rollback-journal and write-ahead-log journal modes.',
  paradigm: 'embedded-sql',
  concurrency: 'multi-process-mvcc',
  storage: 'single-file-btree',
  language: 'C',
  initialRelease: 2000,
  license: 'Public Domain',
  accent: '#00ffe1',
  highlights: [
    { label: 'Footprint', value: '< 750 KiB' },
    { label: 'Journal', value: 'WAL or rollback' },
    { label: 'Indexes', value: 'B-tree + r-tree + FTS5' },
    { label: 'Concurrency', value: 'many readers / 1 writer' },
  ],
  features: [
    {
      title: 'Single-file storage',
      detail:
        'One .sqlite file holds the schema, tables, indexes, and free pages. The file is portable across architectures and works read-only when needed.',
    },
    {
      title: 'Write-Ahead Log (WAL)',
      detail:
        'WAL appends uncommitted changes to a sidecar file so readers and writers never block each other. The WAL is checkpointed back into the main file periodically.',
    },
    {
      title: 'B-tree pages',
      detail:
        'Tables and indexes are stored as B-trees of fixed-size pages (default 4 KiB, configurable up to 64 KiB). Each page has a small header followed by cells.',
    },
    {
      title: 'In-process SQL compiler',
      detail:
        'A full SQL parser, planner, and bytecode VM lives in your process. There is no daemon, no socket, no authentication layer — that is also why it is fast.',
    },
  ],
  sections: [
    {
      heading: 'On-disk layout',
      paragraphs: [
        'A SQLite file begins with a 100-byte header that contains the magic string "SQLite format 3\\0", the page size, the schema cookie, and pointers to the freelist and the most recently committed transaction. The rest of the file is a sequence of equally-sized pages.',
        'Pages are typed: lock-byte, freelist, B-tree interior, B-tree leaf, payload overflow, and pointer-map. The B-tree interior pages form a navigational index; B-tree leaf pages hold actual row data. Pages that are too small to fit a row spill into a chain of overflow pages linked by 4-byte next-page pointers.',
      ],
      bullets: [
        'A 4 KiB page can hold 2–3 typical rows, or 40+ small rows.',
        'Schema changes bump the schema cookie so prepared statements from older schemas are re-prepared automatically.',
        'PRAGMA integrity_check walks every page to detect corruption.',
      ],
    },
    {
      heading: 'Concurrency model',
      paragraphs: [
        'SQLite serializes writers and parallelizes readers. In rollback-journal mode, a writer takes an EXCLUSIVE lock, while readers use SHARED locks. In WAL mode, writers append to the WAL file and readers see the most recently committed snapshot plus the WAL tail, which lets readers and one writer run simultaneously without blocking.',
        'WAL mode is the default for new databases that opt in via PRAGMA journal_mode = WAL. It is faster under mixed workloads and survives crashes because the WAL is replayed or rolled back at next open.',
      ],
      code: 'PRAGMA journal_mode = WAL;\nPRAGMA synchronous = NORMAL;\nPRAGMA busy_timeout = 5000;',
      codeLanguage: 'sql',
    },
    {
      heading: 'Query evaluation',
      paragraphs: [
        'SQLite uses a flat-bytecode VM. The query planner builds a tree of operations — open-read, open-write, sort, filter, aggregate, join — and the executor dispatches each op in turn. There is no JIT, no vectorized engine, no parallelism. For the workloads SQLite targets (embedded, low-concurrency, single-user) this trade-off wins: a 600 KB library that boots in microseconds and never pages out.',
      ],
    },
  ],
  diagrams: [
    {
      component: 'SqliteFileFormat',
      title: 'On-disk file layout',
      description: '100-byte header, then a chain of B-tree pages, with the WAL as a sidecar file.',
    },
  ],
};
