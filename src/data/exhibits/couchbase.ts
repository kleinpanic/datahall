import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'couchbase',
  name: 'Couchbase',
  tagline:
    'Memory-first document database: the cache IS the database, persistence is asynchronous.',
  summary:
    'Couchbase inverts the usual write path: writes land in a managed memory layer first and acknowledge immediately, then queue asynchronously to append-only storage files. Documents are JSON, queries speak N1QL (SQL for JSON), and the cluster distributes documents by vBucket with masterless replication.',
  paradigm: 'client-server',
  concurrency: 'mvcc',
  storage: 'log-structured',
  families: ['document', 'key-value'],
  deploymentModel: 'client-server',
  storageEngines: ['log-structured'],
  indexTypes: ['btree', 'hash', 'full-text'],
  workloads: ['oltp', 'hybrid'],
  language: 'C / Erlang / Go',
  initialRelease: 2011,
  license: 'BSL-1.1 / Apache-2.0 (community)',
  accent: '#ff4d4d',
  highlights: [
    { label: 'Model', value: 'JSON documents in vBuckets' },
    { label: 'Write path', value: 'memory-first, async persistence' },
    { label: 'Query', value: 'N1QL — SQL for JSON' },
    { label: 'Topology', value: 'vBuckets, masterless replicas' },
  ],
  features: [
    {
      title: 'Memory-first architecture',
      detail:
        'The managed cache (memcached lineage) is the system of record on write: mutations acknowledge from RAM, then a background writer appends to Couchstore files. Sets are O(1) hot-path.',
    },
    {
      title: 'vBucket distribution',
      detail:
        'The keyspace splits into 1024 virtual buckets mapped to nodes; each vBucket has one active and N replicas. Rebalancing moves vBuckets, not documents.',
    },
    {
      title: 'N1QL: SQL for JSON',
      detail:
        'Ad-hoc SQL queries with JOINs, GROUP BY, and indexes over JSON documents — secondary indexes (GSI) maintained separately from the data path.',
    },
    {
      title: 'XDCR cross-datacenter replication',
      detail:
        'Active-active multi-cluster replication with filtering — the disaster-recovery and geo-distribution story built into the product.',
    },
  ],
  sections: [
    {
      heading: 'Cache-first is a different contract',
      paragraphs: [
        'Classical engines persist then acknowledge; Couchbase acknowledges from memory and persists in the background. Durability is tunable per operation (replicate-to / persist-to), but the default contract assumes the memory layer plus replication is enough — a design inherited from the memcached lineage.',
        'The consequence: reads of active working sets never touch disk, and write latency is memory-speed. The cost is the persistence queue — crash before persistence loses the queue, which is why the bucket config, replicas, and the disk writer matter.',
      ],
      code: "UPSERT INTO orders (KEY, VALUE)\nVALUES ('order-42', { 'customer': 'ann', 'total': 42 });\n\nSELECT o.total\nFROM orders o\nWHERE o.customer = 'ann';",
      codeLanguage: 'sql',
    },
    {
      heading: 'N1QL: joining the document and SQL worlds',
      paragraphs: [
        'N1QL treats arrays and nested objects as first-class: UNNEST flattens arrays, ANY/EVERY quantify them, and indexes cover nested paths. Secondary indexes (GSI) live on query nodes and are updated asynchronously from the data path.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: SDK → vBucket active → memory + replication queue → disk writer',
      description:
        'Writes acknowledge from the managed memory layer, replicate to vBucket replicas, and queue to the asynchronous disk writer (Couchstore append-only files).',
      caption: 'Durability knobs are per-operation — the default is memory + replication.',
      concepts: ['vBucket', 'managed cache', 'disk writer', 'replication queue'],
      sourceRefs: [
        {
          label: 'Couchbase: Architecture',
          href: 'https://docs.couchbase.com/server/current/learn/architecture-overview-concepts.html',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'vBucket distribution across nodes',
      description:
        '1024 vBuckets mapped onto cluster nodes — active plus replica copies, rebalanced on topology change.',
      levels: [
        { level: 0, nodes: 1, fanout: 0 },
        { level: 1, nodes: 3, fanout: 0 },
        { level: 2, nodes: 1024, fanout: 0 },
      ],
      cardinality: 1024000,
      selectivity: 0.5,
      caption:
        'Illustrative: 3 nodes × 1024 vBuckets (active + replicas). Rebalance moves vBuckets, not keys.',
      concepts: ['vBuckets', 'rebalance', 'replicas'],
      sourceRefs: [
        {
          label: 'Couchbase: Buckets and vBuckets',
          href: 'https://docs.couchbase.com/server/current/learn/buckets.html',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'Couchbase docs: Architecture and concepts',
      href: 'https://docs.couchbase.com/server/current/learn/architecture-overview-concepts.html',
    },
    {
      label: 'Couchbase: N1QL — SQL for JSON',
      href: 'https://docs.couchbase.com/n1ql/current/landingpage/index.html',
    },
    { label: 'couchbase.com', href: 'https://www.couchbase.com/' },
  ],
};
