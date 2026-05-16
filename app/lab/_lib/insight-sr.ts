// Insight-level spaced repetition for the Solving Lab.
//
// We implement a simplified SM-2 variant tuned for "insight recall + transfer"
// rather than vocabulary recall. The user rates how well they recognized the
// underlying insight when shown a FRESH problem tagged with it — not whether
// they memorized a fact.
//
// All functions are pure (no localStorage, no globals). The Lab UI threads
// state in/out itself.

import type { Insight, InsightReview, LabProblem, LabSolve } from "../_data/types";
import { INSIGHTS_BY_ID } from "../_data/insights";

export type ReviewRating = "again" | "hard" | "good" | "easy";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// SM-2 variant tuning. Defaults match Anki's "starting ease" but the
// good/easy multipliers are slightly compressed: insight recall on a fresh
// problem is harder than vocabulary, so we want shorter intervals early on
// and more aggressive ease decay on failure.
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const HARD_MULT = 1.2;
const EASY_BONUS = 1.3;
const FIRST_INTERVAL_DAYS = 1;

// If we can't find an alternative problem for an insight, allow repeating
// the lastProblemId after this many days. Long enough that the user has
// likely forgotten the exact problem text.
const REPEAT_FALLBACK_DAYS = 30;

// ── Core SR functions ─────────────────────────────────────────────────────

/** Initialize a review record for a newly-seen insight. Schedules it 1 day out. */
export function initReview(insightId: string, now: number = Date.now()): InsightReview {
  return {
    insightId,
    interval: FIRST_INTERVAL_DAYS,
    easeFactor: DEFAULT_EASE,
    reviewCount: 0,
    lastReviewedAt: now,
    nextDueAt: now + FIRST_INTERVAL_DAYS * MS_PER_DAY,
  };
}

/**
 * Apply a rating; return the updated review record.
 *
 * Rating semantics:
 *   - again: failed to recall the insight → reset to 1 day, drop ease by 0.2
 *   - hard:  recalled with effort        → interval *= 1.2, drop ease by 0.15
 *   - good:  recalled cleanly            → interval *= ease (the SM-2 default)
 *   - easy:  obvious / instant recall    → interval *= ease * 1.3, raise ease by 0.15
 */
export function applyReview(
  review: InsightReview,
  rating: ReviewRating,
  now: number = Date.now(),
): InsightReview {
  let { interval, easeFactor } = review;

  switch (rating) {
    case "again":
      interval = FIRST_INTERVAL_DAYS;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      break;
    case "hard":
      interval = Math.max(FIRST_INTERVAL_DAYS, interval * HARD_MULT);
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      break;
    case "good":
      interval = interval * easeFactor;
      break;
    case "easy":
      interval = interval * easeFactor * EASY_BONUS;
      easeFactor = Math.min(MAX_EASE, easeFactor + 0.15);
      break;
  }

  return {
    ...review,
    interval,
    easeFactor,
    reviewCount: review.reviewCount + 1,
    lastReviewedAt: now,
    nextDueAt: now + interval * MS_PER_DAY,
  };
}

/**
 * Which insights are due for review, given current reviews and "now"?
 * Sorted by overdueness (most overdue first), so the UI naturally prioritizes
 * the user's biggest debt.
 */
export function dueInsights(
  reviews: readonly InsightReview[],
  now: number = Date.now(),
): InsightReview[] {
  return reviews
    .filter((r) => r.nextDueAt <= now)
    .slice()
    .sort((a, b) => a.nextDueAt - b.nextDueAt);
}

/**
 * Build a review CARD: pick a fresh problem from the catalog that's tagged
 * with the insight, excluding the user's lastProblemId for that insight
 * (don't immediately repeat) and excluding anything already shown this
 * session.
 *
 * Falls back to allowing the lastProblemId after REPEAT_FALLBACK_DAYS if no
 * alternatives exist. Returns null if the insight id is unknown.
 * Returns { insight, problem: null } if the insight is known but no tagged
 * problem exists in the catalog — the UI can surface "review the concept"
 * without a paired exercise.
 */
export function buildReviewCard(
  review: InsightReview,
  catalog: readonly LabProblem[],
  alreadyShownInSession: Set<string> = new Set(),
): { insight: Insight; problem: LabProblem | null } | null {
  const insight = INSIGHTS_BY_ID[review.insightId];
  if (!insight) return null;

  // All problems in the catalog tagged with this insight.
  const tagged = catalog.filter((p) => p.insightTags?.includes(review.insightId));
  if (tagged.length === 0) {
    return { insight, problem: null };
  }

  // Prefer problems not shown this session AND not the last-shown one.
  const fresh = tagged.filter(
    (p) => p.id !== review.lastProblemId && !alreadyShownInSession.has(p.id),
  );
  if (fresh.length > 0) {
    return { insight, problem: fresh[0]! };
  }

  // Fall back: allow the lastProblemId only if enough time has passed.
  const ageMs = Date.now() - review.lastReviewedAt;
  if (
    review.lastProblemId &&
    ageMs >= REPEAT_FALLBACK_DAYS * MS_PER_DAY
  ) {
    const last = tagged.find((p) => p.id === review.lastProblemId);
    if (last) return { insight, problem: last };
  }

  // Last resort: any tagged problem not already shown this session.
  const notInSession = tagged.filter((p) => !alreadyShownInSession.has(p.id));
  if (notInSession.length > 0) {
    return { insight, problem: notInSession[0]! };
  }

  // Truly exhausted — return concept-only.
  return { insight, problem: null };
}

/**
 * After a solve, which insights should be "introduced" into the SR system
 * for this user? Pulls from the problem's insightTags and filters out
 * insights the user is already reviewing.
 *
 * The Lab UI calls this after a successful solve, then calls initReview()
 * on each returned id and persists the result.
 */
export function newInsightsFromSolve(
  solve: LabSolve,
  problem: LabProblem,
  existingReviews: readonly InsightReview[],
): string[] {
  // We only introduce insights on actual solves — gave-up / skipped don't
  // earn the user the right to start reviewing the insight; they should
  // re-attempt instead.
  if (solve.outcome !== "solved") return [];

  const tags = problem.insightTags ?? [];
  if (tags.length === 0) return [];

  const tracked = new Set(existingReviews.map((r) => r.insightId));
  // De-dupe within the tag list itself (defensive — curators shouldn't
  // duplicate, but cheap to enforce).
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (tracked.has(tag) || seen.has(tag)) continue;
    // Only introduce insights we actually know about.
    if (!INSIGHTS_BY_ID[tag]) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}
