import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'clickhouse',
  name: 'ClickHouse',
  tagline: 'A columnar OLAP engine: sparse primary keys, granule skipping, vectorized scans.',
  summary:
    'ClickHouse stores table data in parts, column by column, in blocks called granules. A sparse primary index records the key value at each granule boundary — it routes key ranges rather than looking up rows. Queries read only the referenced columns, skip whole granules by key range, evaluate predicates block-wise, and merge partial aggregate states. It is built for analytics over append-heavy workloads, not for row-level updates.',
  paradigm: 'server',
  concurrency: 'snapshot-isolation',
  storage: 'columnar',
  families: ['olap-columnar'],
  deploymentModel: 'client-server',
  storageEngines: ['columnar'],
  indexTypes: ['btree', 'bitmap'],
  workloads: ['olap', 'analytics', 'time-series'],
  language: 'C++',
  initialRelease: 2016,
  license: 'Apache-2.0',
  accent: '#ffb347',
  highlights: [
    { label: 'Storage', value: 'columnar parts of ~8192-row granules' },
    { label: 'Index', value: 'sparse primary key (1 entry per granule)' },
    { label: 'Execution', value: 'vectorized block processing' },
    { label: 'Note', value: 'append-mostly; no row-level UPDATE' },
  ],
  features: [
    {
      title: 'MergeTree parts',
      detail:
        'The MergeTree family writes each insert batch as an immutable part; background merges combine parts and apply TTLs. Granules (~8192 rows by default) are the unit the index and the engine reason about.',
    },
    {
      title: 'Sparse primary key',
      detail:
        'The primary index stores the key of the first row of each granule — one entry per ~8192 rows, small enough to stay in memory. It finds candidate granule ranges; it is not a B-tree over rows and cannot serve point lookups the way an OLTP index can.',
    },
    {
      title: 'Data skipping indexes',
      detail:
        'Beyond the primary key, min/max, set, bloom-filter, and n-gram skip indexes let the engine reject granules of non-key columns during the scan.',
    },
    {
      title: 'Vectorized execution',
      detail:
        'Operators process whole blocks of column values with CPU-vectorized code, and mergeable aggregates (sum, count, min) combine partial states without re-reading rows.',
    },
  ],
  sections: [
    {
      heading: 'The physical model: columns, parts, granules',
      paragraphs: [
        'A table is a set of parts; each part stores every column as a contiguous compressed file cut into granules. Reading three columns of one granule is three sequential block reads — the layout, not clever caching, is what makes wide-table analytics fast.',
        'The primary key orders data within a part and marks granule boundaries. Because the index is sparse, a key-range predicate prunes whole granules before any data is read; predicates on non-key columns need skip indexes or the block loop.',
      ],
      code: "CREATE TABLE events (\n  day Date, user_id UInt32, region LowCardinality(String), bytes UInt64\n) ENGINE = MergeTree\nPARTITION BY toYYYYMM(day)\nORDER BY (day, region)\nSETTINGS index_granularity = 8192;\n\nSELECT region, sum(bytes) FROM events\nWHERE day >= '2026-10-07' AND bytes > 1000 GROUP BY region;",
      codeLanguage: 'sql',
    },
    {
      heading: 'Execution: prune, scan blocks, merge',
      paragraphs: [
        'A query pipeline selects the referenced columns, applies primary-key analysis to choose granule ranges, reads those granules column-by-column, evaluates remaining predicates on blocks, and pushes partial aggregate states up to be merged. The walkthrough below traces one such query end to end with honest counters: rows examined, granules skipped, cells read.',
        'Writes are batch inserts that create new parts; mutations (ALTER UPDATE/DELETE) rewrite affected parts asynchronously. Point updates and heavy concurrent row-writes are the wrong workload — this is a columnar OLAP engine, not a general-purpose OLTP database, and comparing its mutation story to PostgreSQL’s is a category error.',
      ],
    },
    {
      heading: 'Reading a query plan',
      paragraphs: [
        'EXPLAIN PIPELINE prints the operator chain with per-stage parallelism; EXPLAIN indexes = 1 shows the granule ranges key analysis selected. Treat cost numbers as planner estimates of work, not measured latency — the pipeline view plus counters like rows read is the honest way to reason about performance here.',
        'The walkthrough below renders one such pipeline as a step trace, with the counters that matter: granules skipped by the key range, rows examined, cells read per referenced column, and rows surviving the block predicate.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'query',
      database: 'generic',
      title: 'Query path: key analysis → granule read → block predicates → aggregate merge',
      description:
        'The pipeline prunes granules by key range, reads only referenced columns, evaluates predicates block-wise, and merges partial aggregate states.',
      caption: 'MergeTree model; PARTITION pruning happens above key analysis in real plans.',
      concepts: ['key analysis', 'granules', 'vectorized blocks', 'partial aggregates'],
      sourceRefs: [
        {
          label: 'ClickHouse: MergeTree',
          href: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'columnar-scan',
      variant: 'default',
      title: 'Columnar scan with pruning and block predicates',
      description:
        'One query, step by step: column pruning, primary-key granule skipping, block-wise predicate evaluation, mergeable aggregation, output — with honest counters for rows and cells read.',
      caption:
        'Teaching model: 8 granules × 4 rows for legibility; production parts carry ~8192-row granules and run key analysis per part.',
      concepts: ['column pruning', 'data skipping', 'block predicate', 'aggregation'],
      sourceRefs: [
        {
          label: 'ClickHouse: Why is ClickHouse fast?',
          href: 'https://clickhouse.com/docs/en/about-us/distinctive-features',
        },
      ],
    },
    {
      kind: 'query-plan',
      title: 'Pipeline shape: filtered aggregation',
      description:
        'Block-level pipeline for the walkthrough query. Units are illustrative relative weights of work, not measured latency.',
      steps: [
        { step: 'ReadFromMergeTree (day, region, bytes)', cost: 30, rows: 12 },
        { step: 'Filter (bytes > 1000)', cost: 8, rows: 6 },
        { step: 'PartialAggregating (sum by region)', cost: 6, rows: 9 },
        { step: 'MergingAggregated', cost: 2, rows: 3 },
      ],
      caption:
        'Illustrative pipeline weights for teaching shape — not a measured profile. Use EXPLAIN PIPELINE on a real server for actual stages.',
      concepts: ['pipeline', 'partial aggregation', 'key analysis'],
      sourceRefs: [
        {
          label: 'ClickHouse: EXPLAIN PIPELINE',
          href: 'https://clickhouse.com/docs/en/sql-reference/statements/explain',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'ClickHouse: MergeTree engine',
      href: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree',
    },
    {
      label: 'ClickHouse: Primary key / sparse index',
      href: 'https://clickhouse.com/docs/en/guides/best-practices/sparse-primary-indexes',
    },
    { label: 'clickhouse.com', href: 'https://clickhouse.com/' },
  ],
};
