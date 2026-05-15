# DP Intro / 1D

**Prerequisites:** Recursion & Backtracking  
**Unlocks:** 2D / Grid DP, Knapsack Family, LIS / LCS, DP on Trees, Bitmask DP, Interval DP  
**Track:** both  
**Patterns introduced:** memoisation, tabulation, 1D DP state design  
**Patterns reused:** none — this is the foundation module for all DP

---

## Step 1 — Try this first

Open [AtCoder DP Contest — Frog 1](https://atcoder.jp/contests/dp/tasks/dp_a) and attempt it before reading below.

> N stones in a row. Stone i has height h[i]. A frog starts at stone 1 and wants to reach stone N. Each jump goes to stone i+1 or i+2. The cost of a jump is |h[current] − h[destination]|. Find the minimum total cost.

Write a recursive solution that tries all jump sequences:

```python
def solve(i):
    if i == n - 1: return 0
    opt1 = abs(h[i+1] - h[i]) + solve(i+1)
    opt2 = abs(h[i+2] - h[i]) + solve(i+2) if i+2 < n else float('inf')
    return min(opt1, opt2)
```

Submit it. For n = 10⁵ this recurse tree has 2^n leaves — TLE.

The question to carry into Step 2: *when the recursion reaches stone i having come via different paths, it solves the same subproblem "minimum cost from stone i to stone N" every time. How many distinct subproblems actually exist, and what does that tell you about how much real work there is?*

---

## Step 2 — The technique

### The two DP properties

Dynamic programming applies when a problem has:

1. **Overlapping subproblems.** The same sub-question is solved multiple times. In Frog 1, `solve(3)` is called when you reach stone 3 via stone 1 (1→2→3) and via stone 2 (1→3). Both calls do identical work.

2. **Optimal substructure.** An optimal solution contains optimal solutions to its subproblems. The cheapest path from stone 1 to stone 5 uses the cheapest path from stone 1 to stone 3 (or 4), not some arbitrary path to 3 (or 4).

**Answer to Step 1.** There are exactly n distinct subproblems — one per stone. The 2^n recursion tree is redundant; caching solves each subproblem once.

### Memoisation (top-down)

Add a cache to the recursive solution:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def dp(i):
    if i == n - 1: return 0
    opt1 = abs(h[i+1] - h[i]) + dp(i+1)
    opt2 = abs(h[i+2] - h[i]) + dp(i+2) if i+2 < n else float('inf')
    return min(opt1, opt2)
```

Now each stone is solved exactly once. O(n) total.

### Tabulation (bottom-up)

Build the answer iteratively from small subproblems to large:

```python
dp = [float('inf')] * n
dp[0] = 0                             # base case: already at stone 0
for i in range(1, n):
    dp[i] = min(dp[i], dp[i-1] + abs(h[i] - h[i-1]))
    if i >= 2:
        dp[i] = min(dp[i], dp[i-2] + abs(h[i] - h[i-2]))
# answer: dp[n-1]
```

Tabulation avoids recursion depth issues and is often faster in practice.

**Which to use:** start with memoisation when the recursion structure is clear (easier to write, state space clearer). Convert to tabulation if recursion depth is a concern or you need space optimisation.

### Numeric trace — Frog 1

Heights: `h = [10, 30, 40, 20]`.

```
dp[0] = 0          (start)
dp[1] = dp[0] + |30−10| = 20
dp[2] = min(dp[1] + |40−30|, dp[0] + |40−10|) = min(30, 30) = 30
dp[3] = min(dp[2] + |20−40|, dp[1] + |20−30|) = min(50, 30) = 30
```

Answer: 30. The optimal path skips stone 2: `0 → 1 → 3`.

### The four questions for any DP state

1. **What is the state?** `dp[i]` = minimum cost to reach stone i. Define it precisely before writing any code.
2. **What are the transitions?** How do you compute `dp[i]` from smaller subproblems?
3. **What are the base cases?** `dp[0] = 0`.
4. **What is the answer?** `dp[n-1]`.

### Common 1D DP patterns

**Linear dependency** — `dp[i]` depends only on `dp[i-1]` (and possibly `dp[i-2]`). Examples: Climbing Stairs, Frog 1, House Robber.

**Interval scan** — `dp[i]` depends on *some* earlier `dp[j]`. Must scan all valid `j < i`. Examples: Word Break (dp[i] = True if any dp[j] is True and `s[j:i]` is a word), Coin Change (dp[i] = min over all coins c of dp[i-c]).

**Numeric trace** — Word Break with `s = "leetcode"`, dict = `{"leet", "code"}`:

```
dp[0] = True       (empty prefix is trivially segmentable)
dp[1] (l):       scan j=0: dp[0]=T, "l" not in dict.            dp[1]=F
dp[2] (le):      scan j=0..1: dp[j] and s[j:2] in dict? no.     dp[2]=F
dp[3] (lee):     same — no match.                                dp[3]=F
dp[4] (leet):    j=0: dp[0]=T and "leet" in dict ✓.              dp[4]=T
dp[5] (leetc):   scan j=0..4. dp[4]=T and "c" in dict? no.       dp[5]=F
dp[6] (leetco):  scan. no match.                                  dp[6]=F
dp[7] (leetcod): no match.                                        dp[7]=F
dp[8] (leetcode): j=4: dp[4]=T and "code" in dict ✓.             dp[8]=T

Return dp[8] = True.
```

The "scan all earlier j" makes this O(n²) compared to the linear DP's O(n).

**State machine** — multiple states at each position. "Maximum Product Subarray": track both `curr_max` and `curr_min` ending at i, because a negative number flips them.

**Numeric trace** — Max Product on `[2, 3, -2, 4]`:

```
i=0 (x=2):  candidates = {2}. curr_max=2, curr_min=2. result=2.
i=1 (x=3):  candidates = {3, 2*3=6, 2*3=6}. curr_max=6, curr_min=3. result=6.
i=2 (x=-2): candidates = {-2, 6*(-2)=-12, 3*(-2)=-6}. curr_max=-2, curr_min=-12. result=6.
i=3 (x=4):  candidates = {4, -2*4=-8, -12*4=-48}. curr_max=4, curr_min=-48. result=6.

Return 6. The optimal subarray is [2, 3].
```

Notice how `curr_min=-12` at i=2 was useless *then* but would have become useful if i=3 had been negative (e.g., `x=-5` would give `(-12) * (-5) = 60`). That's why we keep both.

The same multiple-state pattern handles **House Robber II** (circular array): solve two linear subproblems (`nums[:-1]` and `nums[1:]`) and take the max — circularity is handled by ruling out one endpoint per pass.

---

## Step 3 — Read

1. [USACO Guide — Intro to DP (Gold)](https://usaco.guide/gold/intro-dp) — covers Frog 1, USACO Gold samples, and the general DP framework. Load-bearing.
2. CPH Chapter 7 (Dynamic Programming), pp. 73–85 — covers coins, paths, subsequences. Language-agnostic, concise.

---

## Step 4 — Algorithm Pattern Library

DP is a *framework* more than a collection of algorithms — the per-problem code is the recurrence translated to Python. The reusable primitives here are: the two implementation styles (memoisation, tabulation) and the rolling-pair space optimisation that recurs whenever `dp[i]` depends on only `dp[i-1]` and `dp[i-2]`.

### Memoisation skeleton (top-down)

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def dp(*state):
    if base_case(state):
        return base_value
    # combine subproblem results
    return min(dp(smaller_state_1), dp(smaller_state_2), ...)

answer = dp(*initial_state)
```

Use when the recursion structure is clearer than the iteration order, or when you don't visit all states (memoisation computes only what's reachable from the root call).

