import type { StuckMove, StuckMoveLog } from "../_data/types";

// Helpers for analyzing the user's stuck-move usage log. All functions are
// PURE: callers pass in the log array; nothing reads from localStorage or
// the network. The intended caller is a React hook that reads the log from
// localStorage and threads it through.
//
// Vocabulary:
//   - "try" = one entry in the log (the user invoked the move on a problem)
//   - "hit" = one entry where worked === true
//   - "hit rate" = hits / tries, in [0, 1]

// Minimum number of attempts before a move's hit rate is treated as a
// reliable signal. Below this threshold, hit rate is too noisy to rank by.
const DEFAULT_MIN_SAMPLES = 3;

interface MoveStats {
  tries: number;
  hits: number;
}

/**
 * Build {moveId -> {tries, hits}} from the raw log. Internal helper.
 */
function tally(log: readonly StuckMoveLog[]): Map<string, MoveStats> {
  const stats = new Map<string, MoveStats>();
  for (const entry of log) {
    const s = stats.get(entry.moveId) ?? { tries: 0, hits: 0 };
    s.tries += 1;
    if (entry.worked) s.hits += 1;
    stats.set(entry.moveId, s);
  }
  return stats;
}

/**
 * Return the user's most-effective moves, sorted by hit rate (descending).
 * Only moves with at least `minSamples` attempts are included — below that,
 * a single lucky/unlucky data point would dominate the ranking.
 *
 * Tie-break: more tries first (more evidence), then alphabetical move id
 * for stable output.
 */
export function getTopMoves(
  log: readonly StuckMoveLog[],
  allMoves: readonly StuckMove[],
  minSamples: number = DEFAULT_MIN_SAMPLES,
): Array<{ move: StuckMove; tries: number; hits: number; hitRate: number }> {
  const stats = tally(log);
  const byId = new Map(allMoves.map((m) => [m.id, m]));

  const rows: Array<{
    move: StuckMove;
    tries: number;
    hits: number;
    hitRate: number;
  }> = [];

  for (const [moveId, s] of stats) {
    if (s.tries < minSamples) continue;
    const move = byId.get(moveId);
    if (!move) continue; // log entry references a move that's no longer in the library
    rows.push({
      move,
      tries: s.tries,
      hits: s.hits,
      hitRate: s.hits / s.tries,
    });
  }

  rows.sort((a, b) => {
    if (a.hitRate !== b.hitRate) return b.hitRate - a.hitRate;
    if (a.tries !== b.tries) return b.tries - a.tries;
    return a.move.id.localeCompare(b.move.id);
  });

  return rows;
}

/**
 * Stats restricted to log entries from problems that require a given module.
 * Lets the UI answer "what works for ME on graph problems?" by filtering the
 * log to graph-tagged problems and then aggregating.
 *
 * Sorted by tries (descending), then by hits, then by move id. We do NOT sort
 * by hit rate here because module-scoped samples are typically small enough
 * that "what I've tried most" is a more honest ranking than "what scored best".
 */
export function getMoveStatsForModule(
  log: readonly StuckMoveLog[],
  problemModuleLookup: (problemId: string) => string[],
  moduleId: string,
  allMoves: readonly StuckMove[],
): Array<{ move: StuckMove; tries: number; hits: number }> {
  // Memoize the per-problem module lookup so a hot module isn't recomputed
  // for every log entry. The caller's lookup may be expensive (Array.includes
  // on a big tag list).
  const problemMatchCache = new Map<string, boolean>();
  const matchesModule = (problemId: string): boolean => {
    const cached = problemMatchCache.get(problemId);
    if (cached !== undefined) return cached;
    const result = problemModuleLookup(problemId).includes(moduleId);
    problemMatchCache.set(problemId, result);
    return result;
  };

  const filtered = log.filter((entry) => matchesModule(entry.problemId));
  const stats = tally(filtered);
  const byId = new Map(allMoves.map((m) => [m.id, m]));

  const rows: Array<{ move: StuckMove; tries: number; hits: number }> = [];
  for (const [moveId, s] of stats) {
    const move = byId.get(moveId);
    if (!move) continue;
    rows.push({ move, tries: s.tries, hits: s.hits });
  }

  rows.sort((a, b) => {
    if (a.tries !== b.tries) return b.tries - a.tries;
    if (a.hits !== b.hits) return b.hits - a.hits;
    return a.move.id.localeCompare(b.move.id);
  });

  return rows;
}

