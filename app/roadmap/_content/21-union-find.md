# Union-Find / DSU

**Prerequisites:** Arrays & Hashing  
**Unlocks:** MST  
**Patterns introduced:** path compression + union by size  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [CSES 1676 — Road Construction](https://cses.fi/problemset/task/1676) and attempt it before reading below.

> A country has n cities and no roads. m new roads are built one at a time. After each new road, report (a) the number of connected components and (b) the size of the largest component.  
> Constraints: n, m ≤ 10⁵.

The naive solution after each road: run BFS/DFS from every node to find components.

```python
for each new road (u, v):
    add edge u-v to adjacency list
    visited = set()
    components = []
    for node in range(n):
        if node in visited: continue
        c = bfs_collect(node)            # O(n + m)
        visited |= set(c)
        components.append(len(c))
    print(len(components), max(components))
```

m roads × O(n + m) per query = O(m(n + m)) ≈ 10¹⁰ for n = m = 10⁵. TLE.

The question to carry into Step 2: *after the first road merges nodes 1 and 2, the second road between 2 and 3 should "obviously" merge node 3 into that group. What can you store per node, updated only on merges, that lets you check "are X and Y in the same group?" without re-running BFS?*

---

## Step 2 — The technique

### The disjoint-set structure

Maintain a **parent pointer** for each node. Each node points to another node in its component; following parents repeatedly reaches the component's **representative** (a node whose parent is itself).

Two operations:
- `find(x)` — walk parent pointers until reaching the root; returns the representative.
- `union(x, y)` — call `find(x)` and `find(y)`. If they differ, attach one root under the other.

Two nodes are in the same component iff their `find()` returns the same root.

### Optimisations — without them this is O(n) per call

Naive `find` can be O(n) on a degenerate tree (a chain). Two cumulative optimisations bring it to **O(α(n))** amortised per operation — effectively O(1) for any practical n.

**Path compression** — during `find(x)`, redirect every node on the path to point directly to the root.

```python
def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])      # compress
    return parent[x]
```

**Union by size** — when merging, attach the smaller tree under the larger. Keeps trees shallow.

```python
def union(x, y):
    rx, ry = find(x), find(y)
    if rx == ry: return False             # already same component
    if size[rx] < size[ry]: rx, ry = ry, rx
    parent[ry] = rx
    size[rx] += size[ry]
    return True
```

Together: every operation is O(α(n)), where α is the inverse Ackermann function (~4 for any realistic input).

### Numeric trace — CSES 1676 with n = 5

Initial: `parent = [0, 1, 2, 3, 4]`, `size = [1, 1, 1, 1, 1]`. Components = 5.

```
Add (1, 2):
  find(1)=1, find(2)=2. Distinct. union: parent[2]=1, size[1]=2.
  parent = [0, 1, 1, 3, 4]. Components = 4. Max size = 2.

Add (2, 3):
  find(2): parent[2]=1, parent[1]=1. Returns 1. (Path compression: 2 already points to 1.)
  find(3)=3. Distinct. union: parent[3]=1, size[1]=3.
  parent = [0, 1, 1, 1, 4]. Components = 3. Max size = 3.

Add (3, 4):
  find(3)=1, find(4)=4. Distinct. union: parent[4]=1, size[1]=4.
  parent = [0, 1, 1, 1, 1]. Components = 2. Max size = 4.

Add (1, 2):     (duplicate edge)
  find(1)=1, find(2)=1. Same. No-op.
  Components = 2. Max size = 4.
```

The `parent` array doubles as both the component representative and the "are they connected?" check.

### Counting components and component sizes incrementally

Maintain a `components` counter, initialised to n. Each successful `union` decrements it by 1. Max size is tracked via the `size` array — after each union, compare `size[new_root]` against a running max.

### When DSU is the right tool

Three signals:
1. The problem involves **merging groups** dynamically.
2. The questions you need to answer are about **same-group membership** or **group statistics** (size, sum, max).
3. The merges are **append-only** — DSU does not support efficient *splits*. For splits, use other structures (link-cut trees in Section 3).

If the merges happen offline (in a fixed order known in advance), you can also sort the queries and merges by some key, then sweep — this is the "offline DSU" pattern that USACO Mootube uses.

### Detecting cycles with DSU

A cycle in an undirected graph exists iff some edge connects two nodes already in the same component. As you process edges:

```python
for u, v in edges:
    if find(u) == find(v):
        return [u, v]               # this edge closes a cycle
    union(u, v)
```

This is the heart of LC 684 (Redundant Connection).

---

## Step 3 — Read

The USACO Guide's Gold DSU page is load-bearing.

1. [USACO Guide — Disjoint Set Union (Gold)](https://usaco.guide/gold/dsu) — covers Road Construction (your Step 1 problem) with full walkthrough plus the offline-merge pattern.
2. CPH Chapter 15.2 (Union-find structure), pp. 158–160 — concise statement of the structure and complexity.

---

## Step 4 — Code reference

### DSU class

```python
class DSU:
    def __init__(self, n):
        # Invariant: parent[x] == x iff x is a representative;
        # size[x] is meaningful only if x is a representative.
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])     # path compression
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False                          # already connected
        if self.size[rx] < self.size[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        self.size[rx] += self.size[ry]
        self.components -= 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)

    def component_size(self, x):
        return self.size[self.find(x)]
```

### Iterative find (avoids recursion limit on 10⁵-deep chains before first compression)

```python
def find(self, x):
    root = x
    while self.parent[root] != root:
        root = self.parent[root]
    # second pass: compress path
    while self.parent[x] != root:
        self.parent[x], x = root, self.parent[x]
    return root
```

### Cycle detection

```python
def find_redundant(edges, n):
    dsu = DSU(n + 1)                          # 1-indexed
    for u, v in edges:
        if dsu.connected(u, v):
            return [u, v]                     # this edge would create a cycle
        dsu.union(u, v)
    return []
```

### Offline DSU with sorted queries (USACO Mootube)

```python
def mootube_offline(edges, queries):
    # Process queries by decreasing k; edges by decreasing weight.
    # As k decreases, more edges become valid → union them in.
    edges.sort(key=lambda e: -e[2])
    queries_indexed = sorted(enumerate(queries), key=lambda q: -q[1][1])
    dsu = DSU(n + 1)
    answers = [0] * len(queries)
    i = 0
    for qi, (v, k) in queries_indexed:
        while i < len(edges) and edges[i][2] >= k:
            dsu.union(edges[i][0], edges[i][1])
            i += 1
        answers[qi] = dsu.component_size(v) - 1   # exclude v itself
    return answers
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Road Construction](https://cses.fi/problemset/task/1676) | CSES | Easy | UG | baseline | Incremental component tracking with size — your Step 1 problem |
| 2 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | LC 684 | Medium | NC150 | extension | Cycle detection via "same root before union" |
| 3 | [Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/) | LC 261 | Medium | NC150 | extension | Tree validation = connected + acyclic + exactly n−1 edges; combine cycle check with final component count |
| 4 | [Number of Operations to Make Network Connected](https://leetcode.com/problems/number-of-operations-to-make-network-connected/) | LC 1319 | Medium | ⭐ | extension | Count surplus edges (those within already-connected components); check if surplus ≥ components − 1 |
| 5 | [Mootube](http://www.usaco.org/index.php?page=viewproblem2&cpid=789) | USACO Gold | Easy | UG ⭐ | extension | Offline DSU — sort queries and edges by weight, sweep with unions; preview of Kruskal's-style technique used in module 23 |
| 6 | [Wormhole Sort](http://www.usaco.org/index.php?page=viewproblem2&cpid=992) | USACO Silver | Medium | UG ⭐ | **checkpoint** | Binary search on the answer (module 12) + DSU connectivity check — combine two earlier modules |

**Checkpoint:** USACO Wormhole Sort without hints. Three things must come together: (1) **recognise BS on answer** — the question "minimum wormhole width such that some valid permutation exists" is monotonic in width; (2) **feasibility check via DSU** — for a given width, union all wormholes with that width or larger and check that for every i, nodes i and `permutation[i]` end up in the same component; (3) **edge case** — the identity permutation is always feasible (every cow stays put), so the answer is `-1` only if no permutation needs wormholes at all. The combination of module 12's BS on answer with this module's DSU is the leap.

**Also doable:** [Number of Connected Components in an Undirected Graph (LC 323, NC150)](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) — simpler one-shot version of problem 1, count components after processing all edges.

---

## Common mistakes

- **Recursive `find` on Python's default recursion limit.** A long chain of unions without intervening `find` calls can produce a 10⁵-deep parent chain. The first `find` recurses that deep and crashes. Either set `sys.setrecursionlimit(300_000)` or use the iterative `find` from Step 4.
- **Forgetting that `size[x]` is only meaningful at roots.** After unions, the size of a non-root node is stale. Always call `size[find(x)]` to read a component's size, not `size[x]` directly.
- **Using DSU for splits.** DSU supports merges efficiently but not splits — once two components merge, you can't undo it cheaply. If the problem requires removing edges, process operations in reverse order (offline) so removals become additions.
- **LC 684 — multiple edges between the same pair.** The input can include `[1, 2]` twice. The first one unions; the second one detects "already connected" and is reported as redundant. This is the intended behaviour, not a bug.