### Tabulation skeleton (bottom-up)

```python
dp = [<initial>] * n
dp[base_index] = <base value>
for i in <some order>:
    dp[i] = combine(dp[j] for j in dependencies(i))
return dp[<answer index>]
```

Use when the iteration order is obvious (left-to-right for 1D linear, fill-by-length for intervals) and you need to avoid Python's recursion limit.

### Rolling-pair optimisation

When `dp[i]` depends only on `dp[i-1]` and `dp[i-2]`, you don't need the full array:

```python
# Invariant: prev1 = optimal answer ending at position i; prev2 = ending at i-1
prev2, prev1 = <base for -1>, <base for 0>
for x in sequence:
    prev2, prev1 = prev1, <recurrence using prev1, prev2, x>
return prev1
```

This collapses O(n) space to O(1). Applies to: Climbing Stairs, House Robber, Frog 1, Min Cost Climbing Stairs, and any other "depends-on-last-two" DP.

### Multi-state pattern

When the answer at position `i` depends on which of several mutually-exclusive states you were in at position `i-1`, carry one running value per state:

```python
state_a, state_b = <init_a>, <init_b>
for x in sequence:
    new_a = transition_a(state_a, state_b, x)
    new_b = transition_b(state_a, state_b, x)
    state_a, state_b = new_a, new_b
return max(state_a, state_b)
```

