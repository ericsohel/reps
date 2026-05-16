// Sanity tests for the insight-SR scheduler.
//
// Plain-Node tests — no jest/vitest dependency. Run with: `npx tsx insight-sr.test.ts`
// (we keep this lightweight so it can be invoked from any CI tier).

import type { InsightReview, LabProblem, LabSolve } from "../_data/types";
import { INSIGHT_REGISTRY, INSIGHTS_BY_ID } from "../_data/insights";
import {
  applyReview,
  buildReviewCard,
  dueInsights,
  initReview,
  newInsightsFromSolve,
} from "./insight-sr";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    return;
  }
  failed++;
  // eslint-disable-next-line no-console
  console.error(`FAIL: ${msg}`);
}

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

// ── initReview ────────────────────────────────────────────────────────────
{
  const r = initReview("linearity-of-expectation", 1000);
  assert(r.insightId === "linearity-of-expectation", "initReview: insightId carries through");
  assert(r.interval === 1, "initReview: default interval is 1 day");
  assert(r.easeFactor === 2.5, "initReview: default ease is 2.5");
  assert(r.reviewCount === 0, "initReview: reviewCount starts at 0");
  assert(r.lastReviewedAt === 1000, "initReview: lastReviewedAt = now");
  assert(r.nextDueAt === 1000 + MS_PER_DAY, "initReview: nextDueAt is now + 1 day");
  assert(r.lastProblemId === undefined, "initReview: no lastProblemId yet");
}

// ── applyReview: again ────────────────────────────────────────────────────
{
  // Build up some history first, then fail.
  let r = initReview("invariant-search", 0);
  r = applyReview(r, "good", MS_PER_DAY); // interval becomes 1 * 2.5 = 2.5
  r = applyReview(r, "good", 2 * MS_PER_DAY); // interval becomes 2.5 * 2.5 = 6.25
  const beforeEase = r.easeFactor;
  r = applyReview(r, "again", 3 * MS_PER_DAY);
  assert(r.interval === 1, "applyReview again: resets interval to 1");
  assert(approx(r.easeFactor, beforeEase - 0.2), "applyReview again: drops ease by 0.2");
  assert(r.reviewCount === 3, "applyReview again: still increments reviewCount");
  assert(r.nextDueAt === 3 * MS_PER_DAY + MS_PER_DAY, "applyReview again: nextDue is now + 1 day");
}

// ── applyReview: ease floor ───────────────────────────────────────────────
{
  let r = initReview("invariant-search", 0);
  // Slam "again" repeatedly to verify the ease floor.
  for (let i = 0; i < 20; i++) r = applyReview(r, "again", 0);
  assert(r.easeFactor >= 1.3 - 1e-9, "applyReview: ease never drops below 1.3");
  assert(approx(r.easeFactor, 1.3) || r.easeFactor === 1.3, "applyReview: ease bottoms out at 1.3");
}

// ── applyReview: good multiplies by ease ──────────────────────────────────
{
  const r0 = initReview("frame-as-graph", 0); // interval=1, ease=2.5
  const r1 = applyReview(r0, "good", MS_PER_DAY);
  assert(approx(r1.interval, 1 * 2.5), "applyReview good: interval *= ease (first time)");
  assert(r1.easeFactor === 2.5, "applyReview good: ease unchanged");
  const r2 = applyReview(r1, "good", 2 * MS_PER_DAY);
  assert(approx(r2.interval, 2.5 * 2.5), "applyReview good: interval *= ease (second time)");
  assert(r2.nextDueAt === 2 * MS_PER_DAY + 6.25 * MS_PER_DAY, "applyReview good: nextDue correct");
}

// ── applyReview: easy bumps ease and interval ─────────────────────────────
{
  const r0 = initReview("two-pointers-converge", 0);
  const r1 = applyReview(r0, "easy", 0);
  assert(approx(r1.interval, 1 * 2.5 * 1.3), "applyReview easy: interval *= ease * 1.3");
  assert(approx(r1.easeFactor, 2.5 + 0.15), "applyReview easy: ease +0.15");
  // Slam easy to test ceiling.
  let r = r0;
  for (let i = 0; i < 20; i++) r = applyReview(r, "easy", 0);
  assert(r.easeFactor <= 2.8 + 1e-9, "applyReview easy: ease never exceeds 2.8");
}

