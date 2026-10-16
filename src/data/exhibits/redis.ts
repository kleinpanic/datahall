import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'redis',
  name: 'Redis',
  tagline: 'An in-memory data-structure server: strings, sets, hashes, sorted sets, streams.',
  summary:
    'Redis keeps every value in memory as one of several purpose-built data structures and answers commands on a single thread. Persistence is optional and log-structured: an append-only file of write commands plus point-in-time RDB snapshots. Sorted sets are skip lists — the same probabilistic structure LSM memtables use.',
  paradigm: 'client-server',
  concurrency: 'single-writer-mvcc',
  storage: 'log-structured',
  families: ['key-value'],
  deploymentModel: 'client-server',
  storageEngines: ['log-structured'],
  indexTypes: ['hash'],
  workloads: ['oltp', 'hybrid'],
  language: 'C',
  initialRelease: 2009,
  license: 'RSALv2 / SSPLv1',
  accent: '#ff5d8f',
  highlights: [
    { label: 'Model', value: 'in-memory data structures' },
    { label: 'Execution', value: 'single-threaded command loop' },
    { label: 'Persistence', value: 'AOF log + RDB snapshots' },
    { label: 'ZSET', value: 'skip list + hash, dual-encoded' },
  ],
  features: [
    {
      title: 'Purpose-built structures',
      detail:
        'Strings, lists, sets, hashes, sorted sets, streams: each command is O(1) or O(log N) against a structure designed for it, instead of rows in a general engine.',
    },
    {
      title: 'AOF + RDB persistence',
      detail:
        'The append-only file records every write command; RDB snapshots dump a point-in-time binary image. Redis rewrites the AOF compactly in the background.',
    },
    {
      title: 'Single-threaded core',
      detail:
        'Commands execute on one thread — no locks, no context switches per key. I/O and slow operations are the scaling limits, not contention.',
    },
    {
      title: 'Sorted sets are skip lists',
      detail:
        'ZSET encodes members in a skip list ordered by score plus a hash map for O(1) score lookup — the same probabilistic structure LSM memtables use.',
    },
  ],
  sections: [
    {
      heading: 'Data structures, not tables',
      paragraphs: [
        'A Redis key maps to one typed structure. A leaderboard is a sorted set (a skip list plus a hash); a queue is a list; a rate limiter is a counter on a string. Choosing the structure is the schema design — the server exposes operations on the structure itself, not a query language.',
        'Because everything lives in memory and commands run single-threaded, latency is predictable to the microsecond. The engine is deliberately not a database of record: durability comes from the persistence settings you choose, and datasets must fit (or be sharded) in RAM.',
      ],
      code: 'ZADD leaderboard 950 "ann" 870 "bob"\nZINCRBY leaderboard 10 "ann"\nZRANGE leaderboard 0 2 REV WITHSCORES',
      codeLanguage: 'redis',
    },
    {
      heading: 'Durability is a dial, not a default',
      paragraphs: [
        'AOF every-command fsync is the safest and slowest setting; everysec trades one second of loss for throughput; RDB alone can lose everything since the last snapshot. Replicas and Redis Sentinel or Cluster turn that dial into a failover story.',
        'The walkthrough below shows the skip list that powers sorted sets: level-by-level search, a coin-flip node height, and pointer swaps instead of tree rotations.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: command → event loop → memory → AOF append',
      description:
        'A command executes on the single-threaded event loop, mutates the in-memory structure, and appends to the AOF. RDB snapshots fork the process for point-in-time images.',
      caption: 'No query planner, no pages: the structure IS the index.',
      concepts: ['event loop', 'AOF', 'RDB', 'in-memory'],
      sourceRefs: [
        {
          label: 'Redis docs: Persistence',
          href: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'skiplist-memtable',
      variant: 'alt',
      title: 'Skip lists: how sorted sets stay ordered',
      description:
        'Search and insert in the skip list behind ZSET: greedy hops on high levels, a coin-flip node height, and pointer swaps instead of rotations.',
      caption:
        'Same structure LSM memtables use — Redis uses it as the live sorted-set index, not a staging buffer.',
      concepts: ['skip list', 'sorted set', 'probabilistic height'],
      sourceRefs: [
        {
          label: 'Redis docs: Sorted sets',
          href: 'https://redis.io/docs/latest/develop/data-types/sorted-sets/',
        },
      ],
    },
  ],
  sourceRefs: [
    { label: 'Redis docs: Data types', href: 'https://redis.io/docs/latest/develop/data-types/' },
    {
      label: 'Redis docs: Persistence',
      href: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/',
    },
    { label: 'redis.io', href: 'https://redis.io/' },
  ],
};
