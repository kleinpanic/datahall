/**
 * columnar -- columnar scan with pruning, predicate pushdown, aggregation.
 *
 * Teaching model: ClickHouse-flavored. A 4-column table stored as 8 granules
 * per column; the primary key (day) gives min/max per granule via the sparse
 * index. The trace shows column pruning (unread columns), data skipping
 * (granules pruned by key range), block-level predicate evaluation of a
 * non-key filter, and partial aggregation merged into the result. ClickHouse
 * specifics — sparse primary index (not a B-tree), granule size, per-part
 * parts, vectorized engine — are noted in the exhibit; the mechanics shown
 * are the general columnar execution model.
 *
 * Reference: ClickHouse docs — primary key/sparse index, granularity, and
 * the "Why is ClickHouse fast?" overview.
 */

import type { WtTrace } from './types';

export type ColumnarVariant = 'range-filter' | 'full-scan';

export interface ColumnarModel {
  columns: string[];
  granules: number;
  /** min/max day per granule (day as ordinal 1..32 for display). */
  granuleDays: Array<[number, number]>;
  /** rows passing the bytes > 1000 predicate per granule. */
  passingRows: number[];
  regions: string[];
}

export function columnarModel(variant: ColumnarVariant = 'range-filter'): ColumnarModel {
  // Granule g covers days [4g+1 .. 4g+4], g = 0..7 (32 rows total).
  const granuleDays: Array<[number, number]> = Array.from({ length: 8 }, (_, g) => [
    4 * g + 1,
    4 * g + 4,
  ]);
  const passingRows =
    variant === 'range-filter'
      ? // day >= 21 loads granules 5-7; bytes > 1000 passes 2 of 4 rows in each.
        [0, 0, 0, 0, 0, 2, 2, 2]
      : [2, 2, 2, 2, 2, 2, 2, 2];
  return {
    columns: ['day', 'user_id', 'region', 'bytes'],
    granules: 8,
    granuleDays,
    passingRows,
    regions: ['us', 'eu', 'ap'],
  };
}

export function columnarTrace(variant: ColumnarVariant = 'range-filter'): WtTrace {
  const filter = variant === 'range-filter';
  const model = columnarModel(variant);
  const skipped = filter ? 5 : 0;
  const loaded = model.granules - skipped;
  const rowsExamined = loaded * 4;
  const cellsRead = rowsExamined * 3; // day, region, bytes — user_id is never read
  const passing = model.passingRows.reduce((a, b) => a + b, 0);

  const steps: WtTrace['steps'] = [
    {
      title: 'Parse the query',
      note: 'SELECT region, sum(bytes) … WHERE day ≥ 21 AND bytes > 1000 GROUP BY region — only day, region, and bytes are referenced. user_id is never read: a row store would carry every column through the operator; here it costs zero bytes.',
      reveal: ['wt-col-prune'],
    },
  ];

  if (filter) {
    steps.push({
      title: 'Skip granules by primary key range',
      note: 'The sparse primary index stores min/max of day per granule. Granules covering days 1-20 cannot contain day ≥ 21: 5 of 8 granules are skipped without reading a single row — data skipping.',
      reveal: ['wt-col-skip'],
    });
  }

  steps.push(
    {
      title: `Read ${loaded} granules × 3 columns`,
      note: `Only referenced columns of surviving granules are read: ${rowsExamined} rows × day/region/bytes = ${cellsRead} cells (of ${32 * 4} in the table). Columnar layout makes each read a contiguous scan of one column’s block.`,
      reveal: ['wt-col-read'],
    },
    {
      title: 'Evaluate the predicate per block',
      note: filter
        ? 'bytes > 1000 is evaluated block-by-block (vectorized, not row-at-a-time): 6 of the 12 loaded rows pass into the aggregate. Note this filter is independent of the key — key ranges cannot prune it, only the block loop can.'
        : 'bytes > 1000 is evaluated over all 8 granules: 16 of 32 rows pass. Without a key filter nothing can be skipped — pruning is exactly what the primary key buys you.',
      reveal: ['wt-col-pred'],
    },
    {
      title: 'Aggregate by region',
      note: 'Each block produces partial sums per region; partial states merge up the pipeline. sum() is a mergeable aggregate, so blocks combine without re-touching rows.',
      reveal: ['wt-col-agg'],
    },
    {
      title: 'Output',
      note: `One row per region with its byte total. Rows examined ${rowsExamined}/32, granules skipped ${skipped}/${model.granules}, cells read ${cellsRead}, rows out: ${model.regions.length}.`,
      reveal: ['wt-col-out', 'wt-col-summary'],
    },
  );

  return {
    mode: 'columnar-scan',
    intro:
      'Columnar execution: column pruning, key-range granule skipping, block predicates, and mergeable aggregation — ClickHouse-flavored. Teaching model: 8 granules × 4 rows, one part; real engines run many parts with merges in the background and much larger granules.',
    steps,
    summary: [
      ['table', '32 rows × 4 columns'],
      ['granules skipped', `${skipped}/${model.granules} (primary key range)`],
      ['cells read', `${cellsRead} of ${32 * 4} (user_id never read)`],
      ['rows examined', `${rowsExamined}/32`],
      ['rows after predicate', `${passing}`],
      ['output rows', `${model.regions.length}`],
    ],
  };
}
