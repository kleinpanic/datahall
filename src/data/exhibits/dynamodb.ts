import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'dynamodb',
  name: 'Amazon DynamoDB',
  tagline:
    'Serverless key-value at any scale: partition-key routing, quorum replication, single-digit ms.',
  summary:
    'DynamoDB is AWS managed key-value and document storage. Tables are hashed across partitions by a partition key, optionally ordered by a sort key; every item is replicated three times across availability zones with quorum agreement. Access is operations, not queries: GetItem, PutItem, Query by key — with GSIs for alternate access paths.',
  paradigm: 'server',
  concurrency: 'lock-free',
  storage: 'log-structured',
  families: ['key-value', 'wide-column'],
  deploymentModel: 'server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['hash', 'btree'],
  workloads: ['oltp', 'hybrid'],
  language: 'Proprietary (AWS-managed)',
  initialRelease: 2012,
  license: 'Proprietary (managed service)',
  accent: '#527fff',
  highlights: [
    { label: 'Model', value: 'partition key + sort key items' },
    { label: 'Access', value: 'GetItem / Query / Scan ops' },
    { label: 'Replication', value: '3 AZs, quorum writes' },
    { label: 'Scale', value: 'serverless, on-demand capacity' },
  ],
  features: [
    {
      title: 'Partition-key routing',
      detail:
        'The partition key hashes to a physical storage partition; the sort key orders items inside it. Table design IS access design — the key schema determines what you can fetch in O(1).',
    },
    {
      title: 'GSIs for alternate paths',
      detail:
        'Global secondary indexes replicate the table under a different key schema, maintained asynchronously — extra access patterns at extra write cost.',
    },
    {
      title: 'Quorum consistency',
      detail:
        'Writes acknowledge at quorum; eventually consistent reads may see stale values, strongly consistent reads always read the quorum leader.',
    },
    {
      title: 'Streams and triggers',
      detail:
        'DynamoDB Streams publishes item-change events in order per key — feeding analytics, replicas in other tables, and event-driven architectures.',
    },
  ],
  sections: [
    {
      heading: 'Access patterns are the schema',
      paragraphs: [
        'DynamoDB inverts relational design: you enumerate the queries first, then design tables so each query is a direct key lookup. The partition key spreads load across storage partitions — a hot partition key throttles, no matter the table size.',
        'The single-table design pattern packs multiple entity types into one table using overlapping key schemas — powerful and famously easy to get wrong.',
      ],
      code: 'GetItem:\n  Table: orders\n  Key: { customer_id: "c-42", order_ts: 1699999999 }\n  → one item, O(1), single-digit ms',
      codeLanguage: 'text',
    },
    {
      heading: 'Capacity, throttling, and cost',
      paragraphs: [
        'Provisioned or on-demand capacity units meter reads and writes; exceeding partition throughput throws throttling errors rather than queuing. Cost scales with throughput and storage — predictable if your access patterns are uniform, expensive if they spike.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: request → router → partition → quorum replication → storage',
      description:
        'A write routes by partition-key hash to one partition leader, replicates to two bystander replicas across AZs, and acknowledges at quorum into log-structured storage.',
      caption: 'The 2012 DynamoDB paper (Sivasubramanian) describes this design publicly.',
      concepts: ['partition hash', 'quorum', 'replication', 'throttling'],
      sourceRefs: [
        {
          label: 'AWS: DynamoDB Developer Guide',
          href: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Partition and GSI shape',
      description:
        'Base table partitions vs a global secondary index projection — the GSI duplicates chosen attributes under an alternate key.',
      levels: [
        { level: 0, nodes: 8, fanout: 0 },
        { level: 1, nodes: 8, fanout: 120 },
        { level: 2, nodes: 960, fanout: 0 },
      ],
      cardinality: 115000,
      selectivity: 0.3,
      caption:
        'Illustrative: 8 partitions, one GSI projecting an alternate access path. Hot partitions throttle independently of table size.',
      concepts: ['partition', 'GSI projection', 'hot key'],
      sourceRefs: [
        {
          label: 'AWS: Global secondary indexes',
          href: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'AWS: DynamoDB Developer Guide',
      href: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html',
    },
    {
      label: 'Sivasubramanian (2012), Amazon DynamoDB (ACM Symposium on Cloud Computing keynote)',
      href: 'https://www.youtube.com/watch?v=6yqUfQ7Yvlc',
    },
    {
      label: 'DeCandia et al. (2007), Dynamo',
      href: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf',
    },
  ],
};
