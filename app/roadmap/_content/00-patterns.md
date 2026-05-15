# Pattern Atlas

Meta-patterns that recur across modules. Reference these by name in module Step 2 sections. When you introduce a new cross-module pattern, add it here.

---

## Complement lookup

> Maintain a hash of things-seen-so-far. For each new element, query for the value that completes the relationship.

| Module | Canonical problem | Variant |
|---|---|---|
| 2 — Arrays & Hashing | LC 1 Two Sum | `seen[value] = index`; for each `x`, look up `target - x` |
| 3 — Prefix Sums | CSES 1661 Subarray Sums II | `freq[prefix_sum] = count`; for each prefix, look up `prefix - k` |

---

## Monotonic invariant

> One direction strictly improves a quantity; the other strictly worsens it. Use this to skip work.

| Module | Canonical problem | Form of the invariant |
|---|---|---|
| 4 — Two Pointers | LC 11 Container With Most Water | The shorter bar limits height; moving the taller bar inward can only shrink area |
| 5 — Sliding Window | CSES 1660 Subarray Sums I | All elements positive → expanding right grows the sum, shrinking left shrinks it |
| 7 — Monotonic Stack | CSES 1645 Nearest Smaller Values | Once an element ≥ current is seen, it can never be the "nearest smaller" for any future element — discard |
| 8 — Monotonic Deque | LC 239 Sliding Window Maximum | Indices with values ≤ current can never be the window max while current is in the window |

---

## Count during merge

> A divide-and-conquer sort visits every pair at most once: pairs inside the left half, pairs inside the right half, and pairs crossing the split (counted in the merge). Replace "sort" with "sort *and* accumulate" — the merge step becomes an oracle for any pairwise predicate that's monotone in index.

| Module | Canonical problem | What's accumulated in the merge |
|---|---|---|
| 3 — Sorting | CSES 1162 Counting Inversions | `+= len(L) - i` on every R-pull = inversions crossing the split |
| 3 — Sorting | LC 315 Count Smaller After Self | Per-original-index accumulator: charge R-pulls to each remaining L's result slot |
| 35 — Fenwick Tree | LC 315 (alt) | Same problem, alternative machinery: BIT over compressed values, queried right-to-left |

The recursive scaffold (`total = within-L + within-R + crossing`) is reusable; the predicate and the accumulator are what change between problems.

---

## Reduce by fixing one dimension

> When the problem has k variables, fix one and apply a simpler technique to the rest.

| Module | Canonical problem | What gets fixed |
|---|---|---|
| 4 — Two Pointers | LC 15 3Sum | Fix `i`, then converging two-pointer on the rest for two-sum |
| 7 — Monotonic Stack | LC 907 Sum of Subarray Minimums | Fix each element as the minimum; count subarrays it dominates via PSE + NSE |
| 12 — Backtracking | LC 78 Subsets | Fix the decision for element `i` (include/exclude); recurse on `i+1` |

---

## Two-scan span

> A single sweep gives partial information. A reverse sweep gives the complement. Combine for the full answer.

| Module | Canonical problem | What each scan gives |
|---|---|---|
| 3 — Prefix Sums | LC 238 Product of Array Except Self | Prefix product (left) × suffix product (right) at each index |
| 7 — Monotonic Stack | LC 84 Largest Rectangle in Histogram | Previous smaller element (left) + next smaller element (right) = span for each bar |
| 8 — Monotonic Deque | LC 1438 Longest Continuous Subarray Abs Diff ≤ Limit | Max-deque + min-deque tracked simultaneously over a variable window |

---

## Sentinel flush

> Append a value at the end of input that forces a final cleanup loop to run, eliminating a separate post-loop section.

| Module | Canonical problem | The sentinel |
|---|---|---|
| 7 — Monotonic Stack | LC 84 Largest Rectangle in Histogram | Append `0` height — forces all remaining stack entries to flush |
| 8 — Monotonic Deque | LC 862 Shortest Subarray Sum ≥ K | Prefix array index runs through `n` (one past the last element) |

---

## Exchange argument

> Prove greedy optimality by showing any deviation from the greedy choice can be swapped back without decreasing the objective. The local optimum reaches the global optimum because every "non-greedy" arrangement can be patched into a greedy one without loss.

| Module | Canonical problem | The swap |
|---|---|---|
| 16 — Greedy | CSES 1630 Tasks & Deadlines | Adjacent tasks scheduled (longer, shorter) → swap to (shorter, longer) → total reward increases by `d_longer − d_shorter > 0` |
| 17 — Intervals | CSES 1629 Movie Festival | If OPT contains a movie ending later than the EFT choice, swap it out — strictly no worse, frees up future picks |

---

## Sweep line / events

> Decompose intervals into start (+1) and end (−1) events, sort by time, scan once while maintaining a running count. Linear-time answers to "max concurrent" and related "at every point in time" queries.

