# Sorting

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Two Pointers, Greedy, Intervals & Sweep Line, Fenwick Tree (alternative path for inversion counting)  
**Patterns introduced:** *divide-and-conquer merge* — split, recurse, combine; the load-bearing work lives in the combine step.  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [CSES 1162 — Counting Inversions](https://cses.fi/problemset/task/1162) and attempt it before reading below.

> Given an array A of n integers, count the number of inversions — pairs (i, j) with i < j and A[i] > A[j].  
> Constraints: n ≤ 2 × 10⁵.

The naive solution:

```python
def count_inversions(a):
    inv = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] > a[j]:
                inv += 1
    return inv
```

Worst case: n = 2 × 10⁵, n² = 4 × 10¹⁰ comparisons — off by a factor of ~4000 against a 1-second TL.

`a.sort()` would solve the *sorting* problem in O(n log n), but the act of sorting destroys the original order — you can no longer ask "which pairs were out of order?"

The question to carry into Step 2: *can you count the inversions **while** you sort? A divide-and-conquer sort visits every pair at most once across all recursive layers — what does each layer naturally know about pairs that cross its split?*

---

## Step 2 — The technique

This module covers two ideas:

1. **Mergesort** — one sorting algorithm you implement by hand.
2. **Counting during the merge** — the merge step naturally exposes information about pairs that cross the split, and that information is the lever for a whole family of problems.

The reader already has `arr.sort()` from Foundations §4 for the *idiom* (custom keys, stable sort, `cmp_to_key`). Sorting as an *algorithm* is what this module adds.

### Mergesort

Split the array in half. Sort each half recursively. **Merge** the two sorted halves into one sorted array.

**Numeric trace** with `[5, 2, 4, 1, 3]`:

```
sort [5, 2, 4, 1, 3]
  split → [5, 2]   and   [4, 1, 3]
  sort [5, 2]:
    split → [5]  and  [2]
    merge ([5], [2]) → [2, 5]
  sort [4, 1, 3]:
    split → [4]  and  [1, 3]
    sort [1, 3]:
      merge ([1], [3]) → [1, 3]
    merge ([4], [1, 3]) → [1, 3, 4]
  merge ([2, 5], [1, 3, 4]) → [1, 2, 3, 4, 5]
```

Recurrence: T(n) = 2 T(n/2) + O(n) → O(n log n). Every level merges n total elements; there are log n levels.

**Why hand-write it?** Python's `arr.sort()` (TimSort in C) is faster in practice. You write mergesort yourself only when you need to **carry information through the merge** that TimSort discards.

### Counting inversions during merge

In the merge of two sorted runs L (length p) and R (length q), every time you pull from R *before* L is exhausted, the remaining elements of L are all greater than the element you just pulled — each of those is an inversion crossing the split. Counting them is one addition per R-pull.

**Numeric trace** with `L = [2, 5]`, `R = [1, 3, 4]`:

```
i=0, j=0 :  L[0]=2  vs  R[0]=1.  Pull R[0]. L has 2 unused (i..) → +2 inversions.
i=0, j=1 :  L[0]=2  vs  R[1]=3.  Pull L[0].
i=1, j=1 :  L[1]=5  vs  R[1]=3.  Pull R[1]. L has 1 unused           → +1 inversion.
i=1, j=2 :  L[1]=5  vs  R[2]=4.  Pull R[2]. L has 1 unused           → +1 inversion.
i=1, j=3 :  R exhausted. Flush L.

Crossing inversions from this merge: 2 + 1 + 1 = 4.
```

These are only the inversions *crossing* the split. Inversions wholly inside L are counted by the recursive sort of L; same for R. By structural induction:

```
total = within-L + within-R + crossing
```

The pattern generalises. Any "count pairs (i, j) with i < j and P(a[i], a[j])" where P is monotone in i can be answered during merge — examples include LC 493 Reverse Pairs (`a[i] > 2 * a[j]`) and "count pairs with `a[i] − a[j] ≥ k`". The merge step does all the work; the recursive scaffold is reusable.

### Stability — and what it buys you

Python's `sorted` and `list.sort` are **stable**: elements that compare equal preserve their relative input order. Stability is what makes the "sort by secondary, then by primary" trick work (Foundations §4): a second stable sort on the primary key cannot reshuffle records that tie on the primary, so the earlier sort's order survives within each tie group.

In the merge step, stability comes from choosing `<=` (not `<`) when pulling from L: ties go to L first, preserving original order.

### Full custom comparators

`key=` expresses any ordering that ranks each element in isolation. When the order depends on *pairs* — "should `a` come before `b`?" — use `functools.cmp_to_key`:

```python
from functools import cmp_to_key

# LC 179: order strings so their concatenation is lexicographically largest.
def cmp(a, b):
    if a + b > b + a: return -1     # a before b
    if a + b < b + a: return  1     # b before a
    return 0

nums = sorted(map(str, nums), key=cmp_to_key(cmp))
```

`cmp(a, b)` returns negative if `a` should come first, positive if `b` should come first, zero on tie — same convention as C's `qsort`. Slower than `key=` (it's a Python-level callback per comparison), so reach for it only when no `key=` expression works.

