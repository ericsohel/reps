# Binary Search

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Binary Search on Answer, Sparse Table  
**Patterns introduced:** the binary search invariant (specialised in module 11 to non-array predicates)  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [LC 153 — Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) and attempt it before reading below.

> A sorted array of distinct integers was rotated at some unknown pivot. Find the minimum element.  
> Example: `[3,4,5,1,2]` → `1`, `[4,5,6,7,0,1,2]` → `0`  
> Constraints: n ≤ 5000, **target O(log n).**

The O(n) solution is trivial — scan everything. Achieving O(log n) means never looking at most of the array.

The question to carry into Step 2: *your search range is `[lo, hi]`. At each step you look at `mid = (lo + hi) // 2`. What can you compare `a[mid]` against — `a[lo]` or `a[hi]` — that tells you which half of the array contains the minimum?*

---

## Step 2 — The technique

### The binary search invariant

Binary search works on any problem where you can maintain the invariant **"the answer lies within `[lo, hi]`"** and shrink the range by half each iteration.

At each step examine `mid`. Decide in O(1) whether the answer is in `[lo, mid]` or `[mid+1, hi]`. The whole search is O(log n).

For exact-value search on a sorted array:

- `a[mid] == target` → found.
- `a[mid] < target` → answer in `[mid+1, hi]`.
- `a[mid] > target` → answer in `[lo, mid-1]`.

### Two templates

**Template A — exact value (`while lo <= hi`):**

```python
lo, hi = 0, len(a) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if a[mid] == target:
        return mid
    elif a[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
return -1
```

**Template B — boundary search (`while lo < hi`):**

For "first index satisfying a condition" (e.g. minimum in rotated array, first element ≥ x):

```python
lo, hi = 0, len(a) - 1
while lo < hi:
    mid = (lo + hi) // 2
    if condition(mid):       # answer is at mid or to its left
        hi = mid
    else:                    # answer is strictly to mid's right
        lo = mid + 1
return lo                    # lo == hi at exit, that's the boundary
```

Invariant of Template B: `lo` is always a possible answer position; `hi` is also a possible answer position; the interval shrinks to a single value.

**Mixing them is the most common bug.** Pick the right template for the question shape. Exact-value: A. Boundary: B.

### Rotated sorted array — answer to Step 1

After rotation, at least one half is fully sorted. Compare `a[mid]` to `a[hi]`:

- `a[mid] <= a[hi]` → right half `[mid, hi]` is sorted. Min is either `a[mid]` itself or in `[lo, mid-1]`. Set `hi = mid`.
- `a[mid] > a[hi]` → left half is sorted. The rotation point (and minimum) is in `[mid+1, hi]`. Set `lo = mid + 1`.

Using `a[hi]` (not `a[lo]`) correctly handles the two-element case where `mid == lo`.

### Numeric trace — find min in rotated

`a = [4, 5, 6, 7, 0, 1, 2]`, lo=0, hi=6:

```
mid=3, a[3]=7, a[6]=2.  7 > 2 → min is right of mid.    lo=4
mid=5, a[5]=1, a[6]=2.  1 ≤ 2 → min is at mid or left.  hi=5
mid=4, a[4]=0, a[5]=1.  0 ≤ 1 → min is at mid or left.  hi=4
lo == hi == 4.  Result: a[4] = 0  ✓
```

Three iterations on a 7-element array. log₂(7) ≈ 2.8 → matches.

### Python's `bisect`

`bisect_left(a, x)` returns the leftmost insertion index for `x` in a sorted list — equivalent to "index of the first element `≥ x`" or "count of elements strictly less than `x`".

`bisect_right(a, x)` is the rightmost such index — "index of the first element `> x`" or "count of elements `≤ x`".

```python
import bisect
a = [1, 3, 3, 5, 7]
bisect.bisect_left(a, 3)    # → 1
bisect.bisect_right(a, 3)   # → 3
bisect.bisect_right(a, 3) - bisect.bisect_left(a, 3)   # count of 3s → 2
```

Use `bisect_left` for "first ≥". Use `bisect_right` for "first >".

### 2D matrix → 1D sorted array

An m×n matrix with row-wise sorting and `row[i].first > row[i-1].last` is equivalent to a single sorted array. Map flat index `k` → `(k // n, k % n)`. Then run Template A.

### Preconditions

