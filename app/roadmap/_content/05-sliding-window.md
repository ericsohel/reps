# Sliding Window

**Prerequisites:** [complement lookup (module 2)](00-patterns.md#complement-lookup), [monotonic invariant (module 4)](00-patterns.md#monotonic-invariant)  
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

**Difference from module 4:** in module 4 both pointers could move in either direction (converging from both ends). Here both pointers always move *forward*, but the right pointer leads. There's no symmetric mirror logic.

### Numeric trace — variable window for exact sum

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

Each element enters and leaves the window once. O(n).

### Preconditions ([atlas](00-patterns.md#monotonic-invariant))

The technique applies when the window property is **monotonic in the window's extent**:

- "Subarray with sum = k, all positive integers" — sum is monotonic in extent (positive integers only).
- "Longest substring with no duplicates" — adding a character can introduce a duplicate; removing one can resolve it.
- "Longest window with `max − min ≤ K`" — once max − min exceeds K, shrinking left can only fix it.

**Negative numbers break the precondition.** With negatives, extending right doesn't necessarily grow the sum. Use prefix sums + dict (module 3) instead — that's exactly what LC 862 in module 8 requires.

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

1. [USACO Guide — Two Pointers (Silver)](https://usaco.guide/silver/two-pointers) — the CF Books / sliding-window section onward. Skip the converging part (that was module 4's reading).
2. CPH Chapter 8.1, pp. 79–81 — the subarray examples at the bottom of the section cover the variable-window pattern.

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
| 2 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | LC 121 | Easy | NC150 | extension | Degenerate window — single-pass with running minimum; the "window" is really just `(running_min_index, current_index)` |
| 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | LC 3 | Medium | NC150 | extension | Variable window with a set — shrink when a duplicate is added |
| 4 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | LC 424 | Medium | NC150 | extension | Variable window with frequency dict — uses the stale-`max_freq` trick from Step 2 |
| 5 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | LC 567 | Medium | NC150 | extension | Fixed window with frequency comparison — window size is exactly `len(s1)` |
| 6 | [Diamond Collector](http://www.usaco.org/index.php?page=viewproblem2&cpid=643) | USACO Silver | Medium | UG ⭐ | extension | Sort + variable window with `max − min ≤ K` constraint — must recognise the pattern from the problem statement |
| 7 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | LC 76 | Hard | NC150 | **checkpoint** | Minimum valid variable window with multi-character tracking |

**Checkpoint:** LC 76 without hints. The leap is the "missing counter" — instead of comparing the whole frequency dict on every step, track a single integer `missing` that counts how many `t`-character requirements are still unmet. Decrement when the right character is added in sufficient quantity; increment when it's removed past its required count. The `if need[c] > 0: missing -= 1` and `if need[s[left]] > 0: missing += 1` checks are the load-bearing details — getting them wrong gives a non-O(n) algorithm.

---

## Common mistakes

- **Applying sliding window when the property is not monotonic.** With negative numbers in the array, sum is not monotonic in window extent. Use module 3's prefix-sum + dict (which doesn't require monotonicity); LC 862 in module 8 is the canonical case.
- **Forgetting `del freq[x]` when count hits zero.** `len(freq)` reads count-of-keys, which stays inflated if you leave zero-valued keys. Either `del` on zero, or use `if freq[x] == 0: missing += 1`-style tracking that doesn't depend on dict size.
- **Fixed-window off-by-one.** Build the initial window with `window = sum(a[:k])`, then start the slide loop at `range(k, n)`. Iterating from index 0 double-counts the first window.
- **`while` vs `if` for shrink.** Variable-window shrinkage uses `while` (the window might be invalid for several elements). Using `if` advances `left` by at most 1 per iteration and produces wrong answers when multiple shrinks are needed.
