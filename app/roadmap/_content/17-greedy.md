# Greedy

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Intervals & Sweep Line  
**Patterns introduced:** [exchange argument](00-patterns.md#exchange-argument)  
**Patterns reused:** [monotonic invariant](00-patterns.md#monotonic-invariant) (max-reach style), [reduce by fixing one dimension](00-patterns.md#reduce-by-fixing-one-dimension)

---

## Step 1 — Try this first

Open [CSES 1630 — Tasks and Deadlines](https://cses.fi/problemset/task/1630) and attempt it before reading below.

> You have n tasks. Task i has duration `d_i` and a reward `a_i − completion_time`. Process tasks one at a time (no parallelism). Find the schedule that maximises total reward.  
> Constraints: n ≤ 2 × 10⁵.

The brute force:

```python
from itertools import permutations
best = -float('inf')
for perm in permutations(range(n)):
    t, total = 0, 0
    for i in perm:
        t += d[i]
        total += a[i] - t
    best = max(best, total)
```

O(n!) — for n = 10 already 3.6 × 10⁶ permutations; n = 20 hits 2.4 × 10¹⁸. TLE almost immediately.

You'll be tempted by several "greedy" orderings: sort by reward descending (urgent first), by `a_i / d_i` ratio (best yield per minute), by duration ascending (fast first), by `a_i − d_i` (something else). Most will be wrong on some inputs.

The question to carry into Step 2: *consider two adjacent tasks i and j in some schedule. The completion times of all other tasks are unaffected by swapping i and j. What property of just those two tasks determines whether swapping them increases or decreases the total reward?*

---

## Step 2 — The technique

### Greedy choice + exchange argument ([atlas](00-patterns.md#exchange-argument))

A greedy algorithm makes a local choice that's part of *some* optimal solution. The proof technique is the **exchange argument**: take any optimal solution OPT and show that any deviation from the greedy choice can be swapped back without decreasing the objective. After enough swaps, OPT becomes the greedy solution, so greedy is at least as good as OPT — therefore optimal.

**Answer to Step 1.** Consider two adjacent tasks i, j scheduled in that order with `d_i > d_j`. Let T be the elapsed time before them. The schedule contribution is:

```
before swap:  (a_i − T − d_i)        +  (a_j − T − d_i − d_j)
after swap:   (a_j − T − d_j)        +  (a_i − T − d_j − d_i)

difference (after − before)  =  d_i − d_j  >  0
```

Any "longer-first, shorter-after" adjacent pair can be swapped to gain `d_i − d_j` reward. So any OPT can be converted into "sort by duration ascending" without losing reward. Greedy choice: shortest duration first.

### Numeric trace — Tasks & Deadlines

Tasks (duration, reward): `(4, 8), (1, 5), (2, 7), (3, 9)`.

Sort by duration ascending: `(1, 5), (2, 7), (3, 9), (4, 8)`.

```
elapsed=0 → +d=1, t=1.  reward = 5  − 1  =  4.  total =  4
elapsed=1 → +d=2, t=3.  reward = 7  − 3  =  4.  total =  8
elapsed=3 → +d=3, t=6.  reward = 9  − 6  =  3.  total = 11
elapsed=6 → +d=4, t=10. reward = 8  − 10 = −2.  total =  9
```

The last task is run at a loss (negative reward), but moving it earlier would push another, larger-reward task later — the exchange argument guarantees we can't do better.

### Three recurring greedy templates

**Template A — sort, then iterate** (CSES 1630, LC 763, LC 846).  
Sort by the greedy key, scan once, build the answer linearly.

**Template B — running aggregate / Kadane's** (LC 53).  
Maintain a running quantity (current best ending here); reset or extend at each element based on a local rule.

**Template C — max-reach / single-pass invariant** (LC 55, LC 134).  
Maintain a single running invariant (furthest index, cumulative deficit) and decide locally. Often relies on the [monotonic invariant pattern](00-patterns.md#monotonic-invariant).

### When greedy fails

Greedy is not a universal hammer. The classic counterexample: **coin change with arbitrary denominations**. Denominations `{1, 3, 4}`, target 6.

- Greedy (take largest): `4 + 1 + 1 = 3` coins.
- Optimal: `3 + 3 = 2` coins.

Greedy fails here because the local "best" choice (4) prevents the global "best" structure (3 + 3). The exchange argument doesn't go through: swapping 4 for 3 changes the remaining subproblem in a way that can't be patched without making things worse.

**The diagnostic:** if you can write an exchange-argument proof in three lines (like the Tasks & Deadlines proof above), greedy works. If you can't, suspect DP.

### Why this module precedes Intervals

Module 18 (Intervals & Sweep Line) is a specialisation of greedy where the elements are time ranges. The exchange argument idea here is the foundation; in module 18 it applies to interval-scheduling problems specifically.

---

## Step 3 — Read

The USACO Guide has two greedy pages. The Silver one is load-bearing for this module's harder problems.

1. [USACO Guide — Intro to Greedy (Bronze)](https://usaco.guide/bronze/intro-greedy) — gentle introduction with the Mad Scientist sample. Read the prose, the problem set is for module 18's overlap.
2. [USACO Guide — Greedy Sorting (Silver)](https://usaco.guide/silver/greedy-sorting) — covers CSES 1630 (your Step 1) with the full exchange-argument proof. Load-bearing.

---

## Step 4 — Code reference

### Template A — sort then iterate (Tasks & Deadlines)

```python
def tasks_deadlines(tasks):
    # tasks = [(duration, reward), ...]
    # Invariant: process shortest-first; elapsed = time used by tasks done so far.
    tasks.sort(key=lambda t: t[0])
    elapsed, total = 0, 0
    for d, a in tasks:
        elapsed += d
        total += a - elapsed
    return total
```

### Template B — running aggregate (Kadane's)

```python
def max_subarray(a):
    # Invariant: cur = best subarray sum ending at current index;
    #            best = max over all ending positions seen so far.
    cur = best = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)         # reset if running sum is hurting
        best = max(best, cur)
    return best
```

### Template C — max-reach (Jump Game)

```python
def can_jump(a):
    # Invariant: max_reach = furthest index reachable from a[0..i] with i ≤ current
    max_reach = 0
    for i, jump in enumerate(a):
        if i > max_reach:
            return False              # can't even arrive at i
        max_reach = max(max_reach, i + jump)
    return True
```

### Cumulative deficit (Gas Station)

```python
def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1                     # globally infeasible
    # Invariant: start at the station immediately AFTER the index where running deficit hit minimum
    tank, start = 0, 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:                  # can't reach i+1 from current start
            start = i + 1             # restart
            tank = 0
    return start
```

### Two-pass for both extremes (Valid Parenthesis String)

```python
def check_valid_string(s):
    # Track the range [low, high] of possible open-paren counts.
    # '*' can be '(' (push high), ')' (pop low), or '' — handle the range.
    low = high = 0
    for c in s:
        if c == '(':
            low += 1; high += 1
        elif c == ')':
            low -= 1; high -= 1
        else:                          # '*'
            low -= 1                   # treat as ')'
            high += 1                  # treat as '('
        if high < 0: return False     # too many ')'s even in best case
        low = max(low, 0)             # negative low → some '*' becomes ''
    return low == 0
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Tasks and Deadlines](https://cses.fi/problemset/task/1630) | CSES | Easy | UG ⭐ | baseline | Sort + iterate with exchange-argument optimality — your Step 1 problem |
| 2 | [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) | LC 53 | Medium | NC150 | baseline | Kadane's — running aggregate with local reset rule |
| 3 | [Jump Game](https://leetcode.com/problems/jump-game/) | LC 55 | Medium | NC150 | baseline | Max-reach single-pass invariant |
| 4 | [Partition Labels](https://leetcode.com/problems/partition-labels/) | LC 763 | Medium | NC150 | extension | One-pass with `last_occurrence` lookup; close a partition when the running max-last-index equals the current index |
| 5 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | LC 45 | Medium | NC150 | extension | Extends LC 55 with BFS-style level counting — track current jump's reach AND next jump's reach |
| 6 | [Gas Station](https://leetcode.com/problems/gas-station/) | LC 134 | Medium | NC150 | extension | Cumulative deficit insight — global feasibility check + restart-on-negative |
| 7 | [Hand of Straights](https://leetcode.com/problems/hand-of-straights/) | LC 846 | Medium | NC150 | extension | Sort + frequency map — greedily consume the smallest remaining card to start each group |
| 8 | [Valid Parenthesis String](https://leetcode.com/problems/valid-parenthesis-string/) | LC 678 | Medium | NC150 | **checkpoint** | Two-bound tracking — maintain `low` and `high` simultaneously to handle the `*` wildcard |

**Checkpoint:** LC 678 without hints. The leap: track *two* running quantities — the minimum and maximum possible open-paren counts. `*` increments high (treated as `(`) and decrements low (treated as `)`). If `high` ever goes negative, no valid interpretation exists. If `low` would go negative, some `*` is being interpreted as `''` (skip). At the end, valid iff `low == 0`. Tracking a *range* instead of a single state is the leap — no earlier problem in this ladder uses two simultaneous invariants.

**Also doable:** [Merge Triplets to Form Target Triplet (LC 1899, NC150)](https://leetcode.com/problems/merge-triplets-to-form-target-triplet/) — discard any triplet exceeding the target in any coordinate; greedily check if remaining triplets cover the target in each coordinate.

---

## Common mistakes

- **Trusting greedy without proof.** "Sort by some metric, take greedily" is the most common wrong-answer source. Always either write a one-paragraph exchange argument or verify on at least three small examples (including a counterexample candidate).
- **Wrong sort key.** Tasks & Deadlines sorts by duration, not reward. Hand of Straights sorts by value, not frequency. The greedy key is determined by the exchange argument — if you can't justify the key, the algorithm is a guess.
- **Kadane's reset condition.** `cur = max(x, cur + x)` is correct. `cur = max(0, cur + x)` works only for arrays with at least one non-negative element. The first form handles all-negative arrays correctly.
- **Gas Station global check.** If `sum(gas) < sum(cost)`, no solution exists regardless of starting position. Skipping this check makes the "restart on negative" logic return a bogus index.
- **LC 678 update order.** `low = max(low, 0)` *after* the update. Clamping before applying the update can mask invalid sequences.
