# Monotonic Stack

**Prerequisites:** Stack, [monotonic invariant (module 5)](00-patterns.md#monotonic-invariant)  
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

This is the [monotonic invariant pattern](00-patterns.md#monotonic-invariant) again — the "useless candidates" insight from module 5 is the same idea, now used to maintain a stack instead of advance a pointer.

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

### Carrying state on the stack

Stack entries don't have to be bare indices. When the pop step does meaningful work — accumulating a span, merging into a group — store `(key, payload)` tuples. The monotone invariant on the **key** stays the same; the payload is whatever you need to combine on pop.

**LC 901 Online Stock Span** stores `(price, span)` with prices strictly decreasing bottom-to-top. On each new price, pop all entries with `price ≤ current` and absorb their spans into the current day's span. The accumulation collapses what would otherwise be a Previous-Greater-Element pass followed by a subtraction into one motion.

**Numeric trace** with `prices = [100, 80, 60, 70, 60, 75, 85]`:

```
day 1 (100): span=1                              stack=[(100,1)]
day 2  (80): 80 < 100; span=1                    stack=[(100,1),(80,1)]
day 3  (60): 60 < 80;  span=1                    stack=[(100,1),(80,1),(60,1)]
day 4  (70): pop (60,1) → span=2                 stack=[(100,1),(80,1),(70,2)]
day 5  (60): 60 < 70;  span=1                    stack=[(100,1),(80,1),(70,2),(60,1)]
day 6  (75): pop (60,1)→2; pop (70,2)→4; span=4  stack=[(100,1),(80,1),(75,4)]
day 7  (85): pop (75,4)→5; pop (80,1)→6; span=6  stack=[(100,1),(85,6)]

spans = [1, 1, 1, 2, 1, 4, 6]
```

Each price is pushed once and popped at most once across all `next()` calls → amortised O(1) per call.

**LC 853 Car Fleet** uses the same idea with a different payload: sort cars by position descending, walk them in order toward the destination, and store arrival times on the stack. When a new car's arrival time is **≤** the stack top, it cannot pass the slower fleet ahead — *merge* (don't push). When greater, it forms a new fleet. The final stack height is the number of fleets.

Unifying idea: the stack's order encodes "what's still distinct"; the payload and the pop action encode the aggregation. PSE/NSE answer a per-element question; carrying state answers an aggregate one (counts, sums, spans).

### Two-scan span ([atlas](00-patterns.md#two-scan-span))

For each element you can compute both PSE (previous smaller) and NSE (next smaller). The span `(NSE_index − PSE_index − 1)` is the widest subarray where this element is the strict minimum.

This is the [two-scan span pattern from module 4](00-patterns.md#two-scan-span): one forward sweep, one backward sweep, combine. Largest Rectangle in Histogram (LC 84) uses this directly — `height[i] × span[i]` is the largest rectangle whose lowest bar is `i`.

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

### State-carrying skeleton (LC 901-style: accumulate on pop)

```python
def state_carrying(values):
    # Invariant: stack stores (key, payload) with keys strictly decreasing bottom→top.
    # On pop, absorb the popped payload into the current entry's payload.
    stack = []
    answers = []
    for v in values:
        payload = 1                          # init from the current element (problem-specific)
        while stack and stack[-1][0] <= v:   # inclusive ≤ — see Step 2 for why
            payload += stack.pop()[1]        # absorb
        stack.append((v, payload))
        answers.append(payload)
    return answers
```

For LC 853 the payload is the arrival time and the "absorb" step is a no-op (the slower fleet's time wins, the faster car simply doesn't get pushed). The skeleton is the same shape; what changes is the payload field and what `absorb` does.

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

### Contribution counting — PSE + NSE with asymmetric tie-breaking

For "sum over all subarrays of f(min)" or similar — the **structure** is two monotonic-stack passes (PSE and NSE) producing per-element span arrays, then aggregation. The asymmetric tie-breaking (one side uses `>=` on pop, the other uses `>`) is the load-bearing detail — see Step 2 for the leftmost-rep proof on `[1, 2, 1]`. The implementation is left for the checkpoint.

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Nearest Smaller Values](https://cses.fi/problemset/task/1645) | CSES | Easy | UG | baseline | PSE going left-to-right — implement your Step 1 problem with the increasing stack |
| 2 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | LC 739 | Medium | NC150 | extension | NGE going right — answer assigned at pop time; the mirror direction of problem 1 |
| 3 | [Mike and Feet](https://codeforces.com/contest/547/problem/B) | CF 547B | Medium | UG ⭐ | extension | Span = PSE + NSE — for each height, find the widest subarray where it is the minimum; first use of the two-scan span pattern |
| 4 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | LC 901 | Medium | new | extension | New sub-pattern: `(price, span)` pairs with accumulate-on-pop — the stack carries state, popping does work (Step 2 "carrying state") |
| 5 | [Car Fleet](https://leetcode.com/problems/car-fleet/) | LC 853 | Medium | NC150 | extension | Same carrying-state idiom in a lateral framing — sort by position, decreasing stack of arrival times, a slower fleet absorbs faster cars trapped behind it |
| 6 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | LC 84 | Hard | NC150 | extension | Canonical PSE + NSE with the sentinel-flush trick; computes `height[i] × span[i]` at pop time |
| 7 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | LC 907 | Medium | ⭐ | **checkpoint** | Contribution counting with asymmetric tie-breaking (`≥` on PSE side, `>` on NSE side) |

**Checkpoint:** LC 907 without hints. The mechanics — count subarrays where `a[i]` is the minimum using `left_span × right_span` — follow from problem 3's pattern. The tie-breaking trick (one side strict, one side not) is the leap. Without it, arrays with duplicates get counted multiple times. Step 2's numeric trace on `[1, 2, 1]` is the canonical demonstration.

---

## Common mistakes

- **Bare indices vs. tuples.** For PSE/NSE/NGE/PGE questions where the answer depends on positions, store **indices** and look up values as `a[stack[-1]]`. For state-carrying problems (LC 901, LC 853), store `(key, payload)` tuples so the pop step can absorb state. Picking the wrong representation makes the pop logic awkward.
- **Missing the sentinel.** After the main loop, the stack may still hold indices with no next-smaller to the right. Either append a sentinel (height = 0 for rectangles, ∞ for next-smaller) or write a separate post-loop cleanup.
- **NGE order: assigning answer on push vs. pop.** PSE/PGE answer is determined when the new index is *pushed* (read the top before pushing). NSE/NGE answer is determined when an old index is *popped* (the popping index is the answer). Mixing these up gives garbage.
- **Inclusive vs. exclusive pop in state-carrying stacks.** LC 901 says "less than or equal to today's price" — pop on `≤`. LC 853 likewise: a slower car ahead absorbs anything arriving at time `≤` it. Using strict `<` undercounts the span / overcounts the fleets. Read the problem's definition of "absorbed" before fixing the operator.
