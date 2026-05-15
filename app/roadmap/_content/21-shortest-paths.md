# Shortest Paths

**Prerequisites:** Graph Traversal, Heap / Priority Queue  
**Unlocks:** MST, Advanced Graphs  
**Patterns introduced:** greedy relaxation (Dijkstra), edge relaxation in waves (Bellman-Ford), all-pairs DP (Floyd-Warshall) — all module-specific  
**Patterns reused:** [heap of size k](00-patterns.md#heap-of-size-k) (Dijkstra's priority queue), [BFS/DFS skeleton](00-patterns.md#bfs-dfs-skeleton)

---

## Step 1 — Try this first

Open [LC 743 — Network Delay Time](https://leetcode.com/problems/network-delay-time/) and attempt it before reading below.

> Given a directed weighted graph and a source node, return the time it takes for a signal to reach every node (the maximum shortest-path distance from source). Return `-1` if any node is unreachable.  
> Weights are positive.

Try BFS from the source — module 18's tool for unweighted shortest paths.

```python
from collections import deque
dist = {src: 0}
q = deque([src])
while q:
    u = q.popleft()
    for v, w in graph[u]:
        if v not in dist:
            dist[v] = dist[u] + w
            q.append(v)
```

Submit. On some inputs this gives a wrong answer.

Construct a 3-node example where BFS fails. Try: `1 → 2 (weight 10)`, `1 → 3 (weight 1)`, `3 → 2 (weight 1)`. BFS pops 1, sets `dist[2]=10`, `dist[3]=1`. Then pops 2 (no further neighbours), then pops 3, but `2 in dist` already — BFS skips. Final `dist[2]=10`. The true shortest path is `1→3→2 = 2`.

The question to carry into Step 2: *BFS committed to `dist[2] = 10` the moment it first reached node 2 — before discovering the path through node 3. Under what condition on edge weights would BFS's "first reached = final distance" rule be reliable, and where does it break here?*

---

## Step 2 — The technique

### Dijkstra — greedy by current distance

Process nodes in **order of current shortest distance from source**. The crucial invariant: when a node is popped with distance `d`, that `d` is its final shortest distance.

**Why it works (non-negative weights only).** When you pop `u` with distance `d[u]`, all unpopped nodes have distance ≥ `d[u]` (heap invariant). Any path to `u` through an unpopped node `w` has length ≥ `d[w] ≥ d[u]`, plus a non-negative remainder — so this path cannot beat `d[u]`. Therefore `d[u]` is final.

The algorithm with a heap:

```python
import heapq

def dijkstra(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue              # stale entry
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist
```

O((V + E) log V) with a binary heap.

**The "stale entry" check** (`if d > dist[u]: continue`) is load-bearing. The heap can hold multiple entries for the same node (each relaxation pushes a fresh one). When you pop a stale entry whose distance is no longer the best, skip it. Without this check, you process each node multiple times and the complexity degrades.

### Precondition — non-negative weights only

The "popped distance is final" argument **requires every edge weight to be non-negative**. With a negative edge, a node popped early could later be relaxed via a negative path → the popped distance is wrong.

With negative weights, use Bellman-Ford. With both negative *and* a need for all pairs, use Floyd-Warshall.

### Numeric trace — Dijkstra

Graph: `1→2 (4), 1→3 (1), 3→2 (2), 2→4 (1), 3→4 (5)`. Source 1.

```
dist = [_, 0, ∞, ∞, ∞]    heap = [(0, 1)]

Pop (0, 1). Relax:
  via 1→2: dist[2] = 4.   push (4, 2)
  via 1→3: dist[3] = 1.   push (1, 3)
heap = [(1, 3), (4, 2)]

Pop (1, 3). Relax:
  via 3→2: dist[2] = min(4, 1+2) = 3.   push (3, 2)
  via 3→4: dist[4] = 1+5 = 6.            push (6, 4)
heap = [(3, 2), (4, 2), (6, 4)]

Pop (3, 2).  d = 3 == dist[2] = 3, fresh. Relax:
  via 2→4: dist[4] = min(6, 3+1) = 4.   push (4, 4)
heap = [(4, 2), (4, 4), (6, 4)]

Pop (4, 2).  d = 4 > dist[2] = 3 → STALE, skip.
Pop (4, 4).  Fresh. No outgoing edges.
Pop (6, 4).  STALE, skip.

Final: dist = [_, 0, 3, 1, 4]
```

The stale-entry skip happens twice. Without it the algorithm still gives correct distances, but redundant relaxations push `2` back into the heap and processing is wasted.

### Bellman-Ford — handles negative weights

When edges can be negative, Dijkstra is wrong. Bellman-Ford instead: relax **every edge** in waves, V − 1 times. After V − 1 waves, distances are final (any shortest path has at most V − 1 edges).

```python
def bellman_ford(edges, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return dist
```

O(VE) — slower than Dijkstra but more general.

**Detect a negative cycle:** run a V-th wave. If any distance updates, a negative cycle is reachable from the source — shortest paths are not well-defined (you can loop the cycle to get arbitrarily short).

### Floyd-Warshall — all pairs

When you need shortest distance between every pair of nodes (and V is small, say ≤ 500):

```python
def floyd_warshall(graph, n):
    # graph[u][v] = edge weight or ∞ if no edge
    dist = [row[:] for row in graph]
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist
```

O(V³). The outer loop over `k` is the "use node k as a possible intermediate" relaxation step. Works with negative weights but not negative cycles.

### Pattern selection

| You have | Use |
|---|---|
| Non-negative weights, single source, sparse graph | Dijkstra |
| Non-negative weights, unit-weight edges only | BFS (module 18) |
| Negative weights possible, single source, ~V × E ≤ 10⁷ | Bellman-Ford |
| All pairs, V ≤ 500 | Floyd-Warshall |
| Weights ∈ {0, 1} only | 0-1 BFS (deque variant) — appears in some USACO problems |

### Dijkstra on implicit graphs (module 18 echo)

LC 778 Swim in Rising Water has the structure of a grid where each cell has a height. The "cost" of a path is the *maximum* cell height along it (not the sum). Dijkstra still applies — replace the relaxation `dist[v] = dist[u] + w` with `dist[v] = max(dist[u], grid[v])`. The greedy invariant still holds: the popped distance (now: maximum height seen) is monotone, and any path through unpopped nodes cannot reduce a maximum.

This is the **minimax path** variant. Dijkstra's framework generalises to any objective where extending a path is monotone in a path statistic.

---

## Step 3 — Read

The USACO Guide has two pages — one on Dijkstra (weighted), one on BFS-based (unweighted, including 0-1 BFS).

1. [USACO Guide — Shortest Paths (Gold)](https://usaco.guide/gold/shortest-paths) — covers Dijkstra and Floyd-Warshall with CSES samples. Load-bearing.
2. CPH Chapter 13 (Shortest paths), pp. 129–141 — Dijkstra, Bellman-Ford, Floyd-Warshall in one place. Read.

---

## Step 4 — Code reference

### Dijkstra — single source, non-negative weights

```python
import heapq

def dijkstra(graph, src, n):
    # Invariant: when a node is popped from heap, its distance is final
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue                # stale entry — must skip
        for v, w in graph[u]:                   # graph[u] = list of (v, weight)
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist
```

### Bellman-Ford — handles negatives, detects negative cycles

```python
def bellman_ford(edges, src, n):
    # Invariant: after k waves, dist[v] = shortest dist using at most k edges
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed: break                   # early exit if stable
    # One more wave: if any update, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None                          # negative cycle reachable
    return dist
```

### Floyd-Warshall — all pairs

```python
def floyd_warshall(adj_matrix, n):
    # Invariant after iteration k: dist[i][j] = shortest path from i to j
    # using only intermediate nodes in {0, 1, ..., k}
    dist = [row[:] for row in adj_matrix]
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist
```

### Dijkstra with edge-count limit (LC 787 pattern)

```python
def cheapest_with_stops(edges, src, dst, k, n):
    # State = (node, edges_used). Process states in order of cost.
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
    heap = [(0, src, 0)]                        # (cost, node, edges_used)
    best = {}                                   # (node, edges_used) → min cost
    while heap:
        cost, u, used = heapq.heappop(heap)
        if u == dst: return cost
        if used > k: continue
        if (u, used) in best and best[(u, used)] <= cost: continue
        best[(u, used)] = cost
        for v, w in graph[u]:
            heapq.heappush(heap, (cost + w, v, used + 1))
    return -1
```

### Dijkstra with minimax (LC 778 pattern)

```python
def swim_in_water(grid):
    n = len(grid)
    visited = [[False] * n for _ in range(n)]
    heap = [(grid[0][0], 0, 0)]
    while heap:
        h, r, c = heapq.heappop(heap)
        if visited[r][c]: continue
        visited[r][c] = True
        if (r, c) == (n - 1, n - 1): return h
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and not visited[nr][nc]:
                heapq.heappush(heap, (max(h, grid[nr][nc]), nr, nc))
    return -1
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | LC 743 | Medium | NC150 | baseline | Dijkstra with heap — your Step 1 problem; final answer is `max(dist)` |
| 2 | [Flight Discount](https://cses.fi/problemset/task/1195) | CSES | Easy | UG | extension | Dijkstra with **state augmentation** — track `(node, discount_used)`; relax with or without using the discount |
| 3 | [High Score](https://cses.fi/problemset/task/1673) | CSES | Easy | UG | extension | Bellman-Ford — handles negative weights; mark nodes affected by negative cycles via a second-pass |
| 4 | [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | LC 787 | Medium | NC150 | extension | Bellman-Ford with **edge-count limit** — run K + 1 waves instead of V − 1; or state-augmented Dijkstra |
| 5 | [Shortest Routes II](https://cses.fi/problemset/task/1672) | CSES | Easy | UG | extension | Floyd-Warshall — all-pairs distances; `O(V³)` precomputation, then O(1) per query |
| 6 | [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) | LC 778 | Hard | NC150 | **checkpoint** | Dijkstra with **minimax relaxation** — replace `dist[u] + w` with `max(dist[u], cell)`; the greedy invariant still holds for monotone path statistics |

**Checkpoint:** LC 778 without hints. The leap is recognising that **Dijkstra's framework generalises beyond sum-of-weights**. The invariant — "popped distance is final" — holds for any path statistic that is **monotone non-decreasing** as the path extends (max, min in a different sense, lexicographic compare). For this problem the statistic is "maximum cell height on the path", and the relaxation becomes `new = max(current, neighbour_height)`. None of the earlier problems use a non-additive relaxation; recognising that the same machinery applies is the genuine insight.

---

## Common mistakes

- **Forgetting the stale-entry skip.** Without `if d > dist[u]: continue`, you process each node every time it's relaxed — the algorithm still terminates but complexity degrades to O((V + E) × max_relaxations).
- **Running Dijkstra with negative edges.** The "popped distance is final" argument breaks. Test for negative weights at the start and fall back to Bellman-Ford. Silently giving wrong answers is the failure mode.
- **Heap of values vs heap of (value, id) tuples.** Always push `(distance, node)` tuples — never raw distances — so you know which node each heap entry refers to.
- **Bellman-Ford and negative cycle scope.** A negative cycle reachable from the source corrupts distances to the cycle's descendants. The V-th wave detects existence; to find *which* nodes are affected, propagate "negative-cycle-tainted" forward via another BFS.
- **Floyd-Warshall loop order.** The outer loop must iterate over `k` (the intermediate node), then `i`, then `j`. Swapping any pair gives wrong answers — `k` outermost is what makes the DP recurrence work.
