import type { Module } from "../types";

// Tier: faang-plus — small utility module. Coordinate compression is the
// canonical preprocessing that makes Fenwick / segment tree / sparse table
// usable when values are large (10^9) but few (<= N). The downstream modules
// (35-fenwick, 36-seg-tree) consume the compressed indices — this module
// teaches the *compression*, not the data structure.
export const coordComp: Module = {
  id: "coord-comp",
  num: 32,
  name: "Coordinate Compression",
  label: "Coordinate\nCompression",
  section: "2e",
  tier: "faang-plus",
  order: 32,
  prereqIds: ["arrays-hashing"],
  isNew: true,
  isUtility: true,
  resources: [
    { title: "USACO Guide — Coordinate Compression (Gold)", url: "https://usaco.guide/gold/sweep#coordinate-compression" },
    { title: "CP-Algorithms — Sqrt Decomposition (compression context)", url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html" },
    { title: "CPH Book Ch. 9 — Range Queries (compression motivation)", url: "https://cses.fi/book/book.pdf" },
  ],
  problems: [
    {
      num: 1,
      title: "Rank Transform of an Array",
      url: "https://leetcode.com/problems/rank-transform-of-an-array/",
      source: "LC 1331",
      difficulty: "easy",
      list: "new",
      role: "baseline",
      teaches: "**The compression pattern in one line** — `sorted(set(a))` then map each value to its index in that sorted unique list. This *is* coordinate compression; rank transform is the same operation under a different name. Internalise the three-step template: collect → `sorted(set(...))` → dict-map back. Every downstream module re-uses this exact preamble.",
    },
    {
      num: 2,
      title: "Distinct Numbers",
      url: "https://cses.fi/problemset/task/1621",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "extension",
      teaches: "Trivial answer (`len(set(a))`) hides the point: the *implementation* of `set` over 10^9-range values **is** coordinate compression — sort, dedupe, count. Solve it once with `set`, once by sorting and counting unique runs, and notice they're the same algorithm. This is the warm-up before you need indices, not just counts.",
    },
    {
      num: 3,
      title: "Counting Haybales",
      url: "https://usaco.org/index.php?page=viewproblem2&cpid=666",
      source: "USACO Silver",
      difficulty: "medium",
      list: "UG ⭐",
      role: "extension",
      teaches: "**Compression + binary search** — sort haybale coordinates once, then each `[a, b]` query is `bisect_right(b) - bisect_left(a)`. The compression here is implicit (sort is enough; no remap needed) but it teaches the *offline* mindset: collect all relevant coordinates, sort them, then answer queries via index arithmetic. The mental model for problems 4 and 5.",
    },
    {
      num: 4,
      title: "Minimum Interval to Include Each Query",
      url: "https://leetcode.com/problems/minimum-interval-to-include-each-query/",
      source: "LC 1851",
      difficulty: "hard",
      list: "new",
      role: "extension",
      teaches: "**Offline query reordering** — sort both intervals and queries by coordinate, sweep, maintain a heap of active intervals keyed by length. The compression isn't a remap but the *same idea*: only `O(N + Q)` distinct event coordinates matter, so process them in sorted order. The offline-sweep template that returns in seg-tree and Fenwick problems.",
    },
    {
      num: 5,
      title: "Salary Queries",
      url: "https://cses.fi/problemset/task/1144",
      source: "CSES",
      difficulty: "hard",
      list: "UG",
      role: "extension",
      teaches: "**The canonical \"compress then Fenwick\" problem** — salaries are up to 10^9 but only `N + Q` distinct values ever appear (initial salaries + update targets + query endpoints). Collect them all upfront, compress to `[0, M)`, then a length-M Fenwick handles point-update / range-count in `O(log M)`. The *offline* compression step is what makes the structure fit in memory. This is the problem the next module (35-fenwick) is built around.",
    },
    {
      num: 6,
      title: "Count of Range Sum",
      url: "https://leetcode.com/problems/count-of-range-sum/",
      source: "LC 327",
      difficulty: "hard",
      list: "new",
      role: "checkpoint",
      teaches: "Before reading: count pairs `(i, j)` with `lower <= prefix[j] - prefix[i] <= upper`. For each `j`, the valid `prefix[i]` values lie in `[prefix[j] - upper, prefix[j] - lower]` — a range-count query over a growing multiset. What does that ask for, and what makes the values fit? Compress the union of `{prefix[j], prefix[j] - lower, prefix[j] - upper}`, then Fenwick-count as you sweep `j`. Compression + Fenwick + prefix sums — three modules in one. The Google / Two Sigma synthesis problem.",
    },
  ],
};
