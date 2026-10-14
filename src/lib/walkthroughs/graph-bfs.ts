/**
 * graph-bfs -- breadth-first traversal over a small directed property graph.
 *
 * Teaching model: six nodes, deterministic adjacency order, FIFO frontier.
 * Neo4j-flavored in the exhibit (Cypher variable-length paths compile to
 * traversals like this, and direction is a first-class part of every hop),
 * but the algorithm itself is graph-generic. BFS on an unweighted graph
 * discovers nodes in shortest-hop order — that property is the point of
 * step 5.
 *
 * Reference: Cypher docs (MATCH path semantics); any algorithms text for BFS.
 */

import type { WtTrace } from './types';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}
export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export const GRAPH_NODES: GraphNode[] = [
  { id: 'A', label: 'Person A', x: 0.12, y: 0.5 },
  { id: 'B', label: 'Person B', x: 0.38, y: 0.22 },
  { id: 'C', label: 'Person C', x: 0.38, y: 0.78 },
  { id: 'D', label: 'Post D', x: 0.64, y: 0.3 },
  { id: 'E', label: 'Group E', x: 0.64, y: 0.72 },
  { id: 'F', label: 'Comment F', x: 0.9, y: 0.5 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', label: 'KNOWS' },
  { from: 'A', to: 'C', label: 'KNOWS' },
  { from: 'B', to: 'D', label: 'POSTED' },
  { from: 'C', to: 'D', label: 'LIKES' },
  { from: 'C', to: 'E', label: 'JOINED' },
  { from: 'D', to: 'F', label: 'HAS' },
  { from: 'E', to: 'F', label: 'HAS' },
];

const ADJ: Record<string, string[]> = (() => {
  const adj: Record<string, string[]> = {};
  for (const e of GRAPH_EDGES) (adj[e.from] ??= []).push(e.to);
  return adj;
})();

const EDGE_IDX = new Map<string, number>(GRAPH_EDGES.map((e, i) => [`${e.from}->${e.to}`, i]));

export type BfsTarget = 'F' | 'E';

export function graphBfsTrace(target: BfsTarget = 'F'): WtTrace {
  const start = 'A';
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();
  let frontier = [start];
  const steps: WtTrace['steps'] = [];
  let edgesExamined = 0;
  let depth = 0;

  steps.push({
    title: `Start at ${start}`,
    note: `The traversal begins at ${start}. Frontier = {${start}}, visited = {${start}}. Direction matters: only outgoing relationships (FOLLOWS →) are walkable.`,
    reveal: ['wt-g-node-A', 'wt-g-front-A'],
  });

  let pathFound: string[] | null = null;
  while (frontier.length > 0 && !pathFound) {
    depth++;
    const next: string[] = [];
    const hopEdges: string[] = [];
    const skipped: string[] = [];
    for (const u of frontier) {
      for (const v of ADJ[u] ?? []) {
        edgesExamined++;
        const ek = EDGE_IDX.get(`${u}->${v}`)!;
        if (visited.has(v)) {
          skipped.push(`${ek}`);
          continue;
        }
        visited.add(v);
        parent.set(v, u);
        hopEdges.push(`${ek}`);
        next.push(v);
        if (v === target) {
          pathFound = [v];
          let p = u;
          while (p !== start) {
            pathFound.unshift(p);
            p = parent.get(p)!;
          }
          pathFound.unshift(start);
        }
      }
    }
    const layer = [...next];
    steps.push({
      title: `Depth ${depth}: expand {${frontier.join(', ')}}`,
      note:
        next.length > 0
          ? `FIFO order: each frontier node's outgoing edges are examined; newly discovered nodes join the next frontier. Examined ${hopEdges.length + skipped.length} edges this layer, skipped ${skipped.length} to already-visited nodes — a node is enqueued once, which is what makes BFS terminate on cyclic graphs.`
          : `Frontier exhausted: all reachable nodes visited.`,
      reveal: [
        ...hopEdges.map((e) => `wt-g-edge-${e}`),
        ...layer.map((n) => `wt-g-node-${n}`),
        ...layer.map((n) => `wt-g-front-${n}`),
      ],
    });
    frontier = layer;
  }

  const pathStr = pathFound ? pathFound.join('→') : 'unreachable';
  return {
    mode: 'graph-bfs',
    intro:
      'Breadth-first traversal from A with directed edges and a FIFO frontier. Teaching model: generic BFS over 6 nodes; the Neo4j exhibit maps it to Cypher variable-length MATCH, where relationship direction and traversal limits are part of the query.',
    steps,
    summary: [
      ['nodes visited', `${visited.size}/${GRAPH_NODES.length}`],
      ['edges examined', `${edgesExamined}/${GRAPH_EDGES.length}`],
      ['shortest path to ' + target, `${pathStr} (${pathFound ? pathFound.length - 1 : '∞'} hops)`],
      ['terminates on cycles', 'visited-set check — each node enqueued once'],
    ],
  };
}
