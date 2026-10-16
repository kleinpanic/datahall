import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'cassandra',
  name: 'Apache Cassandra',
  tagline: 'Wide-column storage at planetary scale: leaderless replication, tunable consistency.',
  summary:
    'Cassandra is a distributed wide-column store. A partition key scatters rows across a ring of equal nodes using consistent hashing; within a partition, clustering columns keep rows sorted. Writes go to any node, land in a commit log and memtable, and flush to SSTables — an LSM pipeline with leaderless replication and tunable read/write consistency.',
  paradigm: 'server',
  concurrency: 'lock-free',
  storage: 'log-structured',
  families: ['wide-column', 'lsm-log-structured'],
  deploymentModel: 'client-server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['hash', 'bitmap'],
  workloads: ['oltp', 'time-series', 'hybrid'],
  language: 'Java',
  initialRelease: 2008,
  license: 'Apache-2.0',
  accent: '#ee7b54',
  highlights: [
    { label: 'Model', value: 'partition key → clustering columns' },
    { label: 'Replication', value: 'leaderless, gossip + tunable QUORUM' },
    { label: 'Storage', value: 'commit log → memtable → SSTables' },
    { label: 'Tradeoff', value: 'query-first schema, no joins' },
  ],
  features: [
    {
      title: 'Wide-column partitions',
      detail:
        'The partition key hashes to a ring position; inside the partition, clustering columns store rows sorted — billions of rows per partition with ordered scans.',
    },
    {
      title: 'Leaderless writes',
      detail:
        'Any node can coordinate a write; it goes to R replicas per the replication factor. Consistency is per-operation: ONE, QUORUM, or ALL — availability and latency against consistency.',
    },
    {
      title: 'Tombstones and compaction',
      detail:
        'Deletes write tombstones that shadow older values until compaction. Read path merges memtable + SSTables newest-first — the LSM read-amplification tradeoff.',
    },
    {
      title: 'Query-first schema design',
      detail:
        'Tables are designed around the queries: the partition key IS the access pattern. No joins, no ad-hoc secondary queries without explicit index tables.',
    },
  ],
  sections: [
    {
      heading: 'The ring: consistent hashing without a leader',
      paragraphs: [
        'Every node owns a token range; each partition hashes to one. There is no master — a client can coordinate through any node. Replicas for a partition are the next N nodes clockwise on the ring; gossip keeps membership state.',
        'The price of leaderless symmetry is consistency tuning: with QUORUM reads and writes you get R+W>N overlap; with ONE you get availability during partitions and eventual convergence.',
      ],
      code: 'CREATE TABLE sensor_readings (\n  sensor_id uuid,\n  ts timestamp,\n  value double,\n  PRIMARY KEY (sensor_id, ts)\n) WITH CLUSTERING ORDER BY (ts DESC);',
      codeLanguage: 'sql',
    },
    {
      heading: 'The storage pipeline is the LSM pipeline',
      paragraphs: [
        'Writes append to a commit log, mutate a memtable, flush into immutable SSTables, and compaction merges them — structurally identical to RocksDB. The walkthrough below traces exactly that loop; the Cassandra-specific parts are tombstone garbage collection and read-repair across replicas.',
        'Schema design is query-first: one table per query pattern, denormalized on purpose. The wide-column shape lets each partition carry a different row shape — hence the family name.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: coordinator → R replicas → commit log → memtable → SSTable',
      description:
        'Any node coordinates; the write hits replicas per consistency level, appends to commit logs and memtables, and flushes to immutable SSTables that merge under compaction.',
      caption: 'Leaderless by design: the coordinator is whichever node received the write.',
      concepts: ['coordinator', 'replication factor', 'consistency level', 'SSTable'],
      sourceRefs: [
        {
          label: 'Cassandra docs: Architecture',
          href: 'https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'lsm-compaction',
      variant: 'alt',
      title: 'LSM loop: memtable, tombstones, compaction',
      description:
        'The write/read/delete/compaction loop Cassandra shares with every LSM engine — traced end to end on a small key family.',
      caption:
        'Generic LSM mechanics; Cassandra adds replica read-repair and per-SSTable bloom filters on top.',
      concepts: ['memtable', 'tombstone', 'SSTable', 'compaction'],
      sourceRefs: [
        {
          label: 'Cassandra docs: Compaction',
          href: 'https://cassandra.apache.org/doc/latest/cassandra/operating/compaction/compaction.html',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Partition shape: wide rows over time',
      description:
        'One sensor partition holding clustering-column rows — newest-first ordered scans over billions of points.',
      levels: [
        { level: 0, nodes: 1, fanout: 0 },
        { level: 1, nodes: 12, fanout: 250 },
        { level: 2, nodes: 3000, fanout: 0 },
      ],
      cardinality: 3000000,
      selectivity: 0.9,
      caption:
        'Illustrative partition row counts for one sensor at one-minute resolution over ~5 years.',
      concepts: ['partition', 'clustering columns', 'wide rows'],
      sourceRefs: [
        {
          label: 'Cassandra docs: Data modeling',
          href: 'https://cassandra.apache.org/doc/latest/cassandra/data_modeling/data_modeling_concepts.html',
        },
      ],
    },
  ],
  sourceRefs: [
    { label: 'Cassandra docs', href: 'https://cassandra.apache.org/doc/latest/' },
    {
      label: 'Lakshman & Malik (2010), Cassandra — decentralized structured storage',
      href: 'https://dl.acm.org/doi/10.1145/1773912.1773922',
    },
    {
      label: 'DataStax: Cassandra architecture',
      href: 'https://docs.datastax.com/en/cassandra-oss/3.x/cassandra/architecture/architectureIntro.html',
    },
  ],
};
