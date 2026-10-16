import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'foundationdb',
  name: 'FoundationDB',
  tagline: 'A deterministic distributed key-value store proven by simulation before it ever ships.',
  summary:
    'FoundationDB is an unbundled distributed key-value store: a transaction system, a distributed log, and stateless storage engines, each tested separately. Every feature is validated in a deterministic simulation environment where injected faults run thousands of times faster than real time — the reason its correctness claims carry unusual weight.',
  paradigm: 'server',
  concurrency: 'mvcc',
  storage: 'log-structured',
  families: ['key-value'],
  deploymentModel: 'server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['hash'],
  workloads: ['oltp'],
  language: 'Flow / C++',
  initialRelease: 2018,
  license: 'Apache-2.0',
  accent: '#ff6b4a',
  highlights: [
    { label: 'Design', value: 'unbundled: transaction/log/storage' },
    { label: 'Testing', value: 'deterministic simulation, fault-injected' },
    { label: 'Semantics', value: 'strictly serializable MVCC' },
    { label: 'Layers', value: 'KV core, layers build the rest' },
  ],
  features: [
    {
      title: 'Deterministic simulation',
      detail:
        'A single-threaded deterministic core means any bug reproduces exactly. Simulation injects disk failures, network partitions, and reboots at millions-of-times speed — features ship only after surviving it.',
    },
    {
      title: 'Unbundled architecture',
      detail:
        'GrvProxy (transactions), TLog (durable log), StorageServer (data): independent processes scaled independently. The commit path is a distributed log, storage is an LSM.',
    },
    {
      title: 'Strictly serializable MVCC',
      detail:
        'Reads use a cached version guaranteeing a consistent snapshot; writes conflict-detect at commit via a dependency-tracking log prefix.',
    },
    {
      title: 'Layers on a small core',
      detail:
        'The core is deliberately tiny (ordered KV, watch, transactions). Document stores, queues, indexes — everything else is a layer built on that API.',
    },
  ],
  sections: [
    {
      heading: 'Simulation before implementation',
      paragraphs: [
        'FoundationDB legacy design runs the entire cluster in a single process with deterministic execution: same inputs, same decisions, same bugs — reproducibly. Fault injection then explores failure space orders of magnitude faster than real time.',
        'The famous result: when Apple acquired the company, the database survived a datacenter migration with no data loss — correctness claims backed by the simulation record.',
      ],
      code: '// Layer example: a document store on the KV API\nSET ("doc/42/title", "LSM trees")\nSET ("doc/42/tags", ["lsm", "storage"])\nGET ("doc/42/")  // range read: all keys under doc/42',
      codeLanguage: 'text',
    },
    {
      heading: 'The commit path',
      paragraphs: [
        'A transaction reads at a grv version, buffers writes, then commits: the sequencer assigns a commit version, the mutation lands in the distributed TLog, storage servers pull mutations from the log. Durability = log quorum; storage catches up asynchronously.',
        'The walkthrough below shows the same MVCC commit/crash loop on a single node — FDB distributes that exact rule across its log and storage processes.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Commit path: grv read version → mutations → TLog quorum → storage pull',
      description:
        'Transactions read at a cluster-managed version, buffer mutations, and commit through the distributed transaction log; storage servers apply mutations asynchronously.',
      caption: 'Unbundled: proxies, logs, and storage scale independently.',
      concepts: ['grv version', 'TLog quorum', 'deterministic recovery'],
      sourceRefs: [
        {
          label: 'FoundationDB: Architecture doc',
          href: 'https://apple.github.io/foundationdb/architecture.html',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'mvcc-commit',
      variant: 'alt',
      title: 'MVCC commit and crash recovery, traced',
      description:
        'Version visibility, the durable commit boundary, and replay — the exact rule FoundationDB enforces across its distributed log.',
      caption:
        'Single-node trace of a distributed rule: FDB runs it per TLog with deterministic recovery.',
      concepts: ['MVCC', 'commit boundary', 'replay'],
      sourceRefs: [
        {
          label: 'FoundationDB docs: Transactions',
          href: 'https://apple.github.io/foundationdb/transactions.html',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'FoundationDB docs: Architecture',
      href: 'https://apple.github.io/foundationdb/architecture.html',
    },
    {
      label: 'Zhou et al. (2021), FoundationDB — A Distributed Unbundled Transaction System',
      href: 'https://www.foundationdb.org/files/fdb-paper-snapshot-v1.pdf',
    },
    { label: 'foundationdb.org', href: 'https://www.foundationdb.org/' },
  ],
};
