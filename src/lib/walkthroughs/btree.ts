/**
 * btree -- B+ tree insertion with a node split, as a deterministic trace.
 *
 * Teaching model: an order-fixed B+ tree (max 3 keys per node) with the
 * classic two-level shape. The split follows B+ semantics: on overflow the
 * leaf splits and the *separator* (first key of the right leaf) is copied up
 * to the parent — unlike a B-tree, which moves the median key. Database
 * layout notes are in the exhibit, not here: PostgreSQL's nbtree and
 * WiredTiger both build B+ trees, but their page formats and concurrency
 * differ (see the exhibits' sourceRefs).
 *
 * Reference: Comer, "Ubiquitous B-Tree" (1979); PostgreSQL nbtree docs.
 */

import type { WtTrace } from './types';

export type BtreeVariant = 'insert-split' | 'search';

interface BtNode {
  id: string;
  keys: number[];
  leaf: boolean;
  children?: string[];
}

const BEFORE: Record<string, BtNode> = {
  root: { id: 'root', keys: [10, 20], leaf: false, children: ['l1', 'l2', 'l3'] },
  l1: { id: 'l1', keys: [2, 5, 8], leaf: true },
  l2: { id: 'l2', keys: [10, 12, 15], leaf: true },
  l3: { id: 'l3', keys: [20, 25, 30], leaf: true },
};

export function btreeTrace(variant: BtreeVariant = 'insert-split'): WtTrace {
  if (variant === 'search') {
    return {
      mode: 'btree-search',
      intro:
        'A point lookup in a B+ tree: descend from the root by key comparison, then scan one leaf. Every level touched is one page read in a real database.',
      steps: [
        {
          title: 'Start at root',
          note: 'Search for 12. The root holds separators [10, 20]; all routing happens here first.',
          reveal: ['wt-bt-cmp-root'],
        },
        {
          title: 'Compare at root',
          note: '12 ≥ 10 and 12 < 20, so the search takes the middle subtree. One comparison sequence, one child pointer.',
          reveal: ['wt-bt-path-l2'],
        },
        {
          title: 'Scan the leaf',
          note: 'Leaf L2 holds [10, 12, 15]. Scan finds 12 exactly — the tuple location is stored beside the key.',
          reveal: ['wt-bt-found'],
        },
        {
          title: 'Result',
          note: 'Height 2 ⇒ at most 2 pages touched (plus the root if cached). This logarithmic fanout is why B+ trees dominate disk indexes.',
          reveal: ['wt-bt-summary'],
        },
      ],
      summary: [
        ['comparisons', '3 (2 at root, 3 in leaf scan)'],
        ['pages touched', '2'],
        ['height', '2'],
      ],
    };
  }

  return {
    mode: 'btree-split',
    intro:
      'A B+ tree insert that overflows a leaf, with the resulting split. Teaching model: max 3 keys per node, two levels. On overflow the leaf splits and the separator (first key of the right leaf) is copied up — B+ behavior; a plain B-tree would move its median key instead.',
    steps: [
      {
        title: 'Insert 6 — route from root',
        note: '6 < 10 ⇒ the left leaf L1 [2, 5, 8] owns the range. Root keys are only routers.',
        reveal: ['wt-bt-cmp-root'],
      },
      {
        title: 'Insert into leaf',
        note: 'Leaf scan places 6 between 5 and 8. Sorted order inside the leaf keeps range scans sequential.',
        reveal: ['wt-bt-l1-before', 'wt-bt-l1-insert'],
      },
      {
        title: 'Overflow',
        note: '[2, 5, 6, 8] exceeds the 3-key capacity. The leaf must split.',
        reveal: ['wt-bt-overflow'],
      },
      {
        title: 'Split the leaf',
        note: 'Split at the midpoint: left keeps [2, 5], right takes [6, 8]. The leaf linked-list order is preserved.',
        reveal: ['wt-bt-split'],
      },
      {
        title: 'Copy separator up',
        note: 'The right leaf’s first key, 6, is copied into the parent as the new separator — data stays in the leaves; the root now routes [6, 10, 20].',
        reveal: ['wt-bt-root-after'],
      },
      {
        title: 'Result',
        note: 'Height unchanged at 2; only 3 nodes rewritten. Splits near the root are what grow a B+ tree; leaf splits are the common case.',
        reveal: ['wt-bt-summary'],
      },
    ],
    summary: [
      ['insert key', '6'],
      ['nodes rewritten', '3 (leaf, new leaf, root)'],
      ['height', '2 (unchanged)'],
      ['separator promoted', '6 (copied up — B+ rule)'],
    ],
  };
}

/** Initial (before) and final (after) node sets for the renderer. */
export function btreeRenderModel(): {
  before: BtNode[];
  after: BtNode[];
} {
  const after: Record<string, BtNode> = {
    root: { id: 'root2', keys: [6, 10, 20], leaf: false, children: ['n1', 'n2', 'l2', 'l3'] },
    n1: { id: 'n1', keys: [2, 5], leaf: true },
    n2: { id: 'n2', keys: [6, 8], leaf: true },
    l2: { id: 'l2', keys: [10, 12, 15], leaf: true },
    l3: { id: 'l3', keys: [20, 25, 30], leaf: true },
  };
  return {
    before: [BEFORE.root, BEFORE.l1, BEFORE.l2, BEFORE.l3],
    after: [after.root, after.n1, after.n2, after.l2, after.l3],
  };
}