### Counting sort

When keys are integers in a known range `[0, k)`, sort in O(n + k):

```python
def counting_sort(a, k):
    cnt = [0] * k
    for x in a: cnt[x] += 1
    out = []
    for v in range(k):
        out.extend([v] * cnt[v])
    return out
```

LC 75 Sort Colors (k = 3) is the canonical case. For very large k or non-integer keys, this doesn't apply — use TimSort.

### Preconditions

- **Mergesort by hand** is taught here because the merge step *carries information*. Don't reach for it as a faster sort — `arr.sort()` is faster in Python.
- **Inversion counting via merge** assumes you only want the *count*. Listing every inverted pair is Ω(n²) worst case.
- **Counting sort** requires integer keys in a known small range. With duplicates of large integers or non-integer keys, use a hash count or TimSort.

---

## Step 3 — Read

The USACO Guide has no dedicated sorting page — sorting is treated as assumed from Bronze onward. Two reads:

1. [CPH Book](https://cses.fi/book/book.pdf) Chapter 4 (Sorting, pp. 39–48) — covers mergesort, custom comparators, and counting sort. The C++ syntax doesn't matter; the algorithms and the inversion-count derivation do.
2. [LeetCode Editorial — LC 912 Sort an Array](https://leetcode.com/problems/sort-an-array/editorial/) — for the Python translations of mergesort, quicksort, and counting sort if you want a worked alternative to the templates below.

---

## Step 4 — Algorithm pattern library

### Mergesort skeleton

```python
def mergesort(a):
    # Invariant: returns a new list of the same elements in non-decreasing order.
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left  = mergesort(a[:mid])
    right = mergesort(a[mid:])
    return merge(left, right)

def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:        # `<=` (not `<`) keeps the merge stable
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out
```

### Count inversions during merge

```python
def count_inversions(a):
    def sort_count(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left,  inv_l = sort_count(arr[:mid])
        right, inv_r = sort_count(arr[mid:])
        merged, inv_c = merge_count(left, right)
        return merged, inv_l + inv_r + inv_c    # within-L + within-R + crossing
    return sort_count(a)[1]

def merge_count(left, right):
    out, i, j, inv = [], 0, 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
            inv += len(left) - i                # every remaining L > current R
    out.extend(left[i:]); out.extend(right[j:])
    return out, inv
```

### Full custom comparator

```python
from functools import cmp_to_key

def cmp(a, b):
    if a + b > b + a: return -1
    if a + b < b + a: return  1
    return 0

result = sorted(strings, key=cmp_to_key(cmp))
```

### Counting sort (integer keys in `[0, k)`)

```python
def counting_sort(a, k):
    cnt = [0] * k
    for x in a: cnt[x] += 1
    out, idx = [0] * len(a), 0
    for v in range(k):
        for _ in range(cnt[v]):
            out[idx] = v; idx += 1
    return out
```

For signed integers, offset first: `x → x - min(a)`. For tuples of `(key, payload)`, replace the inner write to preserve payloads.

### Dutch national flag (3-way partition, in-place, O(1) space)

```python
def sort_three_values(a):
    # Invariant: a[:lo] = lows, a[lo:mid] = mids, a[hi+1:] = highs,
    #            a[mid:hi+1] = unseen.
    lo, mid, hi = 0, 0, len(a) - 1
    while mid <= hi:
        if   a[mid] == 0:
            a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1
        elif a[mid] == 2:
            a[mid], a[hi] = a[hi], a[mid]; hi -= 1   # don't advance `mid` — swapped-in is unseen
        else:
            mid += 1
```

The asymmetry — `mid` advances on a `0` swap but not on a `2` swap — is the load-bearing detail. Reading it as "two pointers" misses why: a value swapped in from `lo` has already been seen (it must have been `1`), but a value swapped in from `hi` has not.

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Sort an Array](https://leetcode.com/problems/sort-an-array/) | LC 912 | Medium | NC150 | baseline | Mergesort from Step 4 cold — write the skeleton without `sorted()`, verify against the language built-in |
| 2 | [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) | LC 88 | Easy | NC150 | extension | In-place merge — fill `nums1` from the back to avoid overwriting unread elements; same merge subroutine, different storage discipline |
| 3 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | LC 75 | Medium | NC150 | baseline | New sub-pattern: counting sort for k = 3, or Dutch national flag in one in-place pass with O(1) extra space |
| 4 | [Relative Sort Array](https://leetcode.com/problems/relative-sort-array/) | LC 1122 | Easy | new | extension | `key=` from a rank dictionary — the "sort by an external ordering" idiom, with a fallback rank for unranked elements |
| 5 | [Largest Number](https://leetcode.com/problems/largest-number/) | LC 179 | Medium | NC150 | extension | `cmp_to_key` — pair-wise comparison when `key=` can't express the ordering (`a + b` vs `b + a` is a property of the pair, not of either operand alone) |
| 6 | [Counting Inversions](https://cses.fi/problemset/task/1162) | CSES | Medium | UG ⭐ | combination | Mergesort + count during merge — total = within-L + within-R + crossing; the Step 4 template applied directly |
| 7 | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | LC 315 | Hard | NC150 | **checkpoint** | Per-index inversion counting — carry the original index through the recursion; on each R-pull, charge the inversion to each remaining L element's result slot |

**Checkpoint:** LC 315 without hints. The leap from problem 6 is that you no longer want the *total* inversion count; you want, for each original index `i`, the count of elements appearing *after* index `i` that are smaller than `a[i]`. Carry tuples `(value, original_index)` through the recursion. In the merge step, every time you pull from R, each remaining L element (which has the original-index of *some position to the left of every R element*) gains one toward its result — increment `result[index_of_remaining_L]` by 1 per R-pull, or by `len(R) - j` in a batched form.

The Fenwick + coordinate-compression approach (module 35) is the alternative interview answer and is often cleaner to write. Both are first-class solutions; pick the one whose template you can reproduce cold.

If you stall: identify the sub-pattern. This is "count during merge" with **per-element accumulation** — the recursive scaffold from problem 6 stays; the result aggregation is what changes.

### NC150 problems handed off to other modules

- *Merge Intervals* (LC 56) → module 18 (Intervals & Sweep Line). The sort is preprocessing; the interesting work is the linear sweep over a sorted interval list.

---

## Common mistakes

- **`merge` using `<` instead of `<=`.** Strict less-than makes the merge unstable — equal elements may cross. Use `<=` (or `>=` when sorting descending). Stability is what `sorted(..., key=...)` users implicitly rely on.
- **Inversion count: `inv += len(left) - i` BEFORE incrementing `i`.** A common off-by-one — counting *after* the increment misses one inversion per right-pull. The expression assumes the *current* `left[i]` is still unused.
- **`cmp_to_key` performance.** Each comparison is a Python-level callback. For n = 10⁶, prefer a `key=` reformulation whenever it exists.
- **`arr.sort()` returns `None`.** It's in-place. Use `sorted(arr)` if you need both the original and the sorted version.
- **Counting sort with negative or sparse keys.** Offset to `[0, k)` first (`x → x - min(a)`). Sparse-but-wide keys (e.g. `[0, 10⁹]` with only 10⁴ distinct values) need coordinate compression (module 33) before counting sort applies.
- **Dutch flag advancing `mid` on a high-side swap.** The element swapped in from the high pointer hasn't been classified yet — don't advance `mid` until you've inspected it.
