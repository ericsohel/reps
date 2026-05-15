# Sliding Window

**Prerequisites:** [complement lookup (module 2)](00-patterns.md#complement-lookup), [monotonic invariant (module 5)](00-patterns.md#monotonic-invariant)  
**Unlocks:** Monotonic Deque  
**Patterns introduced:** none new (specialises [monotonic invariant](00-patterns.md#monotonic-invariant) for same-direction pointers)  
**Patterns reused:** [complement lookup](00-patterns.md#complement-lookup) (over window dicts), [monotonic invariant](00-patterns.md#monotonic-invariant)

---

## Step 1 — Try this first

Open [CSES 1660 — Subarray Sums I](https://cses.fi/problemset/task/1660) and attempt it before reading below.

> Given an array of n **positive** integers and a target x, find a contiguous subarray with sum exactly x.  
> Constraints: n ≤ 2 × 10⁵.

The naive solution:

```python
for i in range(n):
    total = 0
    for j in range(i, n):
        total += a[j]
        if total == x:
            print(i + 1, j + 1)
```

O(n²) — TLE for n = 2 × 10⁵.

The question to carry into Step 2: *as the right boundary moves from r to r+1, the sum changes by exactly +a[r+1]. As the left boundary moves from l to l+1, it changes by exactly −a[l]. What would you do differently if you avoided recomputing the sum from scratch each iteration?*

---

## Step 2 — The technique

### Same-direction two pointers (the sliding window)

Maintain a window `[left, right]`. The right pointer always advances. The left pointer advances only when the window violates its invariant.

```
right →→→→→→→→→→→→→→
left →  →    →→   →→→
```

This is the [monotonic invariant pattern](00-patterns.md#monotonic-invariant) specialised: there must be a monotonic relationship between the window and its constraint — extending right makes the window "worse" in one direction, shrinking left makes it "better". Each pointer crosses each index at most once → O(n) total.

**Difference from module 5:** in module 5 both pointers could move in either direction (converging from both ends). Here both pointers always move *forward*, but the right pointer leads. There's no symmetric mirror logic.

### Three variable-window shapes

The same skeleton — *extend right, shrink left* — produces three different answers depending on **when you read the result** and **when you shrink**:

| Goal | Shrink while ... | Read answer ... |
|---|---|---|
| **Exact match** (subarray sum = target, positive ints) | `sum > target` | when `sum == target` |
| **Longest** valid window (e.g. ≤ k distinct, no duplicates) | window is *invalid* | each iteration *after* shrinking |
| **Minimum** valid window (e.g. sum ≥ target) | window is *still valid* (greedy contraction) | each iteration *before* shrinking, inside the `while` |

Same O(n) bound — each pointer crosses each index at most once — but the loop body shape and the answer-update placement are not interchangeable.

### Numeric trace — exact-match (CSES 1660 shape)

`a = [4, 1, 2, 1, 3, 1, 2, 1]`, target = 5:

```
left=0, sum=0
right=0: sum += 4 → sum=4. <5. extend.
right=1: sum += 1 → sum=5. ✓ found at a[0..1].
right=2: sum += 2 → sum=7. >5. shrink:
         sum -= 4 → sum=3. left=1.
right=3: sum += 1 → sum=4. <5. extend.
right=4: sum += 3 → sum=7. >5. shrink:
         sum -= 1 → sum=6. left=2.
         sum -= 2 → sum=4. left=3.
right=5: sum += 1 → sum=5. ✓ found at a[3..5].
... continues
```

### Numeric trace — minimum-window (LC 209 shape)

`a = [2, 3, 1, 2, 4, 3]`, target = 7. Find the *shortest* subarray with `sum ≥ target`:

```
left=0, sum=0, best=∞
right=0: sum=2.  <7. extend.
right=1: sum=5.  <7. extend.
right=2: sum=6.  <7. extend.
right=3: sum=8.  ≥7. shrink while still ≥7:
           best = min(∞, 3-0+1) = 4.   sum -= a[0]=2 → sum=6. left=1.  <7, stop.
right=4: sum=10. ≥7. shrink:
           best = min(4, 4-1+1) = 4.   sum -= a[1]=3 → sum=7. left=2.
           best = min(4, 4-2+1) = 3.   sum -= a[2]=1 → sum=6. left=3.  <7, stop.
right=5: sum=9.  ≥7. shrink:
           best = min(3, 5-3+1) = 3.   sum -= a[3]=2 → sum=7. left=4.
           best = min(3, 5-4+1) = 2.   sum -= a[4]=4 → sum=3. left=5.  <7, stop.

best = 2  (subarray [4, 3])
```

**Update *before* the shrink, inside the `while`.** Every shrink step exposes a strictly smaller valid window — if you update after, you've already destroyed the witness. Each element still enters and leaves the window at most once, so the total work is O(n) despite the inner `while`.

### Preconditions ([atlas](00-patterns.md#monotonic-invariant))

The technique applies when the window property is **monotonic in the window's extent**:

- "Subarray with sum = k, all positive integers" — sum is monotonic in extent (positive integers only).
- "Longest substring with no duplicates" — adding a character can introduce a duplicate; removing one can resolve it.
- "Longest window with `max − min ≤ K`" — once max − min exceeds K, shrinking left can only fix it.

**Negative numbers break the precondition.** With negatives, extending right doesn't necessarily grow the sum. Use prefix sums + dict (module 4) instead — that's exactly what LC 862 in module 9 requires.

### Variable window with a dict (recombination with module 2)

When the constraint involves character/element counts, the window's state is a `defaultdict(int)`. This is the same [complement-lookup machinery](00-patterns.md#complement-lookup) from module 2, but now the dict tracks elements *currently in the window* rather than elements seen so far.

```python
from collections import defaultdict

freq = defaultdict(int)
left = 0
for right in range(n):
    freq[a[right]] += 1                # extend: add a[right]
    while <window invalid>:
        freq[a[left]] -= 1             # shrink: remove a[left]
        if freq[a[left]] == 0:
            del freq[a[left]]
        left += 1
    # window [left, right] is now valid — record / update answer
```

### Fixed-size window

When the window size is fixed at k, slide it one step at a time. No shrinking decision needed.

```python
window_sum = sum(a[:k])
for right in range(k, n):
    window_sum += a[right] - a[right - k]
    # process
```

### The LC 424 trick — don't update max_freq on shrink

LC 424 (Longest Repeating Character Replacement) asks for the longest window such that `(window_size − max_frequency_in_window) ≤ k`.

Naive: recompute `max_freq` every iteration → O(26 · n).

The trick: update `max_freq` *only when growing the window* (right pointer adds a character). On shrink, leave `max_freq` stale.

The over-estimate doesn't break correctness because the answer is the *maximum* window length, and `ans` is monotonically non-decreasing. A stale `max_freq` could let the window appear valid when it isn't, allowing further growth — but if that further growth happens, it can only match the size previously achieved with a real frequency that large. The reader is never asked for the window itself, only its length.

---

## Step 3 — Read

This module is a curated path through the second half of the USACO Guide's Two Pointers page (the same-direction examples).

1. [USACO Guide — Two Pointers (Silver)](https://usaco.guide/silver/two-pointers) — the same-direction / sliding-window section. Skip the converging part (that was module 5's reading).

---

## Step 4 — Code reference

### Variable window — positive integer sum

```python
def subarray_sum(a, target):
    # Invariant: sum(a[left..right-1]) is the running window sum;
    # the window is [left, right-1] inclusive at each iteration.
    left, total = 0, 0
    for right in range(len(a)):
        total += a[right]
        while total > target:
            total -= a[left]
            left += 1
        if total == target:
            return left, right
    return None
```

### Variable window — longest window with at most k distinct elements

```python
from collections import defaultdict

def longest_at_most_k_distinct(a, k):
    # Invariant: freq tracks counts of elements in window [left, right]
    freq = defaultdict(int)
    left, ans = 0, 0
    for right in range(len(a)):
        freq[a[right]] += 1
        while len(freq) > k:
            freq[a[left]] -= 1
            if freq[a[left]] == 0:
                del freq[a[left]]
            left += 1
        ans = max(ans, right - left + 1)
    return ans
```

### LC 424 — stale max_freq trick

```python
from collections import defaultdict

def character_replacement(s, k):
    freq = defaultdict(int)
    left, max_freq, ans = 0, 0, 0
    for right in range(len(s)):
        freq[s[right]] += 1
        max_freq = max(max_freq, freq[s[right]])       # only updated on growth
        while (right - left + 1) - max_freq > k:        # may use stale max_freq
            freq[s[left]] -= 1
            left += 1
        ans = max(ans, right - left + 1)
    return ans
```

### Fixed window — sliding sum

```python
def max_sum_window(a, k):
    window = sum(a[:k])
    ans = window
    for i in range(k, len(a)):
        window += a[i] - a[i - k]
        ans = max(ans, window)
    return ans
```

### Minimum-valid-window shape (when the goal is "smallest window satisfying P")

Variation of the variable window above — extend until P holds, then *shrink* while P still holds to find the smallest window ending at the current right pointer. The skeleton:

```python
# Invariant: window [left, right] either does not satisfy P, or is the smallest such
left = 0
best = (math.inf, ...)            # track length + identifying info
for right in range(n):
    # extend: update state to include element at right
    ...
    while window_satisfies(P):
        if (right - left + 1, left) < best:
            best = (right - left + 1, left)
        # shrink: update state to remove element at left
        ...
        left += 1
return best
```

The non-trivial part for problems like LC 76 (Minimum Window Substring) is the `window_satisfies(P)` check. Maintaining a single `missing` counter (number of unmet requirements) makes the check O(1) — see the Step 2 LC 424 discussion for an analogous trick. This is the checkpoint's leap; the code is left for Step 5.

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Subarray Sums I](https://cses.fi/problemset/task/1660) | CSES | Easy | UG | baseline | Variable window on positive integers, exact match — this was your Step 1 problem |
| 2 | [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) | LC 209 | Medium | new | extension | The **minimum-window** shape from Step 2 — extend until valid, then shrink while *still* valid; update `best` inside the `while`. Same skeleton the checkpoint extends |
| 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | LC 3 | Medium | NC150 | extension | The **longest-window** shape — extend, then shrink while *invalid*; window state is a set (or count-of-1s dict) |
| 4 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | LC 424 | Medium | NC150 | extension | Same longest-window shape with a frequency dict, plus the stale-`max_freq` trick from Step 2 — load-bearing because a fresh max recompute on every step would be O(26 · n) |
| 5 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | LC 567 | Medium | NC150 | extension | Fixed window — window size is exactly `len(s1)`, no shrink decision; compare freq dicts in O(26) per slide, or track a "matches" counter for O(1) |
| 6 | [Diamond Collector](http://www.usaco.org/index.php?page=viewproblem2&cpid=643) | USACO Silver | Medium | UG ⭐ | extension | Sort + variable window with `max − min ≤ K` constraint — the problem statement does not say "sliding window"; you must recognise it after the sort |
| 7 | [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/) | LC 992 | Hard | new | combination | at-most-K reduction — "exactly K distinct" isn't monotonic in window size; convert to `atMost(K) − atMost(K−1)`, run two variable-window passes and subtract; the first time the window pattern doubles on itself |
| 8 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | LC 76 | Hard | NC150 | **checkpoint** | Minimum-window (problem 2's shape) + multi-character tracking — the "missing counter" trick replaces the freq-dict comparison |

**Checkpoint:** LC 76 without hints. Problem 2 (LC 209) gave you the minimum-window skeleton with a single condition; the leap here is the multi-character requirement. The naive check — "does the window's freq dict cover `t`'s freq dict?" — is O(|alphabet|) per step. The leap is the **missing counter**: a single integer that counts how many `t`-character requirements are still unmet. Decrement when adding a character that brings its count up to (but not past) its required count; increment when removing a character that drops its count below required. The `if need[c] > 0: missing -= 1` and `if need[s[left]] > 0: missing += 1` checks are the load-bearing details — getting them wrong gives a non-O(n) algorithm or a wrong answer.

If you stall: re-solve problem 7 from scratch first (what makes "exactly K" hard?), then ask what changes when "valid" depends on multiple characters instead of a single sum.

### Problems handed off to other modules

- *Best Time to Buy and Sell Stock* (LC 121, NC150) → module 25 (1D DP). NC150 categorises it under Sliding Window with the label "Single Pass", but the technique is a Kadane-style scan (`best_profit_so_far`, `min_price_so_far`); the "window" interpretation requires squinting. It's better taught as the entry-level 1D DP problem.
- *Sliding Window Maximum* (LC 239, NC150) → module 9 (Monotonic Deque). The fixed-window framing is incidental; the technique is a monotonic deque keyed by index.
- *Shortest Subarray with Sum at Least K* (LC 862) → module 9 (Monotonic Deque). Negative numbers break the monotonic precondition — sum is not monotonic in window extent, so the variable-window approach fails. The correct technique is prefix sums + monotonic deque, which lives in module 9.
- *Jump Game VI* (LC 1696) → module 9 (Monotonic Deque). A DP recurrence with a sliding-window max — the deque is the load-bearing structure, not the window itself.
- *Find K Closest Elements* (LC 658, NC150) → module 11 (Binary Search). The canonical solution binary-searches for the window's left boundary, then expands. NC150 miscategorises it as sliding window.
- *Contains Duplicate II* (LC 219, NC150) — too thin to own a module slot. Fixed window with a set: `if a[right] in window: return True; window.add(a[right]); if len(window) > k: window.remove(a[right-k])`. Solve directly.
- *Find All Anagrams in a String* (LC 438) — direct reskin of problem 5 (LC 567): same fixed-window freq-dict technique, different framing. Solve it after LC 567 if you want extra reps; it adds no new mechanic.

---

## Common mistakes

- **Applying sliding window when the property is not monotonic.** With negative numbers in the array, sum is not monotonic in window extent. Use module 4's prefix-sum + dict (which doesn't require monotonicity); LC 862 in module 9 is the canonical case.
- **Updating `best` after the shrink in the minimum-window shape.** The smallest window is the one *just before* you remove an element. Update inside the `while`, before the `sum -= a[left]; left += 1` step. Updating after gives you the answer for the window minus its leftmost element — silently off by one.
- **Forgetting `del freq[x]` when count hits zero.** `len(freq)` reads count-of-keys, which stays inflated if you leave zero-valued keys. Either `del` on zero, or use `if freq[x] == 0: missing += 1`-style tracking that doesn't depend on dict size.
- **Fixed-window off-by-one.** Build the initial window with `window = sum(a[:k])`, then start the slide loop at `range(k, n)`. Iterating from index 0 double-counts the first window.
- **`while` vs `if` for shrink.** Variable-window shrinkage uses `while` (the window may be invalid — or in the min-window case, *still valid* — for several elements). Using `if` advances `left` by at most 1 per iteration and produces wrong answers when multiple shrinks are needed.
