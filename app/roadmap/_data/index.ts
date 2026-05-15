// Aggregator: imports every module and exposes the derived collections used
// by the UI (NODES/EDGES/ORDER/PROBLEM_COUNTS). Edit per-module data in
// app/roadmap/_data/modules/*.ts — never edit the derived values directly.

import type { Module } from "./types";

import { foundations } from "./modules/01-foundations";
import { arraysHashing } from "./modules/02-arrays-hashing";
import { sorting } from "./modules/03-sorting";
import { prefixSums } from "./modules/04-prefix-sums";
import { twoPointers } from "./modules/05-two-pointers";
import { slidingWindow } from "./modules/06-sliding-window";
import { stack } from "./modules/07-stack";
import { monotonicStack } from "./modules/08-monotonic-stack";
import { monotonicDeque } from "./modules/09-monotonic-deque";
import { linkedList } from "./modules/10-linked-list";
import { binarySearch } from "./modules/11-binary-search";
import { bsAnswer } from "./modules/12-binary-search-answer";
import { backtracking } from "./modules/13-backtracking";
import { trees } from "./modules/14-trees";
import { tries } from "./modules/15-tries";
import { heap } from "./modules/16-heap";
import { greedy } from "./modules/17-greedy";
import { intervals } from "./modules/18-intervals";
import { graphTraversal } from "./modules/19-graph-traversal";
import { topoSort } from "./modules/20-topological-sort";
import { unionFind } from "./modules/21-union-find";
import { shortestPaths } from "./modules/22-shortest-paths";
import { mst } from "./modules/23-mst";
import { advGraphs } from "./modules/24-advanced-graphs";
import { dpIntro } from "./modules/25-dp-intro";
import { dp2d } from "./modules/26-dp-2d";
import { knapsack } from "./modules/27-knapsack";
import { lisLcs } from "./modules/28-lis-lcs";
import { dpTrees } from "./modules/29-dp-trees";
import { bitManip } from "./modules/30-bit-manip";
import { bitmaskDp } from "./modules/31-bitmask-dp";
import { intervalDp } from "./modules/32-interval-dp";
import { coordComp } from "./modules/33-coord-comp";
import { sparseTable } from "./modules/34-sparse-table";
import { fenwick } from "./modules/35-fenwick";
import { segTree } from "./modules/36-seg-tree";
import { numberTheory } from "./modules/37-number-theory";
import { combinatorics } from "./modules/38-combinatorics";
import { probability } from "./modules/39-probability";
import { geometry } from "./modules/40-geometry";
import { gameTheory } from "./modules/41-game-theory";
import { strings } from "./modules/42-strings";
import { design } from "./modules/43-design";

export const MODULES: readonly Module[] = [
  foundations, arraysHashing, sorting, prefixSums, bitManip,
  twoPointers, slidingWindow, stack, monotonicStack, monotonicDeque,
  linkedList, binarySearch, bsAnswer, backtracking, trees,
  tries, heap, greedy, intervals, dpIntro,
  knapsack, lisLcs, dpTrees, graphTraversal, topoSort,
  unionFind, shortestPaths, mst, advGraphs, dp2d,
  bitmaskDp, intervalDp, coordComp, sparseTable, fenwick,
  segTree, numberTheory, combinatorics, probability, geometry,
  gameTheory, strings, design,
];

export const MODULES_BY_ID: Readonly<Record<string, Module>> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

// ── Derived DAG data ────────────────────────────────────────────────────────
// Anything below is computed from MODULES; do not hand-edit.

export interface DagNode {
  id: string;
  label: string;
  section: string;
  track: "both" | "interview" | "cp";
  isNew?: boolean;
  kind?: "utility";
}

export const NODES: readonly DagNode[] = MODULES.map((m) => ({
  id: m.id,
  label: m.label ?? m.name,
  section: m.section,
  track: m.track,
  ...(m.isNew ? { isNew: true as const } : {}),
  ...(m.isUtility ? { kind: "utility" as const } : {}),
}));

export const EDGES: readonly [string, string][] = MODULES.flatMap((m) =>
  m.prereqIds.map((p) => [p, m.id] as [string, string]),
);

export const ORDER: Readonly<Record<string, number>> = Object.fromEntries(
  MODULES.map((m) => [m.id, m.order]),
);

export const PROBLEM_COUNTS: Readonly<Record<string, number>> = Object.fromEntries(
  MODULES.flatMap((m) => {
    if (m.problems) return [[m.id, m.problems.length] as const];
    if (m.checklist) return [[m.id, m.checklist.length] as const];
    return [];
  }),
);

// ── Section presentation ────────────────────────────────────────────────────

export const SECTION_NAMES: Readonly<Record<string, string>> = {
  "0":  "Foundations",
  "1a": "Section 1A — Linear DS & Bit",
  "1b": "Section 1B — Scanning Techniques",
  "1c": "Section 1C — Search & Decision",
  "1d": "Section 1D — Recursion, Trees & Heap",
  "2a": "Section 2A — Greedy & Intervals",
  "2b": "Section 2B — DP Fundamentals",
  "2c": "Section 2C — Graphs",
  "2d": "Section 2D — DP Advanced",
  "2e": "Section 2E — Advanced Data Structures",
  "2f": "Section 2F — Math",
  "2g": "Section 2G — Strings",
  "2h": "Section 2H — Design & OOD",
};

export const SECTION_COLORS: Readonly<Record<string, string>> = {
  "0":  "#6741d9",
  "1a": "#3b5bdb",
  "1b": "#4263eb",
  "1c": "#5c7cfa",
  "1d": "#748ffc",
  "2a": "#2f9e44",
  "2b": "#fab005",
  "2c": "#0891b2",
  "2d": "#c07a00",
  "2e": "#7048e8",
  "2f": "#c2255c",
  "2g": "#0c8599",
  "2h": "#e8590c",
};
