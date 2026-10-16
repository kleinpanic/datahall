import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'timescaledb',
  name: 'TimescaleDB',
  tagline:
    'Postgres extended for time series: hypertables, automatic chunking, columnar compression.',
  summary:
    'TimescaleDB is a Postgres extension that turns ordinary tables into hypertables — automatically partitioned into time-based chunks, each with columnar-compressed segments. Full Postgres SQL applies (joins, CTEs, extensions), while chunk interval, compression, and retention policies manage time-series lifecycle automatically.',
  paradigm: 'server',
  concurrency: 'mvcc',
  storage: 'columnar',
  families: ['time-series', 'relational'],
  deploymentModel: 'client-server',
  storageEngines: ['columnar'],
  indexTypes: ['brin', 'btree'],
  workloads: ['time-series', 'analytics', 'olap'],
  language: 'C',
  initialRelease: 2017,
  license: 'Apache-2.0 (community) / Timescale License',
  accent: '#f2a33c',
  highlights: [
    { label: 'Model', value: 'hypertables over Postgres' },
    { label: 'Partitioning', value: 'automatic time + space chunks' },
    { label: 'Compression', value: '10-20× columnar on old chunks' },
    { label: 'SQL', value: 'full Postgres: joins, CTEs, functions' },
  ],
  features: [
    {
      title: 'Hypertables and chunks',
      detail:
        'A hypertable is a virtual table partitioned into chunks by time (and optional space dimension). Each chunk is a real Postgres table with its own indexes — queries prune to the chunks their time range touches.',
    },
    {
      title: 'Native columnar compression',
      detail:
        'Recent chunks stay row-based for fast inserts; a policy compresses older chunks into columnar form — typically 10-20× smaller, with segment-by reordering for query speed.',
    },
    {
      title: 'Policies, not cron jobs',
      detail:
        'Compression, retention, downsampling, and aggregation refresh run as scheduled policies inside the database — lifecycle management becomes data definition.',
    },
    {
      title: 'Continuous aggregates',
      detail:
        'Materialized views over time buckets that refresh incrementally as new data lands — raw data and rollups coexist with different retention.',
    },
  ],
  sections: [
    {
      heading: 'Why not just Postgres?',
      paragraphs: [
        'Plain Postgres handles time series until indexes bloat and inserts scatter across the heap. TimescaleDB chunks by time so each insert hits the current chunk, indexes stay small, and old chunks compress columnar — the partitioning a DBA would hand-build, automated.',
        'Because chunks are ordinary tables, everything Postgres works: joins against relational reference data, PostGIS, full-text search, extensions. Time-series specialization without leaving the ecosystem.',
      ],
      code: "SELECT time_bucket('5 minutes', time) AS bucket,\n       avg(temperature) AS avg_temp\nFROM conditions\nWHERE time > NOW() - INTERVAL '1 day'\nGROUP BY bucket\nORDER BY bucket;",
      codeLanguage: 'sql',
    },
    {
      heading: 'The lifecycle is data definition',
      paragraphs: [
        'Compression at 7 days, retention at 90 days, continuous aggregates refreshed hourly: three policies replace a rack of cron scripts. Each runs inside the engine with transactional guarantees.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'wal-timeline',
      mode: 'postgres',
      showCrashMoment: true,
      title: 'Postgres WAL + chunk lifecycle',
      description:
        'Inserts land in the newest chunk under standard Postgres WAL; compression and retention policies run transactionally against whole chunks.',
      concepts: ['WAL', 'chunks', 'compression policy'],
      sourceRefs: [
        {
          label: 'TimescaleDB: About hypertables',
          href: 'https://docs.timescale.com/use-timescale/latest/hypertables/',
        },
      ],
    },
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: INSERT → current chunk → compression policy → columnar',
      description:
        'Inserts land in the newest row-based chunk; scheduled policies compress older chunks columnar and drop chunks past retention.',
      caption: 'Chunks are real Postgres tables — pruning is plan-time chunk exclusion.',
      concepts: ['hypertable', 'chunks', 'compression policy', 'retention'],
      sourceRefs: [
        {
          label: 'TimescaleDB: Hypertables and chunks',
          href: 'https://docs.timescale.com/use-timescale/latest/hypertables/',
        },
      ],
    },
    {
      kind: 'time-series',
      title: 'Raw vs continuously aggregated',
      description:
        'Raw sensor points and the continuous-aggregate rollup served from compressed chunks.',
      series: [
        {
          name: 'raw',
          points: [
            { t: 0, v: 41.2 },
            { t: 6, v: 40.8 },
            { t: 12, v: 41.5 },
            { t: 18, v: 42.1 },
            { t: 24, v: 41.7 },
          ],
        },
        {
          name: '1h avg (illustrative)',
          points: [
            { t: 3, v: 41.0 },
            { t: 15, v: 41.8 },
          ],
        },
      ],
      unit: '°C',
      caption: 'Illustrative shapes for the continuous-aggregate pattern — not measured data.',
      concepts: ['continuous aggregates', 'rollups', 'chunk pruning'],
      sourceRefs: [
        {
          label: 'TimescaleDB: Continuous aggregates',
          href: 'https://docs.timescale.com/use-timescale/latest/continuous-aggregates/',
        },
      ],
    },
  ],
  sourceRefs: [
    { label: 'TimescaleDB docs', href: 'https://docs.timescale.com/' },
    {
      label: 'Timescale: Time-series compression',
      href: 'https://www.timescale.com/blog/time-series-compression-algorithms-explained/',
    },
    { label: 'timescale.com', href: 'https://www.timescale.com/' },
  ],
};
