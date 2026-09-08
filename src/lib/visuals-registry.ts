/**
 * Kind metadata for visual modules.
 *
 * Kept side-effect free of any Astro component import so that vitest can
 * parse this file without dragging `.astro` files into vite's import-analysis
 * pipeline. The full `visuals.ts` re-exports the values below and adds the
 * `AstroComponent` registrations on top.
 */

export const VISUAL_KINDS = [
  'diagram',
  'pipeline',
  'page-microscope',
  'wal-timeline',
  'vector-index',
  'family-map',
  'legend',
  'gpu-scene',
] as const;

export type RegisteredVisualKind = (typeof VISUAL_KINDS)[number];

/** Legacy zero-prop diagram component names that the `kind: 'diagram'` shim routes by. */
export const LEGACY_DIAGRAM_NAMES = Object.freeze([
  'SqliteFileFormat',
  'MvccTimeline',
  'Replication',
  'VectorIndex',
] as const);

/** `true` if `kind` is one of the registered kinds. */
export function isRegisteredKind(kind: string): kind is RegisteredVisualKind {
  return (VISUAL_KINDS as readonly string[]).includes(kind);
}

/** Snapshot of the registered kinds for consumers that want a plain array. */
export function registeredKinds(): ReadonlyArray<string> {
  return [...VISUAL_KINDS];
}
