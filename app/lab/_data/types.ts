// Solving Lab — types
// Lab problems are pulled from sources OUTSIDE the roadmap. Their purpose is
// to train transfer: the user encounters a problem without a category label
// and must frame, hypothesize, and solve from scratch.
//
// The Lab is NOT limited to algorithmic problems. Three content kinds share
// this schema:
//   - "algo" (default): traditional algorithmic problems with module prereqs
//   - "puzzle": brain teasers / logic puzzles / cross-domain transfer
//   - "estimation": Fermi problems / complexity ranking / prediction drills
// New kinds (e.g. "logic", "math") can be added by extending the union.

export type LabSource =
  | "codeforces" | "atcoder" | "usaco" | "cses" | "leetcode"
  | "project-euler" | "brilliant" | "jane-street" | "puzzle" | "fermi" | "custom";
export type LabDifficulty = "warm-up" | "standard" | "stretch";
export type LabKind = "algo" | "puzzle" | "estimation";

export interface LabProblem {
  id: string;                     // stable id, e.g. "cf-1850-c", "puzzle-100-prisoners"
  source: LabSource;
  url: string;                    // canonical URL; for original puzzles use a stable reference URL
  title: string;
  estMinutes: number;             // realistic solve time

  // Content kind — defaults to "algo" if omitted (back-compat with curator A/B/C output).
  kind?: LabKind;

  // Eligibility gate — every required module must be `isModuleDone` for this
  // problem to surface in the queue. Use roadmap module ids (see
  // app/roadmap/_data/modules/*.ts), e.g. ["sliding-window", "monotonic-deque"].
  // For puzzles and estimation problems this is typically [].
  requiredModules: string[];
  optionalModules?: string[];     // speedups; not gating

  difficulty: LabDifficulty;

  // Higher = harder to recognize which technique applies.
  // 1 = technique is obvious from the problem statement (warm-up tier)
  // 2 = needs one observation or transformation to see the pattern
  // 3 = heavily disguised; the framing decision IS the trick
  transferDistance: 1 | 2 | 3;

  // The 1-sentence "ah-ha" — what the solver should extract after solving.
  // Surfaced AFTER they mark the problem solved (or as a hint of last resort).
  canonicalInsight: string;

  // 2-3 generic thinking moves to try when blocked. NOT the answer — just
  // shoves toward a productive next probe (e.g. "write n=3 by hand",
  // "what's the inverse problem?", "what if you sort first?").
  stuckHints: string[];

  // ── Problem statement ────────────────────────────────────────────────────
  // Inline problem text shown in the card BEFORE the user starts solving.
  // Required for puzzle and estimation kinds (users shouldn't need to click
  // away to know what the problem is). Optional for algo (the judge URL has
  // the full statement). Keep to 1-4 sentences — just enough to understand
  // the task; the URL is the authoritative source.
  problemStatement?: string;

  // ── Insight-SR linkage ───────────────────────────────────────────────────
  // Tags from the central insight registry (see ./insights.ts). When an
  // insight comes due for spaced-repetition review, the system picks a fresh
  // problem tagged with that insight and surfaces it. Curators tag with the
  // PRIMARY insight(s) the problem exercises — keep small (1-2 tags typical).
  insightTags?: string[];

  // ── Estimation-only fields (kind === "estimation") ───────────────────────
  // Used by the calibration drill UI to auto-check the user's answer.
  answer?: string;                // canonical answer ("10^7", "O(n log n)", "A,B,D")
  answerType?: "numeric" | "ordering" | "categorical";
  acceptableTolerance?: number;   // numeric only: e.g. 0.5 means within ±50%
}

export interface LabSolve {
  problemId: string;
  frameArtifact: string;          // user's 1-sentence restatement (before reading)
  approachGuess: string;          // predicted approach (before solving)
  outcome: "solved" | "gave-up" | "skipped";
  elapsedMin: number;
  hintsUsed: number;              // how many stuckHints were revealed
  insight: string;                // user's own distillation (after solving)
  ts: number;                     // unix ms when this solve was recorded

  // For estimation problems: the user's answer + whether it was within tolerance.
  userAnswer?: string;
  answerCorrect?: boolean;
}

// ── Insight-SR ─────────────────────────────────────────────────────────────
// Insights are curator-maintained "transferable lessons" surfaced via spaced
// repetition. Each insight is paired (at review time) with a FRESH problem
// from the catalog tagged with that insight — the user can't pattern-match
// the URL; they have to recognize the underlying shape.

export interface Insight {
  id: string;                     // stable, e.g. "linearity-of-expectation"
  name: string;                   // display name, e.g. "Linearity of Expectation"
  description: string;            // 1-2 sentence explanation, plain language
  // Optional pointer back into the roadmap for "go re-study" links.
  relatedModuleIds?: string[];
}

export interface InsightReview {
  insightId: string;
  // SM-2-style fields (we use a simplified variant — see _lib/insight-sr.ts):
  interval: number;               // days until next review
  easeFactor: number;             // 1.3 .. 2.5, default 2.5
  reviewCount: number;
  lastReviewedAt: number;         // unix ms
  nextDueAt: number;              // unix ms
  // Track which problem we used last time so we don't repeat immediately.
  lastProblemId?: string;
}

// ── Stuck-recovery moves ───────────────────────────────────────────────────
// Library of generic thinking moves the user can deploy when blocked. Stored
// statically; usage is logged so the user can see their personal playbook
// (which moves work for them, on which problem shapes).

export interface StuckMove {
  id: string;                     // stable, e.g. "small-example"
  name: string;                   // display, e.g. "Write n=3 by hand"
  description: string;            // what the move IS
  whenToUse: string;              // signals that this move might help
  example: string;                // short concrete example of the move in action
}

export interface StuckMoveLog {
  problemId: string;
  moveId: string;
  worked: boolean;                // did the user report it helped?
  ts: number;
}
