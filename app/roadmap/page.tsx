"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PROBLEM_COUNTS } from "./_lib/problem-counts";

const MODULE_PAGES: Record<string, string> = {
  "foundations":     "/roadmap/foundations",
  "arrays-hashing":  "/roadmap/arrays-hashing",
  "sorting":         "/roadmap/sorting",
  "prefix-sums":     "/roadmap/prefix-sums",
  "two-pointers":    "/roadmap/two-pointers",
  "sliding-window":  "/roadmap/sliding-window",
  "stack":           "/roadmap/stack",
  "monotonic-stack": "/roadmap/monotonic-stack",
  "monotonic-deque": "/roadmap/monotonic-deque",
  "linked-list":     "/roadmap/linked-list",
  "binary-search":   "/roadmap/binary-search",
  "bs-answer":       "/roadmap/bs-answer",
  "backtracking":    "/roadmap/backtracking",
  "trees":           "/roadmap/trees",
  "tries":           "/roadmap/tries",
  "heap":            "/roadmap/heap",
  "greedy":          "/roadmap/greedy",
  "intervals":       "/roadmap/intervals",
  "graph-traversal": "/roadmap/graph-traversal",
  "topo-sort":       "/roadmap/topo-sort",
  "union-find":      "/roadmap/union-find",
  "shortest-paths":  "/roadmap/shortest-paths",
  "mst":             "/roadmap/mst",
  "adv-graphs":      "/roadmap/adv-graphs",
  "dp-intro":        "/roadmap/dp-intro",
  "dp-2d":           "/roadmap/dp-2d",
};

const COLORS: Record<string, string> = {
  "0":  "#6741d9",
  "1":  "#3b5bdb",
  "2a": "#1971c2",
  "2b": "#2f9e44",
  "2c": "#c07a00",
  "2d": "#7048e8",
  "2e": "#c2255c",
};

const SECTION_NAMES: Record<string, string> = {
  "0":  "Foundations",
  "1":  "Section 1 — Core",
  "2a": "Section 2A — Graphs",
  "2b": "Section 2B — Greedy & Sweep",
  "2c": "Section 2C — Dynamic Programming",
  "2d": "Section 2D — Advanced Data Structures",
  "2e": "Section 2E — Math",
};

type Track = "both" | "interview" | "cp";
type Kind = "topic" | "utility";

interface Node {
  id: string;
  label: string;
  section: string;
  track: Track;
  isNew?: boolean;
  kind?: Kind;
}

