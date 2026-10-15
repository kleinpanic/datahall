/**
 * bloom -- Bloom filter membership as a deterministic trace.
 *
 * Teaching model: a 24-bit array with k=3 hash functions over a small id
 * space. The trace inserts three elements, shows a true hit, a clean
 * absence, and a genuine false positive (found by deterministic search over
 * the id space), then reports the classical false-positive rate
 * (1 - e^{-kn/m})^k. Bloom filters answer "definitely not present" vs
 * "possibly present" — the absence guarantee is exact, the presence answer
 * is probabilistic. RocksDB keeps one per SST to skip files that cannot
 * contain a key (see the RocksDB exhibit).
 *
 * Reference: Bloom (1970), "Space/Time Trade-offs in Hash Coding with
 * Allowable Errors"; rocksdb.org wiki, Bloom filters.
 */

import type { WtTrace } from './types';

export const BLOOM_BITS = 24;
export const BLOOM_K = 3;

/** Deterministic, display-friendly hash family: h_i = (a_i * id + b_i) mod m. */
const HASHES: Array<[number, number]> = [
  [5, 3],
  [11, 7],
  [17, 11],
];

export function bloomHash(index: number, id: number): number {
  const [a, b] = HASHES[index]!;
  return (a * id + b) % BLOOM_BITS;
}

export function bloomBits(id: number): number[] {
  return HASHES.map((_, i) => bloomHash(i, id));
}

const INSERTED = [1, 4, 6];

/** The bit array after all insertions. */
export function bloomState(): boolean[] {
  const bits = new Array<boolean>(BLOOM_BITS).fill(false);
  for (const id of INSERTED) for (const b of bloomBits(id)) bits[b] = true;
  return bits;
}

/** Smallest id not inserted whose bits are all set — a real false positive. */
export function findFalsePositive(): number {
  const bits = bloomState();
  const inserted = new Set(INSERTED);
  for (let id = 0; id < 64; id++) {
    if (inserted.has(id)) continue;
    if (bloomBits(id).every((b) => bits[b])) return id;
  }
  throw new Error('no false positive found for the fixed model — adjust hashes');
}

export function falsePositiveRate(n: number, k = BLOOM_K, m = BLOOM_BITS): number {
  return (1 - Math.exp((-k * n) / m)) ** k;
}

export type BloomVariant = 'membership' | 'insert-only';

export function bloomTrace(variant: BloomVariant = 'membership'): WtTrace {
  const state = bloomState();
  const bitsOf = (id: number) => bloomBits(id);
  const revealBits = (id: number, prefix: string) => bitsOf(id).map((b) => `${prefix}-${b}`);

  const steps: WtTrace['steps'] = [];

  for (const [n, id] of INSERTED.entries()) {
    const bits = bitsOf(id);
    steps.push({
      title: `insert(${id}) — set ${bits.length} bits`,
      note: `Three hash functions map ${id} to bits {${bits.join(', ')}}. No element is ever stored — only the bit pattern. Writes touch exactly k=${BLOOM_K} bits regardless of how many elements are in the filter.`,
      reveal: revealBits(id, `wt-bf-ins-${n}`),
    });
  }

  const fp = findFalsePositive();
  const lookups: Array<{ id: number; kind: 'hit' | 'clean' | 'fp'; key: string }> = [
    { id: 4, kind: 'hit', key: 'wt-bf-hit' },
    { id: 7, kind: 'clean', key: 'wt-bf-clean' },
  ];
  if (variant === 'membership') lookups.push({ id: fp, kind: 'fp', key: 'wt-bf-fp' });

  for (const { id, kind, key } of lookups) {
    const bits = bitsOf(id);
    const allSet = bits.every((b) => state[b]);
    if (kind === 'hit') {
      steps.push({
        title: `lookup(${id}) — all bits set: possibly present`,
        note: `Hashes to {${bits.join(', ')}} — every bit is 1, so the filter says "possibly present". The data file is opened and checked for real. This one IS present (inserted earlier).`,
        reveal: [key, ...revealBits(id, 'wt-bf-hit-bit')],
      });
    } else if (kind === 'clean') {
      const unset = bits.find((b) => !state[b])!;
      steps.push({
        title: `lookup(${id}) — a zero bit: definitely absent`,
        note: `Hashes to {${bits.join(', ')}} — bit ${unset} is 0, and a set bit can never be cleared by an insert. The filter answers "definitely NOT present" with certainty: no disk read happens at all.`,
        reveal: [key, ...revealBits(id, 'wt-bf-clean-bit')],
      });
    } else {
      steps.push({
        title: `lookup(${id}) — false positive: never inserted, all bits set`,
        note: `Every hashed bit happens to be 1 from OTHER elements — a false positive. The engine pays one unnecessary read. This is the bloom filter's only error mode: it never misses a present element, but it sometimes says "maybe" for absent ones.`,
        reveal: [key, ...revealBits(id, 'wt-bf-fp-bit')],
      });
    }
  }

  const rate = falsePositiveRate(INSERTED.length);
  steps.push({
    title: 'Result: the tradeoff in numbers',
    note: `With n=${INSERTED.length} elements, k=${BLOOM_K} hashes, m=${BLOOM_BITS} bits: false-positive rate ≈ ${(rate * 100).toFixed(1)}%. Size the bit array up and the rate falls exponentially — which is why RocksDB picks 10 bits per key (~1%) by default.`,
    reveal: ['wt-bf-summary'],
  });

  return {
    mode: 'bloom-filter',
    intro:
      'A Bloom filter: k hash functions over a fixed bit array. Insertions set bits; lookups check bits. Absence is certain, presence is probabilistic — the visible false positive is the entire tradeoff. RocksDB keeps one per SST file so reads skip whole files that cannot contain the key.',
    steps,
    summary: [
      ['bit array', `${BLOOM_BITS} bits, k=${BLOOM_K} hashes`],
      ['inserted', `${INSERTED.length} elements → ${state.filter(Boolean).length} bits set`],
      ['false positives', `possible (example: id ${fp})`],
      ['false negatives', 'impossible — set bits are never cleared'],
      ['FPR formula', '(1 − e^(−kn/m))^k'],
    ],
  };
}
