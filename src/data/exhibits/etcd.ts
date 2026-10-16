import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'etcd',
  name: 'etcd',
  tagline:
    'The Raft-consensus key-value store that coordinates Kubernetes — small, watchable, linearizable.',
  summary:
    'etcd is a strongly consistent, distributed key-value store built on the Raft consensus algorithm. It stores small volumes of configuration and coordination data with MVCC revisions, supports range queries and atomic compare-and-swap, and pushes changes to watchers in real time. It is the control-plane datastore of Kubernetes.',
  paradigm: 'server',
  concurrency: 'mvcc',
  storage: 'single-file-btree',
  families: ['key-value'],
  deploymentModel: 'server',
  storageEngines: ['b-plus-tree'],
  indexTypes: ['btree'],
  workloads: ['oltp'],
  language: 'Go',
  initialRelease: 2013,
  license: 'Apache-2.0',
  accent: '#4d9fff',
  highlights: [
    { label: 'Consensus', value: 'Raft — leader + quorum commits' },
    { label: 'Semantics', value: 'linearizable reads, MVCC revisions' },
    { label: 'Watch', value: 'stream changes from any revision' },
    { label: 'Role', value: 'control plane, not application data' },
  ],
  features: [
    {
      title: 'Raft consensus',
      detail:
        'One leader per cluster term; writes commit only when a majority of nodes persist them — minority partitions reject writes rather than split the brain.',
    },
    {
      title: 'MVCC multi-version store',
      detail:
        'Keys keep their revision history in a backend B+tree; reads at a past revision are consistent snapshots, and compaction prunes old revisions.',
    },
    {
      title: 'Watch streams',
      detail:
        'Clients watch key ranges from any historical revision and receive every change event in order — the mechanism behind Kubernetes controllers.',
    },
    {
      title: 'Leases and TTLs',
      detail:
        'Keys attach to leases with TTLs; heartbeat renewals keep them alive, expiry deletes them — distributed locks and liveness come free.',
    },
  ],
  sections: [
    {
      heading: 'Built for the control plane',
      paragraphs: [
        'etcd is deliberately not application storage: values are small, volumes are low, and correctness is absolute. Kubernetes stores cluster state in it — every API-object write, every leader election, every lease heartbeat flows through Raft.',
        'Watch streams make controllers reactive: a Deployment controller watches for pod changes at a revision and receives events the moment they commit. Compaction prunes old revisions — too-aggressive compaction breaks slow watchers, too-late compaction grows the store.',
      ],
    },
    {
      heading: 'Raft in one paragraph',
      paragraphs: [
        'Raft elects a leader per term; the leader takes a proposal, replicates it to followers, and commits once a majority persists. Linearizable reads go through the leader (or verify recency against it); historical reads use the MVCC snapshot at a chosen revision. Terms, log indices, and revisions are the only clock a consensus store needs.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Commit path: propose → Raft leader → quorum persist → apply → watchers',
      description:
        'A write proposes through the Raft leader, commits at majority persistence, applies to the MVCC store in revision order, and notifies watchers.',
      caption:
        'etcd data volumes are small by design — the store is coordination, not application data.',
      concepts: ['Raft', 'quorum', 'revision', 'watch'],
      sourceRefs: [
        {
          label: 'etcd docs: Architecture',
          href: 'https://etcd.io/docs/v3.5/learning/design-learner/',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Revision store shape',
      description:
        'Keys keep revision history until compaction; compact prunes revisions older than the cluster compact revision.',
      levels: [
        { level: 0, nodes: 1, fanout: 0 },
        { level: 1, nodes: 8, fanout: 64 },
        { level: 2, nodes: 512, fanout: 0 },
      ],
      cardinality: 50000,
      selectivity: 0.05,
      caption:
        'Illustrative backend key/revision tree — etcd is tuned for small keys and many revisions.',
      concepts: ['revisions', 'compaction', 'backend B+tree'],
      sourceRefs: [
        { label: 'etcd docs: Data model', href: 'https://etcd.io/docs/v3.5/learning/data_model/' },
      ],
    },
  ],
  sourceRefs: [
    { label: 'etcd docs', href: 'https://etcd.io/docs/' },
    {
      label: 'Ongaro & Ousterhout, Raft (In Search of an Understandable Consensus Algorithm)',
      href: 'https://raft.github.io/raft.pdf',
    },
    { label: 'etcd.io', href: 'https://etcd.io/' },
  ],
};
