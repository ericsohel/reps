# Sorting

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Two Pointers, Greedy, Intervals & Sweep Line, Fenwick Tree (alternative path for inversion counting)  
**Patterns introduced:** [count during merge](00-patterns.md#count-during-merge) — the merge step observes every pair that crosses the split; what you accumulate there is the answer to a *pairwise* problem.  
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

`a.sort()` solves the *sorting* problem in O(n log n) — but sorting destroys the original order. After `a.sort()` you can no longer ask "which pairs were out of order?". The answer is *destroyed* by the same operation that would make the count fast.

The question to carry into Step 2: *the brute force makes n² comparisons. A fast sort makes only O(n log n). Where did the other comparisons go — does the fast sort skip pairs entirely, or does each of its comparisons stand in for many of the brute force's?*

---

## Step 2 — The technique

You already have `arr.sort()` from Foundations §4 — Python's TimSort is O(n log n), stable, and faster than anything you can write in pure Python. This module covers four things `arr.sort()` does *not* give you:

1. **Mergesort by hand** — because the merge step exposes pair-crossing information that the built-in discards.
2. **Counting during the merge** — the lever that turns a sort into an algorithm for *pairwise* questions (inversions, reverse pairs, per-index ranks).
3. **Counting sort and Dutch flag** — non-comparison sorts that beat O(n log n) when the key space cooperates.
4. **`cmp_to_key`** — pair-wise comparators when `key=` can't express the ordering.

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

Recurrence: T(n) = 2 T(n/2) + O(n) → O(n log n). Each level merges n total elements; there are log n levels.

**Stability** is a property of the merge: choosing `<=` (not `<`) when pulling from L sends ties to L first, so elements that compare equal preserve their input order. This is what makes "sort by secondary, then by primary" (Foundations §4) composable — a second stable sort on the primary cannot reshuffle records that tie on the primary, so the earlier sort survives inside each tie group.

### Counting during the merge ([atlas](00-patterns.md#count-during-merge))

The merge step has a property the built-in silently throws away: it sees every pair that crosses the split. If you hand-write the merge, you can accumulate something on every comparison — and the answer for the whole array is the recursion's sum.

**Numeric trace** of inversion counting with `L = [2, 5]`, `R = [1, 3, 4]`:

```
i=0, j=0 :  L[0]=2  vs  R[0]=1.  Pull R[0]. L has 2 unused (i..) → +2 inversions.
i=0, j=1 :  L[0]=2  vs  R[1]=3.  Pull L[0].
i=1, j=1 :  L[1]=5  vs  R[1]=3.  Pull R[1]. L has 1 unused          → +1 inversion.
i=1, j=2 :  L[1]=5  vs  R[2]=4.  Pull R[2]. L has 1 unused          → +1 inversion.
i=1, j=3 :  R exhausted. Flush L.

Crossing inversions from this merge: 2 + 1 + 1 = 4.
```

Every time you pull from R *before* L is exhausted, all `len(L) - i` remaining L elements are greater than the value you just pulled — that's the answer to your Step 1 question. One R-pull stands in for up to `len(L)` brute-force pair comparisons. Crossings are only part of the total; the recursive sorts of L and R count the inversions wholly inside each side. By structural induction:

```
total = within-L + within-R + crossing
```

The pattern generalises. Any "count pairs (i, j) with i < j and P(a[i], a[j])" where P is monotone in index can be answered during a merge — LC 493 Reverse Pairs (`a[i] > 2 · a[j]`), "count pairs with `a[i] − a[j] ≥ k`", and the checkpoint LC 315 (per-index). The recursive scaffold stays the same; only the predicate and the accumulator change.

The same problems can also be solved with Fenwick Tree + coordinate compression (module 35) — different machinery, same pattern. The two are first-class alternatives; pick the one you can write cold.

### Counting sort

When keys are integers in a known range `[0, k)`, sort in O(n + k) by tallying — no comparisons at all.

**Numeric trace** with `a = [2, 0, 1, 2, 0]`, k = 3:

```
init: cnt = [0, 0, 0]
scan: cnt[2]++ → cnt[0]++ → cnt[1]++ → cnt[2]++ → cnt[0]++
      cnt = [2, 1, 2]
emit: 0 twice, 1 once, 2 twice → [0, 0, 1, 2, 2]
```

The bound `n + k` is *additive*: when k is small relative to n (LC 75 has k = 3 for n up to 300), counting sort is linear. When k is large or non-integer, this collapses; use TimSort. Sparse-but-wide keys (e.g. n = 10⁴ distinct values drawn from `[0, 10⁹]`) need coordinate compression (module 33) before counting sort applies.

### Dutch national flag (3-way partition)

When the array contains only 3 categories (Sort Colors' three colours; quickselect's `< pivot, = pivot, > pivot`), counting sort works — but you can do it in **one in-place pass with O(1) extra space**. Maintain three regions and one cursor:

```
[ lows | mids | unseen | highs ]
       lo    mid     hi
```

`a[:lo]` is finalised lows, `a[lo:mid]` is finalised mids, `a[hi+1:]` is finalised highs, and `a[mid:hi+1]` is the unprocessed middle. Step the cursor and place each element in its region by swapping.

**Numeric trace** with `a = [2, 0, 2, 1, 0]`:

```
init   lo=0, mid=0, hi=4  | [2, 0, 2, 1, 0]    a[mid]=2 → swap with hi, hi--, mid stays
                          | [0, 0, 2, 1, 2]    hi=3
                          | a[mid]=0           → swap with lo, lo++, mid++
                          | [0, 0, 2, 1, 2]    lo=1, mid=1
                          | a[mid]=0           → swap with lo, lo++, mid++
                          | [0, 0, 2, 1, 2]    lo=2, mid=2
                          | a[mid]=2           → swap with hi, hi--, mid stays
                          | [0, 0, 1, 2, 2]    hi=2
                          | a[mid]=1           → mid++
                          | mid=3 > hi=2       → done.
final  [0, 0, 1, 2, 2]
```

**The asymmetry is the load-bearing detail.** On a low swap (`a[mid] == 0`), the element coming in from `lo` has already been classified as a `1` by the loop invariant, so `mid` advances. On a high swap (`a[mid] == 2`), the element coming in from `hi` is **unseen** — `mid` does *not* advance, because next iteration must still classify it. Reading Dutch flag as "just two pointers" misses why the steps are different on the two sides.

### Custom comparators

`key=` works whenever you can rank each element in isolation — extract a sortable value (number, tuple, lowercased string) and let `<` on Python's built-in types do the rest. Compound `key=lambda x: (a, -b, c)` covers most multi-field orderings.

`functools.cmp_to_key` is needed when the order between two elements is a property of the *pair*, not of either element alone. LC 179 (concatenate digits for the largest number) is the canonical case: whether `"3"` should come before `"30"` depends on whether `"330" > "303"` — which only makes sense by looking at both strings together. No `key=` expression captures this, because there is no isolated-element value that gives the right comparison for every pair.

`cmp(a, b)` returns negative if `a` belongs first, positive if `b` belongs first, zero on tie — the C `qsort` convention. It's slower than `key=` (one Python-level callback per comparison), so reach for it only when `key=` truly can't express the ordering.

### Preconditions

- **Mergesort by hand** is taught here because the merge step *carries information*. Don't reach for it as a faster sort — `arr.sort()` is faster in Python.
- **Counting during merge** assumes you want only the count, or a per-index accumulator. Materialising every inverted pair is Ω(n²) worst case (consider a descending array).
- **Counting sort** requires integer keys in a known small range. With negative keys, offset first (`x → x - min(a)`). With duplicates over a large range, use TimSort or compress first (module 33).
- **Dutch flag** generalises to any *fixed* k categories with k−1 cursors. For k that grows with n, you're back to counting sort or comparison sorting.

---

## Step 3 — Read

1. [USACO Guide — Intro to Sorting (Bronze)](https://usaco.guide/bronze/intro-sorting) — built-in sort, `key=` idioms, and basic sorted-array techniques. Work through their examples.
2. [USACO Guide — Sorting with Custom Comparators (Silver)](https://usaco.guide/silver/sorting-custom) — load-bearing for the `cmp_to_key` content in Step 2. Covers the string-concatenation comparator in detail.
3. [CPH Book](https://cses.fi/book/book.pdf) Chapter 3 (Sorting, pp. 25–31) — mergesort derivation, custom comparators, and counting sort. The C++ syntax doesn't matter; the inversion-count derivation and stability proof do.

If the Step 2 traces (mergesort, inversion count) made sense, reads 1 and 2 are confirmation — read 3 for the formal derivation.

---

## Step 4 — Algorithm pattern library

### Mergesort skeleton

```python
def mergesort(a):
    # Invariant: returns a new list of the same elements in non-decreasing order
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

### Count during merge

```python
def count_inversions(a):
    # Invariant: sort_count returns (sorted version of arr, inversions inside arr)
    def sort_count(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left,  inv_l = sort_count(arr[:mid])
        right, inv_r = sort_count(arr[mid:])
        merged, inv_c = merge_count(left, right)
        return merged, inv_l + inv_r + inv_c        # within-L + within-R + crossing
    return sort_count(a)[1]

def merge_count(left, right):
    out, i, j, inv = [], 0, 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
            inv += len(left) - i                    # each remaining L > the R just pulled
    out.extend(left[i:]); out.extend(right[j:])
    return out, inv
```

To adapt for a different predicate, change the `inv += ...` line (and possibly precompute counts with a separate two-pointer scan over L and R *before* the merge proper — see LC 493).

### Custom comparator

```python
from functools import cmp_to_key

def cmp(a, b):
    # Return < 0 if a should come before b, > 0 if b before a, 0 on tie
    ...

result = sorted(items, key=cmp_to_key(cmp))
```

### Counting sort (integer keys in `[0, k)`)

```python
def counting_sort(a, k):
    # Invariant: cnt[v] is the multiplicity of v in the *unprocessed* prefix of a
    cnt = [0] * k
    for x in a: cnt[x] += 1
    out, idx = [0] * len(a), 0
    for v in range(k):
        for _ in range(cnt[v]):
            out[idx] = v; idx += 1
    return out
```

For signed integers, offset first: `x → x - min(a)`. For `(key, payload)` records, replace the inner write loop with one that emits payloads in arrival order to preserve stability.

### Dutch national flag (3-way partition, in-place, O(1) space)

```python
def sort_three_values(a):
    # Invariant: a[:lo] = lows, a[lo:mid] = mids, a[hi+1:] = highs, a[mid:hi+1] = unseen
    lo, mid, hi = 0, 0, len(a) - 1
    while mid <= hi:
        if   a[mid] == 0:
            a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1
        elif a[mid] == 2:
            a[mid], a[hi] = a[hi], a[mid]; hi -= 1     # don't advance `mid` — swapped-in is unseen
        else:
            mid += 1
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Sort an Array](https://leetcode.com/problems/sort-an-array/) | LC 912 | Medium | NC150 | baseline | Mergesort skeleton from Step 4 cold — write it without `sorted()`, verify against the built-in |
| 2 | [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) | LC 88 | Easy | NC150 | extension | In-place merge — fill `nums1` from the back so writes never trample unread reads; same merge logic, different storage discipline |
| 3 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | LC 75 | Medium | NC150 | baseline | New sub-pattern: counting sort for k = 3, or Dutch flag in one in-place O(1)-space pass |
| 4 | [Relative Sort Array](https://leetcode.com/problems/relative-sort-array/) | LC 1122 | Easy | new | extension | `key=` from an external rank dict, with a fallback rank for unranked elements — the "sort by an imposed ordering" idiom |
| 5 | [Largest Number](https://leetcode.com/problems/largest-number/) | LC 179 | Medium | NC150 | extension | `cmp_to_key` — pair-wise comparison when `key=` can't express the ordering, because `a + b` vs `b + a` is a property of the pair |
| 6 | [Counting Inversions](https://cses.fi/problemset/task/1162) | CSES | Medium | UG ⭐ | combination | Mergesort + count-during-merge — `total = within-L + within-R + crossing`; the Step 4 template applied directly |
| 7 | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | LC 315 | Hard | NC150 | **checkpoint** | Per-index inversion counting — carry the original index through the recursion; charge each R-pull to its remaining-L slots |

**Checkpoint:** LC 315 without hints. The leap from problem 6 is that you no longer want the *total* inversion count; you want, for each original index `i`, the count of elements appearing *after* index `i` that are smaller than `a[i]`. Carry tuples `(value, original_index)` through the recursion. In the merge, every time you pull from R, each remaining L element belongs to an original position to the left of every position represented by the current R element — so each of those L elements gains one toward its result. Increment `result[original_index_of_remaining_L]` by 1 per R-pull, or batched as `len(R) - j` at the moment you stop pulling from L.

The Fenwick + coordinate-compression approach (module 35) is the alternative interview answer and is often cleaner to write. Both are first-class solutions; pick the one whose template you can reproduce cold.

If you stall: identify the sub-pattern. This is "count during merge" with **per-element accumulation** — the recursive scaffold from problem 6 stays; the result aggregation is what changes.

### NC150 problems handed off to other modules

- *Merge Intervals* (LC 56) → module 18 (Intervals & Sweep Line). The sort is preprocessing; the interesting work is the linear sweep over a sorted interval list.

---

## Common mistakes

- **`merge` using `<` instead of `<=`.** Strict less-than makes the merge unstable — equal elements can cross each other. Use `<=` (or `>=` for descending). The "sort by secondary, then by primary" idiom silently relies on this.
- **`inv += len(left) - i` AFTER incrementing `i`.** The expression assumes the *current* `left[i]` is still unused. Increment after the addition, or you miss one inversion per R-pull.
- **`cmp_to_key` performance.** Each comparison is a Python-level callback. For n ≥ 10⁶, prefer a `key=` reformulation whenever one exists — the constant factor on `cmp_to_key` shows up in TL margins.
- **`arr.sort()` returns `None`.** It sorts in place. Use `sorted(arr)` if you need both the original and the sorted version.
- **Counting sort with negative or sparse keys.** Offset to `[0, k)` first. Sparse-but-wide keys need coordinate compression (module 33) before counting sort applies; otherwise the `[0] * k` allocation kills you.
- **Dutch flag advancing `mid` on a high-side swap.** The element swapped in from `hi` hasn't been classified yet — don't advance `mid` until you've inspected it. Doing so leaves a `0` stranded in the mids region.