// ── applyReview: hard ────────────────────────────────────────────────────
{
  const r0 = initReview("backward-induction", 0);
  const r1 = applyReview(r0, "good", 0); // interval = 2.5
  const r2 = applyReview(r1, "hard", 0);
  assert(approx(r2.interval, 2.5 * 1.2), "applyReview hard: interval *= 1.2");
  assert(approx(r2.easeFactor, 2.5 - 0.15), "applyReview hard: ease -0.15");
}

// ── dueInsights ───────────────────────────────────────────────────────────
{
  const now = 100 * MS_PER_DAY;
  const reviews: InsightReview[] = [
    // Not due — far future.
    { insightId: "a", interval: 5, easeFactor: 2.5, reviewCount: 1, lastReviewedAt: now, nextDueAt: now + 5 * MS_PER_DAY },
    // Most overdue.
    { insightId: "b", interval: 1, easeFactor: 2.5, reviewCount: 1, lastReviewedAt: 0, nextDueAt: now - 10 * MS_PER_DAY },
    // Slightly overdue.
    { insightId: "c", interval: 1, easeFactor: 2.5, reviewCount: 1, lastReviewedAt: 0, nextDueAt: now - 1 * MS_PER_DAY },
    // Due exactly now.
    { insightId: "d", interval: 1, easeFactor: 2.5, reviewCount: 1, lastReviewedAt: 0, nextDueAt: now },
  ];
  const due = dueInsights(reviews, now);
  assert(due.length === 3, "dueInsights: excludes future-due (a)");
  assert(due[0]!.insightId === "b", "dueInsights: most overdue first (b)");
  assert(due[1]!.insightId === "c", "dueInsights: c second");
  assert(due[2]!.insightId === "d", "dueInsights: due-now last among due");
  assert(!due.some((r) => r.insightId === "a"), "dueInsights: 'a' never appears");
}

// ── buildReviewCard ──────────────────────────────────────────────────────
{
  const insightId = "linearity-of-expectation";
  const cat: LabProblem[] = [
    {
      id: "p1", source: "custom", url: "x", title: "P1", estMinutes: 10,
      requiredModules: [], difficulty: "standard", transferDistance: 2,
      canonicalInsight: "...", stuckHints: [], insightTags: [insightId],
    },
    {
      id: "p2", source: "custom", url: "x", title: "P2", estMinutes: 10,
      requiredModules: [], difficulty: "standard", transferDistance: 2,
      canonicalInsight: "...", stuckHints: [], insightTags: [insightId],
    },
    {
      id: "p3", source: "custom", url: "x", title: "P3", estMinutes: 10,
      requiredModules: [], difficulty: "standard", transferDistance: 2,
      canonicalInsight: "...", stuckHints: [], insightTags: ["invariant-search"],
    },
  ];

  // No history → can pick either p1 or p2 (not p3).
  const r0: InsightReview = {
    insightId, interval: 1, easeFactor: 2.5, reviewCount: 0,
    lastReviewedAt: Date.now(), nextDueAt: Date.now(),
  };
  const card0 = buildReviewCard(r0, cat);
  assert(card0 !== null, "buildReviewCard: returns a card when insight is known");
  assert(card0!.insight.id === insightId, "buildReviewCard: insight resolves correctly");
  assert(card0!.problem !== null && card0!.problem.id !== "p3",
    "buildReviewCard: doesn't pick a problem tagged with a different insight");

  // With lastProblemId=p1, prefers p2.
  const r1: InsightReview = { ...r0, lastProblemId: "p1" };
  const card1 = buildReviewCard(r1, cat);
  assert(card1!.problem!.id === "p2", "buildReviewCard: excludes lastProblemId when alternative exists");

  // alreadyShownInSession excludes too.
  const card2 = buildReviewCard(r0, cat, new Set(["p1"]));
  assert(card2!.problem!.id === "p2", "buildReviewCard: respects alreadyShownInSession");

  // Unknown insight → null card.
  const rUnknown: InsightReview = { ...r0, insightId: "does-not-exist" };
  const cardX = buildReviewCard(rUnknown, cat);
  assert(cardX === null, "buildReviewCard: returns null for unknown insight");

  // Known insight, no tagged problem in catalog → concept-only card.
  const rNoProblem: InsightReview = { ...r0, insightId: "optimal-stopping" };
  const cardNP = buildReviewCard(rNoProblem, cat);
  assert(cardNP !== null && cardNP.problem === null,
    "buildReviewCard: returns concept-only card when no tagged problem");
}

