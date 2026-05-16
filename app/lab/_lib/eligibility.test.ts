// Unit tests for Lab eligibility filter.
// Run: npx tsx app/lab/_lib/eligibility.test.ts
//
// Plain assert-based; no test framework needed. Exits 1 on first failure batch.

import type { LabProblem } from "../_data/types";
import {
  getEligibleProblems,
  getNextProblem,
  isProblemEligible,
  MIN_STANDARD_BEFORE_STRETCH,
  MIN_WARMUP_BEFORE_STANDARD,
} from "./eligibility";

let failures = 0;
function check(label: string, ok: boolean, details?: string) {
  const status = ok ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(`${status}  ${label}${details ? ` — ${details}` : ""}`);
  if (!ok) failures++;
}

// Small builder so the test data stays readable.
function mk(partial: Partial<LabProblem> & { id: string }): LabProblem {
  return {
    id: partial.id,
    source: partial.source ?? "codeforces",
    url: partial.url ?? `https://example.com/${partial.id}`,
    title: partial.title ?? partial.id,
    estMinutes: partial.estMinutes ?? 30,
    requiredModules: partial.requiredModules ?? [],
    optionalModules: partial.optionalModules,
    difficulty: partial.difficulty ?? "standard",
    transferDistance: partial.transferDistance ?? 1,
    canonicalInsight: partial.canonicalInsight ?? "",
    stuckHints: partial.stuckHints ?? [],
  };
}

// ---- 1. No mastery → no eligibility ---------------------------------------
{
  const problems = [
    mk({ id: "a", requiredModules: ["sliding-window"] }),
    mk({ id: "b", requiredModules: ["dp-on-trees"] }),
  ];
  const out = getEligibleProblems(problems, {});
  check("no mastery → 0 eligible", out.length === 0, `got ${out.length}`);
}

// ---- 2. Partial mastery → only fully-prereq'd problems --------------------
{
  const problems = [
    mk({ id: "a", requiredModules: ["sliding-window"] }),
    mk({ id: "b", requiredModules: ["sliding-window", "monotonic-deque"] }),
    mk({ id: "c", requiredModules: ["dp-on-trees"] }),
  ];
  const mastery = { "sliding-window": true };
  const out = getEligibleProblems(problems, mastery);
  check(
    "partial mastery → only fully-prereq'd",
    out.length === 1 && out[0].id === "a",
    `got [${out.map((p) => p.id).join(",")}]`,
  );
}

// ---- 3. Missing keys treated as false -------------------------------------
{
  const p = mk({ id: "a", requiredModules: ["sliding-window", "missing"] });
  check(
    "missing mastery key === false",
    isProblemEligible(p, { "sliding-window": true }) === false,
  );
  check(
    "explicit false === false",
    isProblemEligible(p, { "sliding-window": true, missing: false }) === false,
  );
  check(
    "all true === true",
    isProblemEligible(p, { "sliding-window": true, missing: true }) === true,
  );
}

// ---- 4. Empty problems array ----------------------------------------------
{
  const out = getEligibleProblems([], { anything: true });
  check("empty problems → []", out.length === 0);
}

// ---- 5. Phase A: warm-up beats standard regardless of transferDistance ----
{
  // The standard problem has higher transferDistance (3 vs 1) AND no prereqs,
  // but the user is in Phase A (no warm-ups solved yet) so warm-up wins.
  const problems = [
    mk({ id: "std-hard", difficulty: "standard", transferDistance: 3 }),
    mk({ id: "warm-easy", difficulty: "warm-up", transferDistance: 1 }),
  ];
  const out = getEligibleProblems(problems, {}, { "warm-up": 0, standard: 0, stretch: 0 });
  check(
    "Phase A: warm-up first even when standard has higher transferDistance",
    out[0].id === "warm-easy",
    `got ${out.map((p) => p.id).join(",")}`,
  );
}

// ---- 6. Phase B: standard wins after MIN_WARMUP_BEFORE_STANDARD -----------
{
  const problems = [
    mk({ id: "std", difficulty: "standard", transferDistance: 2 }),
    mk({ id: "warm", difficulty: "warm-up", transferDistance: 3 }),
  ];
  const out = getEligibleProblems(problems, {}, {
    "warm-up": MIN_WARMUP_BEFORE_STANDARD,
    standard: 0,
    stretch: 0,
  });
  check(
    "Phase B: standard ranked above warm-up after threshold",
    out[0].id === "std",
    `got ${out.map((p) => p.id).join(",")}`,
  );
}

