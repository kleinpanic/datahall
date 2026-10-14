/**
 * Invariant tests for the deterministic walkthrough traces. These traces are
 * the single source rendered by Walkthrough.astro (final state server-side,
 * replay client-side), so the tests pin the teaching model: deterministic
 * steps, non-empty narration, correct algorithmic outcomes, and inspectable
 * summaries.
 */
import { describe, expect, it } from 'vitest';
import { btreeTrace, btreeRenderModel } from '../../src/lib/walkthroughs/btree';
import { lsmTrace, lsmRenderModel } from '../../src/lib/walkthroughs/lsm';
import { mvccTrace } from '../../src/lib/walkthroughs/mvcc';
import { graphBfsTrace, GRAPH_NODES, GRAPH_EDGES } from '../../src/lib/walkthroughs/graph-bfs';
import { columnarTrace, columnarModel } from '../../src/lib/walkthroughs/columnar';
import type { WtTrace } from '../../src/lib/walkthroughs/types';

function expectSane(trace: WtTrace): void {
  expect(trace.steps.length).toBeGreaterThan(2);
  for (const step of trace.steps) {
    expect(step.title.length).toBeGreaterThan(2);
    expect(step.note.length).toBeGreaterThan(20);
    expect(Array.isArray(step.reveal)).toBe(true);
  }
  expect(trace.summary.length).toBeGreaterThan(0);
  expect(trace.intro.length).toBeGreaterThan(20);
}

describe('btree walkthrough', () => {
  it('insert-split: copies the separator up and reports the split', () => {
    const t = btreeTrace('insert-split');
    expectSane(t);
    expect(t.steps.map((s) => s.title)).toEqual(
      expect.arrayContaining(['Split the leaf', 'Copy separator up']),
    );
    const result = t.summary.find(([k]) => k === 'separator promoted');
    expect(result?.[1]).toContain('6');
    expect(t.mode).toBe('btree-split');
  });

  it('search: finds the key with a bounded page count', () => {
    const t = btreeTrace('search');
    expectSane(t);
    expect(t.steps).toHaveLength(4);
    const pages = t.summary.find(([k]) => k === 'pages touched');
    expect(pages?.[1]).toBe('2');
  });

  it('render model matches the described split', () => {
    const m = btreeRenderModel();
    expect(m.before).toHaveLength(4);
    expect(m.after).toHaveLength(5);
    const root = m.after.find((n) => n.id === 'root2');
    expect(root?.keys).toEqual([6, 10, 20]);
  });

  it('is deterministic', () => {
    expect(btreeTrace('insert-split')).toEqual(btreeTrace('insert-split'));
  });
});

describe('lsm walkthrough', () => {
  it('delete variant: tombstone shadows, compaction cleans up', () => {
    const t = lsmTrace('delete');
    expectSane(t);
    expect(t.steps).toHaveLength(10);
    const compact = t.steps.find((s) => s.title.startsWith('Compact'));
    expect(compact?.note).toContain('tombstone');
    expect(t.summary.some(([k]) => k === 'compaction dropped')).toBe(true);
  });

  it('overwrite variant: newest value shadows in-memory', () => {
    const t = lsmTrace('overwrite');
    expectSane(t);
    expect(t.steps).toHaveLength(6);
    expect(t.summary.some(([k, v]) => k.startsWith('lookup(a)') && v === '4')).toBe(true);
  });

  it('render model: memtable history and post-compaction L1', () => {
    const m = lsmRenderModel();
    expect(m.memInitial).toHaveLength(3);
    expect(m.runsInitial).toHaveLength(2);
    expect(m.l1Initial).toEqual(['e = 9']);
    expect(m.l1After).toEqual(['a = 1', 'b = 2', 'd = 4', 'e = 9']);
  });

  it('is deterministic', () => {
    expect(lsmTrace('delete')).toEqual(lsmTrace('delete'));
  });
});

describe('mvcc walkthrough', () => {
  it('crash-before-commit: aborted version never becomes visible', () => {
    const t = mvccTrace('crash-before-commit');
    expectSane(t);
    expect(t.steps).toHaveLength(5);
    const visible = t.summary.find(([k]) => k === 'visible after recovery');
    expect(visible?.[1]).toContain('100');
  });

  it('crash-after-commit: committed version survives recovery', () => {
    const t = mvccTrace('crash-after-commit');
    expectSane(t);
    expect(t.steps).toHaveLength(6);
    const visible = t.summary.find(([k]) => k === 'visible after recovery');
    expect(visible?.[1]).toContain('250');
    const rule = t.summary.find(([k]) => k === 'durability rule');
    expect(rule?.[1]).toContain('WAL');
  });

  it('is deterministic', () => {
    expect(mvccTrace('crash-after-commit')).toEqual(mvccTrace('crash-after-commit'));
  });
});

describe('graph BFS walkthrough', () => {
  it('target F: discovers in BFS order, finds a 3-hop path', () => {
    const t = graphBfsTrace('F');
    expectSane(t);
    // start + depth1 (B,C) + depth2 (D,E) + depth3 (F)
    expect(t.steps).toHaveLength(4);
    const path = t.summary.find(([k]) => k.startsWith('shortest path'));
    expect(path?.[1]).toContain('A→B→D→F');
    const visited = t.summary.find(([k]) => k === 'nodes visited');
    expect(visited?.[1]).toBe('6/6');
  });

  it('target E: finds the 2-hop path via C', () => {
    const t = graphBfsTrace('E');
    const path = t.summary.find(([k]) => k.startsWith('shortest path'));
    expect(path?.[1]).toContain('A→C→E');
  });

  it('graph constants are internally consistent', () => {
    expect(GRAPH_NODES).toHaveLength(6);
    expect(GRAPH_EDGES).toHaveLength(7);
    const ids = new Set(GRAPH_NODES.map((n) => n.id));
    for (const e of GRAPH_EDGES) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });

  it('is deterministic', () => {
    expect(graphBfsTrace('F')).toEqual(graphBfsTrace('F'));
  });
});

describe('columnar walkthrough', () => {
  it('range-filter: prunes granules, counts rows honestly', () => {
    const t = columnarTrace('range-filter');
    expectSane(t);
    expect(t.steps).toHaveLength(6);
    const skipped = t.summary.find(([k]) => k.startsWith('granules skipped'));
    expect(skipped?.[1]).toContain('5/8');
    const cells = t.summary.find(([k]) => k.startsWith('cells read'));
    expect(cells?.[1]).toContain('36');
    const rows = t.summary.find(([k]) => k === 'rows after predicate');
    expect(rows?.[1]).toBe('6');
  });

  it('full-scan variant: nothing skipped, everything read', () => {
    const t = columnarTrace('full-scan');
    expectSane(t);
    expect(t.steps).toHaveLength(5);
    const skipped = t.summary.find(([k]) => k.startsWith('granules skipped'));
    expect(skipped?.[1]).toContain('0/8');
    const rows = t.summary.find(([k]) => k === 'rows after predicate');
    expect(rows?.[1]).toBe('16');
  });

  it('model: granule day ranges tile the table', () => {
    const m = columnarModel('range-filter');
    expect(m.granuleDays[0]).toEqual([1, 4]);
    expect(m.granuleDays[7]).toEqual([29, 32]);
    expect(m.passingRows).toHaveLength(8);
  });

  it('is deterministic', () => {
    expect(columnarTrace('range-filter')).toEqual(columnarTrace('range-filter'));
  });
});
