// Unit tests for stuck-recovery tracking helpers.
// Run: npx tsx app/lab/_lib/stuck-tracking.test.ts
//
// Plain assert-based; no test framework needed. Exits 1 on first failure batch.

import type { StuckMove, StuckMoveLog } from "../_data/types";
import {
  getMoveStatsForModule,
  getRecommendedMove,
  getTopMoves,
} from "./stuck-tracking";

let failures = 0;
function check(label: string, ok: boolean, details?: string) {
  const status = ok ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(`${status}  ${label}${details ? ` — ${details}` : ""}`);
  if (!ok) failures++;
}

// Minimal test moves — we only need a few. The real library lives in
// app/lab/_data/stuck-moves.ts; we don't import it so the tests don't depend
// on the curated content.
const MOVES: readonly StuckMove[] = [
  {
    id: "small-example",
    name: "Small example",
    description: "",
    whenToUse: "",
    example: "",
  },
  {
    id: "brute-force-first",
    name: "Brute force first",
    description: "",
    whenToUse: "",
    example: "",
  },
  {
    id: "invariant-search",
    name: "Invariant search",
    description: "",
    whenToUse: "",
    example: "",
  },
  {
    id: "work-backwards",
    name: "Work backwards",
    description: "",
    whenToUse: "",
    example: "",
  },
];

function entry(
  moveId: string,
  problemId: string,
  worked: boolean,
  ts: number = 0,
): StuckMoveLog {
  return { moveId, problemId, worked, ts };
}

// ─── getTopMoves ─────────────────────────────────────────────────────────

// 1. Empty log → empty result.
{
  const out = getTopMoves([], MOVES);
  check("getTopMoves: empty log → []", out.length === 0, `got ${out.length}`);
}

// 2. Below min samples → excluded.
{
  const log = [
    entry("small-example", "p1", true, 1),
    entry("small-example", "p2", true, 2),
  ];
  const out = getTopMoves(log, MOVES, 3);
  check(
    "getTopMoves: below minSamples → excluded",
    out.length === 0,
    `got ${out.length}`,
  );
}

// 3. Sorted by hit rate descending.
{
  const log = [
    // brute-force-first: 3 tries, 1 hit -> 0.333
    entry("brute-force-first", "p1", true, 1),
    entry("brute-force-first", "p2", false, 2),
    entry("brute-force-first", "p3", false, 3),
    // small-example: 3 tries, 3 hits -> 1.0
    entry("small-example", "p1", true, 1),
    entry("small-example", "p2", true, 2),
    entry("small-example", "p3", true, 3),
  ];
  const out = getTopMoves(log, MOVES, 3);
  check(
    "getTopMoves: sorted by hit rate desc",
    out.length === 2 &&
      out[0].move.id === "small-example" &&
      out[0].hitRate === 1 &&
      out[1].move.id === "brute-force-first" &&
      Math.abs(out[1].hitRate - 1 / 3) < 1e-9,
    `got ${out.map((r) => `${r.move.id}=${r.hitRate.toFixed(2)}`).join(", ")}`,
  );
}

// 4. Single-move success raises its hit rate (vs. equal-sample failure case).
{
  const successLog = [
    entry("small-example", "p1", true, 1),
    entry("small-example", "p2", true, 2),
    entry("small-example", "p3", true, 3),
  ];
  const failLog = [
    entry("small-example", "p1", false, 1),
    entry("small-example", "p2", false, 2),
    entry("small-example", "p3", false, 3),
  ];
  const succ = getTopMoves(successLog, MOVES, 3);
  const fail = getTopMoves(failLog, MOVES, 3);
  check(
    "getTopMoves: single-move all-success > all-fail",
    succ[0].hitRate > fail[0].hitRate,
    `succ=${succ[0]?.hitRate} fail=${fail[0]?.hitRate}`,
  );
}

// 5. Unknown moveId in log is silently ignored (library can evolve).
{
  const log = [
    entry("retired-move", "p1", true, 1),
    entry("retired-move", "p2", true, 2),
    entry("retired-move", "p3", true, 3),
  ];
  const out = getTopMoves(log, MOVES, 3);
  check(
    "getTopMoves: unknown moveId is ignored",
    out.length === 0,
    `got ${out.length}`,
  );
}

// ─── getMoveStatsForModule ───────────────────────────────────────────────

// 6. Only counts log entries from problems in the requested module.
{
  const log = [
    entry("small-example", "graph-1", true, 1),
    entry("small-example", "graph-2", true, 2),
    entry("small-example", "dp-1", false, 3),
    entry("brute-force-first", "graph-1", false, 4),
  ];
  const moduleLookup = (pid: string): string[] => {
    if (pid.startsWith("graph")) return ["graphs"];
    if (pid.startsWith("dp")) return ["dp-1d"];
    return [];
  };
  const out = getMoveStatsForModule(log, moduleLookup, "graphs", MOVES);
  // small-example: 2 tries, 2 hits in graphs
  // brute-force-first: 1 try, 0 hits in graphs
  const se = out.find((r) => r.move.id === "small-example");
  const bf = out.find((r) => r.move.id === "brute-force-first");
  check(
    "getMoveStatsForModule: filters to module",
    out.length === 2 &&
      se?.tries === 2 &&
      se.hits === 2 &&
      bf?.tries === 1 &&
      bf.hits === 0,
    `got ${out.map((r) => `${r.move.id}=${r.hits}/${r.tries}`).join(", ")}`,
  );
}

