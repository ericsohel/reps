"use client";

// Solving Lab — frame · approach · solve · distill.
//
// Single-file MVP. Reads the static catalogs from app/lab/_data and routes the
// user through a per-kind solve flow (algo, puzzle, estimation). All persistence
// is localStorage; nothing here hits the network or a server action.
//
// Order of concerns in this file:
//   1) Persistence keys + small typed JSON helpers
//   2) Mastery + solve-count derivation from existing roadmap state
//   3) Numeric parsing for the estimation grader
//   4) The page component — mode state, queue, solve state machine, render

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LAB_PROBLEMS,
  LAB_PROBLEMS_BY_ID,
  type LabProblem,
} from "./_data";
import type {
  InsightReview,
  LabSolve,
  StuckMove,
  StuckMoveLog,
} from "./_data/types";
import { STUCK_MOVES } from "./_data/stuck-moves";
import {
  getEligibleProblems,
  getNextProblem,
} from "./_lib/eligibility";
import {
  applyReview,
  buildReviewCard,
  dueInsights,
  initReview,
  newInsightsFromSolve,
  type ReviewRating,
} from "./_lib/insight-sr";
import { getRecommendedMove } from "./_lib/stuck-tracking";
import { MODULES, PROBLEM_COUNTS } from "../roadmap/_data";
import {
  ApproachStage,
  ConceptOnlyReview,
  DistillStage,
  FrameStage,
  ProblemHeader,
  ReviewBanner,
  SolveStage,
  StuckPanel,
  type Stage,
} from "./_components/stages";

// ── localStorage schema ──────────────────────────────────────────────────────
const LS_SOLVES = "dsa-v1-lab-solves";
const LS_REVIEWS = "dsa-v1-lab-reviews";
const LS_STUCK_LOG = "dsa-v1-lab-stuck-log";
const LS_MODE = "dsa-v1-lab-mode";

// Roadmap keys we read (do not write):
const LS_ROADMAP_COMPLETED = "dsa-v1-completed";
const LS_ROADMAP_SOLVED = "dsa-v1-problems-solved";

const UNLOCK_THRESHOLD = 3;