const NODES: Node[] = [
  { id: "foundations",     label: "Foundations",               section: "0",  track: "both" },
  { id: "arrays-hashing",  label: "Arrays & Hashing",          section: "1",  track: "both" },
  { id: "sorting",         label: "Sorting",                   section: "1",  track: "both", isNew: true },
  { id: "prefix-sums",     label: "Prefix Sums",               section: "1",  track: "both", isNew: true },
  { id: "two-pointers",    label: "Two Pointers",              section: "1",  track: "both" },
  { id: "sliding-window",  label: "Sliding Window",            section: "1",  track: "both" },
  { id: "monotonic-deque", label: "Monotonic Deque",           section: "1",  track: "both", isNew: true },
  { id: "stack",           label: "Stack",                     section: "1",  track: "both" },
  { id: "monotonic-stack", label: "Monotonic Stack",           section: "1",  track: "both", isNew: true },
  { id: "linked-list",     label: "Linked List",               section: "1",  track: "both" },
  { id: "backtracking",    label: "Recursion & Backtracking",  section: "1",  track: "both" },
  { id: "binary-search",   label: "Binary Search",             section: "1",  track: "both" },
  { id: "bs-answer",       label: "Binary Search on Answer",   section: "1",  track: "both", isNew: true },
  { id: "trees",           label: "Trees",                     section: "1",  track: "both" },
  { id: "tries",           label: "Tries",                     section: "1",  track: "both" },
  { id: "heap",            label: "Heap / Priority Queue",     section: "1",  track: "both" },
  { id: "graph-traversal", label: "Graph Traversal",           section: "2a", track: "both" },
  { id: "topo-sort",       label: "Topological Sort",          section: "2a", track: "both", isNew: true },
  { id: "union-find",      label: "Union-Find / DSU",          section: "2a", track: "both", isNew: true },
  { id: "shortest-paths",  label: "Shortest Paths",            section: "2a", track: "both", isNew: true },
  { id: "mst",             label: "MST",                       section: "2a", track: "cp",   isNew: true },
  { id: "adv-graphs",      label: "Advanced Graphs",           section: "2a", track: "cp" },
  { id: "greedy",          label: "Greedy",                    section: "2b", track: "both" },
  { id: "intervals",       label: "Intervals & Sweep Line",    section: "2b", track: "both", isNew: true },
  { id: "dp-intro",        label: "DP Intro / 1D",             section: "2c", track: "both" },
  { id: "dp-2d",           label: "2D / Grid DP",              section: "2c", track: "both" },
  { id: "knapsack",        label: "Knapsack Family",           section: "2c", track: "both", isNew: true },
  { id: "lis-lcs",         label: "LIS / LCS",                 section: "2c", track: "both", isNew: true },
  { id: "dp-trees",        label: "DP on Trees",               section: "2c", track: "cp",   isNew: true },
  { id: "bit-manip",       label: "Bit Manipulation",          section: "2c", track: "both", kind: "utility" },
  { id: "bitmask-dp",      label: "Bitmask DP",                section: "2c", track: "both", isNew: true },
  { id: "interval-dp",     label: "Interval DP",               section: "2c", track: "cp",   isNew: true },
  { id: "coord-comp",      label: "Coordinate Compression",    section: "2d", track: "both", isNew: true, kind: "utility" },
  { id: "sparse-table",    label: "Sparse Table",              section: "2d", track: "cp",   isNew: true },
  { id: "fenwick",         label: "Fenwick Tree (BIT)",        section: "2d", track: "both", isNew: true },
  { id: "seg-tree",        label: "Segment Tree",              section: "2d", track: "both", isNew: true },
  { id: "number-theory",   label: "Number Theory",             section: "2e", track: "both", isNew: true },
  { id: "combinatorics",   label: "Combinatorics",             section: "2e", track: "both", isNew: true },
  { id: "probability",     label: "Probability & Expected Value", section: "2e", track: "both", isNew: true },
  { id: "geometry",        label: "Geometry Basics",           section: "2e", track: "interview" },
  { id: "game-theory",     label: "Game Theory",               section: "2e", track: "cp",   isNew: true },
];

const EDGES: [string, string][] = [
  ["foundations","arrays-hashing"],["foundations","backtracking"],
  ["foundations","bit-manip"],["foundations","number-theory"],
  ["arrays-hashing","sorting"],
  ["sorting","two-pointers"],["sorting","greedy"],
  ["arrays-hashing","prefix-sums"],["arrays-hashing","two-pointers"],
  ["arrays-hashing","stack"],["arrays-hashing","linked-list"],
  ["arrays-hashing","binary-search"],["two-pointers","binary-search"],
  ["arrays-hashing","union-find"],
  ["arrays-hashing","coord-comp"],["arrays-hashing","greedy"],
  ["arrays-hashing","geometry"],
  ["two-pointers","sliding-window"],
  ["sliding-window","monotonic-deque"],
  ["stack","monotonic-stack"],
  ["two-pointers","monotonic-stack"],
  ["monotonic-stack","monotonic-deque"],
  ["prefix-sums","monotonic-deque"],
  ["binary-search","bs-answer"],
  ["binary-search","sparse-table"],["prefix-sums","sparse-table"],
  ["prefix-sums","fenwick"],["coord-comp","fenwick"],
  ["fenwick","seg-tree"],
  ["backtracking","trees"],["stack","trees"],["backtracking","dp-intro"],
  ["trees","tries"],["trees","heap"],["linked-list","heap"],
  ["trees","graph-traversal"],["binary-search","graph-traversal"],["trees","dp-trees"],
  ["dp-intro","dp-trees"],
  ["heap","shortest-paths"],
  ["graph-traversal","topo-sort"],["graph-traversal","shortest-paths"],
  ["topo-sort","adv-graphs"],["shortest-paths","adv-graphs"],
  ["union-find","mst"],["shortest-paths","mst"],
  ["greedy","intervals"],
  ["heap","intervals"],
  ["dp-intro","dp-2d"],["dp-intro","knapsack"],
  ["dp-intro","lis-lcs"],["dp-intro","bitmask-dp"],
  ["dp-intro","interval-dp"],
  ["bit-manip","bitmask-dp"],
  ["number-theory","combinatorics"],
  ["combinatorics","probability"],["combinatorics","game-theory"],
  ["probability","game-theory"],
];

