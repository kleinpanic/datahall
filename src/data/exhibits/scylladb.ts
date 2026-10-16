import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'scylladb',
  name: 'ScyllaDB',
  tagline: 'Cassandra rebuilt in C++ on a shared-nothing sharded architecture: the same model, lower latency.',
  summary:
    'ScyllaDB reimplements the Cassandra wide-column model in C++ on a shared-nothing architecture: each core owns its own shard of memory, SSTables, and network queues, with no cross-core locks or coordination. Fully compatible with Cassandra drivers and CQL, targeting single-digit-millisecond p99 at high throughput.',
  paradigm: 'server',
  concurrency: 'lock-free',
  storage: 'log-structured',
  families: ['wide-column', 'lsm-log-structured'],
  deploymentModel: 'client-server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['btree', 'bitmap'],
  workloads: ['oltp', 'time-series', 'hybrid'],
  language: 'C++',
  initialRelease: 2015,
  license: 'AGPL-3.0 / commercial',
  accent: '#6ad1e3',
  highlights: [
    { label: 'Compatible', value: 'Cassandra CQL + drivers' },
    { label: 'Architecture', value: 'shared-nothing per-core shards' },
    { label: 'Latency', value: 'p99 in single-digit ms' },
    { label: 'Tuning', value: 'self-tuning compaction' },
  ],
  features: [
    {
      title: 'Shared-nothing shards',
      detail:
        'One shard per CPU core, each with private memory, cache, commit log slice, and network queues. Requests never cross cores — no locks, no atomics on the hot path.',
    },
    {
      title: 'CQL-compatible',
      detail:
        'Speaks Cassandra Query Language and the Cassandra wire protocol: drivers migrate by swapping endpoints, schema and tools carry over.',
    },
    {
      title: 'Self-tuning compaction',
      detail:
        'Compaction strategy switches by workload shape (size-tiered for write-heavy, incremental for read-heavy) and adapts without manual threshold tuning.',
    },
    {
      title: 'IO scheduler',
      detail:
        'A reactor-level IO scheduler shares disk bandwidth across shards by priority class — compaction cannot starve the read path.',
    },
  ],
  sections: [
    {
      heading: 'Why rebuild Cassandra in C++?',
      paragraphs: [
        'Cassandra runs one JVM with shared heaps, GC pauses, and cross-core coordination on the hot path. ScyllaDB applies the seastar framework: thread-per-core, poll-mode IO, and per-core ownership — the same CQL semantics with dramatically lower tail latencies and predictable behavior under saturation.',
        'For the data model nothing changes: partition key, clustering columns, tunable consistency, tombstones, compaction. The difference is execution architecture — which is the lesson of this exhibit: the same data model can ride radically different engines.',
      ],
      code: 'CREATE TABLE metrics (\n  series_id uuid,\n  ts timestamp,\n  value double,\n  PRIMARY KEY (series_id, ts)\n);',
      codeLanguage: 'cql',
    },
    {
      heading: 'Reading the latency story',
      paragraphs: [
        'The latency story is the pitch: shared-nothing cores mean p99 stays flat as throughput climbs — the tail does not diverge from the median under load the way GC-based engines do.',
        'Read the percentiles, not the average: p50 and p99 together reveal queueing, compaction pressure, and shard imbalance. The IO scheduler keeps compaction from starving reads, which is what keeps that p99 line flat.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Shard-local write path: coordinator core → owning shard → commit log → memtable → SSTable',
      description:
        'A request lands on one core, hops to the shard owning the partition key, and follows the LSM loop entirely within that core — no cross-core locks.',
      caption: 'Shared-nothing: ownership of memory and disk queues is per-core.',
      concepts: ['shard', 'reactor', 'commit log', 'SSTable'],
      sourceRefs: [{ label: 'ScyllaDB docs: Architecture', href: 'https://docs.scylladb.com/stable/architecture/architecture.html' }],
    },
    {
      kind: 'index-stats',
      title: 'Shard-level throughput shape',
      description:
        'Per-shard SSTable counts stay balanced because partition tokens map evenly to cores — imbalance is a token, not a tuning, problem.',
      levels: [
        { level: 0, nodes: 4, fanout: 0 },
        { level: 1, nodes: 4, fanout: 24 },
        { level: 2, nodes: 96, fanout: 0 },
      ],
      cardinality: 200000,
      selectivity: 0.25,
      caption: 'Illustrative per-shard SSTable tiers on a 4-core node.',
      concepts: ['shards', 'balanced tiers', 'IO scheduler'],
      sourceRefs: [{ label: 'ScyllaDB University: Shared nothing architecture', href: 'https://university.scylladb.com/' }],
    },
  ],
  sourceRefs: [
    { label: 'ScyllaDB docs: Architecture', href: 'https://docs.scylladb.com/stable/architecture/architecture.html' },
    { label: 'ScyllaDB University', href: 'https://university.scylladb.com/' },
    { label: 'scylladb.com', href: 'https://www.scylladb.com/' },
  ],
};