| Module | Canonical problem | What's swept |
|---|---|---|
| 17 — Intervals | LC 253 Meeting Rooms II | Start/end events; max running count = min rooms |
| 17 — Intervals | CSES 1619 Restaurant Customers | Arrival/departure events; max concurrent customers |

Tie-breaking matters: process close events (−1) before open events (+1) at the same timestamp if endpoints are considered non-overlapping.

---

## BFS/DFS skeleton

> Visit every reachable node from a start, marking each on first encounter to avoid revisits. DFS goes deep (recursion or explicit stack). BFS goes wide (queue; mark on push for correct shortest distances on unit-weight graphs).

| Module | Canonical problem | What it does |
|---|---|---|
| 18 — Graph Traversal | LC 200 Number of Islands | Grid DFS to count components; multi-source BFS for distance from a set (LC 994) |
| 19 — Topological Sort | LC 207 Course Schedule | Kahn's = BFS where "neighbours" are nodes whose in-degree drops to 0 after relaxation |
| 21 — Shortest Paths | LC 743 Network Delay Time | Dijkstra = BFS where the queue is a min-heap keyed by current distance |

The shared invariant across variants: each node is **marked once** (on the first visit), and the order of marking encodes the algorithm's semantics — distance for BFS, finish time for DFS, current best for Dijkstra.

---

## Fast/slow pointer (Floyd's tortoise and hare)

> Two pointers traverse the same structure at different speeds. The speed gap lets you derive structural information (cycle detection, midpoint location) in O(1) extra space.

| Module | Canonical problem | Speed/gap |
|---|---|---|
| 4 — Two Pointers | (mentioned only) | Same-direction with differing speeds is the foundation |
| 9 — Linked List | LC 141 Linked List Cycle | Fast moves 2, slow moves 1; they meet iff there's a cycle |
| 9 — Linked List | LC 287 Find the Duplicate Number | Floyd's applied to an implicit functional graph (`i → a[i]`); cycle start = duplicate value |

---

## State down vs return up (tree DFS)

> A recursive subroutine has two channels: parameters passed downward into children, and the return value passed upward to the parent. Choose which one carries which information.

| Module | Canonical problem | Down → / ↑ Up |
|---|---|---|
| 13 — Trees | LC 543 Diameter of Binary Tree | Return height ↑; update global diameter as side effect |
| 13 — Trees | LC 1448 Count Good Nodes | Pass `max_so_far` down; return count up |
| 13 — Trees | LC 98 Validate BST | Pass `(lo, hi)` range down; return validity up |
| 13 — Trees | LC 124 Binary Tree Maximum Path Sum | Return single-arm best ↑; update global through-this-node best as side effect |

---

## Binary search on monotonic predicate

> Not all binary searches are on arrays. If `feasible(x)` is a monotonic yes/no function, binary search finds the boundary.

| Module | Canonical problem | The predicate |
|---|---|---|
| 11 — Binary Search on Answer | CSES 1085 Array Division | `feasible(max_sum)` = can the array be split into k parts each ≤ max_sum? |
| 11 — Binary Search on Answer | LC 875 Koko Eating Bananas | `feasible(speed)` = can Koko eat all piles in h hours at this speed? |

---

## Augmented data structure

> The base structure can't answer your query directly. Carry an extra field per element that records the running answer at insertion time.

| Module | Canonical problem | What's carried |
|---|---|---|
| 6 — Stack | LC 155 Min Stack | Each stack entry: `(value, min_so_far)` |
| 8 — Monotonic Deque | LC 862 Shortest Subarray Sum ≥ K | Deque stores indices into a precomputed prefix-sum array |
| 9 — Linked List | LC 146 LRU Cache | Doubly linked list nodes + dict `{key → node}` |

---

## Heap of size k

> When you only need the top-k (not the full sort), maintain a heap of size k. Saves O(n log n) → O(n log k).

| Module | Canonical problem | Heap type |
|---|---|---|
| 15 — Heap / PQ | LC 703 Kth Largest in a Stream | Min-heap of size k — top is the k-th largest |
| 15 — Heap / PQ | LC 973 K Closest Points | Max-heap of size k — pop when size exceeds k |

---

## Two-heap balancing

> Split a stream into two halves separated by a target rank (the median, the k-th smallest). One half is a max-heap, the other a min-heap. Rebalance after each insert.

| Module | Canonical problem | The split |
|---|---|---|
| 15 — Heap / PQ | LC 295 Find Median from Data Stream | Lower half (max-heap) and upper half (min-heap); median at the boundary |

---

## Backtrack template (choose / explore / unchoose)

> Make a choice, recurse, then undo the choice. Every backtracking algorithm reduces to this triple.

| Module | Canonical problem | What's chosen |
|---|---|---|
| 12 — Backtracking | LC 78 Subsets | Include or exclude `nums[i]` |
| 12 — Backtracking | LC 46 Permutations | Fix one element at the current position |
| 12 — Backtracking | LC 39 Combination Sum | Take `candidates[i]` (possibly with reuse) |
| 12 — Backtracking | LC 51 N-Queens | Place a queen in some column on the current row |