const ORDER: Record<string, number> = {
  "foundations": 1,   "arrays-hashing": 2,  "sorting": 3,
  "prefix-sums": 4,   "two-pointers": 5,    "sliding-window": 6,
  "stack": 7,         "monotonic-stack": 8, "monotonic-deque": 9,
  "linked-list": 10,  "binary-search": 11,  "bs-answer": 12,
  "backtracking": 13, "trees": 14,          "tries": 15,
  "heap": 16,         "greedy": 17,         "intervals": 18,
  "graph-traversal": 19, "topo-sort": 20,   "union-find": 21,
  "shortest-paths": 22,  "mst": 23,         "adv-graphs": 24,
  "dp-intro": 25,     "dp-2d": 26,          "knapsack": 27,
  "lis-lcs": 28,      "dp-trees": 29,       "bit-manip": 30,
  "bitmask-dp": 31,   "interval-dp": 32,    "coord-comp": 33,
  "sparse-table": 34, "fenwick": 35,        "seg-tree": 36,
  "number-theory": 37,"combinatorics": 38,  "probability": 39,
  "geometry": 40,     "game-theory": 41,
};

type FilterTrack = "all" | "interview" | "cp";

function computeUnlocks(id: string): number {
  const visited = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const [s, t] of EDGES) {
      if (s === cur && !visited.has(t)) {
        visited.add(t);
        stack.push(t);
      }
    }
  }
  return visited.size;
}

const REQUIRED_PROBLEMS = 5;