// ─── Recommender ──────────────────────────────────────────────────────────
//
// Scoring formula for getRecommendedMove. Each candidate gets a score; we
// pick the argmax. Score has three additive parts:
//
//   1) Personal hit rate (Bayesian-smoothed):
//        rate = (hits + ALPHA) / (tries + ALPHA + BETA)
//      With ALPHA=1, BETA=1 (uniform Beta(1,1) prior), a never-tried move
//      gets rate = 0.5 — not punished for lack of data, not over-rewarded.
//      A move tried once and worked gets (1+1)/(1+2) = 0.667, not 1.0.
//
//   2) Exploration bonus for moves the user has never tried:
//        +EXPLORE_BONUS if tries === 0
//      Small nudge so the user occasionally tries new tools instead of
//      always falling back to their two favorites.
//
//   3) Recency penalty for moves used very recently across the whole log
//      (regardless of problem). This encourages variety; a move you just
//      tried 2 minutes ago is unlikely to be the right next probe.
//        -RECENCY_PENALTY * exp(-k) for k = position from end of log
//
// Caller-provided excludedMoveIds (moves already shown in this session) are
// hard-filtered out before scoring.

const PRIOR_ALPHA = 1;
const PRIOR_BETA = 1;
const EXPLORE_BONUS = 0.1;
const RECENCY_PENALTY = 0.3;
const RECENCY_LOOKBACK = 5; // only the last N log entries contribute

/**
 * Pick a single recommended move. Returns null only when allMoves is empty
 * or every move is excluded.
 *
 * Deterministic for a given (log, allMoves, excludedMoveIds) — no randomness.
 * That keeps the UI testable; if you want shuffle, the caller can add jitter.
 */
export function getRecommendedMove(
  log: readonly StuckMoveLog[],
  allMoves: readonly StuckMove[],
  excludedMoveIds?: readonly string[],
): StuckMove | null {
  if (allMoves.length === 0) return null;

  const excluded = new Set(excludedMoveIds ?? []);
  const candidates = allMoves.filter((m) => !excluded.has(m.id));
  if (candidates.length === 0) return null;

  const stats = tally(log);

  // Build a "how recently was each move used" map. Index 0 = most recent
  // entry in the log; higher index = older.
  const recencyIndex = new Map<string, number>();
  const start = Math.max(0, log.length - RECENCY_LOOKBACK);
  for (let i = log.length - 1; i >= start; i--) {
    const moveId = log[i].moveId;
    if (!recencyIndex.has(moveId)) {
      recencyIndex.set(moveId, log.length - 1 - i);
    }
  }

  let best: StuckMove | null = null;
  let bestScore = -Infinity;

  for (const move of candidates) {
    const s = stats.get(move.id) ?? { tries: 0, hits: 0 };

    // (1) Bayesian-smoothed hit rate. Uniform Beta(1,1) prior.
    const rate =
      (s.hits + PRIOR_ALPHA) / (s.tries + PRIOR_ALPHA + PRIOR_BETA);

    // (2) Explore bonus for untried moves.
    const exploreBonus = s.tries === 0 ? EXPLORE_BONUS : 0;

    // (3) Recency penalty — strongest for the move used last, decaying
    // exponentially with how many entries back it was.
    let recencyPenalty = 0;
    const idx = recencyIndex.get(move.id);
    if (idx !== undefined) {
      recencyPenalty = RECENCY_PENALTY * Math.exp(-idx);
    }

    const score = rate + exploreBonus - recencyPenalty;

    if (
      score > bestScore ||
      // Stable tie-break on move id so ordering is deterministic.
      (score === bestScore && best !== null && move.id < best.id)
    ) {
      best = move;
      bestScore = score;
    }
  }

  return best;
}
