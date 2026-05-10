// Sanity tests for FSRS-5 + procedural-skill modifications.
// Run: npx tsx lib/fsrs.test.ts
//
// These are not exhaustive — they cover the cases most likely to break.

import { applyReview, intervalForStability, recallProbability, TARGET_RETENTION } from "./fsrs";

let failures = 0;
function check(label: string, ok: boolean, details?: string) {
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status}  ${label}${details ? ` — ${details}` : ""}`);
  if (!ok) failures++;
}

function approx(a: number, b: number, tol = 0.05) {
  return Math.abs(a - b) <= tol;
}

// 1. Recall probability hits 85% at S days when target=0.85.
{
  const interval = intervalForStability(10, 0.85);
  const R = recallProbability(10, interval);
  check("intervalForStability rounds to target retention", approx(R, 0.85, 0.001), `R=${R.toFixed(3)} interval=${interval.toFixed(2)}d`);
}

// 2. Day-1 cap on first encounter only.
{
  const r = applyReview({
    stability: null, difficulty: null, elapsedDays: 0, grade: 4, reps: 0,
    elapsedMinutes: 25, lcDifficulty: "Medium",
  });
  check("first encounter Easy → 2-day cap", r.intervalDays === 2, `got ${r.intervalDays}d`);
  check("first encounter Easy → S₀ ~ 6.0 × adjustment", r.stability >= 4.5 && r.stability <= 9.5, `S=${r.stability.toFixed(2)}`);
}
{
  const r = applyReview({
    stability: null, difficulty: null, elapsedDays: 0, grade: 1, reps: 0,
    elapsedMinutes: 50, lcDifficulty: "Medium",
  });
  check("first encounter Lapse → 1-day cap", r.intervalDays === 1, `got ${r.intervalDays}d`);
}

// 3. Second review (reps=1) does NOT apply day-1 cap.
{
  const r = applyReview({
    stability: 6, difficulty: 5, elapsedDays: 2, grade: 3, reps: 1,
    elapsedMinutes: 20, lcDifficulty: "Medium",
  });
  check("second review NOT capped to 2 days", r.intervalDays > 2, `got ${r.intervalDays.toFixed(2)}d`);
}

// 4. Auto-promote: fast Good on Medium → treated as Easy.
{
  const slow = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 25, lcDifficulty: "Medium",
  });
  const fast = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 10, lcDifficulty: "Medium", // < 0.7 × 25
  });
  check("fast Good → auto-promoted to Easy (effective grade 4)", fast.effectiveGrade === 4);
  check("auto-promote produces larger stability gain", fast.stability > slow.stability, `fast=${fast.stability.toFixed(2)} slow=${slow.stability.toFixed(2)}`);
}

// 5. Lapse caps stability at max(S₀, 0.3 × S_old).
{
  const r = applyReview({
    stability: 20, difficulty: 5, elapsedDays: 30, grade: 1, reps: 5,
    elapsedMinutes: 40, lcDifficulty: "Medium",
  });
  check("lapse from S=20 → S_new ≤ 0.3 × 20 = 6", r.stability <= 6.0001, `S=${r.stability.toFixed(2)}`);
  check("lapse marks isLapse=true", r.isLapse === true);
}

// 6. Hard penalty reduces stability growth vs Good.
{
  const good = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 25, lcDifficulty: "Medium",
  });
  const hard = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 2, reps: 2,
    elapsedMinutes: 25, lcDifficulty: "Medium",
  });
  check("Hard rating < Good stability growth", hard.stability < good.stability);
}

// 7. Time-aware adjustment: faster solve → bigger growth.
{
  const slow = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 30, lcDifficulty: "Medium",
  });
  const fast = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 18, lcDifficulty: "Medium", // not auto-promoted (>0.7×25=17.5)
  });
  check("faster solve → larger or equal stability", fast.stability >= slow.stability, `fast=${fast.stability.toFixed(2)} slow=${slow.stability.toFixed(2)}`);
}

// 8. Difficulty mean-reverts toward LC tagged difficulty.
// Use elapsedMinutes high enough that auto-promote doesn't fire on Hard
// (auto-promote threshold for Hard is 0.7 × 45 = 31.5 min).
{
  const easy = applyReview({
    stability: 5, difficulty: 8, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 50, lcDifficulty: "Easy",
  });
  const hard = applyReview({
    stability: 5, difficulty: 8, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 50, lcDifficulty: "Hard",
  });
  check("Easy LC tag pulls D toward 3 faster than Hard tag pulls toward 7", easy.difficulty < hard.difficulty, `easy=${easy.difficulty.toFixed(3)} hard=${hard.difficulty.toFixed(3)}`);
}

// 9. Pattern stability bleed floors S_new.
{
  const noPattern = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 25, lcDifficulty: "Medium",
  });
  const withPattern = applyReview({
    stability: 5, difficulty: 5, elapsedDays: 5, grade: 3, reps: 2,
    elapsedMinutes: 25, lcDifficulty: "Medium",
    patternStability: 100, // 10% = 10d floor
  });
  check("strong pattern stability raises floor on weak problem update", withPattern.stability >= 10, `S=${withPattern.stability.toFixed(2)}`);
  check("no-pattern baseline lower than floored", withPattern.stability >= noPattern.stability);
}

// 10. Validation: bad inputs throw.
{
  let threw = false;
  try {
    applyReview({ stability: 5, difficulty: 5, elapsedDays: -1, grade: 3, reps: 2, elapsedMinutes: 25, lcDifficulty: "Medium" });
  } catch { threw = true; }
  check("negative elapsedDays throws", threw);
}

console.log(`\n${failures === 0 ? "✓ all passed" : `✗ ${failures} failed`}`);
process.exit(failures === 0 ? 0 : 1);
