import type { Module } from "../types";

// Tier: faang-plus (lowest priority in the tier)
// Computational geometry barely shows up in standard FAANG screens. When it
// does, it's almost always Google (convex hull, closest pair, line sweep) or
// the very occasional Meta/Amazon "points on a line" warm-up. The set below is
// deliberately small: slope primitive (LC 149) → axis-aligned hashing → cross
// product / convex hull → line sweep. Skip this module unless you're
// specifically prepping for Google or onsite-level edge cases.
export const geometry: Module = {
  id: "geometry",
  num: 39,
  name: "Geometry Basics",
  section: "2e",
  tier: "faang-plus",
  order: 39,
  prereqIds: ["arrays-hashing"],
  resources: [
    { title: "CP-Algorithms — Geometry (overview)", url: "https://cp-algorithms.com/geometry/" },
    { title: "CP-Algorithms — Convex Hull (Andrew's monotone chain)", url: "https://cp-algorithms.com/geometry/convex-hull.html" },
    { title: "USACO Guide — Geometry Primitives (Gold)", url: "https://usaco.guide/gold/geo-pri" },
  ],
  problems: [
    {
      num: 1,
      title: "Max Points on a Line",
      url: "https://leetcode.com/problems/max-points-on-a-line/",
      source: "LC 149",
      difficulty: "hard",
      list: "new",
      role: "baseline",
      teaches: "**Slope as a hashable primitive** — for each anchor point, count colinear neighbours by hashing `dy / dx` in reduced form. The trap is float slopes: instead store the pair `(dy/g, dx/g)` where `g = gcd(dy, dx)` with a sign convention, so `(2, 4)` and `(1, 2)` collide. The single most-asked geometry question on FAANG screens — Google and Meta both recycle it",
    },
    {
      num: 2,
      title: "Minimum Area Rectangle",
      url: "https://leetcode.com/problems/minimum-area-rectangle/",
      source: "LC 939",
      difficulty: "medium",
      list: "new",
      role: "extension",
      teaches: "**Hash a point set, then enumerate diagonals.** For every pair `(p1, p3)` with distinct x and y, check whether the other two corners `(p1.x, p3.y)` and `(p3.x, p1.y)` are in the set. O(N²) with a `HashSet<(x,y)>` lookup — the geometry version of two-sum. Sets up the rotated extension in problem 3",
    },
    {
      num: 3,
      title: "Minimum Area Rectangle II",
      url: "https://leetcode.com/problems/minimum-area-rectangle-ii/",
      source: "LC 963",
      difficulty: "medium",
      list: "new",
      role: "extension",
      teaches: "**Rotated rectangles via the diagonal-midpoint invariant** — a quadrilateral is a rectangle iff both diagonals share a midpoint *and* have equal length. Group pairs by `(midpoint, length²)`; every two pairs in the same bucket form a rectangle. Same hash-the-key pattern as LC 939, but the key encodes a geometric invariant instead of raw coordinates",
    },
    {
      num: 4,
      title: "Point Location Test",
      url: "https://cses.fi/problemset/task/2189",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "extension",
      teaches: "**Cross product as the orientation oracle** — `cross(B-A, P-A) > 0` means P is left of AB, `< 0` right, `= 0` colinear. This single sign test is the entire CP geometry toolkit: convex hull, segment intersection, polygon containment, and half-plane tests all reduce to it. Use 64-bit integer arithmetic (no floats) to dodge precision bugs",
    },
    {
      num: 5,
      title: "Erect the Fence",
      url: "https://leetcode.com/problems/erect-the-fence/",
      source: "LC 587",
      difficulty: "hard",
      list: "new",
      role: "extension",
      teaches: "**Convex hull via Andrew's monotone chain** — sort points by `(x, y)`, build the lower hull then upper hull, popping while the last turn is *not* counter-clockwise (`cross <= 0`). O(N log N), all integer arithmetic, ~30 lines. The collinear-points wrinkle (keep them on the boundary) is the standard interview follow-up. Same primitive as CSES Convex Hull (1742)",
    },
    {
      num: 6,
      title: "The Skyline Problem",
      url: "https://leetcode.com/problems/the-skyline-problem/",
      source: "LC 218",
      difficulty: "hard",
      list: "new",
      role: "extension",
      teaches: "**Line sweep with a max-heap of active heights.** Events are `(x, +h)` on building start and `(x, -h)` on end; sweep left-to-right and emit a keypoint whenever the current max height changes. The lazy-deletion heap (push `(-h, end)`, pop while the top's end is past `x`) is the cleanest implementation. The geometry intro to event-driven sweeps — the same skeleton powers segment intersection and rectangle union",
    },
    {
      num: 7,
      title: "Convex Hull",
      url: "https://cses.fi/problemset/task/2195",
      source: "CSES",
      difficulty: "hard",
      list: "UG ⭐",
      role: "checkpoint",
      teaches: "Before coding: which sort key, and what's the predicate that pops a point off the stack? Andrew's monotone chain end-to-end with the *collinear-points-on-boundary* requirement (use `cross < 0` to pop, not `<= 0`). Combines the cross-product primitive (problem 4) with the hull construction (problem 5) and forces you to handle the edge case interviewers love. If you can write this from scratch in 20 minutes, the geometry module is done",
    },
  ],
};
