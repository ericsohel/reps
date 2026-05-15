# Minimum Spanning Tree

**Prerequisites:** Union-Find / DSU, Shortest Paths  
**Unlocks:** (none in v1 — leaf node in interview track; CP problems build on it)  
**Track:** cp  
**Patterns introduced:** cut property (greedy edge selection), Kruskal's + Prim's algorithms  
**Patterns reused:** [heap of size k](00-patterns.md#heap-of-size-k) (Prim's priority queue), [BFS/DFS skeleton](00-patterns.md#bfs-dfs-skeleton) (Prim's expansion)

---

## Step 1 — Try this first

Open [CSES 1675 — Road Reparation](https://cses.fi/problemset/task/1675) and attempt it before reading below.

> There are n cities and m roads. Each road has a repair cost. Find the minimum total cost to repair roads so that every city is reachable from every other city. If this is impossible, output "IMPOSSIBLE".

The brute-force tries all spanning trees — there are n^(n−2) of them by Cayley's formula. TLE immediately for n > 10.

The question to carry into Step 2: *you're adding roads one by one to connect the cities. You always want the cheapest road next — but there's one condition that prevents you from adding a road even if it's cheap. What is it?*

---

## Step 2 — The technique

### What is a Minimum Spanning Tree?

A **spanning tree** of a graph is a subgraph that:
- Connects all n nodes
- Has exactly n − 1 edges (minimum possible while connected)
- Has no cycles

A **minimum spanning tree** (MST) is a spanning tree with minimum total edge weight. MSTs exist iff the graph is connected.

**Answer to Step 1.** You skip a road if its two cities are *already connected* by roads you've already added — adding it would create a cycle, not extend connectivity. This is exactly what DSU's `find` + `union` gives you in O(α) per query.

### Kruskal's algorithm

Sort all edges by weight. Process in order: add the edge if it connects two different components; skip if both endpoints are already in the same component.

```python
edges.sort(key=lambda e: e[2])        # sort by weight
for u, v, w in edges:
    if find(u) != find(v):            # different components
        union(u, v)
        mst_weight += w
        mst_edges.append((u, v, w))
        if len(mst_edges) == n - 1:
            break                      # MST complete
```

**Correctness — the cut property.** For any partition of graph vertices into two non-empty sets (a "cut"), the minimum-weight edge crossing the cut belongs to *some* MST. Kruskal's processes edges in weight order, so the first edge that can join two components is always the cheapest option for that cut.

**Numeric trace** on 4 nodes, edges sorted by weight:

```
Edges (sorted): (1-2, w=1), (1-3, w=2), (2-3, w=3), (3-4, w=4), (1-4, w=5)
DSU starts: each node its own component.

(1-2, 1): find(1)≠find(2) → union. MST weight=1. Components: {1,2} {3} {4}
(1-3, 2): find(1)≠find(3) → union. MST weight=3. Components: {1,2,3} {4}
(2-3, 3): find(2)==find(3) → skip (would cycle).
(3-4, 4): find(3)≠find(4) → union. MST weight=7. Components: {1,2,3,4}

n-1=3 edges added. Done. MST weight = 7.
```

**Complexity:** O(m log m) for sorting + O(m α(n)) for DSU ≈ O(m log m).

### Prim's algorithm

Grow the MST from any starting node. At each step, add the minimum-weight edge that connects a node *inside* the current tree to a node *outside*.

```python
import heapq
in_mst = [False] * n
dist = [float('inf')] * n          # cheapest edge to reach each node
dist[0] = 0
heap = [(0, 0)]                    # (edge_weight, node)
mst_weight = 0
while heap:
    w, u = heapq.heappop(heap)
    if in_mst[u]: continue
    in_mst[u] = True
    mst_weight += w
    for v, edge_w in graph[u]:
        if not in_mst[v] and edge_w < dist[v]:
            dist[v] = edge_w
            heapq.heappush(heap, (edge_w, v))
```

**Complexity:** O((n + m) log n) with a heap.

**Mark on POP, not on PUSH** (same rule as Dijkstra in module 21, *opposite* to BFS in module 18). The heap can hold the same node multiple times with different edge costs — the cheapest one comes out first, so the first pop is the right one to commit. If you marked on push, a later cheaper edge to the same node would push a fresh entry that's now incorrectly ignored. The contrast:

- **BFS** (unweighted): mark on push — first visit IS shortest because every edge has the same cost.
- **Dijkstra / Prim's** (weighted): mark on pop — the heap orders by cost, so the first pop is the cheapest path/edge, but multiple entries for the same node may have been pushed earlier.

### Kruskal's vs Prim's

| | Kruskal's | Prim's |
|---|---|---|
| Input | Edge list | Adjacency list |
| Best for | Sparse graphs (m ≈ n) | Dense graphs (m ≈ n²) |
| Core structure | DSU | Min-heap |
| Code | Slightly shorter | Dijkstra-like |

For LC 1584 (complete graph of n points, all O(n²) edges), Prim's O(n² log n) is natural. Kruskal's would need to generate all O(n²) edges first, same complexity.

### MST applications

- **Minimum cost to connect all nodes** (direct).
- **Verifying an MST** (USACO CF 472D — check if a given tree is the MST by running MST and comparing).
- **Restricted MST** (some edges must or cannot be included — add them first, then run Kruskal's on the rest).

---

## Step 3 — Read

1. [USACO Guide — MST (Gold)](https://usaco.guide/gold/mst) — covers Kruskal's and Prim's with CSES and USACO samples. Load-bearing for this module.
2. CPH Chapter 15 (Spanning Trees), pp. 151–159 — both algorithms, correctness proofs, applications.

---

## Step 4 — Code reference

### Kruskal's algorithm

```python
def kruskal(n, edges):
    # Invariant: `parent` encodes the DSU of currently connected components
    parent = list(range(n))
    rank = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px == py: return False
        if rank[px] < rank[py]: px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]: rank[px] += 1
        return True

    edges.sort(key=lambda e: e[2])
    mst_weight = 0
    mst_edges = []
    for u, v, w in edges:
        if union(u, v):
            mst_weight += w
            mst_edges.append((u, v, w))
            if len(mst_edges) == n - 1:
                break
    return mst_weight if len(mst_edges) == n - 1 else -1    # -1 = disconnected
```

### Prim's algorithm

```python
import heapq

def prim(n, graph):
    # Invariant: in_mst[u] = True once u's cheapest connection is finalised
    in_mst = [False] * n
    heap = [(0, 0)]                    # (edge cost to reach node, node)
    total = 0
    while heap:
        w, u = heapq.heappop(heap)
        if in_mst[u]: continue
        in_mst[u] = True
        total += w
        for v, edge_w in graph[u]:
            if not in_mst[v]:
                heapq.heappush(heap, (edge_w, v))
    return total if all(in_mst) else -1
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Road Reparation](https://cses.fi/problemset/task/1675) | CSES | Easy | UG | baseline | Kruskal's from scratch — your Step 1 problem |
| 2 | [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) | LC 1584 | Medium | NC150 | extension | Prim's on a complete graph — all O(n²) edges implicit, so Prim's without pre-generating edges is cleaner |
| 3 | [Superbull](http://www.usaco.org/index.php?page=viewproblem2&cpid=531) | USACO Old Silver | Easy | UG | extension | MST where edge weights are computed from node values (XOR or sum) — must build the edge list from scratch |
| 4 | [I Would Walk 500 Miles](http://www.usaco.org/index.php?page=viewproblem2&cpid=946) | USACO Gold | Medium | UG | extension | Large n MST with structured edge costs — Kruskal's with careful edge generation |
| 5 | [GCD and MST](https://codeforces.com/problemset/problem/1513/D) | CF 1513D | Medium | UG | extension | Not all edges present — edges exist only when GCD condition holds; construct edges cleverly before Kruskal's |
| 6 | [Portals](http://www.usaco.org/index.php?page=viewproblem2&cpid=1138) | USACO Gold | Medium | UG | **checkpoint** | Grid with portal edges — construct edge list from grid constraints then MST; requires identifying which edges to add |

**Checkpoint:** USACO Gold Portals without hints. The key step — constructing the correct edge set from the portal constraints (each room connects to the cheapest portal in its row and column) — is non-derivable from any earlier problem. Once the edge set is identified, Kruskal's is mechanical.

---

## Common mistakes

- **Disconnected graph.** After running Kruskal's, check `len(mst_edges) == n − 1`. If fewer, the graph was disconnected. Return "IMPOSSIBLE" (CSES) or `-1` (LC conventions).
- **Kruskal's — 0-indexed vs 1-indexed DSU.** CSES problems are 1-indexed; initialise `parent = list(range(n + 1))`. Off-by-one here corrupts the DSU silently.
