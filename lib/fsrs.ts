// FSRS-5 with modifications for procedural-skill (LeetCode) practice.
// Notes:
//   - Day-1 learning step is applied ONLY at first encounter (not on subsequent reviews).
//   - Difficulty mean-reverts toward the LC-tagged difficulty, not a global constant.
//   - Time-aware adjustment applies on first encounter and on reviews.
//   - Lapse forces S_new ≤ max(S₀, 0.3 × S_old).

export type Grade = 1 | 2 | 3 | 4; // 1=Lapse, 2=Hard, 3=Good, 4=Easy

export const TARGET_RETENTION = 0.85;
const FACTOR = 0.235;
const DECAY = -0.5;

const PROCEDURAL_INIT_S = [0.4, 1.18, 3.17, 6.0] as const;
const W = {
  difficultyDelta: -1.46,
  difficultyMeanReversion: 0.0046,
  stabilityScale: Math.exp(1.55),
  stabilityDecay: -0.12,
  stabilityRecall: 1.02,
  hardPenalty: 0.23,
  easyBonus: 2.99,
  lapseScale: 1.94,
  lapseDifficulty: -0.11,
  lapseStability: 0.30,
  lapseRecall: 2.27,
};

// Default expected solve times per LC difficulty (overridden once user has 5+ samples).
const EXPECTED_MIN_DEFAULT: Record<"Easy" | "Medium" | "Hard", number> = {
  Easy: 12, Medium: 25, Hard: 45,
};

// Mean-reversion target for difficulty per LC difficulty (avoids drift toward Easy).
const DIFFICULTY_TARGET: Record<"Easy" | "Medium" | "Hard", number> = {
  Easy: 3, Medium: 5, Hard: 7,
};

const FLOOR_S = 0.1;

export function recallProbability(stabilityDays: number, elapsedDays: number): number {
  if (stabilityDays <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stabilityDays, DECAY);
}

export function intervalForStability(stability: number, target = TARGET_RETENTION): number {
  return (stability / FACTOR) * (Math.pow(target, 1 / DECAY) - 1);
}

export function initialDifficulty(grade: Grade): number {
  const d = 7.19 - Math.exp(0.53 * (grade - 1)) + 1;
  return clamp(d, 1, 10);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export interface ReviewInput {
  // null on first encounter
  stability: number | null;
  difficulty: number | null;
  elapsedDays: number;
  grade: Grade;
  reps: number;
  // For time-aware adjustment + auto-promote
  elapsedMinutes: number;
  expectedMinutes?: number; // user-calibrated; falls back to defaults
  lcDifficulty: "Easy" | "Medium" | "Hard";
  // Pattern stability bleed-in (decimal fraction of S to add as a floor)
  patternStability?: number;
}

export interface ReviewOutput {
  stability: number;
  difficulty: number;
  intervalDays: number;
  effectiveGrade: Grade; // after auto-promote
  isLapse: boolean;
}

export function applyReview(input: ReviewInput): ReviewOutput {
  // Validate input.
  if (!Number.isFinite(input.elapsedMinutes) || input.elapsedMinutes < 0) {
    throw new Error(`invalid elapsedMinutes: ${input.elapsedMinutes}`);
  }
  if (!Number.isFinite(input.elapsedDays) || input.elapsedDays < 0) {
    throw new Error(`invalid elapsedDays: ${input.elapsedDays}`);
  }
  if (![1, 2, 3, 4].includes(input.grade)) {
    throw new Error(`invalid grade: ${input.grade}`);
  }

  const expected = input.expectedMinutes ?? EXPECTED_MIN_DEFAULT[input.lcDifficulty];
  let grade = input.grade;

  // Auto-promote: grade=Good + Medium/Hard + elapsed < 70% expected → Easy
  if (grade === 3 && input.lcDifficulty !== "Easy" && input.elapsedMinutes < 0.7 * expected) {
    grade = 4;
  }

  // Time-aware adjustment factor (used in both first-encounter and review paths).
  const ratio = input.elapsedMinutes / expected;
  const adjustment = clamp(2 - ratio, 0.6, 1.5);

  // First encounter: initialize from grade, day-1 cap on the next interval.
  if (input.stability === null || input.difficulty === null) {
    const baseS0 = PROCEDURAL_INIT_S[grade - 1];
    const D0 = initialDifficulty(grade);
    // Apply time-aware adjustment to initial stability for non-lapse grades.
    const S0 = grade === 1 ? baseS0 : Math.max(FLOOR_S, baseS0 * adjustment);
    // Day-1 cap: 1 day for lapse/struggled, 2 days for good/easy.
    const interval = grade <= 2 ? 1 : 2;
    return { stability: S0, difficulty: D0, intervalDays: interval, effectiveGrade: grade, isLapse: grade === 1 };
  }

  const S = input.stability;
  const D = input.difficulty;
  const R = recallProbability(S, input.elapsedDays);
  const isLapse = grade === 1;

  // Update difficulty: mean-revert toward LC-tagged target (not a global constant).
  const D_target = DIFFICULTY_TARGET[input.lcDifficulty];
  const D_prime = D + (W.difficultyDelta * (grade - 3) * (10 - D)) / 9;
  let D_new = W.difficultyMeanReversion * D_target + (1 - W.difficultyMeanReversion) * D_prime;
  D_new = clamp(D_new, 1, 10);

  // Update stability.
  let S_calculated: number;
  if (isLapse) {
    const lapseFormula =
      W.lapseScale *
      Math.pow(D, W.lapseDifficulty) *
      (Math.pow(S + 1, W.lapseStability) - 1) *
      Math.exp(W.lapseRecall * (1 - R));
    // Cap at max(S₀, 0.3 × S_old) — lapse can't leave stability higher than 30%.
    const lapseCap = Math.max(PROCEDURAL_INIT_S[0], 0.3 * S);
    S_calculated = Math.min(lapseFormula, lapseCap);
  } else {
    const hardMul = grade === 2 ? W.hardPenalty : 1;
    const easyMul = grade === 4 ? W.easyBonus : 1;
    const growth =
      W.stabilityScale *
      (11 - D_new) *
      Math.pow(S, W.stabilityDecay) *
      (Math.exp(W.stabilityRecall * (1 - R)) - 1) *
      hardMul *
      easyMul;
    S_calculated = S * (1 + growth);
  }

  // Time-aware stability adjustment (non-lapse only).
  let S_new = isLapse ? S_calculated : S + (S_calculated - S) * adjustment;

  // Pattern stability bleed: floor S_new at 10% of pattern stability (non-lapse only).
  if (!isLapse && input.patternStability) {
    S_new = Math.max(S_new, 0.1 * input.patternStability);
  }

  S_new = Math.max(S_new, FLOOR_S);

  // NOTE: we deliberately do NOT re-apply the day-1 cap here. The day-1 cap is the
  // interval AFTER the first encounter; once we're in this branch we're past it.
  const interval = intervalForStability(S_new);

  return { stability: S_new, difficulty: D_new, intervalDays: interval, effectiveGrade: grade, isLapse };
}

// Pattern-level update: fold individual problem stability into pattern stability.
// Weight scales with pattern maturity — small N → higher weight (faster initial calibration),
// large N → lower weight (smoother updates).
export function updatePatternStability(
  currentPatternS: number,
  problemS_new: number,
  patternProblemCount: number,
): number {
  const weight = Math.max(0.05, Math.min(0.3, 1 / (patternProblemCount + 2)));
  return currentPatternS * (1 - weight) + problemS_new * weight;
}
