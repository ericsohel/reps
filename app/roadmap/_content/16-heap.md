# Heap / Priority Queue

**Prerequisites:** Trees  
**Unlocks:** Shortest Paths (Dijkstra)  
**Patterns introduced:** [heap of size k](00-patterns.md#heap-of-size-k), [two-heap balancing](00-patterns.md#two-heap-balancing)  
**Patterns reused:** [augmented data structure](00-patterns.md#augmented-data-structure) (heap of tuples)

---

## Step 1 — Try this first

Open [CSES 1164 — Room Allocation](https://cses.fi/problemset/task/1164) and attempt it before reading below.

> n customers check in and out of a hotel on given days. Assign rooms so no two customers share a room on any day, minimising the total rooms used. Output the room each customer gets.  
> Constraints: n ≤ 2 × 10⁵.

The naive: process customers in arrival order; for each new customer, scan all existing rooms to find one already vacated. O(n²) — TLE.

The question to carry into Step 2: *as you process customers in arrival order, among the currently occupied rooms, exactly ONE piece of information determines whether you must open a new room. What is it, and how do you maintain it efficiently as rooms free up?*

---

## Step 2 — The technique

### The heap structure

A heap is a complete binary tree maintaining the **heap property**: every parent is ≤ its children (min-heap) or ≥ (max-heap). All operations work on the array representation, no explicit tree.

- `push(x)`: O(log n)
- `pop()`: O(log n), returns and removes the min (or max)
- `peek()`: O(1)
- `heapify(arr)`: O(n) — bulk-build in linear time

**Python's `heapq` is always a min-heap.** For a max-heap, negate values on push and pop. There is no max-heap class in stdlib.

```python
import heapq
h = []
heapq.heappush(h, 3); heapq.heappush(h, 1); heapq.heappush(h, 2)
heapq.heappop(h)            # 1
h = [3, 1, 4, 1, 5]; heapq.heapify(h)
```

### Answer to Step 1 — sort + min-heap of departures

Sort customers by arrival. Maintain a min-heap of `(departure_day, room_number)` for occupied rooms. The heap's top is the earliest-vacating room — the only information you need.

For each new customer:
- If `heap[0][0] < arrival_day`: that room is already free — reuse (heapreplace).
- Otherwise: no rooms freed in time — open a new one.

O(n log n) total: one heap operation per customer.

### Numeric trace — Room Allocation

Customers (arrival, departure): `(1, 2), (2, 4), (4, 4), (5, 6)`. Sort by arrival (already sorted).

```
i=0 (1, 2):  heap empty.                Open room 1.  push (2, 1).         heap = [(2, 1)]
i=1 (2, 4):  heap[0]=(2, 1). 2 < 2? No. Open room 2.  push (4, 2).         heap = [(2, 1), (4, 2)]
i=2 (4, 4):  heap[0]=(2, 1). 2 < 4? Yes. Pop, reuse room 1. push (4, 1).   heap = [(4, 1), (4, 2)]
i=3 (5, 6):  heap[0]=(4, 1). 4 < 5? Yes. Pop, reuse room 1. push (6, 1).   heap = [(4, 2), (6, 1)]

Output: rooms = [1, 2, 1, 1]. Total rooms used = 2.
```

### Heap of size k ([atlas](00-patterns.md#heap-of-size-k))

To find the k-th largest among n elements, maintain a **min-heap of exactly k elements**. After each insert, pop if size > k. The heap's top is always the k-th largest.

Why min-heap for k-th *largest*: the top is the smallest of the top-k, which is the k-th largest overall.

For k closest: max-heap (negated min-heap) of size k. Top is the *farthest* of the closest k — pop if a closer one arrives.

### Two-heap balancing ([atlas](00-patterns.md#two-heap-balancing))

For the running median over a stream: split the data into two halves separated by the median.

- **lo** (max-heap): the lower half. Top = largest in the lower half.
- **hi** (min-heap): the upper half. Top = smallest in the upper half.

Invariant: every element in `lo` ≤ every element in `hi`, and `|lo| ≥ |hi|` with `|lo| − |hi| ∈ {0, 1}`.

The median is `lo[0]` if `|lo| > |hi|`, else `(lo[0] + hi[0]) / 2`.

**The three-step rebalance order on insert.** Order matters:

1. Push the new value into `lo` (negated, since lo is max-heap).
2. Move `lo`'s top across to `hi` — guarantees every `lo` element ≤ every `hi` element.
3. If `|hi| > |lo|`, move `hi`'s top back to `lo` — restores size invariant.

Pushing directly to `hi` skips step 2 and can violate the inequality between halves. Skipping step 3 leaves the size invariant broken when the new value goes to the upper half.

### Heap of tuples — [augmented data structure](00-patterns.md#augmented-data-structure)

When the priority isn't the element itself (a coordinate, a node reference), push `(priority, tiebreaker, payload)` tuples. The heap orders by the first element; the tiebreaker prevents Python from trying to compare incomparable payloads.

In LC 23 (Merge K Sorted Lists), push `(node.val, list_index, node)`. The list index is the tiebreaker — without it, `heapq` tries to compare `ListNode` objects when values tie and raises `TypeError`.

### Greedy + heap

When a greedy choice involves "pick the largest / smallest remaining", a heap gives O(log n) access. Pattern: sort events by one key, process in order, use a heap to track the current best option.

---

## Step 3 — Read

1. [USACO Guide — Priority Queues (Silver)](https://usaco.guide/silver/priority-queues) — covers the Room Allocation sample and USACO contest examples.
2. CPH Chapter 2.4 (Priority Queues), pp. 22–23 — definitional, brief.

---

## Step 4 — Code reference

### k-th largest in a stream (min-heap of size k)

```python
import heapq

class KthLargest:
    def __init__(self, k, nums):
        # Invariant: self.h is a min-heap of size ≤ k holding the largest k seen so far
        self.k = k
        self.h = []
        for x in nums:
            self.add(x)

    def add(self, val):
        heapq.heappush(self.h, val)
        if len(self.h) > self.k:
            heapq.heappop(self.h)
        return self.h[0]
```

### Max-heap simulation (Last Stone Weight)

```python
import heapq

def lastStoneWeight(stones):
    h = [-s for s in stones]
    heapq.heapify(h)
    while len(h) > 1:
        a = -heapq.heappop(h)            # negate on pop
        b = -heapq.heappop(h)
        if a != b:
            heapq.heappush(h, -(a - b))  # negate on push
    return -h[0] if h else 0
```

### Sort + heap (Room Allocation)

```python
import heapq

def room_allocation(arrivals, departures):
    n = len(arrivals)
    order = sorted(range(n), key=lambda i: arrivals[i])
    # Invariant: rooms is a min-heap of (departure_day, room_number) for occupied rooms
    rooms = []
    assignment = [0] * n
    next_room = 1
    for i in order:
        if rooms and rooms[0][0] < arrivals[i]:
            dep, room = heapq.heappop(rooms)
            assignment[i] = room
        else:
            assignment[i] = next_room
            next_room += 1
        heapq.heappush(rooms, (departures[i], assignment[i]))
    return next_room - 1, assignment
```

### Two heaps — Find Median

```python
import heapq

class MedianFinder:
    def __init__(self):
        # Invariants:
        #   lo (max-heap, negated): every element ≤ every element of hi
        #   |lo| - |hi| ∈ {0, 1}
        self.lo = []        # max-heap, store negatives
        self.hi = []        # min-heap

    def addNum(self, num):
        heapq.heappush(self.lo, -num)                    # step 1: push to lo
        heapq.heappush(self.hi, -heapq.heappop(self.lo)) # step 2: balance values
        if len(self.hi) > len(self.lo):                  # step 3: balance sizes
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
```

### Merge K sorted lists (heap of tuples)

```python
import heapq

def mergeKLists(lists):
    dummy = ListNode(0)
    curr = dummy
    h = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(h, (node.val, i, node))    # i = tiebreaker

    while h:
        val, i, node = heapq.heappop(h)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(h, (node.next.val, i, node.next))
    return dummy.next
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Room Allocation](https://cses.fi/problemset/task/1164) | CSES | Medium | UG ⭐ | baseline | Sort by arrival + min-heap of departures — your Step 1 problem |
| 2 | [Kth Largest Element In a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | LC 703 | Easy | NC150 | baseline | Min-heap of size k pattern — top is the k-th largest |
| 3 | [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/) | LC 1046 | Easy | NC150 | extension | Max-heap simulation — negate on push and pop |
| 4 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | LC 973 | Medium | NC150 | extension | Heap-of-size-k applied to distances — max-heap so we pop when the new point is closer |
| 5 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | LC 23 | Hard | NC150 | extension | Heap of `(val, index, node)` tuples — module 10's deferred problem |
| 6 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | LC 621 | Medium | NC150 | extension | Greedy + max-heap with a cooldown queue — schedule the most frequent task that's off cooldown |
| 7 | [Convention II](http://www.usaco.org/index.php?page=viewproblem2&cpid=859) | USACO Silver | Medium | UG ⭐ | extension | Sort + heap in a contest problem — identify that PQ is the right tool from the problem statement |
| 8 | [Find Median From Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | LC 295 | Hard | NC150 | **checkpoint** | Two-heap balancing — the three-step rebalance order from Step 2 |

**Checkpoint:** LC 295 without hints. The leap is the **three-step rebalance order** — push to `lo`, transfer `lo`'s top to `hi`, then balance sizes. Skipping or reordering any step breaks an invariant. The fact that you don't need a sorted data structure at all — you only need the boundary values between the two halves — is the non-obvious framing.

**Also doable after this module:**
- [Design Twitter (LC 355, NC150)](https://leetcode.com/problems/design-twitter/) — merge k sorted tweet feeds; uses the same heap-of-tuples pattern as problem 5.
- [Kth Largest Element in an Array (LC 215, NC150)](https://leetcode.com/problems/kth-largest-element-in-an-array/) — same heap-of-size-k pattern as problem 2, one-shot on a fixed array (also solvable with quickselect, a fancier alternative).

**Deferred from module 10:**
- [Reverse Nodes In K Group (LC 25, NC150)](https://leetcode.com/problems/reverse-nodes-in-k-group/) — hard pointer manipulation in groups of k; not heap-related, just demanding implementation.
- [Serialize and Deserialize Binary Tree (LC 297, NC150, module 14)](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) — BFS-based serialisation; you have all the tools now.

---

## Common mistakes

- **Python `heapq` is min-only.** To simulate max, push `-val` *and* read `-h[0]`. Forgetting either gives wrong results — most commonly forgetting to negate when *reading* `h[0]`.
- **`TypeError` from comparing heap items.** Python compares tuple elements left-to-right; if priorities tie, it tries the next field, which is often an incomparable object (ListNode, custom class). Always include an integer tiebreaker as the second tuple element.
- **k-th largest vs k-th smallest.** Min-heap of size k → k-th largest (top is the smallest of the top-k). Max-heap of size k → k-th smallest (top is the largest of the smallest-k). It's easy to flip these the wrong way.
- **Two-heap rebalance order.** Always push to `lo`, then transfer `lo`'s top to `hi`, then check sizes. Pushing directly to `hi` breaks the `lo ≤ hi` invariant when the new value is small.
- **Task Scheduler — formula alternative.** The simulation with heap + queue works. A direct formula also works: `max(n_tasks, (max_freq - 1) * (cooldown + 1) + count_of_most_frequent)`. Know both — interviewers occasionally ask for the formula derivation.
