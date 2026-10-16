import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'questdb',
  name: 'QuestDB',
  tagline: 'Time-series SQL at columnar speed: time-partitioned native storage with SIMD scans.',
  summary:
    'QuestDB is a time-series SQL database with its own columnar storage engine, SQL over InfluxDB line protocol, and SIMD-accelerated scans. Tables partition by time natively, out-of-order writes are first-class, and sample-by aggregation downsizes series at query time. It competes on ingestion throughput with a Postgres-compatible wire protocol.',
  paradigm: 'server',
  concurrency: 'single-writer-mvcc',
  storage: 'columnar',
  families: ['time-series'],
  deploymentModel: 'client-server',
  storageEngines: ['columnar'],
  indexTypes: ['hash', 'btree'],
  workloads: ['time-series', 'analytics', 'olap'],
  language: 'Java',
  initialRelease: 2019,
  license: 'Apache-2.0',
  accent: '#ffd166',
  highlights: [
    { label: 'Ingest', value: 'line protocol + ILP over TCP/HTTP' },
    { label: 'Storage', value: 'native columnar, time-partitioned' },
    { label: 'Out-of-order', value: 'first-class OO updates' },
    { label: 'SQL', value: 'Postgres wire + Influx line' },
  ],
  features: [
    {
      title: 'Native time partitions',
      detail:
        'Tables partition by DAY/MONTH/YEAR natively — every query prunes partitions by its WHERE time clause before touching columns.',
    },
    {
      title: 'Symbol type',
      detail:
        'Low-cardinality strings store as integer codes over a dictionary — repeated identifiers compress to 4 bytes and filter with integer compares.',
    },
    {
      title: 'SIMD scans',
      detail:
        'Aggregations compile to SIMD instructions over primitive column arrays — group-bys and filters run at memory bandwidth.',
    },
    {
      title: 'Out-of-order engine',
      detail:
        'Late-arriving data merges into committed partitions without rewrites — the OO engine tracks committed and OOMax timestamps per column.',
    },
  ],
  sections: [
    {
      heading: 'Time-series SQL without a bolt-on',
      paragraphs: [
        'QuestDB treats time as a storage primitive: tables partition by time, SAMPLE BY aggregates at query time, ASOF JOIN aligns series by nearest timestamp — operations that need window-function gymnastics elsewhere are single clauses.',
        'Ingestion speaks InfluxDB line protocol, so collectors migrate without changes; queries speak the Postgres wire protocol, so dashboards connect as if it were Postgres.',
      ],
      code: "SELECT location, avg(temp)\nFROM readings\nWHERE timestamp IN '2026-10'\nSAMPLE BY 1h ALIGN TO CALENDAR;",
      codeLanguage: 'sql',
    },
    {
      heading: 'Storage: columns, partitions, symbol dictionaries',
      paragraphs: [
        'Each column is its own memory-mapped file per partition; fixed-width primitives scan with SIMD, variable data (strings) uses an indirection table. The symbol dictionary trades a dictionary lookup for 4-byte storage on every repeated value.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Ingest path: ILP/TCP → OOO commit → columnar partition files',
      description:
        'Line-protocol events append into partition column files; out-of-order timestamps merge via the OO engine; symbol columns store dictionary codes.',
      caption: 'Commit happens per partition with committed/OOMax timestamps per column.',
      concepts: ['ILP', 'partitions', 'out-of-order', 'symbol type'],
      sourceRefs: [
        {
          label: 'QuestDB: Reference — ILP',
          href: 'https://questdb.io/docs/reference/api/ilp/overview/',
        },
      ],
    },
    {
      kind: 'time-series',
      title: 'SAMPLE BY vs raw points',
      description:
        'Raw one-second points against a 1-minute SAMPLE BY average — query-time downsampling over native partitions.',
      series: [
        {
          name: 'raw (1s)',
          points: [
            { t: 0, v: 100 },
            { t: 10, v: 102 },
            { t: 20, v: 99 },
            { t: 30, v: 104 },
            { t: 40, v: 101 },
            { t: 50, v: 106 },
          ],
        },
        {
          name: 'SAMPLE BY 1m (illustrative)',
          points: [
            { t: 20, v: 100.3 },
            { t: 50, v: 103.7 },
          ],
        },
      ],
      unit: 'req/s',
      caption: 'Illustrative shapes — SAMPLE BY runs as a native aggregate over partition columns.',
      concepts: ['SAMPLE BY', 'time partitions', 'SIMD aggregates'],
      sourceRefs: [
        { label: 'QuestDB: SAMPLE BY', href: 'https://questdb.io/docs/reference/sql/sample-by/' },
      ],
    },
  ],
  sourceRefs: [
    { label: 'QuestDB docs', href: 'https://questdb.io/docs/' },
    { label: 'QuestDB: Reference — SQL', href: 'https://questdb.io/docs/reference/sql/overview/' },
    { label: 'questdb.io', href: 'https://questdb.io/' },
  ],
};
