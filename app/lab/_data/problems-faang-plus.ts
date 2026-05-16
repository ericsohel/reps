import type { LabProblem } from "./types";

// Lab problems whose `requiredModules` fall in roadmap modules 31-39 (faang-plus).
// Curated by Agent C. Each problem must NOT duplicate any URL in
// app/roadmap/_data/modules/*.ts.
export const PROBLEMS_FAANG_PLUS: LabProblem[] = [
  {
    id: "cf-1245-d",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1245/D",
    title: "Shichikuji and Power Grid",
    estMinutes: 60,
    requiredModules: ["mst"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "When every node has a per-node 'build a station here' cost AND pairwise wire costs, introduce a virtual super-source connected to each city with edge weight `c_i`. The MST on `n+1` nodes treats 'build a plant' and 'wire to a neighbour' as the same decision — exactly one cheapest 'reason for power' per city.",
    stuckHints: [
      "What if there were only one type of cost — could you just run Kruskal?",
      "Is there a way to turn the per-node cost into an edge cost?",
      "How many components does the optimal solution have, and what connects them to 'the rest of the world'?",
    ],
  },
  {
    id: "abc-282-e",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc282/tasks/abc282_e",
    title: "Choose Two and Eat One",
    estMinutes: 75,
    requiredModules: ["mst"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "A 'pick two, score, discard one, keep the other, repeat until one ball remains' game is a maximum spanning tree in disguise: each move corresponds to picking an edge `(i, j)` with weight `score(i, j)` and merging components. Total max score = MST weight on `K_n` with weights `(x^y + y^x) mod M`.",
    stuckHints: [
      "Write n=3 by hand. Track which balls survive after each move — does any structure emerge?",
      "Each operation eats one ball and accrues one score. How many operations total? What does that count remind you of?",
      "If you draw an edge for every (chosen pair, scored once), what graph do you build?",
    ],
  },
  {
    id: "cses-1685",
    source: "cses",
    url: "https://cses.fi/problemset/task/1685",
    title: "New Flight Routes",
    estMinutes: 90,
    requiredModules: ["adv-graphs"],
    difficulty: "stretch",
    transferDistance: 2,
    canonicalInsight:
      "Reduce the original graph to its SCC condensation (a DAG). The minimum edges to make a DAG strongly connected is `max(sources, sinks)` — then pair each source-leaf with a sink-leaf to close cycles. The constructive part (which sink to attach to which source) is the wrinkle CSES tests for.",
    stuckHints: [
      "If the input were already a DAG, what would the answer be in terms of in/out-degree?",
      "What changes if some SCC has both an incoming and an outgoing edge (i.e. is neither a source nor a sink)?",
      "After you decide HOW MANY edges, how do you decide WHICH endpoints to use?",
    ],
  },
  {
    id: "abc-274-e",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc274/tasks/abc274_e",
    title: "Booster",
    estMinutes: 75,
    requiredModules: ["bitmask-dp"],
    difficulty: "stretch",
    transferDistance: 2,
    canonicalInsight:
      "TSP variant with two kinds of nodes (mandatory towns + optional chests) and a multiplicative state (speed = 2^(chests collected)). State `dp[mask][v]` = min time to have visited the subset `mask` of {towns ∪ chests} ending at `v`; speed at any step is determined entirely by `popcount(mask & chestMask)`, so the state is enough.",
    stuckHints: [
      "If there were no chests, what's the standard DP for visiting all towns?",
      "What information about the past actually affects future travel time?",
      "Could you encode 'which chests have I taken' in the same bitmask as 'which towns have I visited'?",
    ],
  },
  {
    id: "lc-546",
    source: "leetcode",
    url: "https://leetcode.com/problems/remove-boxes/",
    title: "Remove Boxes",
    estMinutes: 90,
    requiredModules: ["interval-dp"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "The naive `dp[l][r]` loses crucial info: how many same-coloured boxes are 'glued' to the right of `r` from earlier removals. Add a third dimension `k` = count of `boxes[r]`-coloured boxes already appended after `r`. Transition: either remove the `k+1` block now, or find a matching `boxes[p] == boxes[r]` inside and merge — the third index carries the deferred merge potential.",
    stuckHints: [
      "Try `dp[l][r] = max points from boxes[l..r]`. What goes wrong when two same-colour blocks could be merged across a removed middle?",
      "What 'extra' state would let you defer the decision of when to merge a block?",
      "Score is `k^2`, not `k` — does that change which merges are worth waiting for?",
    ],
  },
  {
    id: "cf-607-b",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/607/B",
    title: "Zuma",
    estMinutes: 60,
    requiredModules: ["interval-dp"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Min seconds to destroy a row by removing palindromic substrings. `dp[l][r]` = min ops on `s[l..r]`. Transitions: (a) peel off `s[l]` alone (`1 + dp[l+1][r]`); (b) for every `k` with `s[k] == s[l]`, piggyback by erasing `[l+1..k-1]` first, fusing `s[l]` with `s[k]` for one shared op (`dp[l+1][k-1] + dp[k+1][r]`); special case for adjacent matches saves another op. The 'match an endpoint with an internal twin' move is the canonical interval-DP idiom.",
    stuckHints: [
      "What's the cheapest case for a single character? For two equal characters?",
      "If you remove the interior `[l+1, k-1]` first, what happens to `s[l]` and `s[k]`?",
      "Why does the recurrence need both 'peel s[l] alone' and 'merge s[l] with some later s[k]'?",
    ],
  },
  {
    id: "abc-174-f",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc174/tasks/abc174_f",
    title: "Range Set Query",
    estMinutes: 60,
    requiredModules: ["coord-comp", "fenwick"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Offline distinct-count over ranges. Sort queries by right endpoint `r`. Sweep `i` left-to-right; for each `c[i]`, if you've seen this colour before at position `prev`, do `BIT.update(prev, -1)`; then `BIT.update(i, +1)`. After processing position `r`, answer `[l, r]` = `BIT.query(l, r)` — each colour contributes exactly once at its most-recent occurrence. The 'keep only the latest occurrence' trick is the entire pattern; coord-comp on colours just lets the `last-seen` map fit in `O(n)`.",
    stuckHints: [
      "Could you sort the queries instead of processing them in input order?",
      "If a colour appears at positions p1 < p2 < ... < pk, which one should 'count' for a query ending at r?",
      "What if updates were offline — would the problem become a counting sweep?",
    ],
  },
  {
    id: "cses-1734",
    source: "cses",
    url: "https://cses.fi/problemset/task/1734",
    title: "Distinct Values Queries",
    estMinutes: 75,
    requiredModules: ["coord-comp", "fenwick"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Same shape as Mo's-algorithm distinct-count, but the clean solve is offline + BIT: coord-compress values (up to `10^9`), sort queries by `r`, sweep `i`, maintain a BIT with `+1` at the most-recent index of each value (clearing the previous index when revisiting). This *is* the 'last occurrence dominates' pattern that every offline distinct-count problem reduces to — the synthesis of coord-comp + Fenwick + offline sweeping.",
    stuckHints: [
      "What's the underlying query? (`count distinct` is really `count of 'latest occurrences in range'`.)",
      "If you sweep `r` from left to right, what changes about which positions 'represent' each value?",
      "Mo's algorithm works in `O((n+q)*sqrt(n))` — can you do better by sorting queries cleverly?",
    ],
  },
  {
    id: "abc-254-f",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc254/tasks/abc254_f",
    title: "Rectangle GCD",
    estMinutes: 90,
    requiredModules: ["sparse-table"],
    optionalModules: ["number-theory"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Grid cell `(i,j) = A[i] + B[j]`. Use `gcd(x, y) = gcd(x, y-x)`: subtracting the top-left from every other cell exposes `gcd` over `{A[h1]+B[w1]} ∪ {diffs of A in rows} ∪ {diffs of B in cols}`. Build sparse tables (idempotent op: `gcd`) over the two diff arrays for `O(1)` range-gcd; each query is then three lookups combined. The 'subtract a reference value to reveal differences' trick is the geometry-of-gcd insight; sparse table is the immutable RMQ tool the diff arrays beg for.",
    stuckHints: [
      "What's `gcd(a, b, c)` in terms of `gcd(a, b-a, c-a)`?",
      "If the grid were 1D, would `gcd` over a range have a clean immutable structure?",
      "What's `O(1)` range query for an idempotent operation over an unchanging array?",
    ],
  },
  {
    id: "cf-339-d",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/339/D",
    title: "Xenia and Bit Operations",
    estMinutes: 30,
    requiredModules: ["seg-tree"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Sequence of `2^n` values; alternate OR / XOR up the tree. The point update + 'recompute the root' shape is literally segment tree: each node stores the value, each level picks its op (`OR` if level depth is odd, `XOR` if even). Build once, then each query is one `update(i, v)` walk back up the tree — `O(log n)` per op. The cleanest possible 'level-dependent combine function' drill.",
    stuckHints: [
      "Draw the binary-merge tree for `2^n=8` and label which level uses which op.",
      "Which nodes need to be recomputed when `a[i]` changes?",
      "What's the operation stored at the root after a build?",
    ],
  },
  {
    id: "cses-1190",
    source: "cses",
    url: "https://cses.fi/problemset/task/1190",
    title: "Subarray Sum Queries",
    estMinutes: 75,
    requiredModules: ["seg-tree"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Max-subarray-sum under point updates. Each seg-tree node stores `(sum, prefMax, sufMax, bestMax)`; the merge is the classic Kadane combinator: `parent.bestMax = max(L.bestMax, R.bestMax, L.sufMax + R.prefMax)`. This 'aggregate four numbers per node, combine non-trivially' is *the* training problem for designing custom monoids — once you can derive these four fields, every fancy seg-tree problem (count distinct, max subarray with constraints, etc.) is the same exercise.",
    stuckHints: [
      "If you knew the answer for the left half and the right half, what extra info do you need to combine them?",
      "Could the optimal subarray straddle the midpoint? What does each half need to contribute in that case?",
      "What's the minimum number of numbers per node such that two children fully determine the parent?",
    ],
  },
  {
    id: "cses-1739",
    source: "cses",
    url: "https://cses.fi/problemset/task/1739",
    title: "Forest Queries II",
    estMinutes: 60,
    requiredModules: ["fenwick"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Mutable 2D 'count trees in rectangle' is the canonical 2D BIT setup. `update(r, c, ±1)` climbs both indices independently via `i += i & -i`; `query(r, c)` is inclusion-exclusion `Q(r2,c2) - Q(r1-1,c2) - Q(r2,c1-1) + Q(r1-1,c1-1)`. Cost `O(log² n)` per op fits `1000×1000` grid + `2·10^5` queries. Recognising 'mutable 2D rectangle sum' → 2D BIT is the entire framing.",
    stuckHints: [
      "If there were no updates, what classical preprocessing would you use?",
      "What's the 1D analogue, and how does the structure generalise to 2D?",
      "How do you turn 'rectangle sum' into four prefix-rectangle queries?",
    ],
  },
  {
    id: "lc-1610",
    source: "leetcode",
    url: "https://leetcode.com/problems/maximum-number-of-visible-points/",
    title: "Maximum Number of Visible Points",
    estMinutes: 60,
    requiredModules: ["geometry"],
    optionalModules: ["sliding-window"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Compute each point's angle from your location with `atan2(dy, dx)`, sort, duplicate the array with `+2π` to handle wrap-around, then slide a window of width `angle` and take the max count. The geometry is *only* `atan2` + the wrap-around duplication trick — the rest is the standard sliding-window-on-sorted-values pattern. Points at your exact location are a separate `+constant`.",
    stuckHints: [
      "How do you represent 'direction from origin' as a sortable scalar?",
      "What's special about angles that makes the sliding window 'wrap around'?",
      "If you copy the sorted angles and append each `+2π`, does the wrap-around vanish?",
    ],
  },
];
