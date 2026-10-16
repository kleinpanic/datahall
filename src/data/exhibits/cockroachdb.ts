import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'cockroachdb',
  name: 'CockroachDB',
  tagline: 'Distributed SQL that survives datacenter loss: Raft ranges, serializable by default.',
  summary:
    'CockroachDB is a distributed SQL database that shards your tables into ranges of ~512 MiB, each replicated three times via the Raft consensus protocol. It speaks the Postgres wire protocol, offers serializable isolation by default, and keeps working through node loss — while the SQL layer stays familiar: joins, indexes, transactions.',
  paradigm: 'server',
  concurrency: 'mvcc',
  storage: 'log-structured',
  families: ['relational'],
  deploymentModel: 'client-server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['btree'],
  workloads: ['oltp', 'hybrid', 'olap'],
  language: 'Go',
  initialRelease: 2015,
  license: 'BSL-1.1 / Apache-2.0 (core)',
  accent: '#b3502d',
  highlights: [
    { label: 'SQL', value: 'Postgres-compatible wire + dialect' },
    { label: 'Consistency', value: 'serializable, always on' },
    { label: 'Replication', value: 'Raft consensus per range' },
    { label: 'Unit', value: '~512 MiB ranges, auto-split' },
  ],
  features: [
    {
      title: 'Ranges: the unit of distribution',
      detail:
        'Tables and indexes split into ordered ranges, each a replicated Raft group with its own LSM (Pebble) store. Ranges split and rebalance automatically.',
    },
    {
      title: 'Serializable by default',
      detail:
        'Every transaction runs at serializable isolation via timestamp ordering and write intents — no anomaly configuration, no isolation-mode footguns.',
    },
    {
      title: 'Survives failures',
      detail:
        'Losing one replica of three: zero downtime, zero data loss. Losing a datacenter: configure region-local replicas and survive it too.',
    },
    {
      title: 'Postgres on easy mode',
      detail:
        'Drivers, ORMs, and most SQL just work against the Postgres wire protocol — with schema changes online and multi-region table locality controls.',
    },
  ],
  sections: [
    {
      heading: 'Distributed SQL without the distributed-systems degree',
      paragraphs: [
        'A CockroachDB cluster is a key-value map underneath: table data encodes into keys, ordered ranges of keys get replicated via Raft, and the SQL layer on top gives you joins, constraints, and transactions as if it were one Postgres instance.',
        'The transaction story is MVCC with timestamp ordering: readers never block writers, writers detect conflicts at commit, and every commit survives Raft majority agreement before acknowledging — the durability rule databases have used since WAL, now per range.',
      ],
      code: 'BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;  -- serializable, replicated, survives node loss',
      codeLanguage: 'sql',
    },
    {
      heading: 'The commit boundary, distributed',
      paragraphs: [
        'The walkthrough below shows the commit and crash-recovery loop every serious engine implements — the same rule CockroachDB applies per range: a transaction exists once its consensus record is durable, and recovery replays to that point. What is new here is scale: thousands of Raft groups, ranges splitting under load.',
        'Multi-region tables add locality controls: keep a user’s rows in their region, enforce uniqueness globally. The engine handles the placement; you declare the intent.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'gpu-scene',
      title: 'CockroachDB — range replication field (live GPU scene)',
      description:
        'A live WebGPU particle field tinted to this exhibit. Plays only with WebGPU and no reduced-motion preference; a static storyboard renders for everyone else.',
      scene: 'hnsw-layers',
      points: 420,
      seed: 4297,
      fps: 30,
      hue: 300,
    },
    {
      kind: 'wal-timeline',
      mode: 'generic',
      showCrashMoment: true,
      title: 'Raft log + WAL: the commit boundary per range',
      description:
        'Every range replicates its Raft log; a transaction is durable once its record reaches majority agreement. Crash recovery replays to the last committed point.',
      caption:
        'Generic WAL/durability timeline — CockroachDB applies the rule per Raft range across thousands of ranges.',
      concepts: ['Raft log', 'commit boundary', 'recovery'],
      sourceRefs: [
        {
          label: 'CockroachDB: Transaction layer',
          href: 'https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer',
        },
      ],
    },
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: SQL → transaction KV → Raft range → Pebble LSM',
      description:
        'A transaction writes through a timestamp-ordered KV layer; each range replicates via Raft before the commit acknowledges; the range LSM (Pebble) stores the data.',
      caption: 'Postgres semantics, distributed execution.',
      concepts: ['Raft', 'write intents', 'MVCC timestamps', 'Pebble LSM'],
      sourceRefs: [
        {
          label: 'CockroachDB: Architecture overview',
          href: 'https://www.cockroachlabs.com/docs/stable/architecture/overview',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'mvcc-commit',
      variant: 'alt',
      title: 'Commit boundary and crash recovery, traced',
      description:
        'Version visibility, the WAL commit boundary, and recovery replay — the durability rule CockroachDB enforces per Raft range.',
      caption:
        'Generic MVCC+WAL mechanics; CockroachDB distributes the same rule across Raft groups with timestamp cache conflicts.',
      concepts: ['MVCC', 'commit boundary', 'recovery'],
      sourceRefs: [
        {
          label: 'CockroachDB: Transactions',
          href: 'https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'CockroachDB: Architecture overview',
      href: 'https://www.cockroachlabs.com/docs/stable/architecture/overview',
    },
    {
      label: 'CockroachDB: Transaction layer',
      href: 'https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer',
    },
    { label: 'cockroachlabs.com', href: 'https://www.cockroachlabs.com/' },
  ],
};
