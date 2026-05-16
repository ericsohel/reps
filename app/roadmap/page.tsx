"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ModuleModal } from "./_components/module-modal";
import {
  NODES,
  EDGES,
  ORDER,
  PROBLEM_COUNTS,
  SECTION_NAMES,
  SECTION_COLORS as COLORS,
  CHUNKS,
  type DagNode,
} from "./_data";

const MODULE_PAGES: Record<string, string> = {
  foundations: "/roadmap/foundations",
};

type Node = DagNode;
type FilterTier = "core" | "faang-plus" | "quant";
const TIER_RANK: Record<FilterTier, number> = { "core": 0, "faang-plus": 1, "quant": 2 };
const TIER_LABEL: Record<FilterTier, string> = { "core": "Core", "faang-plus": "FAANG+", "quant": "Quant" };

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
const UNLOCK_THRESHOLD = 3;

// Simplified SM-2 schedule: 1d after 1st solve, 7d after 2nd+. For v1 the
// roadmap stores only the latest lastSolvedAt per problem (no review-count
// history), so the practical "due at" used by the engine is lastSolvedAt + 7d.
// This is the conservative flat interval mentioned in the spec.
const REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default function RoadmapPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [problemsSolved, setProblemsSolved] = useState<Record<string, number[]>>({});
  const [problemsSolvedAt, setProblemsSolvedAt] = useState<Record<string, Record<string, number>>>({});
  const [currentTier, setCurrentTier] = useState<FilterTier>("faang-plus");
  const [hydrated, setHydrated] = useState(false);
  const [activeModule, setActiveModule] = useState<{
    id: string;
    title: string;
    previewMode?: boolean;
    unmetPrereqs?: { id: string; label: string }[];
    moduleTarget?: number;
    onMarkKnown?: () => void;
  } | null>(null);
  const [lastVisitedModule, setLastVisitedModule] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dsa-v1-completed") || "[]");
    const solved = JSON.parse(localStorage.getItem("dsa-v1-problems-solved") || "{}");
    const solvedAt = JSON.parse(localStorage.getItem("dsa-v1-problems-solved-at") || "{}");
    // Tier preference with one-time migration from the old `dsa-v1-track` key.
    // Old "interview" → core, old "cp" or "all" → quant (maximalist), default = faang-plus.
    let savedTier = localStorage.getItem("dsa-v1-tier") as FilterTier | null;
    if (!savedTier) {
      const legacy = localStorage.getItem("dsa-v1-track");
      if (legacy === "interview") savedTier = "core";
      else if (legacy === "cp" || legacy === "all") savedTier = "quant";
      else savedTier = "faang-plus";
      if (legacy) localStorage.setItem("dsa-v1-tier", savedTier);
    }
    const savedLastVisited = localStorage.getItem("dsa-v1-last-visited");
    setCompleted(new Set(saved));
    setProblemsSolved(solved);
    setProblemsSolvedAt(solvedAt);
    setCurrentTier(savedTier);
    setLastVisitedModule(savedLastVisited || null);
    setShowBanner(localStorage.getItem("dsa-v1-gating-v2-seen") !== "1");
    setHydrated(true);
  }, []);

  function dismissBanner() {
    localStorage.setItem("dsa-v1-gating-v2-seen", "1");
    setShowBanner(false);
  }

  // Re-sync solved state whenever a problem is toggled in the modal.
  // ProblemsChecklist dispatches "roadmap-progress-changed" after every
  // localStorage write, so cards update in real-time without a reload.
  useEffect(() => {
    function onProgress() {
      try {
        const fresh = JSON.parse(
          localStorage.getItem("dsa-v1-problems-solved") || "{}",
        );
        setProblemsSolved(fresh);
        const freshAt = JSON.parse(
          localStorage.getItem("dsa-v1-problems-solved-at") || "{}",
        );
        setProblemsSolvedAt(freshAt);
      } catch { /* ignore */ }
    }
    window.addEventListener("roadmap-progress-changed", onProgress);
    return () => window.removeEventListener("roadmap-progress-changed", onProgress);
  }, []);

  function saveCompleted(next: Set<string>) {
    localStorage.setItem("dsa-v1-completed", JSON.stringify([...next]));
  }

  // Cumulative filter: selecting a tier shows that tier AND all lower tiers.
  // core → core only; faang-plus → core + faang-plus; quant → all three.
  function inTier(node: Node): boolean {
    return TIER_RANK[node.tier as FilterTier] <= TIER_RANK[currentTier];
  }

  // Cache unlocks per node — EDGES is constant for the session.
  const unlocksCache = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of NODES) m[n.id] = computeUnlocks(n.id);
    return m;
  }, []);
  const unlocksOf = (id: string) => unlocksCache[id] ?? 0;

  // Per-module mastery target: prereq-hubs (high downstream unlock count)
  // require more solved problems to count as "done". Leaf modules keep the
  // base REQUIRED_PROBLEMS threshold.
  function masteryTarget(id: string): number {
    const total = PROBLEM_COUNTS[id] ?? 0;
    if (total === 0) return 0;
    // Core-only tier: low bar, prioritize breadth across FAANG fundamentals.
    // FAANG+ and Quant tiers: scale with downstream count to reward depth on hubs.
    if (currentTier === "core") {
      return Math.min(UNLOCK_THRESHOLD, total);
    }
    const unlocks = unlocksOf(id);
    return Math.min(REQUIRED_PROBLEMS + Math.max(0, unlocks - 3), total);
  }

  // Foundations is always done — it's a reference checklist, not a gate.
  // A module is "done" if manually marked complete OR ≥ min(5, total) problems
  // solved. The min handles modules with fewer than 5 problems consistently
  // with problems-checklist.tsx (which uses the same threshold for unlocking).
  function isModuleDone(id: string): boolean {
    if (id === "foundations") return true;
    if (completed.has(id)) return true;
    const target = masteryTarget(id);
    if (target === 0) return false;
    return (problemsSolved[id]?.length ?? 0) >= target;
  }

  function isModuleUnlocking(id: string): boolean {
    if (id === "foundations") return true;
    if (completed.has(id)) return true;
    const total = PROBLEM_COUNTS[id] ?? 0;
    if (total === 0) return false;
    const threshold = Math.min(UNLOCK_THRESHOLD, total);
    return (problemsSolved[id]?.length ?? 0) >= threshold;
  }

  // Layer-based gating: a module is unlocked iff EVERY module in EVERY earlier
  // chunk is at the unlock threshold (3+ solved). This enforces the rule
  // "completing all of layer N unlocks all of layer N+1" — the user can't skip
  // ahead past unfinished layers. The per-module prereqIds are still respected
  // implicitly because chunks are topologically ordered.
  const moduleChunkIndex = useMemo(() => {
    const m: Record<string, number> = {};
    CHUNKS.forEach((c, i) => c.moduleIds.forEach((id) => { m[id] = i; }));
    return m;
  }, []);

  function nodeState(id: string): "completed" | "available" | "locked" {
    if (isModuleDone(id)) return "completed";
    const myLayer = moduleChunkIndex[id] ?? 0;
    if (myLayer === 0) return "available";  // layer 0 always available
    // Every module in every earlier chunk must be at unlock threshold.
    for (let i = 0; i < myLayer; i++) {
      for (const earlierId of CHUNKS[i].moduleIds) {
        if (!isModuleUnlocking(earlierId)) return "locked";
      }
    }
    return "available";
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

  function handleSetTier(tier: FilterTier) {
    setCurrentTier(tier);
    localStorage.setItem("dsa-v1-tier", tier);
  }

  function reset() {
    if (!confirm("Reset all progress?")) return;
    setCompleted(new Set());
    setProblemsSolved({});
    setProblemsSolvedAt({});
    setLastVisitedModule(null);
    localStorage.removeItem("dsa-v1-completed");
    localStorage.removeItem("dsa-v1-problems-solved");
    localStorage.removeItem("dsa-v1-problems-solved-at");
    localStorage.removeItem("dsa-v1-last-visited");
  }

  const visibleNodes = NODES
    .filter(inTier)
    .sort((a, b) => (ORDER[a.id] || 99) - (ORDER[b.id] || 99));

  const nextId = visibleNodes.find(n => nodeState(n.id) === "available")?.id;
  const doneCount = visibleNodes.filter(n => isModuleDone(n.id)).length;

  // Group visible modules by chunk, filtering out chunks with no visible modules.
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const chunkGroups = CHUNKS
    .map(chunk => ({
      chunk,
      modules: chunk.moduleIds
        .filter(id => visibleNodeIds.has(id))
        .map(id => NODES.find(n => n.id === id)!)
        .filter(Boolean),
    }))
    .filter(g => g.modules.length > 0);

  // ── Recommendation engine ───────────────────────────────────────────────────
  // Picks the highest-yield action across three pools:
  //   EXPAND      — open a new module to build breadth.
  //   CONSOLIDATE — return to a target/N module to finish the checkpoint.
  //   REVIEW      — re-solve a decayed problem in a finished module (retention).
  // Each pool is scored independently; the higher max wins. Pool ceilings are
  // tuned to ~1.0-1.15 so the comparison is fair.
  type Mode = "expand" | "consolidate" | "review";
  type Scored = {
    id: string;
    score: number;
    contributions: { label: string; value: number }[];
  };

  const recommendation: { id: string; reasons: string[]; mode: Mode } | null = (() => {
    // EXPAND pool: nodes the user can newly start (not done, prereqs satisfied).
    const expandCandidates = visibleNodes.filter(n => nodeState(n.id) === "available");

    // CONSOLIDATE pool: nodes with min(5,total) ≤ solved < total, not manually
    // completed. These are "foundation built, depth remaining" — the
    // checkpoint problems are typically what's still unchecked. Foundations
    // is a reference checklist, not a consolidate target.
    const consolidateCandidates = visibleNodes.filter(n => {
      if (n.id === "foundations") return false;
      // Skip the module the user just visited — don't push them back to
      // grinding the same module they just spent a session on.
      if (n.id === lastVisitedModule) return false;
      const total = PROBLEM_COUNTS[n.id] ?? 0;
      if (total <= 0) return false;
      const target = masteryTarget(n.id);
      const solved = problemsSolved[n.id]?.length ?? 0;
      return solved >= target
        && solved < total
        && !completed.has(n.id);
    });

    // REVIEW_DUE pool: modules that are already mastered (isModuleDone)
    // and have at least one solved problem whose lastSolvedAt is older
    // than the review window. Skipped when timestamps absent.
    const now = Date.now();
    type DueInfo = { node: Node; overdueCount: number; maxOverdueAgo: number; checkpointDue: boolean; solvedCount: number };
    const reviewDueInfos: DueInfo[] = [];
    for (const n of visibleNodes) {
      if (!isModuleDone(n.id)) continue;
      if (n.id === "foundations") continue;
      if (n.id === lastVisitedModule) continue;
      const solvedNums = problemsSolved[n.id] ?? [];
      if (solvedNums.length === 0) continue;
      const tsMap = problemsSolvedAt[n.id] ?? {};
      let overdueCount = 0;
      let maxOverdueAgo = 0;
      let checkpointDue = false;
      const total = PROBLEM_COUNTS[n.id] ?? 0;
      for (const num of solvedNums) {
        const ts = tsMap[String(num)];
        if (typeof ts !== "number") continue;
        const dueAt = ts + REVIEW_WINDOW_MS;
        if (now > dueAt) {
          overdueCount += 1;
          const ago = now - dueAt;
          if (ago > maxOverdueAgo) maxOverdueAgo = ago;
          if (num === total) checkpointDue = true;
        }
      }
      if (overdueCount > 0) {
        reviewDueInfos.push({ node: n, overdueCount, maxOverdueAgo, checkpointDue, solvedCount: solvedNums.length });
      }
    }

    if (expandCandidates.length === 0 && consolidateCandidates.length === 0 && reviewDueInfos.length === 0) return null;

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

    const allUnlocksPool = [
      ...expandCandidates,
      ...consolidateCandidates,
      ...reviewDueInfos.map(d => d.node),
    ];
    const maxUnlocks = Math.max(1, ...allUnlocksPool.map(n => unlocksOf(n.id)));
    const maxProblems = Math.max(1, ...Object.values(PROBLEM_COUNTS));

    // Prefer modules that align with the user's current tier focus.
    // Same-tier match = full score, lower-tier (more fundamental) = strong, higher-tier (above focus) = 0.
    const trackScoreFor = (n: Node) => {
      const nodeRank = TIER_RANK[n.tier as FilterTier];
      const focusRank = TIER_RANK[currentTier];
      if (nodeRank === focusRank) return 1;
      if (nodeRank < focusRank) return 0.6;
      return 0;
    };

    // Most-recently-completed section — used for continuity bonus.
    const lastCompletedSection = completedOrders.length > 0
      ? NODES.find(n => (ORDER[n.id] || 99) === Math.max(...completedOrders))?.section ?? null
      : null;

    // ── EXPAND scoring (breadth) ──────────────────────────────────────────────
    const scoredExpand: Scored[] = expandCandidates.map(n => {
      const unlocks = unlocksOf(n.id);
      const order = ORDER[n.id] || 99;
      const distance = Math.abs(order - currentPos);

      const sectionPeers = NODES.filter(x => x.section === n.section && inTier(x));
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

    // Learning debt: 3+ partial modules signals accumulated depth gap. Each
    // partial past 2 adds 0.10 to the global consolidate score, capped at
    // 0.30. Tuned so 4+ partials reliably tilts toward consolidate when the
    // top expand candidate is mid-strength.
    const excessPartials = Math.max(0, consolidateCandidates.length - 2);
    const debtScore = Math.min(0.30, excessPartials * 0.10);

    // ── CONSOLIDATE scoring (depth) ───────────────────────────────────────────
    // Weights tuned to give consolidate a max of ~1.15, matching expand's
    // ceiling so the comparison is fair. Consolidate wins when there's a
    // specific high-value depth signal (1-2 left, checkpoint unsolved,
    // section nearly closed) or when learning debt has accumulated.
    const scoredConsolidate: Scored[] = consolidateCandidates.map(n => {
      const total = PROBLEM_COUNTS[n.id] ?? 0;
      const solved = problemsSolved[n.id]?.length ?? 0;
      const solvedSet = new Set(problemsSolved[n.id] ?? []);
      const remaining = total - solved;
      const order = ORDER[n.id] || 99;

      // NOTE: we intentionally do NOT have a "blocks top expand" signal here.
      // Every consolidate candidate is already "done" (solved ≥ target), so
      // all of its dependents are already unlocked — it cannot block anything.

      // Spaced decay: how many modules of distance since we paused here?
      // Full decay at distance ≥ 5 modules past current position. Partials
      // ahead of currentPos (skipped-ahead) get decay 0 — recent activity.
      const decay = Math.max(0, Math.min(1, (currentPos - order) / 5));

      // Few-problems-left curve. 1-2 remaining is the "almost done" sweet
      // spot — easiest payoff per unit of effort. 3 is medium-good; 4+ tails
      // off because the commitment grows.
      const remainingScore = remaining <= 2
        ? 1
        : Math.max(0, 1 - (remaining - 2) / 6);

      // Checkpoint typically = the last problem in the table. Unsolved means
      // the leap-defining problem is still on the table.
      const checkpointUnsolved = !solvedSet.has(total) ? 1 : 0;

      // Would completing this module close out its section? Use the
      // module-done threshold for peers (min(5, total)) — consistent with
      // how the rest of the app defines "done". Previously this checked
      // strict full-solve which fired far less often than it should.
      const sectionPeers = NODES.filter(x => x.section === n.section && inTier(x));
      const sectionPeersComplete = sectionPeers.every(x =>
        x.id === n.id ? true : isModuleDone(x.id),
      );
      const wouldCloseSection = sectionPeersComplete && sectionPeers.length > 1 ? 1 : 0;

      const contributions = [
        { label: "paused while ago",       value: 0.20 * decay },
        { label: "track alignment",        value: 0.10 * trackScoreFor(n) },
        { label: "few problems left",      value: 0.25 * remainingScore },
        { label: "checkpoint unsolved",    value: 0.15 * checkpointUnsolved },
        { label: "closes section",         value: 0.15 * wouldCloseSection },
        { label: "learning debt",          value: debtScore },
      ];
      return {
        id: n.id,
        score: contributions.reduce((s, c) => s + c.value, 0),
        contributions,
      };
    });

    // ── REVIEW scoring (retention) ────────────────────────────────────────────
    // Ceiling ≈ 1.15 (0.40 + 0.25 + 0.15 + 0.10 + 0.25). Surfaces when a
    // mastered module has solved problems that have decayed past their review
    // window. Plain-English reasons in retrieval voice.
    const scoredReview: Scored[] = reviewDueInfos.map(info => {
      const { node: n, overdueCount, maxOverdueAgo, checkpointDue, solvedCount } = info;
      const retentionDeficit = Math.min(1, maxOverdueAgo / REVIEW_WINDOW_MS);
      const criticality = unlocksOf(n.id) / maxUnlocks;
      const accumulatedDecay = solvedCount > 0 ? Math.min(1, overdueCount / solvedCount) : 0;
      const contributions = [
        { label: `${overdueCount} problem${overdueCount === 1 ? "" : "s"} decayed past review window`, value: 0.40 * retentionDeficit },
        { label: "high-leverage module due for review",                                                 value: 0.25 * criticality },
        { label: "matches your current track",                                                          value: 0.15 * trackScoreFor(n) },
        { label: "checkpoint due for review",                                                           value: checkpointDue ? 0.10 : 0 },
        { label: "retention slipping across this module",                                               value: 0.25 * accumulatedDecay },
      ];
      return {
        id: n.id,
        score: contributions.reduce((s, c) => s + c.value, 0),
        contributions,
      };
    });

    const bestExpand = sortedExpand[0];
    const bestConsolidate = scoredConsolidate.sort((a, b) => b.score - a.score)[0];
    const bestReview = [...scoredReview].sort((a, b) => b.score - a.score)[0];

    const expandScore = bestExpand?.score ?? -Infinity;
    const consolidateScore = bestConsolidate?.score ?? -Infinity;
    const reviewScore = bestReview?.score ?? -Infinity;

    let winner: Scored;
    let mode: Mode;
    if (reviewScore >= expandScore && reviewScore >= consolidateScore && bestReview) {
      winner = bestReview;
      mode = "review";
    } else if (consolidateScore >= expandScore && bestConsolidate) {
      winner = bestConsolidate;
      mode = "consolidate";
    } else {
      winner = bestExpand;
      mode = "expand";
    }

    const meaningful = winner.contributions
      .filter(c => c.value > 0.04)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(c => c.label);

    const fallback = mode === "review"
      ? "review decayed problems"
      : mode === "consolidate"
      ? "finish what's started"
      : "next available";

    return {
      id: winner.id,
      reasons: meaningful.length > 0 ? meaningful : [fallback],
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
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div
            className="flex overflow-hidden rounded-md border border-zinc-700 bg-zinc-900"
            title="Cumulative scope: each tier includes the ones to its left. Core = FAANG essentials; FAANG+ adds harder algos (Fenwick, bitmask DP, advanced graphs); Quant adds probability, combinatorics, game theory."
          >
            {(["core", "faang-plus", "quant"] as const).map((tier, i) => (
              <button
                key={tier}
                onClick={() => handleSetTier(tier)}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  i < 2 ? "border-r border-zinc-700" : "",
                  currentTier === tier
                    ? tier === "core"
                      ? "bg-emerald-950/80 text-emerald-400"
                      : tier === "faang-plus"
                      ? "bg-sky-950/80 text-sky-400"
                      : "bg-amber-950/80 text-amber-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {TIER_LABEL[tier]}
              </button>
            ))}
          </div>

          <span className="text-sm text-zinc-400 tabular-nums">
            <strong className="text-emerald-400">{doneCount}</strong>
            <span className="text-zinc-600"> / {visibleNodes.length}</span>
          </span>

          <Link
            href="/lab"
            className="btn-ghost text-xs px-2 py-1 text-zinc-500 hover:text-emerald-400 no-underline"
            title="Solving Lab — train transfer on fresh problems"
          >
            Lab →
          </Link>

          <button onClick={reset} className="btn-ghost text-xs px-2 py-1 text-zinc-600 hover:text-zinc-400">
            Reset
          </button>
        </div>
      </header>

      {showBanner && (
        <div className="border border-amber-700/40 bg-amber-950/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-amber-400 text-sm flex-shrink-0">●</span>
          <div className="flex-1 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Prerequisites loosened.</strong>{" "}
            Modules now unlock after 3 problems solved, not the full mastery target.
            Your in-progress modules and the recommendation engine still track mastery —
            just the gating relaxed.
          </div>
          <button
            onClick={dismissBanner}
            className="text-zinc-600 hover:text-zinc-300 text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="divider" />

      <div className="space-y-6">
        {chunkGroups.map((group, groupIdx) => {
          const chunkDone = group.modules.filter(m => isModuleDone(m.id)).length;
          const chunkTotal = group.modules.length;

          // Insert tier dividers between tiers
          const prevChunk = groupIdx > 0 ? chunkGroups[groupIdx - 1].chunk : null;
          const showFaangDivider = group.chunk.tier === "faang-plus" && prevChunk?.tier === "core";
          const showQuantDivider = group.chunk.tier === "quant" && prevChunk?.tier !== "quant";

          const gridCols = "grid-cols-1 sm:grid-cols-2";

          return (
            <div key={group.chunk.id}>
              {showFaangDivider && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">FAANG+ Algorithms</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
              )}
              {showQuantDivider && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Quant Mathematics</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-zinc-300">{group.chunk.label}</span>
                <span className="text-xs text-zinc-500 tabular-nums">{chunkDone} / {chunkTotal} mastered</span>
              </div>
              <div className="h-px bg-zinc-800/50 mb-3" />
              <div className={`grid ${gridCols} gap-1.5`}>
                {group.modules.map(n => {
                  const state = nodeState(n.id);
          const num = ORDER[n.id];
          const sectionColor = COLORS[n.section];
          // Layer-based "missing": for a locked module, the user needs to finish
          // unfinished modules in the LATEST earlier chunk (most actionable hint).
          const myLayer = moduleChunkIndex[n.id] ?? 0;
          let missing: (string | undefined)[] = [];
          if (state === "locked") {
            for (let li = myLayer - 1; li >= 0; li--) {
              const unfinished = CHUNKS[li].moduleIds
                .filter((id) => !isModuleUnlocking(id))
                .map((id) => NODES.find((x) => x.id === id)?.label.replace("\n", " "));
              if (unfinished.length > 0) { missing = unfinished; break; }
            }
          }
          const isNext = n.id === nextId;
          const isRecommended = n.id === recommendedId;
          const isReviewRec = isRecommended && recommendation?.mode === "review";
          const unlocks = unlocksOf(n.id);
          const _solvedCount = problemsSolved[n.id]?.length ?? 0;
          const _totalCount = PROBLEM_COUNTS[n.id] ?? 0;
          const isFullySolved = state === "completed" && _totalCount > 0 && _solvedCount >= _totalCount;
          const isUnlockedInProgress = state !== "completed" && state !== "locked" && _solvedCount >= UNLOCK_THRESHOLD && _totalCount > 0;

          return (
            <div
              key={n.id}
              onClick={() => {
                if (PROBLEM_COUNTS[n.id]) {
                  const isLocked = state === "locked";
                  // For the modal: pass the unfinished modules in the latest
                  // earlier chunk (same hint shown on the card).
                  let unmet: { id: string; label: string }[] | undefined;
                  if (isLocked) {
                    for (let li = myLayer - 1; li >= 0; li--) {
                      const unfinished = CHUNKS[li].moduleIds
                        .filter((id) => !isModuleUnlocking(id))
                        .map((id) => ({ id, label: NODES.find((x) => x.id === id)?.label.replace("\n", " ") ?? id }));
                      if (unfinished.length > 0) { unmet = unfinished; break; }
                    }
                  }
                  const target = masteryTarget(n.id);
                  const markKnown = !isLocked && nodeState(n.id) !== "locked"
                    ? () => { toggle(n.id); setActiveModule(null); }
                    : undefined;
                  setActiveModule({ id: n.id, title: n.label, previewMode: isLocked, unmetPrereqs: unmet, moduleTarget: target, onMarkKnown: markKnown });
                  setLastVisitedModule(n.id);
                  localStorage.setItem("dsa-v1-last-visited", n.id);
                } else if (MODULE_PAGES[n.id]) {
                  setLastVisitedModule(n.id);
                  localStorage.setItem("dsa-v1-last-visited", n.id);
                  window.location.href = MODULE_PAGES[n.id];
                }
              }}
              className={[
                "relative flex flex-col items-center justify-center text-center px-3 py-3 rounded-lg border transition-all gap-1",
                isReviewRec
                  ? "cursor-pointer border-cyan-500/60 bg-gradient-to-br from-cyan-950/30 via-zinc-900/40 to-zinc-900/30 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_0_0_1px_rgba(34,211,238,0.12)] ring-1 ring-cyan-500/30 hover:shadow-[0_0_32px_rgba(34,211,238,0.28),inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                  : isRecommended
                  ? "cursor-pointer border-amber-500/60 bg-gradient-to-br from-amber-950/30 via-zinc-900/40 to-zinc-900/30 shadow-[0_0_24px_rgba(251,191,36,0.18),inset_0_0_0_1px_rgba(251,191,36,0.12)] ring-1 ring-amber-500/30 hover:shadow-[0_0_32px_rgba(251,191,36,0.28),inset_0_0_0_1px_rgba(251,191,36,0.2)]"
                  : state === "locked"
                  ? "cursor-pointer border-zinc-800/30 bg-zinc-900/10 hover:bg-zinc-900/20"
                  : isFullySolved
                  ? "cursor-pointer border-emerald-400/80 bg-gradient-to-br from-emerald-950/40 to-emerald-900/30 ring-1 ring-emerald-500/30 hover:bg-emerald-900/35"
                  : state === "completed"
                  ? "cursor-pointer border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-950/30"
                  : isUnlockedInProgress
                  ? "cursor-pointer border-emerald-800/50 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-emerald-700/40"
                  : isNext
                  ? "cursor-pointer border-emerald-500/30 bg-zinc-900/40 shadow-[0_0_0_1px_rgba(52,211,153,0.08)] hover:bg-zinc-900/60"
                  : "cursor-pointer border-zinc-800/80 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-700",
              ].join(" ")}
            >
              {/* State icon — top-right corner */}
              <div className="absolute top-2 right-2 text-xs">
                {isFullySolved ? (
                  <span className="text-emerald-300 font-bold">✓✓</span>
                ) : state === "completed" ? (
                  <span className="text-emerald-400">✓</span>
                ) : state === "locked" ? (
                  <span className="text-zinc-700">🔒</span>
                ) : isNext ? (
                  <span className="text-emerald-400">→</span>
                ) : (
                  <span className="text-zinc-600">○</span>
                )}
              </div>

              <div className="w-full min-w-0">
                <div
                  className={[
                    "text-sm font-semibold leading-snug line-clamp-2",
                    isFullySolved
                      ? "text-emerald-300"
                      : state === "completed"
                      ? "text-emerald-400"
                      : state === "locked"
                      ? "text-zinc-700"
                      : "text-zinc-100",
                  ].join(" ")}
                >
                  {n.label}
                </div>
                {isRecommended && recommendation && (() => {
                  const isReview = recommendation.mode === "review";
                  const labelColor = isReview ? "text-cyan-300" : "text-amber-400";
                  const reasonColor = isReview ? "text-cyan-500/80" : "text-amber-600/80";
                  const label = isReview ? "Review" : recommendation.mode === "consolidate" ? "Consolidate" : "Expand";
                  return (
                    <div className={`text-[9px] font-bold ${labelColor} uppercase tracking-wider mt-0.5`}>
                      {label}
                    </div>
                  );
                })()}
                {state === "locked" && missing.length > 0 && (
                  <div className="text-[10px] text-rose-500 mt-0.5 truncate">
                    needs: {missing.join(", ")}
                  </div>
                )}
                {state !== "locked" && PROBLEM_COUNTS[n.id] && (() => {
                  const solved = problemsSolved[n.id]?.length ?? 0;
                  const total = PROBLEM_COUNTS[n.id];
                  const pct = Math.min(100, (solved / total) * 100);
                  const hitThreshold = solved >= Math.min(REQUIRED_PROBLEMS, total);
                  const allDone = solved === total;
                  return (
                    <div className="mt-1.5 w-full h-1 bg-zinc-800/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${allDone ? "bg-emerald-500" : hitThreshold ? "bg-emerald-500/70" : "bg-zinc-500/50"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}
              </div>

            </div>
          );
                })}
              </div>
            </div>
          );
        })}
      </div>


      {activeModule && (
        <ModuleModal
          moduleId={activeModule.id}
          title={activeModule.title}
          previewMode={activeModule.previewMode}
          unmetPrereqs={activeModule.unmetPrereqs}
          moduleTarget={activeModule.moduleTarget}
          onMarkKnown={activeModule.onMarkKnown}
          onOpenPrereq={(id) => {
            const node = NODES.find(n => n.id === id);
            if (node) {
              setActiveModule({
                id: node.id,
                title: node.label.replace("\n", " "),
                previewMode: false,
                unmetPrereqs: undefined,
                moduleTarget: masteryTarget(node.id),
                onMarkKnown: nodeState(node.id) !== "locked"
                  ? () => { toggle(node.id); setActiveModule(null); }
                  : undefined,
              });
            }
          }}
          onClose={() => setActiveModule(null)}
        />
      )}
    </div>
  );
}
