# Monotonic Deque

**Prerequisites:** Sliding Window, Monotonic Stack  
**Unlocks:** (technique returns in DP optimisations, not in v1)  
**Patterns introduced:** none new — combines monotonic invariant with sliding window  
**Patterns reused:** [monotonic invariant](00-patterns.md#monotonic-invariant), [augmented data structure](00-patterns.md#augmented-data-structure) (deque over prefix sums), [two-scan span](00-patterns.md#two-scan-span) (two-deque variant)

---

## Step 1 — Try this first

Open [LC 239 — Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) and attempt it before reading below.

> Given an array of n integers and a window size k, output the maximum of each window of size k as it slides from left to right.  
> Constraints: n ≤ 10⁵.

The naive solution scans every window:

```python
result = [max(a[i:i+k]) for i in range(n - k + 1)]
```

For n = 10⁵ and k = 10⁴ that's 10⁹ comparisons — TLE.

You have two tools that almost-but-not-quite work:
- A monotonic stack (module 8) pops dominated elements from one end only.
- A sliding window (module 6) advances both pointers in one direction.

The question: *the monotonic stack from module 8 handles dominance but only pops from one end. A sliding window expires elements from the front when they fall out. What changes about the stack to support both operations at once?*

---

## Step 2 — The technique

### The monotonic deque

A **deque** (double-ended queue) supports O(1) push/pop at both ends. A **monotonic deque** maintains its contents in sorted order — like a monotonic stack — *and* supports front-expiry when elements leave the window.

For sliding window maximum, the deque is **decreasing** (front holds the largest, back holds the smallest within the kept set). Two operations per new index i:

```
Rule 1 (back-pop): before appending i, pop back while a[back] ≤ a[i].
                   Those indices can never be the window max while a[i] is in scope.
Rule 2 (front-pop): if dq[0] < i - k + 1, the front index has left the window.
                    Pop front.
The front always holds the index of the current window maximum.
```

Each index is pushed once and popped at most once → O(n) total.

### Numeric trace — Sliding Window Maximum

`a = [1, 3, -1, -3, 5, 3, 6, 7]`, k = 3. Deque stores indices.

```
i=0 a=1:   back-pop: empty. push 0.              dq=[0]      window not yet full
i=1 a=3:   back-pop: a[0]=1 ≤ 3 → pop 0. push 1. dq=[1]      window not yet full
i=2 a=-1:  back-pop: a[1]=3 > -1, stop. push 2.  dq=[1,2]    max = a[1] = 3
i=3 a=-3:  back-pop: a[2]=-1 > -3, stop. push 3. dq=[1,2,3]
           front-pop: dq[0]=1 ≥ 3-3+1=1, keep.   max = a[1] = 3
i=4 a=5:   back-pop: a[3]=-3 ≤ 5 → pop 3.
                     a[2]=-1 ≤ 5 → pop 2.
                     a[1]=3 ≤ 5 → pop 1.
           push 4.                                dq=[4]
           front-pop: dq[0]=4 ≥ 2, keep.         max = a[4] = 5
i=5 a=3:   back-pop: a[4]=5 > 3, stop. push 5.   dq=[4,5]    max = a[4] = 5
i=6 a=6:   back-pop: a[5]=3 ≤ 6 → pop 5.
                     a[4]=5 ≤ 6 → pop 4.
           push 6.                                dq=[6]      max = a[6] = 6
i=7 a=7:   back-pop: a[6]=6 ≤ 7 → pop 6.
           push 7.                                dq=[7]      max = a[7] = 7

Output: [3, 3, 5, 5, 6, 7]
```

### Why this is the right structure ([atlas](00-patterns.md#monotonic-invariant))

The back-pop rule is the monotonic stack rule from module 8: discard candidates that are dominated by a newer, larger value. The front-pop rule is the sliding window expiry rule from module 6: drop indices that have left the window.

Neither rule alone solves the problem — together they're sufficient. A regular stack can't pop from the front. A regular queue can't pop dominated elements from the back. The deque supports both.

### Preconditions

The deque pattern applies whenever you need the **min or max over a sliding window**, fixed or variable size. The constraint:

- The dominance relation must be **transitive and monotone**: if `a[i] ≤ a[j]` and `j` is newer than `i`, then `i` is permanently useless while `j` is in scope. This is the standard order on numbers; if your "value" is something else (a tuple, a function), check that the dominance still implies permanent uselessness.

### Two-deque variant — variable window with `max − min ≤ K` ([two-scan span](00-patterns.md#two-scan-span))

LC 1438 needs *both* the running window max and the running window min. Maintain two deques simultaneously: a decreasing one for max, an increasing one for min. Shrink the window from the left when `a[max_dq[0]] − a[min_dq[0]] > K`.

This is the [two-scan span pattern](00-patterns.md#two-scan-span) interleaved in a single sweep — two complementary monotonic structures advancing together.

### Deque over a DP recurrence

When a recurrence has the shape `dp[i] = f(a[i], aggregate(dp[i-k..i-1]))` where `aggregate` is `max`, `min`, or another monotone combinator over a sliding window of previous DP entries, the deque pattern transplants directly — but the deque now slides over an array that is **computed as you go**, not a precomputed input.

The mechanics are identical to LC 239: indices into `dp` are stored in decreasing (or increasing) order of `dp` value; front-pop on window expiry; back-pop dominated indices on append. The new twist is the **read-then-write ordering**: you must consult the deque to compute `dp[i]`, then push `dp[i]` afterward. Pushing first would let `dp[i]` participate in computing itself.

**Numeric trace** for `dp[i] = nums[i] + max(dp[i-k..i-1])` with `nums = [10, -5, -2, 4, 0, 3]`, k = 2, base case `dp[0] = nums[0]`:

```
dp[0] = 10.                                                       push 0.   dq=[0]
i=1: front-pop while dq[0] < i-k = -1:  none.
     dp[1] = -5 + dp[dq[0]=0] = -5 + 10 = 5.
     back-pop while dp[dq[-1]] ≤ 5:     dp[0]=10 > 5, keep.       push 1.   dq=[0, 1]
i=2: front-pop while dq[0] < 0:          none.
     dp[2] = -2 + dp[dq[0]=0] = -2 + 10 = 8.
     back-pop while dp[dq[-1]] ≤ 8:     dp[1]=5 ≤ 8 → pop.        push 2.   dq=[0, 2]
i=3: front-pop while dq[0] < 1:          dq[0]=0 < 1 → pop.                  dq=[2]
     dp[3] = 4 + dp[2] = 4 + 8 = 12.
     back-pop while dp[dq[-1]] ≤ 12:    dp[2]=8 ≤ 12 → pop.       push 3.   dq=[3]
i=4: front-pop while dq[0] < 2:          dq[0]=3 not < 2, keep.
     dp[4] = 0 + dp[3] = 12.
     back-pop while dp[dq[-1]] ≤ 12:    dp[3]=12 ≤ 12 → pop.      push 4.   dq=[4]
i=5: front-pop while dq[0] < 3:          dq[0]=4 not < 3, keep.
     dp[5] = 3 + dp[4] = 15.            (answer)
```

Total work remains O(n) — each `dp` value enters and leaves the deque at most once. The naive O(n·k) transition collapses to O(n).

This is the LC 1696 pattern, and it returns whenever a DP transition reads a max/min over a fixed-width lookback.

### Deque over prefix sums ([atlas](00-patterns.md#augmented-data-structure))

When the array contains **negative numbers**, the sliding-window monotonic-invariant precondition breaks down: extending right does not reliably grow the sum. The fix: compute prefix sums and use a monotonic deque over the *prefix array*. The deque is an [augmented structure](00-patterns.md#augmented-data-structure) — its entries are indices into a precomputed prefix-sum array, not raw values.

For LC 862 (shortest subarray with sum ≥ k):

- Maintain an **increasing** deque of prefix indices.
- For each new j, **front-pop** while `prefix[j] − prefix[front] ≥ k` (a valid subarray ending at j-1 is found; record its length, then discard the front because shorter is what we want).
- **Back-pop** while `prefix[back] ≥ prefix[j]` (the back can never be a useful start point — j is at least as small and more recent, so any future r > j prefers j over back for length).

This is module 6's pattern broken by negatives, repaired by augmenting with prefix sums.

---

## Step 3 — Read

The USACO Guide's Gold Sliding Window page covers the fixed-window deque pattern (LC 239 as sample).

1. [USACO Guide — Sliding Window (Gold)](https://usaco.guide/gold/sliding-window) — read up to the sorted-set problems (those use a different technique).
2. CPH Chapter 8.3 (Sliding Window Minimum), p. 84 — concise complement.

---

## Step 4 — Code reference

### Fixed window maximum

```python
from collections import deque

def sliding_window_max(a, k):
    # Invariant: dq holds indices in strictly decreasing order of value,
    # all within the current window [i-k+1, i].
    dq = deque()
    result = []
    for i in range(len(a)):
        while dq and dq[0] < i - k + 1:        # front: drop expired
            dq.popleft()
        while dq and a[dq[-1]] <= a[i]:        # back: drop dominated
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(a[dq[0]])
    return result
```

### Variable window — max − min ≤ limit (two deques)

```python
from collections import deque

def longest_subarray(a, limit):
    max_dq = deque()        # decreasing — front is current window max
    min_dq = deque()        # increasing — front is current window min
    left = 0
    ans = 0
    for right in range(len(a)):
        while max_dq and a[max_dq[-1]] <= a[right]:
            max_dq.pop()
        while min_dq and a[min_dq[-1]] >= a[right]:
            min_dq.pop()
        max_dq.append(right)
        min_dq.append(right)

        while a[max_dq[0]] - a[min_dq[0]] > limit:
            left += 1
            if max_dq[0] < left: max_dq.popleft()
            if min_dq[0] < left: min_dq.popleft()

        ans = max(ans, right - left + 1)
    return ans
```

### Deque-optimised DP

```python
from collections import deque

def deque_dp(nums, k):
    # Recurrence:  dp[i] = nums[i] + max(dp[i-k..i-1]);  dp[0] = nums[0].
    # Invariant: dq holds indices into dp in strictly decreasing order of dp value,
    #            all within the lookback window [i-k, i-1].
    n = len(nums)
    dp = [0] * n
    dp[0] = nums[0]
    dq = deque([0])
    for i in range(1, n):
        while dq and dq[0] < i - k:                # front: expire out-of-window indices
            dq.popleft()
        dp[i] = nums[i] + dp[dq[0]]                # READ before WRITE — strict ordering
        while dq and dp[dq[-1]] <= dp[i]:          # back: drop dominated dp values
            dq.pop()
        dq.append(i)
    return dp[-1]
```

### Deque over prefix sums — shortest subarray with sum ≥ k

```python
from collections import deque

def shortest_subarray(a, k):
    n = len(a)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + a[i]

    # Invariant: dq holds prefix-array indices in strictly increasing order of prefix value.
    dq = deque()
    ans = float('inf')

    for j in range(n + 1):
        # front-pop: valid subarrays ending at j-1 are found and recorded
        while dq and prefix[j] - prefix[dq[0]] >= k:
            ans = min(ans, j - dq.popleft())
        # back-pop: current prefix is smaller, so dq back can never be a better start
        while dq and prefix[dq[-1]] >= prefix[j]:
            dq.pop()
        dq.append(j)

    return ans if ans != float('inf') else -1
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | LC 239 | Hard | NC150 | baseline | Fixed-window decreasing deque — your Step 1 problem; the canonical interview application |
| 2 | [Max Subarray Sum II](https://cses.fi/problemset/task/1644) | CSES | Medium | UG | extension | Fixed-window deque over prefix sums — max subarray sum with length in `[a, b]`; reduces to "max of P[i] over a sliding window of size b−a+1" |
| 3 | [Longest Continuous Subarray With Absolute Diff ≤ Limit](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-leq-limit/) | LC 1438 | Medium | new | extension | Two deques simultaneously — max-deque and min-deque tracked together; the two-scan span pattern interleaved in one sweep |
| 4 | [Jump Game VI](https://leetcode.com/problems/jump-game-vi/) | LC 1696 | Medium | new | extension | New sub-pattern: **deque over a DP recurrence**. `dp[i] = nums[i] + max(dp[i-k..i-1])`; the deque slides over an array computed as you go — strict read-before-write |
| 5 | [Maximum Number of Robots Within Budget](https://leetcode.com/problems/maximum-number-of-robots-within-budget/) | LC 2398 | Hard | new | combination | Deque-max combined with a running cost sum inside a variable window from module 6; cost formula `max_charge + window_size × sum_costs` drives the shrink decision |
| 6 | [Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) | LC 862 | Hard | new | **checkpoint** | Deque over prefix sums when the array contains negatives — module 6's sliding window precondition breaks; module 4's prefix sums are the repair |

**Checkpoint:** LC 862 without hints. Two things must combine without hand-holding: (1) recognise that negatives break module 6's sliding window — extending right doesn't necessarily grow the sum, so the monotonic invariant fails; (2) repair by computing prefix sums and running the deque pattern over the *prefix array*. The front-pop and back-pop rules look similar to LC 239 but the meanings are different (front-pop **records** valid subarrays and discards their starts as "no longer the shortest"; back-pop discards useless future start points). Step 2's exposition is the load-bearing teaching for this leap.

If you stall: re-solve problem 4 (LC 1696) first. The "deque over a computed array" framing — and the strict read-then-write ordering — transfers directly; the only change here is *which* computed array (prefix sums) and *what* front-pop means.

---

## Common mistakes

- **Storing values instead of indices.** Front-pop needs to compare an index to the window boundary (`dq[0] < i - k + 1`). Always store indices; look up values via `a[dq[-1]]` or `prefix[dq[0]]` or `dp[dq[0]]`.
- **`<` vs `<=` in back-pop.** Use `<=` (pop on equal). Keeping equal values inflates the deque and produces wrong window boundaries when the front-pop check triggers on an equal-value index that is actually older than necessary.
- **Two-deque variable window — front-pop condition.** When advancing `left`, only `popleft` from a deque if its `dq[0] == left` (the front index is exactly the one being expired). Unconditionally popping front breaks the invariant.
- **Deque-DP: pushing before reading.** Compute `dp[i]` from the deque's front *before* pushing index `i`. Pushing first lets `dp[i]` participate in its own max — `dp[i]` reads itself and gets `dp[i] = nums[i] + dp[i]`, which is wrong for any `nums[i] ≠ 0`.
- **LC 862 loop range.** The prefix array has length `n+1`. The deque loop must run `for j in range(n+1)`, not `range(n)`. Stopping at n misses subarrays ending at the last index.