type Mode = "mixed" | "algo" | "puzzle" | "estimation" | "review";
const MODES: Mode[] = ["mixed", "algo", "puzzle", "estimation", "review"];
const MODE_LABEL: Record<Mode, string> = {
  mixed: "Mixed",
  algo: "Algo",
  puzzle: "Puzzles",
  estimation: "Estimation",
  review: "Review",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Mastery from roadmap state ───────────────────────────────────────────────
// More-permissive than the roadmap's strict mastery target: we use the unlock
// threshold (3 problems) so the Lab surfaces problems as soon as the underlying
// skill is "open", not only after full module mastery. This is intentional —
// the Lab teaches transfer; gating it on full mastery would starve the queue.
function buildMastery(
  completedIds: string[],
  problemsSolved: Record<string, number[]>,
): Record<string, boolean> {
  const mastery: Record<string, boolean> = { foundations: true };
  const completed = new Set(completedIds);
  for (const m of MODULES) {
    if (m.id === "foundations") {
      mastery[m.id] = true;
      continue;
    }
    if (completed.has(m.id)) {
      mastery[m.id] = true;
      continue;
    }
    const total = PROBLEM_COUNTS[m.id] ?? 0;
    if (total <= 0) {
      mastery[m.id] = false;
      continue;
    }
    const solved = problemsSolved[m.id]?.length ?? 0;
    const threshold = Math.min(UNLOCK_THRESHOLD, total);
    mastery[m.id] = solved >= threshold;
  }
  return mastery;
}

function computeSolveCounts(
  solves: readonly LabSolve[],
): Record<"warm-up" | "standard" | "stretch", number> {
  const counts = { "warm-up": 0, standard: 0, stretch: 0 };
  for (const s of solves) {
    if (s.outcome !== "solved") continue;
    const p = LAB_PROBLEMS_BY_ID[s.problemId];
    if (!p) continue;
    counts[p.difficulty] += 1;
  }
  return counts;
}

// ── Estimation grader ────────────────────────────────────────────────────────
// The canonical answer is curator-authored free text like "~10^14 m", "~100
// (between 30 and 300)", or "n ≈ 25". We extract the first plausible numeric
// magnitude (handling "10^N" and scientific notation) and compare against the
// user's parsed value with the curator-supplied tolerance.
function parseMagnitude(raw: string): number | null {
  if (typeof raw !== "string") return null;
  // Normalise: ~10^14 → 1e14, 2×10^9 / 2x10^9 → 2e9
  const cleaned = raw
    .replace(/[~≈]/g, "")
    .replace(/[\s,]/g, "")
    .replace(/[×x*]10\^?/gi, "e")
    .replace(/10\^/g, "1e");
  // Find first number (including scientific notation).
  const match = cleaned.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/i);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function gradeEstimation(
  problem: LabProblem,
  userAnswer: string,
): boolean {
  const canonical = problem.answer?.trim() ?? "";
  const user = userAnswer.trim();
  if (!canonical || !user) return false;

  if (problem.answerType === "numeric") {
    const tol = problem.acceptableTolerance ?? 0.5;
    const c = parseMagnitude(canonical);
    const u = parseMagnitude(user);
    if (c === null || u === null || c === 0) return false;
    // Symmetric log-style tolerance: |u-c|/|c| <= tol. Works for the "within
    // ±50%" intent on Fermi problems even when magnitudes differ.
    return Math.abs(u - c) / Math.abs(c) <= tol;
  }

  // ordering or categorical — relaxed string match. We split the canonical
  // by commas/slashes/and-clauses and require each token to appear (case-
  // insensitive) in the user's answer. Forgiving but not a free pass.
  const tokens = canonical
    .toLowerCase()
    .split(/[,;/]| and | or /i)
    .map((s) => s.trim())
    .filter(Boolean);
  const u = user.toLowerCase();
  if (tokens.length === 0) return u === canonical.toLowerCase();
  return tokens.every((t) => u.includes(t));
}

// ── Catalog views ────────────────────────────────────────────────────────────
// Helpers that filter the global catalog down to the chips the user selected.
function catalogForMode(mode: Mode): readonly LabProblem[] {
  if (mode === "algo") {
    return LAB_PROBLEMS.filter((p) => (p.kind ?? "algo") === "algo");
  }
  if (mode === "puzzle") {
    return LAB_PROBLEMS.filter((p) => p.kind === "puzzle");
  }
  if (mode === "estimation") {
    return LAB_PROBLEMS.filter((p) => p.kind === "estimation");
  }
  // mixed / review use the full catalog
  return LAB_PROBLEMS;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LabPage() {
  // hydration guard — render null until localStorage has been read.
  const [hydrated, setHydrated] = useState(false);

  // Roadmap-derived state (read once, refreshed on storage events).
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [problemsSolved, setProblemsSolved] = useState<Record<string, number[]>>({});

  // Lab state.
  const [solves, setSolves] = useState<LabSolve[]>([]);
  const [reviews, setReviews] = useState<InsightReview[]>([]);
  const [stuckLog, setStuckLog] = useState<StuckMoveLog[]>([]);
  const [mode, setMode] = useState<Mode>("mixed");

  // Current attempt state.
  const [stage, setStage] = useState<Stage>("frame");
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null); // present iff a review card is in flight

  const [frameText, setFrameText] = useState("");
  const [approachText, setApproachText] = useState("");
  const [takeawayText, setTakeawayText] = useState("");
  const [estimationAnswer, setEstimationAnswer] = useState("");
  const [estimationCorrect, setEstimationCorrect] = useState<boolean | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);

  // Stuck-recovery panel state.
  const [stuckOpen, setStuckOpen] = useState(false);
  const [stuckMove, setStuckMove] = useState<StuckMove | null>(null);
  const [stuckTriedInSession, setStuckTriedInSession] = useState<string[]>([]);

  // Outcome bookkeeping for the distill stage.
  const [pendingOutcome, setPendingOutcome] = useState<LabSolve["outcome"]>("solved");

  // ── hydration ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setCompletedIds(readJSON<string[]>(LS_ROADMAP_COMPLETED, []));
    setProblemsSolved(readJSON<Record<string, number[]>>(LS_ROADMAP_SOLVED, {}));
    setSolves(readJSON<LabSolve[]>(LS_SOLVES, []));
    setReviews(readJSON<InsightReview[]>(LS_REVIEWS, []));
    setStuckLog(readJSON<StuckMoveLog[]>(LS_STUCK_LOG, []));
    const m = (localStorage.getItem(LS_MODE) as Mode | null) ?? "mixed";
    setMode(MODES.includes(m) ? m : "mixed");
    setHydrated(true);
  }, []);

  // Re-read roadmap state if the user toggled problems in another tab/page.
  useEffect(() => {
    function onProgress() {
      setCompletedIds(readJSON<string[]>(LS_ROADMAP_COMPLETED, []));
      setProblemsSolved(readJSON<Record<string, number[]>>(LS_ROADMAP_SOLVED, {}));
    }
    window.addEventListener("roadmap-progress-changed", onProgress);
    window.addEventListener("storage", onProgress);
    return () => {
      window.removeEventListener("roadmap-progress-changed", onProgress);
      window.removeEventListener("storage", onProgress);
    };
  }, []);

  // Live timer — 1Hz tick while we're in the SOLVE stage.
  useEffect(() => {
    if (stage !== "solve") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [stage]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const mastery = useMemo(
    () => buildMastery(completedIds, problemsSolved),
    [completedIds, problemsSolved],
  );
  const solveCounts = useMemo(() => computeSolveCounts(solves), [solves]);
  const solvedIdSet = useMemo(
    () => new Set(solves.filter((s) => s.outcome === "solved").map((s) => s.problemId)),
    [solves],
  );
  const due = useMemo(() => dueInsights(reviews, now), [reviews, now]);

  const modeCatalog = useMemo(() => catalogForMode(mode), [mode]);

  // Up-next preview — for the footer.
  const upNext = useMemo(() => {
    if (mode === "review") return [];
    const queue = getEligibleProblems(modeCatalog, mastery, solveCounts).filter(
      (p) => !solvedIdSet.has(p.id) && p.id !== activeProblemId,
    );
    return queue.slice(0, 3);
  }, [modeCatalog, mastery, solveCounts, solvedIdSet, activeProblemId, mode]);

  // The current problem displayed in the SOLVE area.
  const activeProblem: LabProblem | null = activeProblemId
    ? LAB_PROBLEMS_BY_ID[activeProblemId] ?? null
    : null;

  // ── Persistence helpers ────────────────────────────────────────────────────
  function persistSolves(next: LabSolve[]) {
    setSolves(next);
    writeJSON(LS_SOLVES, next);
  }
  function persistReviews(next: InsightReview[]) {
    setReviews(next);
    writeJSON(LS_REVIEWS, next);
  }
  function persistStuckLog(next: StuckMoveLog[]) {
    setStuckLog(next);
    writeJSON(LS_STUCK_LOG, next);
  }
  function persistMode(next: Mode) {
    setMode(next);
    localStorage.setItem(LS_MODE, next);
  }

  // ── Attempt lifecycle ──────────────────────────────────────────────────────
  function resetAttemptInputs() {
    setFrameText("");
    setApproachText("");
    setTakeawayText("");
    setEstimationAnswer("");
    setEstimationCorrect(null);
    setStartedAt(null);
    setHintsUsed(0);
    setStuckOpen(false);
    setStuckMove(null);
    setStuckTriedInSession([]);
  }

  // Pick the next problem to attempt and prime the attempt state. Accepts
  // optional overrides for the just-persisted state — needed because React
  // state updates are batched and the bare closure references stale values
  // mid-handler. Without these we'd surface the same review-due insight or
  // already-solved problem on the very next card.
  function loadNextProblem(
    overrides?: {
      reviews?: InsightReview[];
      solves?: LabSolve[];
      mode?: Mode;
    },
  ) {
    resetAttemptInputs();
    setActiveReviewId(null);
    const effectiveMode = overrides?.mode ?? mode;
    const effectiveReviews = overrides?.reviews ?? reviews;
    const effectiveSolves = overrides?.solves ?? solves;
    const effectiveSolveCounts = overrides?.solves
      ? computeSolveCounts(effectiveSolves)
      : solveCounts;
    const effectiveSolvedIds = overrides?.solves
      ? new Set(
          effectiveSolves
            .filter((s) => s.outcome === "solved")
            .map((s) => s.problemId),
        )
      : solvedIdSet;
    const effectiveCatalog = overrides?.mode
      ? catalogForMode(effectiveMode)
      : modeCatalog;

    if (effectiveMode === "review") {
      const dueNow = dueInsights(effectiveReviews, Date.now());
      const review = dueNow[0];
      if (!review) {
        setActiveProblemId(null);
        setStage("frame");
        return;
      }
      const card = buildReviewCard(review, LAB_PROBLEMS);
      if (!card || !card.problem) {
        // Concept-only — nothing to solve. Mark the active review id but no
        // problem; render concept and let the user rate without solving.
        setActiveReviewId(review.insightId);
        setActiveProblemId(null);
        setStage("done");
        return;
      }
      setActiveReviewId(review.insightId);
      setActiveProblemId(card.problem.id);
      // Algo cards start at frame; puzzle/estimation start at approach (single artifact).
      setStage((card.problem.kind ?? "algo") === "algo" ? "frame" : "approach");
      return;
    }
    const next = getNextProblem(
      effectiveCatalog,
      mastery,
      effectiveSolveCounts,
      effectiveSolvedIds,
    );
    if (!next) {
      setActiveProblemId(null);
      setStage("frame");
      return;
    }
    setActiveProblemId(next.id);
    setStage((next.kind ?? "algo") === "algo" ? "frame" : "approach");
  }

  // Whenever the mode changes (or after hydration), pick a problem.
  useEffect(() => {
    if (!hydrated) return;
    // If the active problem is already a match for the new mode, keep it.
    if (activeProblem) {
      const ok =
        mode === "mixed" ||
        mode === "review" ||
        (mode === "algo" && (activeProblem.kind ?? "algo") === "algo") ||
        (mode === "puzzle" && activeProblem.kind === "puzzle") ||
        (mode === "estimation" && activeProblem.kind === "estimation");
      if (ok && mode !== "review") return;
    }
    loadNextProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);

  function handleStartSolving() {
    setStartedAt(Date.now());
    setNow(Date.now());
    setStage("solve");
  }

  function elapsedMinutes(): number {
    if (!startedAt) return 0;
    return Math.max(0, (Date.now() - startedAt) / 60_000);
  }

  function recordSolve(outcome: LabSolve["outcome"]) {
    if (!activeProblem) return;
    setPendingOutcome(outcome);
    if (outcome === "skipped") {
      // Skip: no distill. Write a minimal solve record and move on.
      const solve: LabSolve = {
        problemId: activeProblem.id,
        frameArtifact: frameText.trim(),
        approachGuess: approachText.trim(),
        outcome: "skipped",
        elapsedMin: Math.round(elapsedMinutes() * 10) / 10,
        hintsUsed,
        insight: "",
        ts: Date.now(),
      };
      const nextSolves = [...solves, solve];
      persistSolves(nextSolves);
      // Reviews don't get introduced on skip. Move forward.
      loadNextProblem({ solves: nextSolves });
      return;
    }
    setStage("distill");
  }

  function saveDistilledAndAdvance(rating?: ReviewRating) {
    if (!activeProblem) return;
    const solve: LabSolve = {
      problemId: activeProblem.id,
      frameArtifact: frameText.trim(),
      approachGuess: approachText.trim(),
      outcome: pendingOutcome,
      elapsedMin: Math.round(elapsedMinutes() * 10) / 10,
      hintsUsed,
      insight: takeawayText.trim(),
      ts: Date.now(),
      ...(activeProblem.kind === "estimation"
        ? {
            userAnswer: estimationAnswer.trim(),
            answerCorrect: estimationCorrect ?? false,
          }
        : {}),
    };
    const nextSolves = [...solves, solve];

    // Introduce new insights into the SR system (only on solved).
    let nextReviews = reviews;
    if (solve.outcome === "solved") {
      const newIds = newInsightsFromSolve(solve, activeProblem, reviews);
      if (newIds.length > 0) {
        const ts = Date.now();
        nextReviews = [...reviews, ...newIds.map((id) => initReview(id, ts))];
      }
    }

    // If this was a review card, apply the SR rating to the active insight.
    if (activeReviewId && rating) {
      nextReviews = nextReviews.map((r) =>
        r.insightId === activeReviewId
          ? { ...applyReview(r, rating), lastProblemId: activeProblem.id }
          : r,
      );
    }

    persistSolves(nextSolves);
    if (nextReviews !== reviews) persistReviews(nextReviews);
    loadNextProblem({ solves: nextSolves, reviews: nextReviews });
  }

  // ── Stuck-recovery ─────────────────────────────────────────────────────────
  function openStuckPanel() {
    if (!activeProblem) return;
    const move = getRecommendedMove(stuckLog, STUCK_MOVES, stuckTriedInSession);
    setStuckMove(move);
    setStuckOpen(true);
  }

  function tryAnotherMove() {
    if (!activeProblem) return;
    const excluded = stuckMove
      ? [...stuckTriedInSession, stuckMove.id]
      : stuckTriedInSession;
    setStuckTriedInSession(excluded);
    const move = getRecommendedMove(stuckLog, STUCK_MOVES, excluded);
    setStuckMove(move);
  }

  function rateStuckMove(worked: boolean) {
    if (!activeProblem || !stuckMove) return;
    const entry: StuckMoveLog = {
      problemId: activeProblem.id,
      moveId: stuckMove.id,
      worked,
      ts: Date.now(),
    };
    persistStuckLog([...stuckLog, entry]);
    setHintsUsed((h) => h + 1);
    if (worked) {
      // Close the panel — back to the problem.
      setStuckOpen(false);
      setStuckMove(null);
    } else {
      // Mark this move as tried and surface another.
      tryAnotherMove();
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetLab() {
    if (!confirm("Reset all Lab progress? (This clears solves, reviews, and stuck-move stats.)")) return;
    localStorage.removeItem(LS_SOLVES);
    localStorage.removeItem(LS_REVIEWS);
    localStorage.removeItem(LS_STUCK_LOG);
    setSolves([]);
    setReviews([]);
    setStuckLog([]);
    resetAttemptInputs();
    setActiveReviewId(null);
    // Re-pick immediately using freshly-empty state so we don't surface a
    // problem the user just "solved" in the now-cleared log.
    loadNextProblem({ solves: [], reviews: [] });
  }

  if (!hydrated) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solving Lab</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Train transfer · not algorithms
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <span className="text-sm text-zinc-400 tabular-nums">
            <strong className={due.length > 0 ? "text-amber-400" : "text-zinc-500"}>
              {due.length}
            </strong>
            <span className="text-zinc-600"> due</span>
          </span>
          <span className="text-sm text-zinc-400 tabular-nums">
            <strong className="text-emerald-400">{solveCounts["warm-up"] + solveCounts.standard + solveCounts.stretch}</strong>
            <span className="text-zinc-600"> solved</span>
          </span>
          <Link
            href="/roadmap"
            className="btn-ghost text-xs px-2 py-1 text-zinc-600 hover:text-zinc-400 no-underline"
          >
            ← Roadmap
          </Link>
          <button
            onClick={resetLab}
            className="btn-ghost text-xs px-2 py-1 text-zinc-600 hover:text-zinc-400"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Mode chips */}
      <div className="flex overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 w-fit">
        {MODES.map((m, i) => {
          const active = mode === m;
          const dueCount = m === "review" ? due.length : 0;
          return (
            <button
              key={m}
              onClick={() => persistMode(m)}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors",
                i < MODES.length - 1 ? "border-r border-zinc-700" : "",
                active
                  ? m === "review"
                    ? "bg-amber-950/80 text-amber-400"
                    : "bg-emerald-950/80 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
              ].join(" ")}
            >
              {MODE_LABEL[m]}
              {m === "review" && dueCount > 0 && (
                <span className={`ml-1.5 tabular-nums ${active ? "text-amber-300" : "text-amber-500"}`}>
                  ({dueCount})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="divider" />

      {/* Empty state — no eligible problem in this mode */}
      {!activeProblem && !activeReviewId && (
        <div className="card px-5 py-8 text-center">
          <p className="text-sm text-zinc-400 leading-relaxed">
            No eligible problems in this mode.
            {mode === "algo" && (
              <> Complete more roadmap modules to unlock new Lab problems, or switch modes — puzzles and estimation need no prereqs.</>
            )}
            {mode === "review" && (
              <> Nothing due for review right now. Solve a few problems to add insights to the SR queue.</>
            )}
            {(mode === "puzzle" || mode === "estimation" || mode === "mixed") && (
              <> Try another mode.</>
            )}
          </p>
        </div>
      )}

      {/* Review concept-only fallback (no tagged problem available) */}
      {!activeProblem && activeReviewId && (
        <ConceptOnlyReview
          insightId={activeReviewId}
          onRate={(rating) => {
            const next = reviews.map((r) =>
              r.insightId === activeReviewId ? applyReview(r, rating) : r,
            );
            persistReviews(next);
            loadNextProblem({ reviews: next });
          }}
        />
      )}

      {/* Active problem */}
      {activeProblem && (
        <div className="card px-5 py-5 space-y-5">
          {activeReviewId && (
            <ReviewBanner insightId={activeReviewId} />
          )}

          <ProblemHeader problem={activeProblem} stage={stage} />

          {/* Stage UI */}
          {stage === "frame" && (
            <FrameStage
              value={frameText}
              onChange={setFrameText}
              onContinue={() => setStage("approach")}
            />
          )}

          {stage === "approach" && (
            <ApproachStage
              problem={activeProblem}
              value={approachText}
              onChange={setApproachText}
              onStart={handleStartSolving}
            />
          )}

          {stage === "solve" && (
            <SolveStage
              problem={activeProblem}
              startedAt={startedAt}
              now={now}
              hintsUsed={hintsUsed}
              onSolved={() => recordSolve("solved")}
              onGaveUp={() => recordSolve("gave-up")}
              onSkip={() => recordSolve("skipped")}
              onStuck={openStuckPanel}
              estimationAnswer={estimationAnswer}
              setEstimationAnswer={setEstimationAnswer}
              estimationCorrect={estimationCorrect}
              onSubmitEstimation={() => {
                const ok = gradeEstimation(activeProblem, estimationAnswer);
                setEstimationCorrect(ok);
                setPendingOutcome(ok ? "solved" : "gave-up");
                setStage("distill");
              }}
            />
          )}

          {stage === "distill" && (
            <DistillStage
              problem={activeProblem}
              takeaway={takeawayText}
              onChange={setTakeawayText}
              estimationCorrect={estimationCorrect}
              estimationAnswer={estimationAnswer}
              outcome={pendingOutcome}
              isReview={Boolean(activeReviewId)}
              onSave={() => {
                if (activeReviewId) {
                  // Review cards need a rating — handled in the rating row.
                  return;
                }
                saveDistilledAndAdvance();
              }}
              onRate={(rating) => saveDistilledAndAdvance(rating)}
            />
          )}

          {/* Stuck panel — appears on top of the SOLVE stage */}
          {stuckOpen && stage === "solve" && (
            <StuckPanel
              move={stuckMove}
              onClose={() => setStuckOpen(false)}
              onWorked={() => rateStuckMove(true)}
              onStillStuck={() => rateStuckMove(false)}
              onAnother={tryAnotherMove}
            />
          )}
        </div>
      )}

      {/* Up next */}
      {mode !== "review" && upNext.length > 0 && (
        <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-zinc-700">Up next ({upNext.length}):</span>
          {upNext.map((p) => (
            <span key={p.id} className="text-zinc-500">
              · {p.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
