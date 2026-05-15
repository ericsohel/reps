# Graph Traversal

**Prerequisites:** Trees  
**Unlocks:** Topological Sort, Union-Find / DSU, Shortest Paths  
**Patterns introduced:** [BFS/DFS skeleton](00-patterns.md#bfs-dfs-skeleton) (modules 20, 22 reuse heavily)  
**Patterns reused:** [state down vs return up (tree DFS)](00-patterns.md#state-down-vs-return-up-tree-dfs) — extended to general graphs with visited tracking

---

## Step 1 — Try this first

Open [LC 200 — Number of Islands](https://leetcode.com/problems/number-of-islands/) and attempt it before reading below.

> Given a 2D grid of `'1'`s (land) and `'0'`s (water), return the number of distinct islands. An island is a maximally connected group of `'1'`s sharing a 4-directional edge.

You'll write some kind of nested loop scanning every cell. The challenge isn't the scan — it's the **marking**: how do you ensure each island is counted exactly once?

The question to carry into Step 2: *after marking `(r, c)` as seen, which other cells immediately become candidates to mark? And once you mark each of those, what does the same question become — looking out from them?*

---

## Step 2 — The technique

### BFS and DFS — two traversal skeletons

Both visit every node reachable from a start, exactly once. They differ in *order*:

- **DFS** goes deep first — recurse (or explicit stack) into a neighbour, finish that subgraph, then back up. Easiest as recursion when the graph is small enough to fit on the call stack.
- **BFS** goes wide first — queue, pop, enqueue unseen neighbours. Natural for "shortest path in unweighted graph" (each pop is one step further from the source).

```python
# DFS (recursive)
visited = set()
def dfs(u):
    visited.add(u)
    for v in graph[u]:
        if v not in visited:
            dfs(v)

# BFS (iterative with queue)
from collections import deque
visited = {start}
q = deque([start])
while q:
    u = q.popleft()
    for v in graph[u]:
        if v not in visited:
            visited.add(v)
            q.append(v)
```

**Mark on push, not on pop** for BFS — otherwise the same node can be queued multiple times. This is the most common BFS bug.

### When to use which

| Question | Use |
|---|---|
| Reachability ("can A reach B?") | Either; DFS shorter to write |
| Count connected components | Either; DFS recursion is cleanest |
| Shortest path in unweighted graph | BFS — distance = pop generation |
| Detect a cycle | DFS with 3-colour states (module 20 specialises) |
| Bipartite check (2-colour) | Either; BFS with colour alternation is natural |

### Grids as implicit graphs

A 2D grid is a graph where each cell has up to four neighbours. The "edges" aren't stored — they're computed on the fly with offset arrays.

```python
DR, DC = (-1, 1, 0, 0), (0, 0, -1, 1)
for dr, dc in zip(DR, DC):
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == '1' and (nr, nc) not in visited:
        dfs(nr, nc)
```

For LC 200, the "graph" has `rows × cols` nodes; total work is O(rows × cols).

### Numeric trace — LC 200 on a 3×4 grid

```
Grid:                   After scanning (0,0):
1 1 0 0                 # # 0 0     count = 1, the first island flooded
1 0 0 1                 # 0 0 ?
0 0 1 1                 0 0 ? ?

Scanner reaches (1, 3) — value '1', not visited.
Flood: visits (1,3), (2,3), (2,2). All become '#'.   count = 2
Final scan finds no more '1's. Return 2.
```

### Multi-source BFS — distance from a set of starts

For "minimum time until every cell is rotten" (LC 994), seed the BFS queue with **all** initial rotten oranges at distance 0, then BFS as usual. The wavefront expands from all sources simultaneously. The answer is the maximum distance achieved (or `-1` if any cell never reaches rotten).

This is one of the highest-leverage patterns in this module. Single-source BFS works for one-source-to-all-distances. Multi-source BFS works for set-to-each-cell-distance with the same code.

**Numeric trace** with `2` = rotten, `1` = fresh, `0` = empty:

```
Grid:        2 1 1
             1 1 0
             0 1 1

Seed:  q = [(0,0)],  dist[(0,0)] = 0.

Wave 1 (dist 1):
  pop (0,0). Neighbours: (0,1) fresh, (1,0) fresh. Mark both 1. q = [(0,1),(1,0)].
Wave 2 (dist 2):
  pop (0,1). Mark (0,2)=2, (1,1)=2. q = [(1,0),(0,2),(1,1)].
  pop (1,0). No new (its fresh neighbours are already in q).
Wave 3 (dist 3):
  pop (0,2). No new.
  pop (1,1). Mark (2,1)=3. q = [(2,1)].
Wave 4 (dist 4):
  pop (2,1). Mark (2,2)=4. q = [(2,2)].
Wave 5: pop (2,2). Done. q empty.

Max distance reached among originally-fresh cells = 4. Answer: 4 minutes.
```

The "wave" structure is what makes BFS levels equal to graph distances — every cell at distance d gets enqueued only after every cell at distance d − 1.

### Bipartite — 2-colouring via traversal

A graph is **bipartite** iff it has no odd-length cycle iff you can 2-colour it so no edge connects same-coloured nodes.

Algorithm: BFS/DFS from each unvisited node, alternating colours. If you ever reach a neighbour already coloured the *same* as the current node, the graph is not bipartite.

```python
color = {}                          # 0 or 1
def bfs(start):
    color[start] = 0
    q = deque([start])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if v not in color:
                color[v] = 1 - color[u]
                q.append(v)
            elif color[v] == color[u]:
                return False        # same colour on both ends — odd cycle
    return True
```

**Numeric trace** on a 4-cycle `1—2—3—4—1`:

```
color[1] = 0. q = [1].
Pop 1. Neighbours 2 (uncoloured → 1), 4 (uncoloured → 1).  q = [2, 4].
Pop 2. Neighbour 1 (colour 0, differs — ok). Neighbour 3 (uncoloured → 0). q = [4, 3].
Pop 4. Neighbour 1 (0, ok). Neighbour 3 (colour 0, colour[4]=1 — differs, ok). q = [3].
Pop 3. Neighbour 2 (1, differs — ok). Neighbour 4 (1, differs — ok).
Done. Bipartite ✓ (it has an even cycle).
```

And on a 3-cycle `1—2—3—1` (an odd cycle, must not be bipartite):

```
color[1] = 0. q = [1].
Pop 1. Neighbours 2 (uncoloured → 1), 3 (uncoloured → 1). q = [2, 3].
Pop 2. Neighbour 1 (0, differs — ok). Neighbour 3 (colour 1, same as colour[2]=1) — RETURN False.
```

The odd cycle forces same-colour neighbours when the BFS frontier wraps back.

### Implicit graphs

Sometimes the "graph" isn't given — you construct neighbours from a rule. LC 127 Word Ladder: words are nodes, edge exists between two words differing in exactly one letter. There can be up to 5,000 words, so enumerating all pairs is O(W² × L) = ~10⁹. Better: for each word, generate the 26L "one-letter-different" variants and look each up in a `set`. O(W × L × 26).

The leap in implicit graphs is **modelling**: recognising that "shortest sequence of words" is a shortest-path question on an implicit graph → BFS.

### Python recursion limit reminder

Grids of size 10³ × 10³ have one million cells. A recursive DFS can hit Python's default 1,000-frame limit even on small grids if the connected component is path-shaped. Always:

```python
import sys
sys.setrecursionlimit(300_000)
```

Or convert to iterative DFS with an explicit stack. For graphs with up to 10⁵ nodes, iterative is more reliable.

---

## Step 3 — Read

The USACO Guide splits graph traversal across Silver "Graph Traversal" and Silver "Flood Fill" pages — together they cover the load-bearing material.

1. [USACO Guide — Graph Traversal (Silver)](https://usaco.guide/silver/graph-traversal) — covers component counting and bipartite checking with CSES samples. Read fully.
2. [USACO Guide — Flood Fill (Silver)](https://usaco.guide/silver/flood-fill) — same techniques applied to 2D grids. Skim if comfortable with grids; read fully if not.
3. CPH Chapter 12 (Graph algorithms), pp. 119–127 — DFS, BFS, applications. Language-agnostic complement.

---

## Step 4 — Code reference

### Recursive DFS (adjacency list)

```python
import sys
sys.setrecursionlimit(300_000)

def dfs(u, graph, visited):
    # Invariant: visited contains every node whose entire subtree has been processed
    visited.add(u)
    for v in graph[u]:
        if v not in visited:
            dfs(v, graph, visited)
```

### Iterative DFS

```python
def dfs(start, graph, visited):
    stack = [start]
    visited.add(start)
    while stack:
        u = stack.pop()
        for v in graph[u]:
            if v not in visited:
                visited.add(v)
                stack.append(v)
```

### BFS — shortest distance (unweighted)

```python
from collections import deque

def bfs_dist(start, graph):
    dist = {start: 0}                   # mark-on-push
    q = deque([start])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
```

### Multi-source BFS

```python
def multi_source_bfs(sources, graph):
    # Invariant: dist[u] = min distance from ANY source to u, computed in waves
    dist = {s: 0 for s in sources}
    q = deque(sources)
    while q:
        u = q.popleft()
        for v in graph[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
```

### Grid DFS

```python
def flood_fill(grid, r, c, target):
    rows, cols = len(grid), len(grid[0])
    DR, DC = (-1, 1, 0, 0), (0, 0, -1, 1)
    def dfs(r, c):
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != target:
            return
        grid[r][c] = '#'                # mark visited in-place
        for dr, dc in zip(DR, DC):
            dfs(r + dr, c + dc)
    dfs(r, c)
```

### Bipartite check

```python
from collections import deque

def is_bipartite(graph, n):
    color = [-1] * n
    for start in range(n):
        if color[start] != -1: continue
        color[start] = 0
        q = deque([start])
        while q:
            u = q.popleft()
            for v in graph[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False
    return True
```

### Word Ladder — implicit graph + BFS

```python
from collections import deque

def ladder_length(begin, end, word_list):
    word_set = set(word_list)
    if end not in word_set: return 0
    q = deque([(begin, 1)])
    seen = {begin}
    while q:
        word, d = q.popleft()
        if word == end: return d
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                new = word[:i] + c + word[i+1:]
                if new in word_set and new not in seen:
                    seen.add(new)
                    q.append((new, d + 1))
    return 0
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | LC 200 | Medium | NC150 | baseline | Grid DFS for connected components — your Step 1 problem |
| 2 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | LC 994 | Medium | NC150 | baseline | Multi-source BFS — distance from a set, computed in one pass |
| 3 | [Building Roads](https://cses.fi/problemset/task/1666) | CSES | Easy | UG | baseline | Adjacency-list DFS — count components, then `k − 1` edges to connect them |
| 4 | [Clone Graph](https://leetcode.com/problems/clone-graph/) | LC 133 | Medium | NC150 | extension | DFS with `{old → new}` visited dict — same node returned consistently across recursive calls |
| 5 | [Building Teams](https://cses.fi/problemset/task/1668) | CSES | Easy | UG | baseline | Bipartite 2-colouring via BFS — same-coloured neighbour means odd cycle |
| 6 | [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) | LC 417 | Medium | NC150 | extension | Reverse the direction — BFS *out* from both oceans' boundaries, intersect the reachable sets |
| 7 | [Surrounded Regions](https://leetcode.com/problems/surrounded-regions/) | LC 130 | Medium | NC150 | extension | Anchor DFS from border-touching `'O'`s, mark survivors, flip the rest |
| 8 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | LC 127 | Hard | NC150 | **checkpoint** | Implicit graph — words are nodes, BFS finds shortest transformation |

**Checkpoint:** LC 127 without hints. The leap is recognising that "minimum word transformations" is a shortest-path question on an implicit graph and that enumerating neighbours by generating all 26-letter swaps (rather than comparing word pairs) makes the construction `O(W × L × 26)` instead of `O(W² × L)`. None of the earlier problems present the graph this implicitly.

**Also doable:** [Max Area of Island (LC 695, NC150)](https://leetcode.com/problems/max-area-of-island/) — same grid DFS as problem 1, return the running component size.

---

## Common mistakes

- **Recursion limit on long path components.** A grid component shaped like a path is `n²` deep. Python's 1000-frame default crashes well before that. Set `sys.setrecursionlimit(300_000)` or use iterative DFS.
- **Single DFS misses disconnected components.** Whether for component counting, bipartite checking, or anything else: a disconnected graph needs an outer loop `for start in nodes: if start not in visited: dfs(start)`. One DFS from any node only covers that node's connected component.
- **Direction offsets ordering.** `(-1, 1, 0, 0), (0, 0, -1, 1)` gives up/down/left/right. If you write the offsets inconsistently between problems, mirrored bugs (off by one on the wrong axis) creep in.
- **Mutating the grid as the visited marker.** Using `grid[r][c] = '#'` works but destroys the input. Acceptable when the grader doesn't care; if you need the grid intact for later, use a separate `visited` set.
