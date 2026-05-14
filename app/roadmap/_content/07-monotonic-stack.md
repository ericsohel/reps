# Monotonic Stack

**Prerequisites:** Stack, [monotonic invariant (module 4)](00-patterns.md#monotonic-invariant)  
**Unlocks:** Monotonic Deque  
**Patterns introduced:** [two-scan span](00-patterns.md#two-scan-span) (combining PSE + NSE), [sentinel flush](00-patterns.md#sentinel-flush)  
**Patterns reused:** monotonic invariant, [reduce by fixing one dimension](00-patterns.md#reduce-by-fixing-one-dimension)

---

## Step 1 — Try this first

Open [CSES 1645 — Nearest Smaller Values](https://cses.fi/problemset/task/1645) and attempt it before reading below.

> For each position in an array of n integers, find the nearest position to its **left** with a strictly smaller value. If none exists, output 0.  
> Example: `[5, 2, 4, 1, 3]` → `[0, 0, 2, 0, 4]`  
> Constraints: n ≤ 2 × 10⁵.

The naive solution: for each i, scan leftward until you find a smaller value. O(n²) — TLE.

The question to carry into Step 2: *as you scan left-to-right, when you arrive at index i, which previously-seen elements are now permanently useless — guaranteed to never be the nearest-smaller for any future index j > i?*

---

## Step 2 — The technique

### The monotonic stack — discarding useless candidates

**Answer to Step 1:** when you reach index i, any previously-seen index j with `a[j] ≥ a[i]` is permanently useless. For any future index k > i, before k can reach j it must pass through i — and since `a[i] ≤ a[j]`, the answer for k is i (or something smaller), never j.

This means: maintain a stack that is always **strictly increasing from bottom to top**. When a new index i arrives, pop everything `≥ a[i]` from the top. The new top (if any) is i's nearest-smaller to the left. Then push i.

This is the [monotonic invariant pattern](00-patterns.md#monotonic-invariant) again — the "useless candidates" insight from module 4 is the same idea, now used to maintain a stack instead of advance a pointer.

### Numeric trace — Nearest Smaller Values

`a = [5, 2, 4, 1, 3]`, stack stores indices, increasing in value order:

```
i=0 a=5: stack empty. ans[0]=0. push 0.          stack=[0]   (values: [5])
i=1 a=2: a[stack[-1]]=5 ≥ 2 → pop 0.
         stack empty. ans[1]=0. push 1.          stack=[1]   (values: [2])
i=2 a=4: a[1]=2 < 4 → stop. ans[2]=1+1=2. push 2. stack=[1,2] (values: [2,4])
i=3 a=1: a[2]=4 ≥ 1 → pop 2.
         a[1]=2 ≥ 1 → pop 1.
         stack empty. ans[3]=0. push 3.          stack=[3]   (values: [1])
i=4 a=3: a[3]=1 < 3 → stop. ans[4]=3+1=4. push 4. stack=[3,4] (values: [1,3])
```

Each index pushed once, popped at most once → O(n) total despite the inner `while` loop.

### Four variants of the pattern

The stack always holds elements in monotone order. The four variants differ in (a) which direction holds the answer, and (b) whether we want smaller or greater.

| Want | Direction | Stack order (bottom→top) | Pop condition |
|---|---|---|---|
| Previous Smaller | left | increasing | `top ≥ current`, keep strict less |
| Previous Greater | left | decreasing | `top ≤ current`, keep strict greater |
| Next Smaller | right | increasing | `top ≥ current`, answer = popping index |
| Next Greater | right | decreasing | `top ≤ current`, answer = popping index |

**Left (previous):** the answer for index i is determined when i is *pushed* — read the top after popping.

**Right (next):** the answer for index j is determined when j is *popped* — the index causing the pop is the answer.

### Two-scan span ([atlas](00-patterns.md#two-scan-span))

For each element you can compute both PSE (previous smaller) and NSE (next smaller). The span `(NSE_index − PSE_index − 1)` is the widest subarray where this element is the strict minimum.

This is the [two-scan span pattern from module 3](00-patterns.md#two-scan-span): one forward sweep, one backward sweep, combine. Largest Rectangle in Histogram (LC 84) uses this directly — `height[i] × span[i]` is the largest rectangle whose lowest bar is `i`.

### Sentinel flush ([atlas](00-patterns.md#sentinel-flush))

After processing the last element, the stack typically still has unprocessed indices (no future index will pop them). One common cleanup pattern: append a sentinel value at the end of the input that forces a final flush.

For LC 84, append a `0` at the end — every remaining bar gets popped against this final 0, eliminating a separate post-loop cleanup section.

### Reduce by fixing one dimension — contribution counting ([atlas](00-patterns.md#reduce-by-fixing-one-dimension))

A more sophisticated application: for each element, count *how many subarrays* have it as the minimum. The answer for the whole array is then `Σ a[i] × count[i]`.

The count is `left_span × right_span`, where left_span and right_span come from PSE and NSE — almost.

**The tie-breaking trick.** If equal values are treated symmetrically on both sides, subarrays containing multiple equal minima get counted once *per* equal element — over-counting.

The fix: make one side strict, the other not. By convention:

- **PSE uses `≥` (pop when top ≥ current).** The stack keeps elements *strictly less than* the current. Equal predecessors are popped — credit doesn't flow to earlier equals.
- **NSE uses `>` (pop when top > current).** The stack keeps elements *less than or equal to* the current. Equal successors are NOT popped — they stop the rightward extension.

Result: among equal elements, only the **leftmost** is the representative for any subarray they all sit in. Every subarray counted exactly once.

**Numeric verification** with `a = [1, 2, 1]`:

```
PSE (pop on ≥):
  i=0: stack=[].          left[0] = 1 (no smaller; covers index 0).         stack=[0]
  i=1: a[0]=1 < 2, stop.  left[1] = 1-0 = 1.                                stack=[0, 1]
  i=2: pop 1 (2≥1), pop 0 (1≥1). stack=[]. left[2] = 3 (covers 0..2).       stack=[2]

NSE (pop on >, scan right-to-left):
  i=2: stack=[].          right[2] = 3-2 = 1 (covers index 2).              stack=[2]
  i=1: a[2]=1 not > 2.    right[1] = 2-1 = 1.                               stack=[2, 1]
  i=0: pop 1 (2>1). a[2]=1 not > 1. right[0] = 2-0 = 2 (covers 0, 1).       stack=[2, 0]

Contributions: a[0]*1*2 + a[1]*1*1 + a[2]*3*1 = 2 + 2 + 3 = 7
Enumeration: [1]=1, [1,2]=1, [1,2,1]=1, [2]=2, [2,1]=1, [1]=1.  Sum = 7. ✓
```

Symmetric tie-breaking (both `≥` or both `>`) over-counts subarrays containing both 1s.

---

## Step 3 — Read

The USACO Guide's Gold Stacks page is load-bearing — it covers CSES 1645 and the histogram problem with full walkthroughs.

1. [USACO Guide — Stacks (Gold)](https://usaco.guide/gold/stacks) — read the full page.
2. CPH Chapter 8.2 (Stack-Based Algorithms), pp. 82–84 — concise complement.

---

## Step 4 — Code reference

### Previous Smaller Element (PSE)

```python
def previous_smaller(a):
    # Invariant: stack stores indices in strictly increasing order of value (bottom→top)
    n = len(a)
    left = [0] * n            # 1-indexed answer; 0 = no smaller exists
    stack = []
    for i in range(n):
        while stack and a[stack[-1]] >= a[i]:    # >= so equal predecessors are discarded (see Step 2)
            stack.pop()
        left[i] = stack[-1] + 1 if stack else 0
        stack.append(i)
    return left
```

### Next Greater Element (NGE)

```python
def next_greater(a):
    # Invariant: stack stores indices in strictly decreasing order of value
    n = len(a)
    right = [-1] * n
    stack = []
    for i in range(n):
        while stack and a[stack[-1]] < a[i]:     # current breaks the decrease
            idx = stack.pop()
            right[idx] = i                        # i is the next greater for idx
        stack.append(i)
    return right
```

### Largest rectangle in histogram (with sentinel)

```python
def largest_rectangle(heights):
    stack = []                # increasing stack of indices
    ans = 0
    # Append a sentinel 0 → forces all remaining bars to flush
    for i in range(len(heights) + 1):
        h = heights[i] if i < len(heights) else 0
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            ans = max(ans, height * width)
        stack.append(i)
    return ans
```

### Sum of subarray minimums (PSE asymmetric with NSE)

```python
def sum_subarray_mins(a):
    MOD = 10**9 + 7
    n = len(a)

    # left[i] = distance to previous STRICTLY smaller element (use >= → leftmost-rep)
    left = [0] * n
    stack = []
    for i in range(n):
        while stack and a[stack[-1]] >= a[i]:
            stack.pop()
        left[i] = i - stack[-1] if stack else i + 1
        stack.append(i)

    # right[i] = distance to next smaller-or-equal element (use >)
    right = [0] * n
    stack = []
    for i in range(n - 1, -1, -1):
        while stack and a[stack[-1]] > a[i]:
            stack.pop()
        right[i] = stack[-1] - i if stack else n - i
        stack.append(i)

    return sum(a[i] * left[i] * right[i] for i in range(n)) % MOD
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Nearest Smaller Values](https://cses.fi/problemset/task/1645) | CSES | Easy | UG | baseline | PSE going left-to-right — implement your Step 1 problem with the increasing stack |
| 2 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | LC 739 | Medium | NC150 | extension | NGE going right — answer assigned at pop time; the mirror direction of problem 1 |
| 3 | [Mike and Feet](https://codeforces.com/contest/547/problem/B) | CF 547B | Normal | UG ⭐ | extension | Span = PSE + NSE — for each height, find the widest subarray where it is the min; first use of the two-scan span pattern |
| 4 | [Car Fleet](https://leetcode.com/problems/car-fleet/) | LC 853 | Medium | NC150 | extension | Sort by position + decreasing stack — a new car merges into the existing fleet when its arrival time is ≤ stack top |
| 5 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | LC 84 | Hard | NC150 | extension | Classic PSE + NSE with the sentinel-flush trick; computes `height[i] × span[i]` for each bar |
| 6 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | LC 907 | Medium | ⭐ | **checkpoint** | Contribution counting with the asymmetric tie-breaking (`≥` on PSE side, `>` on NSE side) |

**Checkpoint:** LC 907 without hints. The mechanics — count subarrays where `a[i]` is the minimum using `left_span × right_span` — follow from problem 3's pattern. The tie-breaking trick (one side strict, one side not) is the leap. Without it, arrays with duplicates get counted multiple times. Step 2's numeric trace on `[1, 2, 1]` is the canonical demonstration.

---

## Common mistakes

- **Storing values instead of indices.** You need indices for distance calculations and to assign right-side answers at pop time. Always store indices; look up values as `a[stack[-1]]`.
- **Missing the sentinel.** After the main loop, the stack may still hold indices with no next-smaller to the right. Either append a sentinel (height = 0 for rectangles, ∞ for next-smaller) or write a separate post-loop cleanup.
- **NGE order: assigning answer on push vs. pop.** PSE/PGE answer is determined when the new index is pushed (read the top before pushing). NSE/NGE answer is determined when an old index is popped (the popping index is the answer). Mixing these up gives garbage.