// 7. No matching problems → empty result.
{
  const log = [entry("small-example", "p1", true, 1)];
  const out = getMoveStatsForModule(
    log,
    () => ["other-module"],
    "graphs",
    MOVES,
  );
  check(
    "getMoveStatsForModule: no module match → []",
    out.length === 0,
    `got ${out.length}`,
  );
}

// ─── getRecommendedMove ──────────────────────────────────────────────────

// 8. Empty log → returns some move (not null), since allMoves is non-empty.
//    Tie-break (everyone scored equal) deterministically picks first by id.
{
  const out = getRecommendedMove([], MOVES);
  check(
    "getRecommendedMove: empty log → returns a move",
    out !== null,
    `got ${out?.id ?? "null"}`,
  );
}

// 9. Empty allMoves → null.
{
  const out = getRecommendedMove([], []);
  check("getRecommendedMove: empty allMoves → null", out === null);
}

// 10. Excluded moves are never returned.
{
  const out = getRecommendedMove(
    [],
    MOVES,
    ["small-example", "brute-force-first", "invariant-search"],
  );
  check(
    "getRecommendedMove: exclusion works",
    out !== null && out.id === "work-backwards",
    `got ${out?.id ?? "null"}`,
  );
}

// 11. All moves excluded → null.
{
  const out = getRecommendedMove([], MOVES, MOVES.map((m) => m.id));
  check("getRecommendedMove: all excluded → null", out === null);
}

// 12. Moves the user found helpful are preferred over moves that never worked.
//     With a Beta(1,1) prior, 4 hits in 4 tries beats 0 hits in 4 tries
//     (5/6 vs 1/6), so the well-rated move wins over the badly-rated one even
//     after the explore-bonus and recency-penalty mix in.
{
  // Pad the log so recency penalty on the well-rated move is negligible.
  const padding: StuckMoveLog[] = [];
  for (let i = 0; i < 20; i++) {
    padding.push(entry("work-backwards", `pad-${i}`, false, 100 + i));
  }
  const log: StuckMoveLog[] = [
    // small-example: 4/4 hits, recent enough to matter
    entry("small-example", "p1", true, 1),
    entry("small-example", "p2", true, 2),
    entry("small-example", "p3", true, 3),
    entry("small-example", "p4", true, 4),
    // brute-force-first: 0/4 hits
    entry("brute-force-first", "p5", false, 5),
    entry("brute-force-first", "p6", false, 6),
    entry("brute-force-first", "p7", false, 7),
    entry("brute-force-first", "p8", false, 8),
    ...padding,
  ];
  const out = getRecommendedMove(log, MOVES, [
    "invariant-search",
    "work-backwards",
  ]);
  check(
    "getRecommendedMove: well-rated move beats badly-rated move",
    out !== null && out.id === "small-example",
    `got ${out?.id ?? "null"}`,
  );
}

// 13. Recency penalty bites: a move just used is deprioritized vs. an
//     untried move with the same baseline rate.
{
  // small-example used MOST recently → should be penalized.
  // work-backwards never tried → gets the explore bonus.
  const log: StuckMoveLog[] = [
    entry("small-example", "p1", true, 100),
  ];
  const out = getRecommendedMove(log, MOVES, [
    "brute-force-first",
    "invariant-search",
  ]);
  // small-example baseline rate = (1+1)/(1+2) = 0.667, minus 0.3*exp(0) = 0.3
  //   → score ≈ 0.367
  // work-backwards baseline rate = 0.5, plus explore 0.1
  //   → score = 0.6
  // work-backwards should win.
  check(
    "getRecommendedMove: recently-used move is deprioritized",
    out !== null && out.id === "work-backwards",
    `got ${out?.id ?? "null"}`,
  );
}

// 14. Untried-move explore bonus: with no log at all, all moves tie on the
//     Beta(1,1) baseline (0.5) and each gets the explore bonus, so the
//     deterministic tie-break picks the alphabetically-first id.
{
  const out = getRecommendedMove([], MOVES);
  const firstByAlpha = [...MOVES.map((m) => m.id)].sort()[0];
  check(
    "getRecommendedMove: deterministic tie-break on empty log",
    out !== null && out.id === firstByAlpha,
    `got ${out?.id ?? "null"} expected ${firstByAlpha}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-console
console.log(`\n${failures === 0 ? "all passed" : `${failures} failed`}`);
process.exit(failures === 0 ? 0 : 1);