- Binary search needs a sorted array OR a problem where some monotonic predicate determines which half holds the answer.
- The rotated-array case shows that "sorted" isn't strictly required — what's needed is enough structure to decide each branch in O(1).

---

## Step 3 — Read

The USACO Guide's two binary-search pages cover the basics. Module 10 uses the sorted-array page; module 11 uses the parametric page.

1. [USACO Guide — Binary Search on Sorted Array (Silver)](https://usaco.guide/silver/binary-search-sorted-array) — covers `bisect_left` / `bisect_right` with USACO examples. Short.
2. [USACO Guide — Binary Search (Silver)](https://usaco.guide/silver/binary-search) — read up to the "Checking Feasibility" section, then stop (the rest is module 11).
3. CPH Chapter 3 (Sorting and Searching), pp. 29–33 — language-agnostic complement.

---

## Step 4 — Code reference

### Standard binary search (Template A)

```python
def binary_search(a, target):
    # Invariant: target, if present, is in a[lo..hi]
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

### Bisect — count occurrences of x

```python
import bisect

def count(a, x):
    return bisect.bisect_right(a, x) - bisect.bisect_left(a, x)

def first_index(a, x):
    i = bisect.bisect_left(a, x)
    return i if i < len(a) and a[i] == x else -1
```

### Find minimum in rotated sorted array (Template B)

```python
def find_min(a):
    # Invariant: the minimum is in a[lo..hi]
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] <= a[hi]:
            hi = mid          # min is at mid or to its left
        else:
            lo = mid + 1      # min is strictly right of mid
    return a[lo]
```

### Search in rotated sorted array

```python
def search_rotated(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                       # left half is sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                     # right half is sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

### 2D matrix search

```python
def search_matrix(matrix, target):
    m, n = len(matrix), len(matrix[0])
    lo, hi = 0, m * n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        val = matrix[mid // n][mid % n]
        if val == target:
            return True
        elif val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Counting Haybales](http://www.usaco.org/index.php?page=viewproblem2&cpid=666) | USACO Silver | Easy | UG | baseline | `bisect_left` / `bisect_right` for range counting — simplest possible sorted-array binary search |
| 2 | [Binary Search](https://leetcode.com/problems/binary-search/) | LC 704 | Easy | NC150 | baseline | Implement Template A from scratch — prove termination via the loop invariant |
| 3 | [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/) | LC 74 | Medium | NC150 | extension | Flatten 2D index `k` to `(k // n, k % n)` — same Template A on the virtual flat array |
| 4 | [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | LC 153 | Medium | NC150 | extension | Your Step 1 problem — Template B with the `a[mid] <= a[hi]` comparison |
| 5 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | LC 33 | Medium | NC150 | extension | Same rotated structure as problem 4, now searching for a target — one extra range check per branch |
| 6 | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/) | LC 981 | Medium | NC150 | extension | `bisect_right` embedded in a data structure design — binary search on a list of timestamps |
| 7 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | LC 4 | Hard | NC150 | **checkpoint** | Binary search on the partition point of the smaller array; the partition of the larger array is then determined |

**Checkpoint:** LC 4 without hints. The O(log(min(m, n))) algorithm binary-searches for the correct partition of the smaller array. The invariant — every element left of both partitions is ≤ every element right of both partitions — defines feasibility. Boundary partitions (`lo_partition = 0` or `m`) require treating absent maxima/minima as `−∞` or `+∞`. This problem doesn't fit either template cleanly because the "answer" is a partition pair, not a single index — the search variable is the partition count for the smaller array.

---

## Common mistakes

- **Template A vs B confusion.** `while lo <= hi` for exact value (returns `-1` on miss). `while lo < hi` for boundary (always returns a valid index at exit). Mixing them produces off-by-one bugs that pass small tests and fail edge cases.
- **`a[lo]` vs `a[hi]` in rotated search.** Use `a[hi]` for finding min — handles the two-element case where `mid == lo` correctly. With `a[lo]`, you need extra guards.
- **`bisect_left` vs `bisect_right` for existence.** To check whether `x` is in the sorted array: `i = bisect_left(a, x); return i < len(a) and a[i] == x`. `bisect_right` does not work for existence — it always returns the position *after* matches.
- **LC 4 empty partitions.** When `lo_partition == 0`, there is no `max_left` for that array; use `−∞`. When `lo_partition == m`, no `min_right`; use `+∞`. Forgetting these makes the comparison crash or give wrong answers on small inputs.
