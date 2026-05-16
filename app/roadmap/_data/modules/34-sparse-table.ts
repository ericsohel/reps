import type { Module } from "../types";

// Tier: faang-plus — sparse table is the O(1) immutable range-query workhorse
// for idempotent operations (min, max, gcd, bitwise and/or). Distinguish from
// Fenwick (mutable, sum/xor) and segment tree (mutable + range update): when
// the array never changes and the op is idempotent, sparse table is strictly
// faster — O(N log N) preprocessing, O(1) per query. Checkpoint is LCA via
// Euler tour + RMQ, the canonical synthesis.
export const sparseTable: Module = {
  id: "sparse-table",
  num: 34,
  name: "Sparse Table",
  section: "2e",
  tier: "faang-plus",
  order: 34,
  prereqIds: ["binary-search", "prefix-sums"],
  isNew: true,
  resources: [
    { title: "CP-Algorithms — Sparse Table", url: "https://cp-algorithms.com/data_structures/sparse-table.html" },
    { title: "USACO Guide — Sparse Tables (Plat)", url: "https://usaco.guide/plat/sparse-segtree" },
    { title: "CP-Algorithms — LCA via RMQ (Euler tour)", url: "https://cp-algorithms.com/graph/lca.html" },
  ],
  problems: [
    {
      num: 1,
      title: "Static Range Minimum Queries",
      url: "https://cses.fi/problemset/task/1647",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "baseline",
      teaches: "**The canonical sparse table** — `st[k][i] = min(a[i..i + 2^k - 1])`, build in `O(N log N)` with `st[k][i] = min(st[k-1][i], st[k-1][i + 2^(k-1)])`, query `[l, r]` in `O(1)` via two overlapping power-of-two windows `min(st[k][l], st[k][r - 2^k + 1])` where `k = floor(log2(r - l + 1))`. Overlap is fine because `min` is **idempotent**. Memorise this template — it's the whole module.",
    },
    {
      num: 2,
      title: "Static Range Sum Queries",
      url: "https://cses.fi/problemset/task/1646",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "extension",
      teaches: "**Why sum uses prefix sums, not sparse table** — sum is *not* idempotent (`sum(a) + sum(a) != sum(a)`), so overlapping the two power-of-two windows double-counts the intersection. Prefix sums give the same `O(1)` query with `O(N)` build. The discriminator: idempotent op → sparse table; invertible op → prefix sums; neither → Fenwick / seg tree. This problem exists in the curriculum to *teach the negative case*.",
    },
    {
      num: 3,
      title: "Find Closest Number to Zero",
      url: "https://leetcode.com/problems/find-closest-number-to-zero/",
      source: "LC 2099",
      difficulty: "easy",
      list: "new",
      role: "extension",
      teaches: "**Generalising the idempotent op** — `gcd`, `bitwise and`, `bitwise or`, `max` all work in a sparse table with the same template. Use any range-gcd / range-or problem (this one rephrases as range-min-abs) to drill that the *only* thing that changes between sparse tables is the combine function. The build/query code is copy-paste; the algebraic property (idempotence) is what you check.",
    },
    {
      num: 4,
      title: "Maximum of Minimum for Every Window Size",
      url: "https://www.geeksforgeeks.org/find-the-maximum-of-minimums-for-every-window-size-in-a-given-array/",
      source: "GfG",
      difficulty: "medium",
      list: "new",
      role: "extension",
      teaches: "**Sparse table vs. monotonic deque** — sliding-window min for a *fixed* window is `O(N)` with deque (module 9). For *every* window size simultaneously, deque doesn't help, but sparse table answers each window's range-min in `O(1)`, giving `O(N^2)` total — and combined with the monotonic-stack \"nearest smaller\" trick, this collapses to `O(N log N)`. The problem that forces you to compare modules 9, 8, and 34.",
    },
    {
      num: 5,
      title: "Longest Nice Subarray",
      url: "https://leetcode.com/problems/longest-nice-subarray/",
      source: "LC 2401",
      difficulty: "medium",
      list: "new",
      role: "extension",
      teaches: "**Range-AND / range-OR via sparse table** — \"nice\" means pairwise AND is 0, equivalently the OR of the subarray equals the sum (no bit appears twice). Range-OR is idempotent → sparse table fits. Combined with binary search on subarray length per starting index (`O(log N)` per index, `O(1)` per query) gives `O(N log^2 N)`. Two-pointer is faster here, but the sparse-table angle is the one Citadel / Jane Street ask for on offline variants.",
    },
    {
      num: 6,
      title: "Range Queries and Copies",
      url: "https://cses.fi/problemset/task/1737",
      source: "CSES",
      difficulty: "hard",
      list: "UG",
      role: "extension",
      teaches: "**When sparse table *fails*** — copy + point-update means the array changes, which kills the immutability requirement. The fix is persistent segment tree (module 36 territory), but framing the problem against this module clarifies *why*: sparse table preprocessing is `O(N log N)` per snapshot, which blows up under copies. The boundary problem that motivates the next two modules.",
    },
    {
      num: 7,
      title: "Lowest Common Ancestor via Euler Tour + RMQ",
      url: "https://cp-algorithms.com/graph/lca.html",
      source: "CP-Algo",
      difficulty: "hard",
      list: "UG ⭐",
      role: "checkpoint",
      teaches: "Before reading: LCA(u, v) is the shallowest node on the unique path between them. The Euler tour visits each node every time the DFS enters or leaves it, producing a length-`2N - 1` sequence where the LCA of `u` and `v` is the **minimum-depth node** in the range between their first occurrences. What does *minimum-depth in a range* reduce to? Range-min query over the depth array — `O(N log N)` build, **`O(1)` per LCA**. This is the synthesis: trees → linearisation → RMQ → sparse table. The fastest LCA in practice for static trees, and the canonical sparse-table application across every competitive-programming reference.",
    },
  ],
};