// ── newInsightsFromSolve ─────────────────────────────────────────────────
{
  const problem: LabProblem = {
    id: "p1", source: "custom", url: "x", title: "P1", estMinutes: 10,
    requiredModules: [], difficulty: "standard", transferDistance: 2,
    canonicalInsight: "...", stuckHints: [],
    insightTags: ["linearity-of-expectation", "indicator-decomposition", "small-example-discovery"],
  };
  const baseSolve: LabSolve = {
    problemId: "p1", frameArtifact: "", approachGuess: "",
    outcome: "solved", elapsedMin: 10, hintsUsed: 0, insight: "", ts: 0,
  };

  // No existing reviews → all three are introduced.
  const news0 = newInsightsFromSolve(baseSolve, problem, []);
  assert(news0.length === 3, "newInsightsFromSolve: returns all tags when none tracked");
  assert(news0.includes("linearity-of-expectation"), "newInsightsFromSolve: includes loe");

  // Already tracking one → returns only the other two.
  const existing: InsightReview[] = [initReview("linearity-of-expectation", 0)];
  const news1 = newInsightsFromSolve(baseSolve, problem, existing);
  assert(news1.length === 2, "newInsightsFromSolve: filters out already-tracked insight");
  assert(!news1.includes("linearity-of-expectation"),
    "newInsightsFromSolve: doesn't re-add tracked insight");

  // Skipped/gave-up → nothing introduced.
  const skippedSolve: LabSolve = { ...baseSolve, outcome: "skipped" };
  const newsSkip = newInsightsFromSolve(skippedSolve, problem, []);
  assert(newsSkip.length === 0, "newInsightsFromSolve: skipped solve introduces nothing");
  const gaveUpSolve: LabSolve = { ...baseSolve, outcome: "gave-up" };
  const newsGU = newInsightsFromSolve(gaveUpSolve, problem, []);
  assert(newsGU.length === 0, "newInsightsFromSolve: gave-up solve introduces nothing");

  // Unknown insight tag is filtered out (curator typo defense).
  const typoProblem: LabProblem = { ...problem, insightTags: ["definitely-not-a-real-insight"] };
  const newsTypo = newInsightsFromSolve(baseSolve, typoProblem, []);
  assert(newsTypo.length === 0, "newInsightsFromSolve: filters out unknown insight ids");

  // Duplicate tags in the same problem are deduped.
  const dupProblem: LabProblem = {
    ...problem,
    insightTags: ["invariant-search", "invariant-search", "monovariant-bounds"],
  };
  const newsDup = newInsightsFromSolve(baseSolve, dupProblem, []);
  assert(newsDup.length === 2, "newInsightsFromSolve: dedupes tag list");
}

// ── Registry sanity ───────────────────────────────────────────────────────
{
  // The registry is expected to grow to cover every insightTag string used in
  // the problem catalog (see audit in spec doc). Lower bound = original
  // curator set; upper bound is generous to allow future catalog expansion.
  assert(INSIGHT_REGISTRY.length >= 18 && INSIGHT_REGISTRY.length <= 200,
    `Registry: count is in target range (got ${INSIGHT_REGISTRY.length})`);
  // All ids kebab-case and unique.
  const ids = new Set<string>();
  for (const i of INSIGHT_REGISTRY) {
    assert(/^[a-z][a-z0-9-]*[a-z0-9]$/.test(i.id), `Registry: '${i.id}' is kebab-case`);
    assert(!ids.has(i.id), `Registry: id '${i.id}' is unique`);
    ids.add(i.id);
    assert(i.name.length > 0, `Registry: '${i.id}' has a name`);
    assert(i.description.length > 0, `Registry: '${i.id}' has a description`);
  }
  // INSIGHTS_BY_ID lookup table consistent with registry.
  for (const i of INSIGHT_REGISTRY) {
    assert(INSIGHTS_BY_ID[i.id] === i, `Registry: INSIGHTS_BY_ID round-trips '${i.id}'`);
  }
}

// ── Report ────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-console
console.log(`insight-sr.test: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
