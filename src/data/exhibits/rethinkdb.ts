import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'rethinkdb',
  name: 'RethinkDB',
  tagline: 'The realtime document database: JSON rows, ReQL chaining, and change feeds that push.',
  summary:
    'RethinkDB is a document database whose defining feature is push: clients subscribe to queries and the server streams result updates as data changes. ReQL embeds query construction in the programming language as chained expressions, storage uses append-friendly B-trees with MVCC snapshots, and the cluster shards and replicates tables automatically.',
  paradigm: 'server',
  concurrency: 'mvcc',
  storage: 'log-structured',
  families: ['document'],
  deploymentModel: 'client-server',
  storageEngines: ['b-plus-tree'],
  indexTypes: ['btree', 'hash', 'rtree'],
  workloads: ['oltp', 'hybrid'],
  language: 'C++',
  initialRelease: 2009,
  license: 'Apache-2.0',
  accent: '#3ddc97',
  highlights: [
    { label: 'Model', value: 'JSON documents, ReQL queries' },
    { label: 'Push', value: 'changefeeds — subscribe to queries' },
    { label: 'Sharding', value: 'replicate + shard per table' },
    { label: 'Indexes', value: 'secondary, multi, geospatial' },
  ],
  features: [
    {
      title: 'ReQL: queries as code',
      detail:
        'Queries are language-native chains (r.table().filter().map()) — composable, refactorable with the app, no string-building.',
    },
    {
      title: 'Changefeeds',
      detail:
        'Subscriptions on tables, filters, or unions stream every change to the result set — the realtime push that defined RethinkDB.',
    },
    {
      title: 'Automatic sharding and replication',
      detail:
        'Tables declare replicas and shards; the cluster balances, elects primaries, and handles failover without manual placement.',
    },
    {
      title: 'Geospatial queries',
      detail:
        'Native points, lines, polygons with intersections and near-queries — indexed with R-trees, not just lat/lon math in app code.',
    },
  ],
  sections: [
    {
      heading: 'Queries that push',
      paragraphs: [
        'A changefeed is a standing query: subscribe once, and every insert, update, or delete that changes the result streams to the client. Dashboards, collaborative apps, and notifications drop from backend polling loops to a single subscription call.',
        'Feeds compose with the query language — filter the feed, transform the output, union across tables. The server computes deltas, not full re-queries.',
      ],
      code: "r.table('orders').changes().run(conn)\n→ { old_val: {...}, new_val: {...} } per change",
      codeLanguage: 'js',
    },
    {
      heading: 'Storage and consistency',
      paragraphs: [
        'Tables shard across the cluster with per-shard B-tree storage; replicas elect a primary per table shard group. Writes acknowledge per write-acknowledgment settings and MVCC snapshots give consistent reads — the realtime push rides on the same MVCC versioning.',
        'The project paused active development in 2020 but remains deployed and its realtime-push + ReQL design still teaches the pattern every subsequent realtime database adopted.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: ReQL write → primary shard → replicas → changefeed push',
      description:
        'A write lands on the table primary, replicates to secondaries, updates indexes, and every subscribed changefeed receives the delta.',
      caption: 'The push is the feature: standing queries stream deltas.',
      concepts: ['changefeed', 'primary election', 'replication', 'delta push'],
      sourceRefs: [
        { label: 'RethinkDB: Changefeeds', href: 'https://rethinkdb.com/docs/changefeeds/' },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Table sharding and replication shape',
      description:
        'Each table shards across servers with configurable replicas; primaries elect per shard range.',
      levels: [
        { level: 0, nodes: 1, fanout: 0 },
        { level: 1, nodes: 3, fanout: 48 },
        { level: 2, nodes: 144, fanout: 0 },
      ],
      cardinality: 140000,
      selectivity: 0.2,
      caption: 'Illustrative shard/replica layout for one table on a 3-server cluster.',
      concepts: ['shards', 'replicas', 'primary election'],
      sourceRefs: [
        {
          label: 'RethinkDB: Sharding and replication',
          href: 'https://rethinkdb.com/docs/sharding-and-replication/',
        },
      ],
    },
  ],
  sourceRefs: [
    { label: 'RethinkDB docs', href: 'https://rethinkdb.com/docs/' },
    { label: 'RethinkDB: Changefeeds', href: 'https://rethinkdb.com/docs/changefeeds/' },
    { label: 'rethinkdb.com', href: 'https://rethinkdb.com/' },
  ],
};