Used in Maximum Product Subarray (states: max ending here, min ending here), Best Time to Buy/Sell with Cooldown (states: holding, sold, rest). The number of states is bounded — usually 2 or 3.

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Frog 1](https://atcoder.jp/contests/dp/tasks/dp_a) | AC | Easy | UG | baseline | Your Step 1 problem — linear DP, two-predecessor transition |
| 2 | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | LC 70 | Easy | NC150 | extension | Fibonacci DP — counting paths instead of minimising cost; same two-predecessor structure |
| 3 | [House Robber](https://leetcode.com/problems/house-robber/) | LC 198 | Medium | NC150 | extension | Take-or-skip with a single constraint; introduces the skip-or-take pattern |
| 4 | [House Robber II](https://leetcode.com/problems/house-robber-ii/) | LC 213 | Medium | NC150 | extension | Circular → two subproblems; solve the same linear DP twice |
| 5 | [Decode Ways](https://leetcode.com/problems/decode-ways/) | LC 91 | Medium | NC150 | extension | Parsing DP — transitions depend on the actual character values, not just position |
| 6 | [Word Break](https://leetcode.com/problems/word-break/) | LC 139 | Medium | NC150 | extension | Interval-scan DP — `dp[i]` looks back at all `dp[j]` for `j < i` |
| 7 | [Time is Mooney](http://www.usaco.org/index.php?page=viewproblem2&cpid=993) | USACO Gold | Easy | UG ⭐ | extension | DP on a graph with a time dimension — must recognise the 2D state space `dp[t][v]` from the problem statement |
| 8 | [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) | LC 152 | Medium | NC150 | **checkpoint** | Tracking two states simultaneously (max and min) — negatives flip, so both matter |

**Checkpoint:** LC 152 without hints. The insight — maintaining both `curr_max` and `curr_min` at each position because a large negative minimum can become the new maximum when multiplied by the next negative — is not derivable from any of problems 1–7. All earlier problems track one quantity per position. Tracking two complementary running values is the leap.

**Also doable** — alongside the ladder:
- After #2: [Min Cost Climbing Stairs (LC 746, NC150)](https://leetcode.com/problems/min-cost-climbing-stairs/) — same two-predecessor structure as Climbing Stairs, but with weighted costs at each step.
- After #8 as a state-machine extension: [Best Time to Buy and Sell Stock with Cooldown (LC 309, NC150)](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) — three running states (holding, sold, rest) instead of two; same multi-state pattern.

**Deferred to other modules:**
- *Coin Change* (LC 322) → module 26 (Knapsack Family) — it's unbounded knapsack.
- *Longest Increasing Subsequence* (LC 300) → module 27 (LIS / LCS).
- *Partition Equal Subset Sum* (LC 416) → module 26.
- *Longest Palindromic Substring* (LC 5), *Palindromic Substrings* (LC 647) → module 25 (2D / Grid DP) — the DP table is 2D `dp[i][j] = "is s[i..j] a palindrome"`.

---

## Common mistakes

- **Forgetting the base case.** `dp[0] = True` in Word Break means "the empty prefix is trivially segmentable". Missing it makes the whole table False.
- **Off-by-one between index and dp index.** `dp[i]` represents the first i characters of `s` (length i). `dp[n]` is the answer, not `dp[n-1]`. Misaligning these is the #1 source of silent wrong answers in string DP.
- **Memoising with mutable arguments.** `@lru_cache` requires hashable arguments. Lists and dicts can't be cached. Convert to tuples or use an explicit `dict`.
- **Maximum Product — resetting vs keeping running product.** Unlike Maximum Subarray (Kadane's — reset to `x` when running is negative), Maximum Product must keep both the max and min because a future negative can resurrect the minimum as the new maximum.
