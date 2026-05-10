// FSRS-5 with four modifications for procedural-skill (LeetCode) practice.
// See README "Algorithm" section for derivation.

export type Grade = 1 | 2 | 3 | 4; // 1=Saw solution, 2=Struggled, 3=Good, 4=Easy

export const TARGET_RETENTION = 0.85;
const FACTOR = 0.235;
const DECAY = -0.5;

const PROCEDURAL_INIT_S = [0.4, 1.18, 3.17, 6.0];
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

const EXPECTED_MIN: Record<string, number> = {
  Easy: 12, Medium: 25, Hard: 45,
};

export function recallProbability(stabilityDays: number, elapsedDays: number): number {
  return Math.pow(1 + FACTOR * elapsedDays / stabilityDays, DECAY);
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
  expectedMinutes?: number; // user-calibrated; falls back to default
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
  const expected = input.expectedMinutes ?? EXPECTED_MIN[input.lcDifficulty];
  let grade = input.grade;

  // Mod 4: auto-promote to Easy if fast enough on Medium/Hard with grade=3
  if (grade === 3 && input.lcDifficulty !== "Easy" && input.elapsedMinutes < 0.7 * expected) {
    grade = 4;
  }

  // First encounter: initialize
  if (input.stability === null || input.difficulty === null) {
    const S0 = PROCEDURAL_INIT_S[grade - 1];
    const D0 = initialDifficulty(grade);
    // Mod 2: day-1 learning step
    const interval = grade <= 2 ? 1 : 2;
    return { stability: S0, difficulty: D0, intervalDays: interval, effectiveGrade: grade, isLapse: grade === 1 };
  }

  const S = input.stability;
  const D = input.difficulty;
  const R = recallProbability(S, input.elapsedDays);
  const isLapse = grade === 1;

  // Update difficulty (mean-revert toward Easy init for grade 4)
  const D_easy = initialDifficulty(4);
  const D_prime = D + W.difficultyDelta * (grade - 3) * (10 - D) / 9;
  let D_new = W.difficultyMeanReversion * D_easy + (1 - W.difficultyMeanReversion) * D_prime;
  D_new = clamp(D_new, 1, 10);

  // Update stability
  let S_calculated: number;
  if (isLapse) {
    // Mod 5 (vs original spec): harder lapse reset — not just capped, actively reduced
    const lapseFormula = W.lapseScale * Math.pow(D, W.lapseDifficulty) * (Math.pow(S + 1, W.lapseStability) - 1) * Math.exp(W.lapseRecall * (1 - R));
    S_calculated = Math.min(lapseFormula, Math.max(PROCEDURAL_INIT_S[0], 0.3 * S));
  } else {
    const hardMul = grade === 2 ? W.hardPenalty : 1;
    const easyMul = grade === 4 ? W.easyBonus : 1;
    const growth = W.stabilityScale * (11 - D_new) * Math.pow(S, W.stabilityDecay) * (Math.exp(W.stabilityRecall * (1 - R)) - 1) * hardMul * easyMul;
    S_calculated = S * (1 + growth);
  }

  // Mod 3: time-aware stability adjustment
  const ratio = input.elapsedMinutes / expected;
  const adjustment = clamp(2 - ratio, 0.6, 1.5);
  let S_new = isLapse ? S_calculated : S + (S_calculated - S) * adjustment;

  // Pattern stability bleed: floor S_new at 10% of pattern stability (post-lapse only on non-lapse)
  if (!isLapse && input.patternStability) {
    S_new = Math.max(S_new, 0.1 * input.patternStability);
  }

  S_new = Math.max(S_new, 0.1); // floor

  // Day-1 cap on second review if reps==1
  let interval = intervalForStability(S_new);
  if (input.reps === 1) {
    interval = Math.min(interval, grade <= 2 ? 1 : 2);
  }

  return { stability: S_new, difficulty: D_new, intervalDays: interval, effectiveGrade: grade, isLapse };
}

// Pattern-level update: fold individual problem stability into pattern stability
export function updatePatternStability(currentPatternS: number, problemS_new: number, weight = 0.15): number {
  return currentPatternS * (1 - weight) + problemS_new * weight;
}
