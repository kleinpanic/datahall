import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'postgresql',
  name: 'PostgreSQL',
  tagline:
    'The most-extensible open-source RDBMS: MVCC, a cost-based planner, and 30+ years of catalog evolution.',
  summary:
    'PostgreSQL is a client-server object-relational database with a process-based architecture, multi-version concurrency control, a cost-based query optimizer, and a deeply extensible type system. It supports user-defined types, operators, index methods, procedural languages, and foreign data wrappers, all cataloged in system tables.',
  paradigm: 'client-server',
  concurrency: 'mvcc',
  storage: 'heap-btree',
  language: 'C',
  initialRelease: 1996,
  license: 'PostgreSQL License',
  accent: '#7c5cff',
  highlights: [
    { label: 'Architecture', value: 'process per connection' },
    { label: 'Isolation', value: 'MVCC + SSI' },
    { label: 'Indexes', value: 'B-tree, hash, GIN, BRIN, GiST' },
    { label: 'Replication', value: 'streaming + logical' },
  ],
  features: [
    {
      title: 'MVCC without undo logs',
      detail:
        'Every row version is written in-place with xmin/xmax system columns. Old versions become dead tuples and are reclaimed by VACUUM.',
    },
    {
      title: 'Cost-based planner',
      detail:
        'The planner enumerates access paths, joins, and aggregations, scores each by an estimated cost, and picks the lowest. Statistics from ANALYZE feed the estimator.',
    },
    {
      title: 'Extensible catalogs',
      detail:
        'Tables, types, functions, and operators are first-class rows in pg_catalog. Extensions install new rows at runtime, not via recompilation.',
    },
    {
      title: 'Logical and physical replication',
      detail:
        'Streaming replication ships WAL to replicas; logical replication decodes WAL into row-level change streams. Both can run in parallel.',
    },
  ],
  sections: [
    {
      heading: 'MVCC and tuple visibility',
      paragraphs: [
        'PostgreSQL never overwrites a row in place. An UPDATE writes a new tuple version and marks the old one as deleted. Visibility is decided per-query by comparing each tuple’s xmin and xmax against the transaction snapshot taken at statement (or transaction) start. This is what makes readers never block writers and writers never block readers.',
        'Dead tuples accumulate and consume space until VACUUM reclaims them. Autovacuum is a background launcher that schedules vacuum workers when the dead-tuple fraction in a table crosses a threshold.',
      ],
    },
    {
      heading: 'Query lifecycle',
      paragraphs: [
        'A client sends SQL over the wire protocol. The backend parses it into a parse tree, rewrites it against the rule system, analyzes it (binding names to catalog entries), and hands it to the planner. The planner produces a tree of plan nodes: Seq Scan, Index Scan, Hash Join, Aggregate, Sort. The executor pulls tuples top-down through the plan.',
        'Each backend is a separate OS process. A connection-pooling proxy (pgBouncer) is the usual way to keep thousands of clients from spawning thousands of backends.',
      ],
      code: 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\n\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT relname, n_live_tup\nFROM pg_stat_user_tables\nORDER BY n_live_tup DESC\nLIMIT 10;',
      codeLanguage: 'sql',
    },
    {
      heading: 'Indexes beyond B-tree',
      paragraphs: [
        'PostgreSQL ships with five built-in index access methods. B-tree handles the 80% case. GIN indexes an inverted list per key (great for full-text, JSONB, arrays). BRIN summarizes a range of pages into a tiny min/max (great for time-series with monotonic keys). GiST and SP-GiST are extensible balanced-tree frameworks for spatial, range, and custom types.',
        'Because indexes are plug-in, the community has built hundreds of them: PostGIS for geometry, pg_trgm for fuzzy text, vector for embeddings.',
      ],
    },
  ],
  diagrams: [
    {
      component: 'MvccTimeline',
      title: 'Snapshot isolation timeline',
      description:
        'Three concurrent transactions with overlapping read/write sets; each sees the row version visible at its snapshot.',
    },
    {
      component: 'Replication',
      title: 'Streaming replication topology',
      description: 'Primary streams WAL; one replica streams further to a cascading replica.',
    },
  ],
};
