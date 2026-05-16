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
  tier: "core" | "faang-plus" | "quant";
  isNew?: boolean;
  kind?: "utility";
}

export const NODES: readonly DagNode[] = MODULES.map((m) => ({
  id: m.id,
  label: m.label ?? m.name,
  section: m.section,
  tier: m.tier,
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
  "2b": "Section 2B — Dynamic Programming",
  "2c": "Section 2C — Graphs",
  "2d": "Section 2D — Strings & Design",
  "2e": "Section 2E — FAANG+ Algorithms",
  "2f": "Section 2F — Quant Math",
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
  "2d": "#e8590c",
  "2e": "#7048e8",
  "2f": "#c2255c",
};

export interface Chunk {
  id: string;
  label: string;
  moduleIds: string[];        // ordered; at most 2
  tier: "core" | "faang-plus" | "quant";
}

export const CHUNKS: readonly Chunk[] = [
  // ── Core tier ────────────────────────────────────────────────────────────
  {
    id: "foundations",
    label: "Foundations",
    tier: "core",
    moduleIds: ["foundations"],
  },
  {
    id: "arrays",
    label: "Arrays & Hashing",
    tier: "core",
    moduleIds: ["arrays-hashing"],   // NeetCode root — alone
  },
  {
    id: "arrays-techniques",
    label: "Array Techniques",
    tier: "core",
    moduleIds: ["sorting", "prefix-sums"],  // foundational array ops
  },
  {
    id: "two-pointers-stack",
    label: "Two Pointers & Stack",
    tier: "core",
    moduleIds: ["two-pointers", "stack"],  // NeetCode L2
  },
  {
    id: "sliding-binary",
    label: "Sliding Window & Binary Search",
    tier: "core",
    moduleIds: ["sliding-window", "binary-search"],  // NeetCode L3
  },
  {
    id: "linked-list-mono",
    label: "Linked List & Monotonic",
    tier: "core",
    moduleIds: ["linked-list", "monotonic-stack"],  // NeetCode L3 + stack extension
  },
  {
    id: "bs-answer-mono-deque",
    label: "BS on Answer & Deque",
    tier: "core",
    moduleIds: ["bs-answer", "monotonic-deque"],
  },
  {
    id: "trees",
    label: "Trees",
    tier: "core",
    moduleIds: ["trees"],  // NeetCode L4 convergence — alone
  },
  {
    id: "tries-heap",
    label: "Tries & Heap",
    tier: "core",
    moduleIds: ["tries", "heap"],  // NeetCode L5
  },
  {
    id: "backtracking",
    label: "Backtracking",
    tier: "core",
    moduleIds: ["backtracking"],  // NeetCode L5 — AFTER trees
  },
  {
    id: "graphs-dp",
    label: "Graphs & DP Intro",
    tier: "core",
    moduleIds: ["graph-traversal", "dp-intro"],  // NeetCode L6
  },
  {
    id: "graph-extensions",
    label: "Graph Extensions",
    tier: "core",
    moduleIds: ["topo-sort", "union-find"],
  },
  {
    id: "dp-sequences",
    label: "DP Sequences",
    tier: "core",
    moduleIds: ["knapsack", "lis-lcs"],
  },
  {
    id: "shortest-dp-2d",
    label: "Shortest Paths & 2D DP",
    tier: "core",
    moduleIds: ["shortest-paths", "dp-2d"],
  },
  {
    id: "dp-trees-greedy",
    label: "DP Trees & Greedy",
    tier: "core",
    moduleIds: ["dp-trees", "greedy"],  // NeetCode L7
  },
  {
    id: "intervals-strings",
    label: "Intervals & Strings",
    tier: "core",
    moduleIds: ["intervals", "strings"],  // NeetCode L7
  },
  {
    id: "bit-manip-design",
    label: "Bit Manipulation & Design",
    tier: "core",
    moduleIds: ["bit-manip", "design"],  // NeetCode: bit-manip is LATE
  },
  // ── FAANG+ tier ──────────────────────────────────────────────────────────
  {
    id: "advanced-graphs",
    label: "Advanced Graphs",
    tier: "faang-plus",
    moduleIds: ["mst", "adv-graphs"],
  },
  {
    id: "range-ds",
    label: "Range DS",
    tier: "faang-plus",
    moduleIds: ["coord-comp", "sparse-table"],
  },
  {
    id: "advanced-dp",
    label: "Advanced DP",
    tier: "faang-plus",
    moduleIds: ["bitmask-dp", "interval-dp"],
  },
  {
    id: "fenwick",
    label: "Fenwick Tree",
    tier: "faang-plus",
    moduleIds: ["fenwick"],
  },
  {
    id: "seg-tree-geometry",
    label: "Seg Tree & Geometry",
    tier: "faang-plus",
    moduleIds: ["seg-tree", "geometry"],
  },
  // ── Quant tier ────────────────────────────────────────────────────────────
  {
    id: "number-combinatorics",
    label: "Number Theory & Combinatorics",
    tier: "quant",
    moduleIds: ["number-theory", "combinatorics"],
  },
  {
    id: "probability",
    label: "Probability",
    tier: "quant",
    moduleIds: ["probability"],
  },
  {
    id: "game-theory",
    label: "Game Theory",
    tier: "quant",
    moduleIds: ["game-theory"],
  },
];
