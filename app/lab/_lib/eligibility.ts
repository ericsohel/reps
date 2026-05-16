import type { LabProblem, LabDifficulty } from "../_data/types";

// Filter a Lab problem catalog to only those the user is qualified to attempt.
// Mastery map: { [moduleId]: isModuleDone }. A problem is eligible iff every
// requiredModule is true.
//
// Ordering policy (the function returns problems in queue order):
//   Phase A) warm-up first (until the user has solved 3 at warm-up difficulty)
//   Phase B) once warm-up >= 3, prioritize standard
//   Phase C) once standard > 5, mix in stretch
// Within each difficulty band, higher transferDistance comes first (the harder
// transfer is the better training — that's the whole point of the Lab).
// Tie-break: lower estMinutes first (build momentum).
//
// Pure: no side effects, no localStorage, fully deterministic from inputs.

// Phase thresholds — exported so the UI can render progression markers.
export const MIN_WARMUP_BEFORE_STANDARD = 3;
export const MIN_STANDARD_BEFORE_STRETCH = 5;

type DifficultyCounts = Record<LabDifficulty, number>;

// Default solve counts when caller doesn't pass any (first-time Lab user).
const EMPTY_COUNTS: DifficultyCounts = {
  "warm-up": 0,
  standard: 0,
  stretch: 0,
};

/**
 * True iff every required module is marked done in the mastery map.
 * Missing keys are treated as `false` (NOT mastered) — matches the roadmap's
 * `isModuleDone` semantics (foundations is the only always-true module and
 * the roadmap already returns true for it, so callers see it as `true` here).
 */
export function isProblemEligible(
  problem: LabProblem,
  mastery: Record<string, boolean>,
): boolean {
  // === instead of !! to make "missing key" and "explicit false" identical.
  for (const moduleId of problem.requiredModules) {
    if (mastery[moduleId] !== true) return false;
  }
  return true;
}

/**
 * Rank a difficulty band into the queue order. Lower number = earlier.
 *   Phase A (warm-up < 3 solved): warm-up → standard → stretch
 *   Phase B (warm-up >= 3, standard <= 5): standard → warm-up → stretch
 *   Phase C (standard > 5): standard → stretch → warm-up
 *
 * Note: in Phase B/C we keep warm-up reachable so users who unlock new
 * prereqs later still see the warm-ups for that new module, just deprioritized.
 */
function difficultyRank(
  difficulty: LabDifficulty,
  counts: DifficultyCounts,
): number {
  const inPhaseA = counts["warm-up"] < MIN_WARMUP_BEFORE_STANDARD;
  const inPhaseC = counts.standard > MIN_STANDARD_BEFORE_STRETCH;

  if (inPhaseA) {
    // Phase A: onboarding to the Lab itself.
    if (difficulty === "warm-up") return 0;
    if (difficulty === "standard") return 1;
    return 2; // stretch — gated until Phase C ideally, but still surfaceable
  }

  if (!inPhaseC) {
    // Phase B: bread-and-butter training.
    if (difficulty === "standard") return 0;
    if (difficulty === "warm-up") return 1;
    return 2;
  }

  // Phase C: mix in stretch.
  if (difficulty === "standard") return 0;
  if (difficulty === "stretch") return 1;
  return 2;
}

/**
 * Compare two problems for queue order. Lower (earlier) is "better next".
 *   1) phase-aware difficulty rank
 *   2) higher transferDistance first (harder transfer = better training)
 *   3) lower estMinutes first (momentum)
 *   4) stable by id for deterministic output
 */
function compareForQueue(
  a: LabProblem,
  b: LabProblem,
  counts: DifficultyCounts,
): number {
  const rankA = difficultyRank(a.difficulty, counts);
  const rankB = difficultyRank(b.difficulty, counts);
  if (rankA !== rankB) return rankA - rankB;

  // Higher transferDistance first → negate the diff.
  if (a.transferDistance !== b.transferDistance) {
    return b.transferDistance - a.transferDistance;
  }

  if (a.estMinutes !== b.estMinutes) return a.estMinutes - b.estMinutes;

  return a.id.localeCompare(b.id);
}

/**
 * Filter to eligible problems and return them in queue order.
 * Pure: never mutates the input array.
 */
export function getEligibleProblems(
  problems: readonly LabProblem[],
  mastery: Record<string, boolean>,
  solveCountByDifficulty?: Record<"warm-up" | "standard" | "stretch", number>,
): LabProblem[] {
  if (problems.length === 0) return [];

  const counts: DifficultyCounts = solveCountByDifficulty
    ? {
        "warm-up": solveCountByDifficulty["warm-up"] ?? 0,
        standard: solveCountByDifficulty.standard ?? 0,
        stretch: solveCountByDifficulty.stretch ?? 0,
      }
    : EMPTY_COUNTS;

  // Copy first (readonly + don't mutate input), then filter + sort.
  return problems
    .filter((p) => isProblemEligible(p, mastery))
    .slice()
    .sort((a, b) => compareForQueue(a, b, counts));
}

/**
 * Return the next problem the user should attempt: the first eligible problem
 * in queue order that hasn't already been solved. Null if none remain.
 */
export function getNextProblem(
  problems: readonly LabProblem[],
  mastery: Record<string, boolean>,
  solveCountByDifficulty: Record<"warm-up" | "standard" | "stretch", number> | undefined,
  alreadySolvedIds: Set<string>,
): LabProblem | null {
  const queue = getEligibleProblems(problems, mastery, solveCountByDifficulty);
  for (const p of queue) {
    if (!alreadySolvedIds.has(p.id)) return p;
  }
  return null;
}
