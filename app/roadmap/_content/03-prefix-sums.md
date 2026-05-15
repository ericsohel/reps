# Prefix Sums

**Prerequisites:** [complement lookup (module 2)](00-patterns.md#complement-lookup)  
**Unlocks:** Sliding Window, Binary Search on Answer, Monotonic Deque, 2D DP  
**Patterns introduced:** [two-scan span](00-patterns.md#two-scan-span)  
**Patterns reused:** [complement lookup](00-patterns.md#complement-lookup) (now over prefix sums)

---

## Step 1 — Try this first

Open [CSES 1646 — Static Range Sum Queries](https://cses.fi/problemset/task/1646) and attempt it before reading below.

> Given an array A of n integers and q queries. Each query gives (l, r) and asks for the sum A[l] + A[l+1] + … + A[r].  
> Constraints: n, q ≤ 2 × 10⁵.

The naive solution:

```python
for l, r in queries:
    print(sum(a[l-1:r]))
```

Worst case: 2 × 10⁵ queries × 2 × 10⁵ elements per slice = 4 × 10¹⁰ operations. TLE.

The question to carry into Step 2: *consecutive queries scan overlapping ranges. What information could you compute *once*, before any queries arrive, that lets each query do constant work afterward?*

---

## Step 2 — The technique

### 1D prefix sums

Define `P` of length n+1:

```
P[0] = 0
P[i] = A[0] + A[1] + ... + A[i-1]   (sum of the first i elements)
```

Then:

```
sum(A[l..r]) = P[r+1] - P[l]
```

**Numeric trace** with `A = [3, 1, 4, 1, 5]`:

```
P[0] = 0
P[1] = 3                (A[0])
P[2] = 4                (A[0]+A[1])
P[3] = 8                (A[0]+A[1]+A[2])
P[4] = 9                (...+A[3])
P[5] = 14               (...+A[4])

sum A[1..3] = P[4] - P[1] = 9 - 3 = 6     ✓ (1+4+1)
sum A[2..4] = P[5] - P[2] = 14 - 4 = 10   ✓ (4+1+5)
```

Build in O(n). Every range query: O(1).

**Generalisation:** prefix arrays work for any **associative invertible operation** — sums, XOR, counts of a value, prefix products. If you can "undo" by subtraction (or XOR-cancel), the technique applies. Counts of a value in a range: maintain one prefix array per value.

### Two-scan span ([atlas](00-patterns.md#two-scan-span))

Sometimes one forward sweep gives only half the answer. Run a second sweep backward to fill in the rest.

LC 238 (Product of Array Except Self) is the cleanest case: for each index `i`, you want the product of everything *except* `a[i]`. Compute `left[i]` = product of `a[0..i-1]` (forward). Compute `right[i]` = product of `a[i+1..n-1]` (backward). Answer is `left[i] * right[i]`.

This same idea drives PSE + NSE in module 7 and max-deque + min-deque in module 8.

### Complement lookup over prefix sums ([atlas](00-patterns.md#complement-lookup))

Same machinery as module 2's Two Sum, but the "values" you're tracking are *prefix sums* instead of array elements.

Question: "how many subarrays sum to k?"

Subarray `A[l..r]` has sum `k` iff `P[r+1] - P[l] = k`, i.e. `P[l] = P[r+1] - k`. So for each prefix `P[r+1]`, count how many earlier prefixes equal `P[r+1] - k`. Maintain a frequency dict of prefix sums seen so far.

**Numeric trace** with `A = [1, 2, 3, -1, 2]`, k = 5:

```
freq = {0: 1}            ← the empty prefix has sum 0
prefix = 0, ans = 0

i=0: x=1, prefix=1.   look for 1−5=−4. not in freq.       freq={0:1, 1:1}
i=1: x=2, prefix=3.   look for 3−5=−2. not in freq.       freq={0:1, 1:1, 3:1}
i=2: x=3, prefix=6.   look for 6−5=1.  freq[1]=1 → ans=1. freq={0:1, 1:1, 3:1, 6:1}
i=3: x=−1, prefix=5.  look for 5−5=0.  freq[0]=1 → ans=2. freq={0:1, 1:1, 3:1, 6:1, 5:1}
i=4: x=2, prefix=7.   look for 7−5=2.  not in freq.       freq={0:1, 1:1, 3:1, 6:1, 5:1, 7:1}

ans = 2: A[1..2] = [2,3] and A[0..3] = [1,2,3,−1].  ✓
```

**The `freq[0] = 1` initialisation is load-bearing.** It represents the empty prefix (sum 0 before any element). Without it, you miss every subarray that starts at index 0 — silent undercount, no error message. This is not a footgun, it's the base case of the recurrence.

The same divisibility variant — "count subarrays with sum divisible by k" — replaces values in the dict with `prefix % k`. Two prefixes have the same value mod k iff the subarray between them sums to a multiple of k.

### 2D prefix sums

Extend the 1D idea to rectangles:

```
P[i][j] = sum of all cells with row < i and col < j
P[i][j] = grid[i-1][j-1] + P[i-1][j] + P[i][j-1] - P[i-1][j-1]
```

Query rectangle from (r1, c1) to (r2, c2) inclusive:

```
sum = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
```

The +/− pattern is inclusion-exclusion over four corners. The 4-term formula is easy to mis-sign — trace one small example by hand before using it on real data.

### Difference arrays — prefix sums in reverse

The inverse problem: apply q range updates ("add v to every element from l to r"), then read the final array.

A difference array D satisfies `D[i] = A[i] - A[i-1]`. A range update on A becomes two point updates on D:

```
D[l] += v
D[r+1] -= v
```

After all updates, recover A by taking the prefix sum of D — one O(n) pass at the end.

**Invariant:** prefix sum of D equals A. Range update on A equals two point updates on D.

### Preconditions

- 1D prefix sums require an **associative invertible** operation. Sums, XOR, counts: yes. Min, max, GCD: no (no subtraction). For those, use sparse tables (module 33) or segment trees (module 34).
- Difference arrays require **all updates done first, then all queries**. Interleaved updates and point queries need a Fenwick tree.

---

## Step 3 — Read

This module is a curated path through the USACO Guide's prefix sums coverage — those two pages do roughly half the teaching. Two reads, in order:

1. [USACO Guide — Prefix Sums (Silver)](https://usaco.guide/silver/prefix-sums) — 1D prefix sums and the dict pattern.
2. [USACO Guide — More Prefix Sums (Silver)](https://usaco.guide/silver/more-prefix-sums) — 2D prefix sums and difference arrays.

CPH Chapter 9 (Range Queries, pp. 87–92) is a concise alternative to (1) if you want the formal derivation.

---

## Step 4 — Code reference

### 1D prefix sum

```python
from itertools import accumulate
# Invariant: prefix[i] = sum of a[0..i-1]
prefix = [0] + list(accumulate(a))

def range_sum(l, r):              # 0-indexed, inclusive
    return prefix[r + 1] - prefix[l]
```

### Two-scan span — product of array except self

```python
def product_except_self(a):
    n = len(a)
    left = [1] * n                # left[i] = product of a[0..i-1]
    for i in range(1, n):
        left[i] = left[i-1] * a[i-1]
    right = 1                     # rolling product of a[i+1..n-1]
    result = [0] * n
    for i in range(n - 1, -1, -1):
        result[i] = left[i] * right
        right *= a[i]
    return result
```

### Prefix sum + dict — count subarrays summing to k

```python
from collections import defaultdict
def count_subarrays(a, k):
    # Invariant: freq[v] = number of prefix sums equal to v among indices 0..i
    freq = defaultdict(int)
    freq[0] = 1                   # empty prefix — see Step 2
    prefix, ans = 0, 0
    for x in a:
        prefix += x
        ans += freq[prefix - k]   # complement lookup
        freq[prefix] += 1
    return ans
```

### 2D prefix sum

```python
def build_2d(grid, n, m):
    P = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            P[i][j] = grid[i-1][j-1] + P[i-1][j] + P[i][j-1] - P[i-1][j-1]
    return P

def rect_sum(P, r1, c1, r2, c2):  # 1-indexed, inclusive
    return P[r2][c2] - P[r1-1][c2] - P[r2][c1-1] + P[r1-1][c1-1]
```

### Difference array

```python
diff = [0] * (n + 1)              # sentinel slot at index n

def range_update(l, r, v):
    diff[l] += v
    diff[r + 1] -= v

# After all updates, recover the array in one pass:
for i in range(1, n):
    diff[i] += diff[i - 1]
# diff[0..n-1] is now the final array
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Static Range Sum Queries](https://cses.fi/problemset/task/1646) | CSES | Easy | UG | baseline | Pure 1D prefix sum — implement the cold attempt from Step 1 properly |
| 2 | [Breed Counting](http://www.usaco.org/index.php?page=viewproblem2&cpid=572) | USACO Silver | Easy | UG ⭐ | extension | One prefix array *per breed* — prefix sums generalise to "counts of anything" |
| 3 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | LC 238 | Medium | NC150 | extension | Two-scan span — introduces the forward + backward sweep pattern that returns in modules 7 and 8 |
| 4 | [Subarray Sums II](https://cses.fi/problemset/task/1661) | CSES | Easy | UG | extension | Complement lookup over prefix sums — recombines module 2's pattern with module 3's quantity |
| 5 | [Subarray Divisibility](https://cses.fi/problemset/task/1662) | CSES | Easy | UG | extension | Same complement-lookup machinery, but the equivalence is `prefix % k` instead of equality |
| 6 | [Forest Queries](https://cses.fi/problemset/task/1652) | CSES | Easy | UG | extension | 2D prefix sums — first time the 4-term inclusion-exclusion is needed |
| 7 | [Haybale Stacking](https://www.spoj.com/problems/HAYBALE/) | SPOJ | Medium | UG ⭐ | extension | Difference array — the inverse direction (range updates, point queries) |
| 8 | [Running Miles](https://codeforces.com/contest/1826/problem/D) | CF 1826D | Medium | UG ⭐ | **checkpoint** | Decompose a 3-term expression into prefix max and suffix max — combines the two-scan span (problem 3) with the "track-what's-best-so-far" framing from problems 4–5 |

**Checkpoint:** CF 1826D without hints. The problem asks you to maximise `a[i] + a[j] - i + a[k] + k` over `i ≤ j ≤ k`. The leap: rewrite the expression as `(a[i] - i) + a[j] + (a[k] + k)`. The three terms are then independent — track the maximum of `(a[i] - i)` over `i ≤ j` (prefix max from the left) and the maximum of `(a[k] + k)` over `k ≥ j` (suffix max from the right). For each candidate `j`, the answer is `prefix_max[j] + a[j] + suffix_max[j]`. The two-scan span pattern from problem 3 makes this implementation easy; the algebraic decomposition is the part you have to invent.

If you stall on any problem, identify which sub-pattern from Step 2 applies before checking solutions.

---

## Common mistakes

- **Off-by-one in the prefix array:** the formula `range_sum(l, r) = prefix[r+1] - prefix[l]` requires `prefix[i]` to be the sum of the *first i elements*. Some textbooks define `prefix[i]` differently — pick one convention and stay with it.
- **2D sign errors:** the 4-term inclusion-exclusion is easy to mis-sign. Verify on a 3×3 example once and keep the formula nearby.
- **Difference array off-by-one:** the sentinel `diff[r+1] -= v` requires `diff` to have length `n+1`, not `n`.
