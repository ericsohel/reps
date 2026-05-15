# Binary Search on Answer

**Prerequisites:** Binary Search  
**Unlocks:** (technique recurs in Graphs, DP, Data Structures)  
**Patterns introduced:** [binary search on monotonic predicate](00-patterns.md#binary-search-on-monotonic-predicate)  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [CSES 1085 — Array Division](https://cses.fi/problemset/task/1085) and attempt it before reading below.

> Divide an array of n integers into k contiguous subarrays so that the maximum subarray sum is minimised. Output the value.  
> Constraints: n ≤ 2 × 10⁵, k ≤ n.

Trying to *construct* the optimal split directly is hard — no obvious greedy or DP runs fast enough for n = 2 × 10⁵.

The question to carry into Step 2: *the problem asks for a specific value X (the minimised maximum). What's the relationship between "the array can be split with max sum ≤ X" and "the array can be split with max sum ≤ X + 1"?*

---

## Step 2 — The technique

### Binary search works on more than sorted arrays

Binary search applies to any **monotonic predicate** — a yes/no question whose answer transitions from "no" to "yes" (or vice versa) exactly once as the input increases.

For Array Division, define `feasible(X) = "can we split the array into ≤ k contiguous subarrays each with sum ≤ X?"`

This predicate is monotonic in X. If feasibility holds at X, it holds at X+1, X+2, ... (the same split still works). If it fails at X, it fails at X−1, X−2, ... The answer is the boundary — the smallest X where feasibility flips from no to yes.

```
X:           1   2   3   ...  14  15  16  17  18
feasible:    N   N   N   ...   N   N   Y   Y   Y
                                      ↑ answer
```

Binary search finds this boundary in O(log(max_X)) iterations. Each iteration costs whatever `feasible` costs (often O(n)). Total: O(n log(max_X)).

### Writing the feasibility check

For Array Division: greedily fill each subarray, starting a new one whenever the sum would exceed X. Count the subarrays needed. If the count ≤ k, X is feasible.

```python
def feasible(X):
    parts, curr = 1, 0
    for x in a:
        if x > X:
            return False             # single element exceeds the cap
        if curr + x > X:
            parts += 1               # start a new subarray
            curr = 0
        curr += x
    return parts <= k
```

### The template

```python
lo = <minimum possible answer>
hi = <maximum possible answer>
# Invariant: the true answer is in [lo, hi]; feasible(lo) might be False, feasible(hi) is True
while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid):
        hi = mid           # mid works — try smaller
    else:
        lo = mid + 1       # mid fails — need larger
return lo
```

This is module 11's Template B with a custom predicate instead of an array comparison.

### Numeric trace — Array Division

`a = [4, 1, 7, 3, 5]`, k = 3.

```
lo = max(a) = 7         (any X smaller than 7 can't fit the single element 7)
hi = sum(a) = 20        (X = sum always feasible with 1 subarray)

iter 1: mid=13. feasible? [4,1,7], [3,5]. parts=2 ≤ 3. Y → hi=13.
iter 2: mid=10. feasible? [4,1], [7,3], [5]. parts=3 ≤ 3. Y → hi=10.
iter 3: mid= 8. feasible? [4,1], [7], [3,5]. parts=3 ≤ 3. Y → hi=8.
iter 4: mid= 7. feasible? [4,1], [7], [3], [5]. parts=4 > 3. N → lo=8.
lo == hi == 8. Answer: 8.
```

Verify: with answer 8, the best split is `[4,1] [7] [3,5]` with max-sum 8. Any X < 8 forces 4+ subarrays.

### Setting the bounds

`lo` is the smallest answer that can possibly be feasible. For Array Division, that's `max(a)` — anything smaller can't fit the largest element in one subarray. `hi` is something guaranteed feasible — `sum(a)` for partition problems.

A loose `lo` (e.g., `0` or `1`) still gives a correct answer but does unnecessary iterations. A loose `hi` (e.g., `10^18`) is also correct but wasteful. Tighten when easy.

### Maximise-minimum direction

When the question is "maximise the minimum X such that...", flip the template:

```python
while lo < hi:
    mid = (lo + hi + 1) // 2   # bias toward the upper side
    if feasible(mid):
        lo = mid               # try larger
    else:
        hi = mid - 1
return lo
```

`feasible(x) = "can we achieve minimum ≥ x?"`. The `+ 1` in `mid` prevents an infinite loop when `lo == hi - 1` and `feasible(mid)` is True (without it, `mid = lo`, `lo = mid` keeps `lo` unchanged).

The canonical case is LC 1552 Magnetic Force Between Two Balls: place m balls at given positions to maximise the minimum pairwise distance. Binary search on the distance d; feasibility is "after sorting positions, greedily place a ball at the first viable spot — is it possible to place ≥ m of them?". The greedy choice (always take the leftmost spot ≥ last + d) is what the exchange argument from module 17 will later formalise.

### Recognising the pattern ([atlas](00-patterns.md#binary-search-on-monotonic-predicate))

Three signals:

1. The problem asks for a **minimum or maximum value** of some quantity.
2. **Checking** a proposed answer is much easier than **finding** the answer directly.
3. The check is **monotonic**: if X works, all larger (or smaller) values also work.

Common phrasings: "minimise the maximum", "maximise the minimum", "find the minimum X such that...", "can you accomplish this in time T?".

### Precondition

The feasibility predicate must be monotonic. If `feasible(X)` is True at some X then False at X+5 then True at X+10, binary search returns garbage. Always argue monotonicity before applying the template.

---

## Step 3 — Read

This module is a curated path through the USACO Guide's Binary Search page (from "Checking Feasibility" onward — you read the first half in module 11).

1. [USACO Guide — Binary Search (Silver)](https://usaco.guide/silver/binary-search) — the "Checking Feasibility" section and its examples are the load-bearing teaching.
2. CPH Chapter 12.1, pp. 113–115 — "Binary search on the answer" section, two pages.

---

## Step 4 — Code reference

### Universal template (minimise direction)

```python
def solve(a, k):
    def feasible(x):
        # Return True iff the answer x is achievable.
        ...

    lo = <min possible>
    hi = <max possible>
    # Invariant: true answer is in [lo, hi]; feasible(hi) is True
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

### Array Division

```python
def array_division(a, k):
    def feasible(X):
        parts, curr = 1, 0
        for x in a:
            if x > X:
                return False
            if curr + x > X:
                parts += 1
                curr = 0
            curr += x
        return parts <= k

    lo, hi = max(a), sum(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

### Koko Eating Bananas

```python
import math

def min_eating_speed(piles, h):
    def feasible(k):
        return sum(math.ceil(p / k) for p in piles) <= h

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

### Maximise-minimum variant

```python
def maximise_min(...):
    def feasible(x):
        # Return True iff we can achieve minimum ≥ x
        ...

    lo, hi = <min possible>, <max possible>
    while lo < hi:
        mid = (lo + hi + 1) // 2     # bias up to avoid infinite loop
        if feasible(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo
```

---

## Step 5 — Problems

The skill being trained is recognising the pattern and writing the feasibility check. Every problem has the same outer skeleton; the **feasibility shape** is what varies — and that's what each "what it teaches" cell names.

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Array Division](https://cses.fi/problemset/task/1085) | CSES | Easy | UG ⭐ | baseline | Greedy-contiguous-partition feasibility — your Step 1 problem; `parts ≤ k` if you fill each subarray up to X |
| 2 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | LC 875 | Medium | NC150 | reskin | Independent-per-element feasibility — `sum(ceil(p / k)) ≤ h`; same outer template, different feasibility shape |
| 3 | [Minimum Number of Days to Make m Bouquets](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/) | LC 1482 | Medium | new | extension | New feasibility shape: scan for **k adjacent bloomed flowers** and count m bouquets — not a sum, a structural streak |
| 4 | [The Meeting Place Cannot Be Changed](https://codeforces.com/contest/782/problem/B) | CF 782B | Medium | UG ⭐ | extension | Interval-intersection feasibility — at time T each friend's reachable interval is `[pos_i − speed_i·T, pos_i + speed_i·T]`; T is feasible iff the intersection is non-empty |
| 5 | [Magnetic Force Between Two Balls](https://leetcode.com/problems/magnetic-force-between-two-balls/) | LC 1552 | Medium | new | extension | **Maximise-minimum** direction — sort positions, greedily place balls at the first viable spot, check count ≥ m; the canonical flipped-template problem |
| 6 | [Maximum Median](https://codeforces.com/contest/1201/problem/C) | CF 1201C | Easy | UG | extension | Sort + cost-over-upper-half feasibility — the USACO Guide's featured example; cost to raise the median to x is `Σ_{i ≥ n/2} max(0, x − a[i])` |
| 7 | [Magic Ship](https://codeforces.com/problemset/problem/1117/C) | CF 1117C | Medium | UG ⭐ | extension | Modular + cyclic-prefix feasibility — the wind pattern repeats every n days, so day T's displacement is `(T // n) · P_n + P_(T % n)` |
| 8 | [Angry Cows (Gold)](http://www.usaco.org/index.php?page=viewproblem2&cpid=597) | USACO Gold | Hard | UG ⭐ | **checkpoint** | Feasibility itself is O(n log n) — chain-reaction simulation over sorted haybales + converging two-pointer over launch positions |

**Checkpoint:** USACO Gold Angry Cows without hints. The outer binary search is routine. The leap is the feasibility function — given a launch power R, can a single cow flatten all the haybales? Simulate the chain reaction: sort haybales, scan outward from each launch position, propagate by R minus the gap travelled. The greedy choice of launch position is non-obvious and requires combining BS on answer (this module) with module 5's converging-two-pointer reasoning over the sorted positions.

---

## Common mistakes

- **Forgetting to argue monotonicity.** Always state: "if X is feasible, so is X+1 (or X−1)". If you can't say why, BS on answer doesn't apply.
- **Off-by-one with `mid` calculation.** Minimise-direction uses `mid = (lo + hi) // 2`. Maximise-direction needs `mid = (lo + hi + 1) // 2` — without the `+ 1`, you can infinite-loop when `lo == hi − 1` and `feasible(mid)` is True.
- **Loose bounds wasting iterations.** Don't set `lo = 0, hi = 10**18` when the actual bounds are `max(a)` and `sum(a)`. Tight bounds save log factors and prevent subtle overflow issues in other languages (not an issue in Python but a good habit).
- **Floating-point answer.** If the answer is real-valued (minimise an average, for example), use `lo`, `hi` as floats and iterate a fixed number of times (100 iterations → 2⁻¹⁰⁰ precision) rather than `while lo < hi`.