export default function RoadmapPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [problemsSolved, setProblemsSolved] = useState<Record<string, number[]>>({});
  const [currentTrack, setCurrentTrack] = useState<FilterTrack>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dsa-v1-completed") || "[]");
    const solved = JSON.parse(localStorage.getItem("dsa-v1-problems-solved") || "{}");
    const savedTrack = (localStorage.getItem("dsa-v1-track") || "all") as FilterTrack;
    setCompleted(new Set(saved));
    setProblemsSolved(solved);
    setCurrentTrack(savedTrack);
    setHydrated(true);
  }, []);

  function saveCompleted(next: Set<string>) {
    localStorage.setItem("dsa-v1-completed", JSON.stringify([...next]));
  }

  function inTrack(node: Node): boolean {
    if (currentTrack === "all") return true;
    return node.track === "both" || node.track === currentTrack;
  }

  // A module is "done" if manually marked complete OR ≥5 problems solved.
  function isModuleDone(id: string): boolean {
    if (completed.has(id)) return true;
    return (problemsSolved[id]?.length ?? 0) >= REQUIRED_PROBLEMS;
  }

  function nodeState(id: string): "completed" | "available" | "locked" {
    if (isModuleDone(id)) return "completed";
    const prereqs = EDGES.filter(([, t]) => t === id).map(([s]) => s);
    return prereqs.every(p => isModuleDone(p)) ? "available" : "locked";
  }

  function toggle(id: string) {
    if (nodeState(id) === "locked") return;
    // Don't allow toggling off an auto-completed module via card click;
    // user must uncheck problems on the module page.
    if (!completed.has(id) && isModuleDone(id)) return;
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompleted(next);
    saveCompleted(next);
  }

  function handleSetTrack(track: FilterTrack) {
    setCurrentTrack(track);
    localStorage.setItem("dsa-v1-track", track);
  }

  function reset() {
    if (!confirm("Reset all progress?")) return;
    setCompleted(new Set());
    setProblemsSolved({});
    localStorage.removeItem("dsa-v1-completed");
    localStorage.removeItem("dsa-v1-problems-solved");
  }

  const visibleNodes = NODES
    .filter(inTrack)
    .sort((a, b) => (ORDER[a.id] || 99) - (ORDER[b.id] || 99));

  const nextId = visibleNodes.find(n => nodeState(n.id) === "available")?.id;
  const doneCount = visibleNodes.filter(n => isModuleDone(n.id)).length;

  // Group visible modules by section, preserving SECTION_NAMES order.
  const sectionGroups = Object.keys(SECTION_NAMES)
    .map(section => ({
      section,
      modules: visibleNodes.filter(n => n.section === section),
    }))
    .filter(g => g.modules.length > 0);

  // ── Recommendation engine ───────────────────────────────────────────────────
  // Picks the highest-yield action across two pools:
  //   EXPAND      — open a new module to build breadth.
  //   CONSOLIDATE — return to a 5/N module to finish the checkpoint (depth).
  // Each pool is scored independently; the higher max wins. Direct downstream
  // blockers (the next expand module's checkpoint needs an unfinished pattern)
  // give consolidate enough lift to override expand naturally via the weights.
  type Mode = "expand" | "consolidate";
  type Scored = {
    id: string;
    score: number;
    contributions: { label: string; value: number }[];
  };

  const recommendation: { id: string; reasons: string[]; mode: Mode } | null = (() => {
    // EXPAND pool: nodes the user can newly start (not done, prereqs satisfied).
    const expandCandidates = visibleNodes.filter(n => nodeState(n.id) === "available");

    // CONSOLIDATE pool: nodes with 5 ≤ solved < total, not manually completed.
    // These are "foundation built, depth remaining" — the checkpoint problems
    // are typically what's still unchecked.
    const consolidateCandidates = visibleNodes.filter(n => {
      const total = PROBLEM_COUNTS[n.id] ?? 0;
      const solved = problemsSolved[n.id]?.length ?? 0;
      return total > 0
        && solved >= REQUIRED_PROBLEMS
        && solved < total
        && !completed.has(n.id);
    });

    if (expandCandidates.length === 0 && consolidateCandidates.length === 0) return null;

    // "Current learning position" — MAX (not median) of completed orders + 1.
    // Max reflects how far you've actually explored via the DAG. Median
    // understates progress whenever you've hopped ahead (e.g., did Backtracking
    // before finishing Section 1's array techniques).
    const completedOrders = NODES
      .filter(n => isModuleDone(n.id))
      .map(n => ORDER[n.id] || 99);
    const currentPos = completedOrders.length > 0
      ? Math.max(...completedOrders) + 1
      : 1;

    const allUnlocksPool = [...expandCandidates, ...consolidateCandidates];
    const maxUnlocks = Math.max(1, ...allUnlocksPool.map(n => computeUnlocks(n.id)));
    const maxProblems = Math.max(1, ...Object.values(PROBLEM_COUNTS));

    const trackScoreFor = (n: Node) => {
      const match = currentTrack !== "all" && n.track === currentTrack ? 1 : 0;
      const neutral = currentTrack === "all" || n.track === "both" ? 0.5 : 0;
      return Math.max(match, neutral);
    };

    // Most-recently-completed section — used for continuity bonus.
    const lastCompletedSection = completedOrders.length > 0
      ? NODES.find(n => (ORDER[n.id] || 99) === Math.max(...completedOrders))?.section ?? null
      : null;

    // ── EXPAND scoring (breadth) ──────────────────────────────────────────────
    const scoredExpand: Scored[] = expandCandidates.map(n => {
      const unlocks = computeUnlocks(n.id);
      const order = ORDER[n.id] || 99;
      const distance = Math.abs(order - currentPos);

      const sectionPeers = NODES.filter(x => x.section === n.section && inTrack(x));
      const sectionDone = sectionPeers.filter(x => isModuleDone(x.id)).length;
      const sectionCoherence = sectionPeers.length > 0 ? sectionDone / sectionPeers.length : 0;

      // Tweak 1: cap downstream impact by distance. A module 12+ orders away
      // cannot claim its full unlock bonus, preventing long-range jumps driven
      // purely by downstream size (e.g. A&H → Backtracking leap).
      const distancePenalty = Math.max(0, 1 - distance / 12);
      const downstreamScore = (unlocks / maxUnlocks) * distancePenalty;

      // Tweak 2: asymmetric proximity. Full credit at order = currentPos + 1
      // (the very next module). Drops off ahead and behind, but the forward
      // direction is favoured — being 1 ahead beats being 1 behind.
      const forwardBias = order >= currentPos ? distance : distance * 1.5;
      const proximity = Math.max(0, 1 - forwardBias / 6);

      const solvedCount = problemsSolved[n.id]?.length || 0;
      const alreadyStarted = solvedCount > 0 && solvedCount < REQUIRED_PROBLEMS;
      const problemDensity = (PROBLEM_COUNTS[n.id] || 0) / maxProblems;

      // Tweak 3: section continuity. Small bonus when the candidate is in the
      // same section as the most recently completed module.
      const sectionContinuity = n.section === lastCompletedSection ? 0.05 : 0;

      const contributions = [
        { label: "downstream impact",    value: 0.35 * downstreamScore },
        { label: "section coherence",    value: 0.20 * sectionCoherence },
        { label: "curriculum proximity", value: 0.15 * proximity },
        { label: "track alignment",      value: 0.10 * trackScoreFor(n) },
        { label: "problem density",      value: 0.10 * problemDensity },
        { label: "already started",      value: alreadyStarted ? 0.15 : 0 },
        { label: "section momentum",     value: sectionDone > 0 && sectionCoherence < 1 ? 0.05 : 0 },
        { label: "section continuity",   value: sectionContinuity },
      ];
      return {
        id: n.id,
        score: contributions.reduce((s, c) => s + c.value, 0),
        contributions,
      };
    });

    const sortedExpand = [...scoredExpand].sort((a, b) => b.score - a.score);

    // Learning debt: more than 2 partial (5/N) modules signals accumulated
    // depth gap. The 3rd+ partial each adds a small global bias toward
    // consolidate, capped at 0.15.
    const excessPartials = Math.max(0, consolidateCandidates.length - 2);
    const debtScore = Math.min(0.15, excessPartials * 0.05);

    // ── CONSOLIDATE scoring (depth) ───────────────────────────────────────────
    const scoredConsolidate: Scored[] = consolidateCandidates.map(n => {
      const total = PROBLEM_COUNTS[n.id] ?? 0;
      const solved = problemsSolved[n.id]?.length ?? 0;
      const solvedSet = new Set(problemsSolved[n.id] ?? []);
      const remaining = total - solved;
      const order = ORDER[n.id] || 99;

      // NOTE: we intentionally do NOT have a "blocks top expand" signal here.
      // Every consolidate candidate is already "done" (solved ≥ 5), so all of
      // its dependents are already unlocked — it cannot block anything. An edge
      // check here fires spuriously and pushes consolidate above expand when
      // the user should simply be moving forward.

      // Spaced decay: how many modules of distance since we paused here?
      // Full decay at distance >= 5 modules past current position.
      const decay = Math.max(0, Math.min(1, (currentPos - order) / 5));

      // Few-problems-left sweet spot: 1–3 problems remaining is high-value.
      // 4+ becomes a bigger commitment with diminishing returns.
      const remainingScore = remaining <= 3
        ? 1
        : Math.max(0, 1 - (remaining - 3) / 5);

      // Checkpoint typically = the last problem in the table. Unsolved means
      // the leap-defining problem is still on the table.
      const checkpointUnsolved = !solvedSet.has(total) ? 1 : 0;

      // Would completing this module close out its section?
      const sectionPeers = NODES.filter(x => x.section === n.section && inTrack(x));
      const sectionPeersComplete = sectionPeers.every(x => {
        if (x.id === n.id) return true; // assume this one completes
        if (completed.has(x.id)) return true;
        const xTotal = PROBLEM_COUNTS[x.id] ?? 0;
        const xSolved = problemsSolved[x.id]?.length ?? 0;
        return xTotal > 0 && xSolved >= xTotal;
      });
      const wouldCloseSection = sectionPeersComplete && sectionPeers.length > 1 ? 1 : 0;

      const contributions = [
        { label: "paused while ago",       value: 0.20 * decay },
        { label: "track alignment",        value: 0.10 * trackScoreFor(n) },
        { label: "few problems left",      value: 0.10 * remainingScore },
        { label: "checkpoint unsolved",    value: 0.10 * checkpointUnsolved },
        { label: "closes section",         value: 0.10 * wouldCloseSection },
        { label: "learning debt",          value: debtScore },
      ];
      return {
        id: n.id,
        score: contributions.reduce((s, c) => s + c.value, 0),
        contributions,
      };
    });

    const bestExpand = sortedExpand[0];
    const bestConsolidate = scoredConsolidate.sort((a, b) => b.score - a.score)[0];

    const expandScore = bestExpand?.score ?? -Infinity;
    const consolidateScore = bestConsolidate?.score ?? -Infinity;

    const winner = consolidateScore > expandScore ? bestConsolidate : bestExpand;
    const mode: Mode = winner === bestConsolidate ? "consolidate" : "expand";

    const meaningful = winner.contributions
      .filter(c => c.value > 0.04)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(c => c.label);

    return {
      id: winner.id,
      reasons: meaningful.length > 0 ? meaningful : [mode === "consolidate" ? "finish what's started" : "next available"],
      mode,
    };
  })();
  const recommendedId = recommendation?.id;

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DSA Roadmap</h1>
          <p className="text-sm text-zinc-500 mt-0.5">41 modules · prerequisite-locked learning path</p>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="flex overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
            {(["interview", "cp", "all"] as const).map((track, i) => (
              <button
                key={track}
                onClick={() => handleSetTrack(track)}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  i < 2 ? "border-r border-zinc-700" : "",
                  currentTrack === track
                    ? track === "interview"
                      ? "bg-emerald-950/80 text-emerald-400"
                      : track === "cp"
                      ? "bg-amber-950/80 text-amber-400"
                      : "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {track === "interview" ? "Interview" : track === "cp" ? "CP" : "All"}
              </button>
            ))}
          </div>

          <span className="text-sm text-zinc-400 tabular-nums">
            <strong className="text-emerald-400">{doneCount}</strong>
            <span className="text-zinc-600"> / {visibleNodes.length}</span>
          </span>

          <button onClick={reset} className="btn-ghost text-xs px-2 py-1 text-zinc-600 hover:text-zinc-400">
            Reset
          </button>
        </div>
      </header>

      <div className="divider" />

      <div className="space-y-6">
        {sectionGroups.map(group => {
          const sectionDone = group.modules.filter(m => isModuleDone(m.id)).length;
          const sectionTotal = group.modules.length;
          const sectionPct = sectionTotal > 0 ? (sectionDone / sectionTotal) * 100 : 0;
          const sectionComplete = sectionDone === sectionTotal && sectionTotal > 0;
          const sectionHeaderColor = COLORS[group.section] || "#3f3f46";

          return (
            <div key={group.section}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: sectionComplete ? "#34d399" : sectionHeaderColor }}
                >
                  {SECTION_NAMES[group.section]}
                </h2>
                <span className="text-[11px] tabular-nums">
                  <span className={sectionComplete ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
                    {sectionDone}
                  </span>
                  <span className="text-zinc-600"> / {sectionTotal}</span>
                </span>
              </div>
              <div className="h-1 bg-zinc-800/70 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${sectionPct}%`,
                    backgroundColor: sectionComplete ? "#34d399" : sectionHeaderColor,
                    opacity: sectionComplete ? 1 : 0.7,
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.modules.map(n => {
                  const state = nodeState(n.id);
          const num = ORDER[n.id];
          const sectionColor = COLORS[n.section];
          const prereqIds = EDGES.filter(([, t]) => t === n.id).map(([s]) => s);
          const missing = prereqIds
            .filter(p => !isModuleDone(p))
            .map(p => NODES.find(x => x.id === p)?.label);
          const isNext = n.id === nextId;
          const isRecommended = n.id === recommendedId;
          const unlocks = computeUnlocks(n.id);

          return (
            <div
              key={n.id}
              onClick={() => state !== "locked" && toggle(n.id)}
              className={[
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                isRecommended
                  ? "cursor-pointer border-amber-500/60 bg-gradient-to-br from-amber-950/30 via-zinc-900/40 to-zinc-900/30 shadow-[0_0_24px_rgba(251,191,36,0.18),inset_0_0_0_1px_rgba(251,191,36,0.12)] ring-1 ring-amber-500/30 hover:shadow-[0_0_32px_rgba(251,191,36,0.28),inset_0_0_0_1px_rgba(251,191,36,0.2)]"
                  : state === "locked"
                  ? "cursor-default border-zinc-800/30 bg-zinc-900/10"
                  : state === "completed"
                  ? "cursor-pointer border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-950/30"
                  : isNext
                  ? "cursor-pointer border-emerald-500/30 bg-zinc-900/40 shadow-[0_0_0_1px_rgba(52,211,153,0.08)] hover:bg-zinc-900/60"
                  : "cursor-pointer border-zinc-800/80 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-700",
              ].join(" ")}
            >
              <div
                className="text-base font-extrabold min-w-[28px] text-center tabular-nums"
                style={{ color: state === "locked" ? "#3f3f46" : isRecommended ? "#fbbf24" : sectionColor }}
              >
                {num}
              </div>

              <div className={`w-px h-7 flex-shrink-0 ${isRecommended ? "bg-amber-700/40" : state === "locked" ? "bg-zinc-800/40" : "bg-zinc-800"}`} />

              <div className="flex-1 min-w-0">
                <div
                  className={[
                    "text-sm font-semibold truncate",
                    state === "completed"
                      ? "text-emerald-400"
                      : state === "locked"
                      ? "text-zinc-700"
                      : "text-zinc-100",
                  ].join(" ")}
                >
                  {n.label}
                </div>
                <div className={`text-[11px] mt-0.5 ${state === "locked" ? "text-zinc-700" : "text-zinc-600"}`}>{SECTION_NAMES[n.section]}</div>
                {isRecommended && recommendation && (
                  <div className="mt-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <span>{recommendation.mode === "consolidate" ? "↻" : "★"}</span>
                      <span>{recommendation.mode === "consolidate" ? "Consolidate" : "Expand"}</span>
                    </div>
                    <div className="text-[9px] text-amber-600/80 mt-0.5 truncate">
                      {recommendation.reasons.join(" · ")}
                    </div>
                  </div>
                )}
                {isNext && !isRecommended && (
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">
                    up next
                  </div>
                )}
                {n.isNew && (
                  <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                    ★ not in NeetCode
                  </div>
                )}
                {n.kind === "utility" && (
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide mt-0.5">
                    ⚙ utility
                  </div>
                )}
                {state === "locked" && missing.length > 0 && (
                  <div className="text-[10px] text-rose-500 mt-0.5 truncate">
                    needs: {missing.join(", ")}
                  </div>
                )}
                {state !== "locked" && unlocks > 0 && (
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    unlocks{" "}
                    <span className="text-zinc-500">{unlocks}</span>{" "}
                    {unlocks === 1 ? "module" : "modules"}
                  </div>
                )}
                {state !== "locked" && PROBLEM_COUNTS[n.id] && (() => {
                  const solved = problemsSolved[n.id]?.length ?? 0;
                  const total = PROBLEM_COUNTS[n.id];
                  const pct = Math.min(100, (solved / total) * 100);
                  const hitThreshold = solved >= Math.min(REQUIRED_PROBLEMS, total);
                  const allDone = solved === total;
                  return (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] tabular-nums leading-none">
                        <span className={allDone ? "text-emerald-400 font-semibold" : hitThreshold ? "text-emerald-500" : "text-zinc-300"}>
                          {solved}
                        </span>
                        <span className="text-zinc-600"> / {total}</span>
                        <span className="text-zinc-700"> solved</span>
                      </span>
                      <div className="flex-1 max-w-[72px] h-1 bg-zinc-800/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${allDone ? "bg-emerald-500" : hitThreshold ? "bg-emerald-500/70" : "bg-zinc-500/50"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {MODULE_PAGES[n.id] && (
                  <Link
                    href={MODULE_PAGES[n.id]}
                    onClick={e => e.stopPropagation()}
                    className="no-underline text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded border border-zinc-700/60 hover:border-emerald-900/50 bg-zinc-900/60"
                    title="View module"
                  >
                    Notes
                  </Link>
                )}
                <div className="w-5 text-center text-sm">
                  {state === "completed" ? (
                    <span className="text-emerald-400">✓</span>
                  ) : state === "locked" ? (
                    <span className="text-zinc-700 text-xs">🔒</span>
                  ) : isNext ? (
                    <span className="text-emerald-400">→</span>
                  ) : (
                    <span className="text-zinc-600">○</span>
                  )}
                </div>
              </div>
            </div>
          );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="divider" />

      <div className="flex gap-6 text-xs text-zinc-600">
        <span><span className="text-emerald-400">✓</span> completed</span>
        <span><span className="text-emerald-400">→</span> up next</span>
        <span><span className="text-zinc-500">○</span> available</span>
        <span><span className="text-zinc-700">🔒</span> locked</span>
        <span><span className="text-amber-500">★</span> not in NeetCode</span>
      </div>
    </div>
  );
}
