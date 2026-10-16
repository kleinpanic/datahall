/**
 * inverted -- inverted index build and query as a deterministic trace.
 *
 * Teaching model: four documents, four analyzed terms, postings lists of
 * document ids. The trace builds the index (term → doc list), then runs a
 * two-term AND query: fetch both postings, intersect, rank. Unlike bloom
 * filters, an inverted index is EXACT — no false positives, no false
 * negatives. This is the structure behind every search engine's text index
 * (see the Elasticsearch exhibit: Lucene stores one postings list per
 * analyzed term per segment).
 *
 * Reference: Zobel & Moffat (2006), "Inverted Files for Text Search
 * Engines"; elastic.co guide, Lucene inverted index.
 */

import type { WtTrace } from './types';

export const II_DOCS = ['d1', 'd2', 'd3', 'd4', 'd5'];
export const II_TERMS: Record<string, string[]> = {
  wired: ['d1', 'd3'],
  tiger: ['d1', 'd2'],
  lsm: ['d3', 'd5'],
  merge: ['d2'],
};

export function invertedPostings(): Array<{ term: string; docs: string[] }> {
  return Object.entries(II_TERMS).map(([term, docs]) => ({ term, docs }));
}

/** Sorted intersection of two postings lists (the AND operation). */
export function intersect(a: string[], b: string[]): string[] {
  return a.filter((d) => b.includes(d));
}

export function invertedTrace(query: [string, string] = ['wired', 'lsm']): WtTrace {
  const [qa, qb] = query;
  const pa = II_TERMS[qa];
  const pb = II_TERMS[qb];
  const result = intersect(pa, pb);

  const steps: WtTrace['steps'] = [];

  for (const [term, docs] of Object.entries(II_TERMS)) {
    steps.push({
      title: `index "${term}" → [${docs.join(', ')}]`,
      note: `The analyzer tokenizes document text into normalized terms; the index stores one postings list per term pointing at the documents that contain it. Built once at write time — search never scans documents.`,
      reveal: docs.map((d) => `wt-ii-post-${term}-${d}`),
    });
  }

  steps.push({
    title: `Query "${qa} ${qb}" — tokenize to two terms`,
    note: `The same analyzer runs on the query: two terms, each with its own postings list. The AND in the query means: a document must appear in BOTH lists.`,
    reveal: [`wt-ii-q-${qa}`, `wt-ii-q-${qb}`],
  });

  steps.push({
    title: `Fetch postings: [${pa.join(', ')}] ∩ [${pb.join(', ')}]`,
    note: `Both lists are already sorted, so the intersection walks them side by side — candidate sets shrink with every term added. Only ${result.length} of the ${new Set([...pa, ...pb]).size} candidate ids survive.`,
    reveal: ['wt-ii-fetch-a', 'wt-ii-fetch-b'],
  });

  steps.push({
    title: `Intersection → ${result.join(', ')}`,
    note: `Documents appearing in both postings answer the AND exactly. No false positives, no false negatives — unlike bloom filters, this is a precise membership structure.`,
    reveal: result.map((d) => `wt-ii-hit-${d}`),
  });

  steps.push({
    title: 'Rank and return',
    note: `Postings carry scores (term frequency, field length); ranking sorts the exact matches. Search answered without opening a single source document — that is why search engines lead with the index.`,
    reveal: ['wt-ii-summary'],
  });

  return {
    mode: 'inverted-index',
    intro:
      'An inverted index: terms in, document lists out. The trace builds four postings lists, then answers a two-term AND query by sorted intersection — exact matches only. This is the core structure of the search family (Lucene keeps one per analyzed field per segment).',
    steps,
    summary: [
      ['structure', 'term → sorted postings list'],
      ['AND query', 'sorted-list intersection'],
      ['exactness', 'no false positives or negatives'],
      ['built', 'once at write time, by the analyzer'],
    ],
  };
}