// ---- 7. Phase C: stretch surfaces only after standard > 5 -----------------
{
  const problems = [
    mk({ id: "stretch", difficulty: "stretch", transferDistance: 3 }),
    mk({ id: "warm", difficulty: "warm-up", transferDistance: 3 }),
  ];
  // standard count exactly at the threshold → NOT yet Phase C (rule says > 5).
  const atBoundary = getEligibleProblems(problems, {}, {
    "warm-up": 99,
    standard: MIN_STANDARD_BEFORE_STRETCH,
    stretch: 0,
  });
  check(
    "Phase C boundary (standard === threshold): warm-up still beats stretch",
    atBoundary[0].id === "warm",
    `got ${atBoundary.map((p) => p.id).join(",")}`,
  );
  // Cross the threshold → stretch outranks warm-up.
  const afterBoundary = getEligibleProblems(problems, {}, {
    "warm-up": 99,
    standard: MIN_STANDARD_BEFORE_STRETCH + 1,
    stretch: 0,
  });
  check(
    "Phase C: stretch ranked above warm-up once standard > threshold",
    afterBoundary[0].id === "stretch",
    `got ${afterBoundary.map((p) => p.id).join(",")}`,
  );
}

// ---- 8. Within difficulty: higher transferDistance first ------------------
{
  const problems = [
    mk({ id: "td1", difficulty: "warm-up", transferDistance: 1 }),
    mk({ id: "td3", difficulty: "warm-up", transferDistance: 3 }),
    mk({ id: "td2", difficulty: "warm-up", transferDistance: 2 }),
  ];
  const out = getEligibleProblems(problems, {});
  check(
    "within band: higher transferDistance first",
    out.map((p) => p.id).join(",") === "td3,td2,td1",
    `got ${out.map((p) => p.id).join(",")}`,
  );
}

// ---- 9. Tie-break: lower estMinutes first ---------------------------------
{
  const problems = [
    mk({ id: "long", difficulty: "warm-up", transferDistance: 2, estMinutes: 60 }),
    mk({ id: "short", difficulty: "warm-up", transferDistance: 2, estMinutes: 20 }),
  ];
  const out = getEligibleProblems(problems, {});
  check(
    "tie-break: lower estMinutes first",
    out[0].id === "short",
    `got ${out.map((p) => p.id).join(",")}`,
  );
}

// ---- 10. undefined solveCountByDifficulty treated as zeros ----------------
{
  const problems = [
    mk({ id: "std", difficulty: "standard", transferDistance: 3 }),
    mk({ id: "warm", difficulty: "warm-up", transferDistance: 1 }),
  ];
  const out = getEligibleProblems(problems, {});
  check(
    "undefined solve counts → Phase A behaviour (warm-up first)",
    out[0].id === "warm",
    `got ${out.map((p) => p.id).join(",")}`,
  );
}

// ---- 11. getNextProblem skips already-solved ids --------------------------
{
  const problems = [
    mk({ id: "a", difficulty: "warm-up", transferDistance: 3 }),
    mk({ id: "b", difficulty: "warm-up", transferDistance: 2 }),
    mk({ id: "c", difficulty: "warm-up", transferDistance: 1 }),
  ];
  const next = getNextProblem(problems, {}, undefined, new Set(["a"]));
  check(
    "getNextProblem skips solved top-pick",
    next !== null && next.id === "b",
    `got ${next?.id ?? "null"}`,
  );
}

// ---- 12. getNextProblem returns null when everything is solved ------------
{
  const problems = [
    mk({ id: "a", difficulty: "warm-up" }),
    mk({ id: "b", difficulty: "warm-up" }),
  ];
  const next = getNextProblem(problems, {}, undefined, new Set(["a", "b"]));
  check("getNextProblem returns null when all solved", next === null);
}

// ---- 13. getNextProblem returns null when no eligible at all --------------
{
  const problems = [mk({ id: "a", requiredModules: ["never-mastered"] })];
  const next = getNextProblem(problems, {}, undefined, new Set());
  check("getNextProblem returns null when nothing eligible", next === null);
}

// ---- 14. Input array is not mutated ---------------------------------------
{
  const problems = [
    mk({ id: "z", difficulty: "warm-up", transferDistance: 1 }),
    mk({ id: "a", difficulty: "warm-up", transferDistance: 3 }),
  ];
  const snapshot = problems.map((p) => p.id).join(",");
  getEligibleProblems(problems, {});
  check(
    "input array order is not mutated",
    problems.map((p) => p.id).join(",") === snapshot,
  );
}

// ---------------------------------------------------------------------------
// eslint-disable-next-line no-console
console.log(`\n${failures === 0 ? "✓ all passed" : `✗ ${failures} failed`}`);
process.exit(failures === 0 ? 0 : 1);
