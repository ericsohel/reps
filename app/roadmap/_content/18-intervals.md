# Intervals & Sweep Line

**Prerequisites:** Greedy  
**Unlocks:** (technique recurs in Graphs, advanced data structures)  
**Patterns introduced:** [sweep line / events](00-patterns.md#sweep-line--events)  
**Patterns reused:** [exchange argument](00-patterns.md#exchange-argument) (EFT proof), [heap of size k](00-patterns.md#heap-of-size-k) (checkpoint)

---

## Step 1 — Try this first

Open [CSES 1629 — Movie Festival](https://cses.fi/problemset/task/1629) and attempt it before reading below.

> You have n movies, each described by a start time and end time. You can watch movies that don't overlap. Find the maximum number of movies you can watch.  
> Constraints: n ≤ 2 × 10⁵.

The brute force tries all 2ⁿ subsets — instant TLE for n = 30. You need a greedy.

There are three plausible greedy orderings. **Construct a small input where each of the first two fails:**

- (a) Sort by **start time**, take the next movie that starts after the last one ends.
- (b) Sort by **duration ascending**, take the next non-conflicting movie.
- (c) Sort by **end time**, take the next non-conflicting movie.

The question to carry into Step 2: *of the three, which one is provably correct? Find the failure case for each of (a) and (b), and ask why (c) doesn't have one.*

---

## Step 2 — The technique

### Three sub-patterns, three sort keys

Interval problems split into three recurring sub-patterns. Each has a **different sort key** — confusing them is the main source of wrong answers in this module.

| Sub-pattern | Sort by | Logic | Examples |
|---|---|---|---|
| Interval scheduling (count / pick) | **end** time | take the next interval that doesn't conflict with the last accepted | CSES 1629, LC 435 |
| Merge overlapping | **start** time | extend running `[start, end]` while new interval overlaps; flush otherwise | LC 56, LC 57 |
| Sweep line (max concurrent) | **time** (events) | scan events, maintain running count | LC 253, CSES 1619 |

### Interval scheduling — earliest-end-first ([atlas](00-patterns.md#exchange-argument))

**Answer to Step 1.** The earliest-end-first (EFT) greedy works. The exchange argument:

Suppose OPT picks some movie `m` ending at time `e_m`. Among non-conflicting movies, suppose the *greedy* would have picked `g` with `e_g ≤ e_m`. Swap `m` for `g` in OPT. The new schedule:
- Still picks the same number of movies.
- Has `g` ending no later than `m` did, so all subsequent OPT choices are still valid.

So any OPT can be transformed into the EFT greedy without loss. EFT is optimal.

Why **start-time-first** fails: a long movie starting early can block several later movies. Counterexample: `[(0, 10), (1, 2), (3, 4), (5, 6)]`. Start-first takes (0,10) and stops — 1 movie. EFT takes (1,2), (3,4), (5,6) — 3 movies.

Why **shortest-first** fails: a short movie in the middle can block two non-conflicting movies. Counterexample: `[(0, 5), (4, 6), (5, 10)]`. Shortest is (4, 6) — but taking it conflicts with both other movies. EFT takes (0,5) and (5,10) — 2 movies vs 1.

### Numeric trace — Movie Festival

Movies: `[(1, 4), (3, 5), (0, 6), (5, 7), (3, 8), (5, 9), (6, 10), (8, 11)]`. Sort by end time (already sorted here):

```
(1, 4):  take. last_end = 4. count = 1.
(3, 5):  3 < 4. skip.
(0, 6):  0 < 4. skip.
(5, 7):  5 ≥ 4. take. last_end = 7. count = 2.
(3, 8):  3 < 7. skip.
(5, 9):  5 < 7. skip.
(6, 10): 6 < 7. skip.
(8, 11): 8 ≥ 7. take. last_end = 11. count = 3.
```

Result: 3 movies.

### Merge overlapping

Sort by **start** time. Maintain a running `[cur_start, cur_end]`. For each new interval:
- If `interval.start ≤ cur_end`: extend `cur_end = max(cur_end, interval.end)`.
- Else: flush `[cur_start, cur_end]` to output and start a new running interval.

### Sweep line ([atlas](00-patterns.md#sweep-line--events))

"Maximum concurrent intervals" decomposes into start and end **events**:

- Each interval `[s, e]` produces two events: `(s, +1)` and `(e, −1)`.
- Sort events by time.
- Scan events, maintain running counter, track maximum.

**Tie-breaking is load-bearing.** When a start and an end event share a timestamp, the convention depends on the problem:

- *Endpoints non-overlapping* (e.g., "a meeting ending at 9 and one starting at 9 use the same room consecutively, not concurrently"): process **close before open**. Sort tuples as `(time, type)` where end is `-1` and start is `+1` — natural order does the right thing.
- *Endpoints overlapping* (e.g., booking events that occupy a single instant): process **open before close**. Negate the convention.

LC 253 Meeting Rooms II uses close-before-open. CSES 1619 Restaurant Customers uses close-before-open too.

### Numeric trace — sweep line on `[(0, 3), (1, 4), (2, 5)]`

Events:

```
(0, +1), (1, +1), (2, +1), (3, -1), (4, -1), (5, -1)
```

Sorted (close < open within tie):

```
(0, +1)  cur=1, max=1
(1, +1)  cur=2, max=2
(2, +1)  cur=3, max=3
(3, -1)  cur=2
(4, -1)  cur=1
(5, -1)  cur=0
```

Max concurrent = 3. (All three intervals overlap at time 2.)

### Checkpoint setup — offline queries

The checkpoint problem (LC 1851) combines:
- Sort intervals by size (so smaller intervals are considered first).
- Sort queries by value (offline processing).
- Two-pointer through intervals, [heap of size k](00-patterns.md#heap-of-size-k) of active intervals keyed by end time.

This recombines this module's sort-by-key idea with module 16's heap pattern.

---

## Step 3 — Read

There is no single USACO Guide page for intervals — content is scattered across Greedy Sorting (where Movie Festival is the sample), Sliding Window, and other modules. The targeted reads:

1. [USACO Guide — Greedy Sorting (Silver)](https://usaco.guide/silver/greedy-sorting) — Movie Festival walkthrough with the EFT proof. Load-bearing for the interval scheduling sub-pattern.
2. CPH Chapter 6 (Greedy algorithms), pp. 67–73 — covers the Movie Festival proof concisely and the events idea.

---

## Step 4 — Code reference

### Interval scheduling — Movie Festival / Non-overlapping Intervals

```python
def max_non_overlapping(intervals):
    # Invariant: last_end = end time of most recently accepted interval
    intervals.sort(key=lambda x: x[1])              # sort by END
    last_end = -float('inf')
    count = 0
    for start, end in intervals:
        if start >= last_end:                       # ≥ if endpoints touch and are allowed
            count += 1
            last_end = end
    return count
```

### Merge overlapping

```python
def merge_intervals(intervals):
    # Invariant: result[-1] is the running merged interval
    intervals.sort(key=lambda x: x[0])              # sort by START
    result = []
    for start, end in intervals:
        if result and start <= result[-1][1]:
            result[-1][1] = max(result[-1][1], end)
        else:
            result.append([start, end])
    return result
```

### Insert into sorted intervals

```python
def insert_interval(intervals, new):
    result = []
    i, n = 0, len(intervals)
    # Pre-insert intervals strictly before new
    while i < n and intervals[i][1] < new[0]:
        result.append(intervals[i]); i += 1
    # Merge all overlapping intervals into new
    while i < n and intervals[i][0] <= new[1]:
        new = [min(new[0], intervals[i][0]), max(new[1], intervals[i][1])]
        i += 1
    result.append(new)
    # Append intervals strictly after
    while i < n:
        result.append(intervals[i]); i += 1
    return result
```

### Sweep line — max concurrent

```python
def max_concurrent(intervals):
    events = []
    for start, end in intervals:
        events.append((start, +1))                  # open event
        events.append((end, -1))                    # close event
    events.sort()                                   # natural order: -1 sorts before +1 at tie
    cur = best = 0
    for _, delta in events:
        cur += delta
        best = max(best, cur)
    return best
```

### Offline query — min interval covering each query (LC 1851)

```python
import heapq

def min_interval(intervals, queries):
    intervals.sort()                                # by start ascending
    sorted_q = sorted(enumerate(queries), key=lambda x: x[1])
    result = [-1] * len(queries)
    heap = []                                       # (size, end) — min-heap by size
    i = 0
    for qi, q in sorted_q:
        # Activate any intervals starting at or before q
        while i < len(intervals) and intervals[i][0] <= q:
            s, e = intervals[i]
            heapq.heappush(heap, (e - s + 1, e))
            i += 1
        # Discard expired intervals (end < q)
        while heap and heap[0][1] < q:
            heapq.heappop(heap)
        result[qi] = heap[0][0] if heap else -1
    return result
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Movie Festival](https://cses.fi/problemset/task/1629) | CSES | Easy | UG | baseline | EFT greedy with exchange-argument proof — your Step 1 problem |
| 2 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | LC 56 | Medium | NC150 | baseline | Sort by start + extend running interval — different sort key, different sub-pattern |
| 3 | [Insert Interval](https://leetcode.com/problems/insert-interval/) | LC 57 | Medium | NC150 | extension | Same merge logic as LC 56 but with a pre-sorted list and one insertion — three-phase scan |
| 4 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | LC 435 | Medium | NC150 | extension | Same EFT machinery as problem 1, framed as "minimum removals = n − max non-overlapping" |
| 5 | [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) | LC 253 | Medium | NC150 | baseline | Sweep line with start/end events — third sub-pattern |
| 6 | [Minimum Interval to Include Each Query](https://leetcode.com/problems/minimum-interval-to-include-each-query/) | LC 1851 | Hard | NC150 | **checkpoint** | Sort queries offline + heap of size k keyed by interval size; remove expired intervals |

**Checkpoint:** LC 1851 without hints. Three independent ideas combine: (1) **offline** processing — answer queries in sorted order of value, not in original order, then remap; (2) **two-pointer activation** — advance an interval pointer to add intervals whose start is ≤ current query; (3) **min-heap by size** — heap top is the smallest active interval; pop expired (end < query). None of problems 1–5 use all three at once. The leap is recognising that offline + heap is the right machinery for "for each query, find best interval covering it."

**Also doable:** [Meeting Rooms (LC 252, NC150)](https://leetcode.com/problems/meeting-rooms/) — boolean "any overlap?" check; sort + scan adjacent pairs. Trivial after problem 1.

---

## Common mistakes

- **Wrong sort key.** Sort by **end** for interval scheduling, **start** for merging, **(time, type)** for sweep line. Mixing these is the single biggest source of wrong answers in this module.
- **Strict vs non-strict overlap.** Whether `interval[i].end == interval[i+1].start` counts as overlap depends on the problem. Movie Festival treats them as non-overlapping (use `start >= last_end`). Meeting Rooms II treats the same case as non-overlapping by tie-breaking (close before open). LC 252 explicitly allows touching endpoints. Read the constraints.
- **Sweep line tie-break order.** When start and end share a timestamp, you must decide whether they collide. For "close before open", sorting `(time, type)` with type as `-1` for close and `+1` for open does it naturally. Reversing makes endpoints collide.
- **LC 1851 — expired heap entries.** When you pop the heap top to read the answer for a query, also pop any entry whose `end < query` (those intervals don't cover the query). Lazy deletion is the standard approach; eager deletion requires a custom heap.
