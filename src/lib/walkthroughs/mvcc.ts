/**
 * mvcc -- PostgreSQL-flavored transaction visibility, WAL commit, crash recovery.
 *
 * Teaching model, stated explicitly: a simplified version chain (xmin-only)
 * with snapshot rules, a WAL strip, and a replay-based recovery. Real
 * PostgreSQL adds xmax, clog/commit status, hint bits, and checkpoint
 * semantics — see the PostgreSQL exhibit's sourceRefs (MVCC ch. 73,
 * WAL ch. 30 of the current docs). The invariant shown here is the one that
 * matters most: a transaction is durable only after its commit record has
 * been flushed to WAL; recovery replays the log to that point.
 *
 * Reference: PostgreSQL documentation — MVCC (ch. 73) and Reliability & WAL.
 */

import type { WtTrace } from './types';

export type MvccVariant = 'crash-before-commit' | 'crash-after-commit';

export function mvccTrace(variant: MvccVariant = 'crash-before-commit'): WtTrace {
  const steps: WtTrace['steps'] = [
    {
      title: 'Tx A: UPDATE balance 100 → 250',
      note: 'A new version (v2, xmin = 100) is written and chained; v1 is marked dead-upon-A’s-commit. Nothing in place is overwritten — writers never block readers.',
      reveal: ['wt-mv-v2'],
    },
    {
      title: 'Reader B (old snapshot) still sees 100',
      note: 'B’s snapshot was taken before A ran. xmin = 100 is in progress ⇒ v2 is invisible to B; it follows the chain to v1 (100). Repeatable reads in action.',
      reveal: ['wt-mv-readerB'],
    },
  ];

  if (variant === 'crash-before-commit') {
    steps.push(
      {
        title: 'Crash before the commit record',
        note: 'A’s WAL records exist, but the commit record was never written or flushed. Durability is defined by that record — without it, A never happened.',
        reveal: ['wt-mv-crash'],
      },
      {
        title: 'Recovery replays WAL to the last commit',
        note: 'On restart, WAL is replayed up to the last committed record. A’s half-written v2 has no commit ⇒ treated as aborted; v1 (100) is the visible state.',
        reveal: ['wt-mv-recovery'],
      },
      {
        title: 'Reader C sees 100 again',
        note: 'Aborted xids are invisible to every snapshot. Atomicity came from the commit boundary, not from undoing pages.',
        reveal: ['wt-mv-readerC-abort'],
      },
    );
    return {
      mode: 'mvcc-commit',
      intro:
        'Transaction visibility, the WAL commit boundary, and crash recovery — PostgreSQL-flavored. Simplified: xmin-only version chains, no xmax/clog details; the durable rule shown here is exact: a transaction exists only once its commit record is flushed to WAL.',
      steps,
      summary: [
        ['visible after recovery', 'v1 (balance 100)'],
        ['v2 (250)', 'aborted — never committed'],
        ['WAL replay stop point', 'last committed record'],
        ['durability rule', 'commit waits for WAL flush'],
      ],
    };
  }

  steps.push(
    {
      title: 'A commits — WAL flushed first',
      note: 'The commit record is appended and flushed to WAL; only then does the client get acknowledgment. Data pages may not even be written yet.',
      reveal: ['wt-mv-commit'],
    },
    {
      title: 'Crash after the commit',
      note: 'The process dies before any checkpoint. The WAL is the truth: committed work survives, uncommitted tails are discarded.',
      reveal: ['wt-mv-crash'],
    },
    {
      title: 'Recovery replays to the commit record',
      note: 'Replay restores v2 (250). A committed transaction cannot be lost — this is the durability half of ACID, paid for at commit latency.',
      reveal: ['wt-mv-recovery'],
    },
    {
      title: 'Reader C (new snapshot) sees 250',
      note: 'Snapshots taken after the commit see v2; v1 is now a dead tuple that VACUUM will reclaim later.',
      reveal: ['wt-mv-readerC-commit'],
    },
  );
  return {
    mode: 'mvcc-commit',
    intro:
      'Transaction visibility, the WAL commit boundary, and crash recovery — PostgreSQL-flavored. Simplified: xmin-only version chains, no xmax/clog details; the durable rule shown here is exact: a transaction exists only once its commit record is flushed to WAL.',
    steps,
    summary: [
      ['visible after recovery', 'v2 (balance 250)'],
      ['v1 (100)', 'dead tuple — reclaimed by VACUUM'],
      ['WAL replay stop point', 'A’s flushed commit record'],
      ['durability rule', 'commit waits for WAL flush'],
    ],
  };
}
