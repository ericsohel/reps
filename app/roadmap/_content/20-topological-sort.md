# Topological Sort

**Prerequisites:** Graph Traversal  
**Unlocks:** Shortest Paths, Advanced Graphs  
**Patterns introduced:** in-degree wave (Kahn's), DFS post-order ordering — both module-specific specialisations  
**Patterns reused:** [BFS/DFS skeleton](00-patterns.md#bfs-dfs-skeleton)

---

## Step 1 — Try this first

Open [LC 207 — Course Schedule](https://leetcode.com/problems/course-schedule/) and attempt it before reading below.

> You have n courses and a list of prerequisite pairs `(a, b)` meaning "to take a, you must first take b". Return whether you can complete all courses.

The brute force tries every permutation of n courses and checks if each respects all prerequisites — O(n! × m) where m is the number of prerequisite pairs. TLE for n = 10.

The question to carry into Step 2: *which course can you ALWAYS take first, regardless of when others are taken? And once that course is taken, what changes about the remaining problem?*

---

## Step 2 — The technique

### Kahn's algorithm — the in-degree wave

**Answer to Step 1.** A course you can take first is one with **no incoming prerequisite edges** — its in-degree is 0. Once taken, it can be removed from the graph, which decreases the in-degree of every course that depended on it. If a new course's in-degree drops to 0, it becomes takeable.

Algorithm:
1. Compute in-degree of every node.
2. Push every in-degree-0 node onto a queue.
3. Pop, record the node, decrement in-degree of all its neighbours; push any whose in-degree just hit 0.
4. If you process every node, the graph is a DAG; the order of recording is a valid topological order. If some node never reaches in-degree 0, there's a cycle.

```python
from collections import deque

def kahn(n, edges):
    # edges = list of (u, v) meaning u must come before v
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else None    # None signals a cycle
```

### Numeric trace — LC 207 with 4 courses

Prerequisites: `[(1, 0), (2, 0), (3, 1), (3, 2)]` — meaning 0 before 1 and 2; 1 and 2 before 3.

```
graph: 0 → [1, 2],  1 → [3],  2 → [3],  3 → []
indeg: [0, 1, 1, 2]

Queue starts: [0]                    (only node 0 has indeg 0)
Pop 0 → order = [0].  indeg becomes [0, 0, 0, 2].  Queue: [1, 2]
Pop 1 → order = [0, 1].  indeg becomes [0, 0, 0, 1].  Queue: [2]
Pop 2 → order = [0, 1, 2].  indeg becomes [0, 0, 0, 0].  Queue: [3]
Pop 3 → order = [0, 1, 2, 3].

|order| == 4 == n, so a valid order exists. Return True.
```

If you added the pair `(0, 3)` (so 0 also depends on 3 — a cycle), the initial queue would be empty (no in-degree 0 node), so `order` ends empty. `len(order) != n` → cycle.

### DFS-based topological sort

The alternative: do post-order DFS, then reverse. The intuition is that a node is "finished" only after all its descendants are finished, so post-order naturally produces dependents before dependencies — reverse to get dependencies-first.

```python
WHITE, GRAY, BLACK = 0, 1, 2
def topo_dfs(graph, n):
    color = [WHITE] * n
    order = []
    has_cycle = False
    def dfs(u):
        nonlocal has_cycle
        color[u] = GRAY
        for v in graph[u]:
            if color[v] == GRAY:        # back-edge — cycle
                has_cycle = True
            elif color[v] == WHITE:
                dfs(v)
        color[u] = BLACK
        order.append(u)
    for i in range(n):
        if color[i] == WHITE:
            dfs(i)
    return None if has_cycle else order[::-1]
```

The three-colour scheme (white = unvisited, grey = on current DFS path, black = finished) detects cycles via grey-to-grey edges. A grey-to-grey edge means the DFS is currently inside a path that loops back to itself — a cycle.

**Numeric trace** on a cycle `0 → 1 → 2 → 0`:

```
dfs(0):    color[0] = GRAY
  dfs(1):  color[1] = GRAY
    dfs(2):  color[2] = GRAY
      neighbour 0 is GRAY → CYCLE FOUND
```

And on a DAG `0 → 1, 0 → 2, 1 → 2`:

```
dfs(0):    color[0] = GRAY
  dfs(1):  color[1] = GRAY
    dfs(2):  color[2] = GRAY. No outgoing. color[2] = BLACK. append 2.
  color[1] = BLACK. append 1.
  neighbour 2 is BLACK — skip (already finished).
color[0] = BLACK. append 0.

order built: [2, 1, 0]. Reverse to [0, 1, 2] — a valid topological order.
```

The reverse-at-the-end matters: post-order DFS finishes leaves first, but topological order wants roots first.

**Kahn's vs DFS:** prefer Kahn's. It's iterative (no recursion limit), the cycle detection falls out naturally (count check), and the in-degree representation is reused in module 22 (Shortest Paths) and module 23 (MST).

### When the graph is built implicitly

LC 269 Alien Dictionary — the input is a list of words, and the alphabet's order must be inferred. The graph is built by comparing **adjacent** word pairs character by character; the first differing pair `(c1, c2)` adds the edge `c1 → c2`.

Edge cases:
- Two words where one is a prefix of the other AND the shorter one comes second (e.g., `"abc"` before `"ab"`) — invalid input, no valid order exists.
- Duplicate edges — store edges in a `set` per node to avoid double-counting in-degrees.

The leap in the checkpoint is recognising that the topological sort is over the *26 lowercase letters*, not over the words themselves.

### Counting paths in a DAG (preview of module 25)

In a DAG processed in topological order, you can compute `dp[v] = sum of dp[u] for each edge u → v`. This is the simplest form of DAG DP — count paths, find longest path, etc. We'll cover it formally in module 25, but topo order is the prerequisite.

---

## Step 3 — Read

The USACO Guide's Gold TopoSort page is load-bearing.

1. [USACO Guide — Topological Sort (Gold)](https://usaco.guide/gold/toposort) — covers Kahn's, DFS variant, and CSES sample problems. Read fully.
2. CPH Chapter 16 (Directed graphs), pp. 161–166 — topological sort + DAG basics. Concise.

---

## Step 4 — Code reference

### Kahn's algorithm — output order, detect cycle

```python
from collections import deque

def topological_sort(n, edges):
    # Invariant: every node in the queue has all its prerequisites already in `order`
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else None      # None on cycle
```

### Directed cycle detection (output the cycle)

```python
def find_cycle(n, graph):
    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * n
    parent = [-1] * n
    cycle_start = cycle_end = -1
    def dfs(u):
        nonlocal cycle_start, cycle_end
        color[u] = GRAY
        for v in graph[u]:
            if color[v] == GRAY:
                cycle_end = u
                cycle_start = v
                return True
            if color[v] == WHITE:
                parent[v] = u
                if dfs(v): return True
        color[u] = BLACK
        return False
    for s in range(n):
        if color[s] == WHITE and dfs(s):
            cycle = [cycle_start]
            v = cycle_end
            while v != cycle_start:
                cycle.append(v)
                v = parent[v]
            cycle.append(cycle_start)
            return cycle[::-1]
    return None
```

### Alien Dictionary — build then topo-sort

```python
from collections import defaultdict, deque

def alien_order(words):
    graph = defaultdict(set)
    indeg = {c: 0 for w in words for c in w}
    for w1, w2 in zip(words, words[1:]):
        for c1, c2 in zip(w1, w2):
            if c1 != c2:
                if c2 not in graph[c1]:
                    graph[c1].add(c2)
                    indeg[c2] += 1
                break
        else:
            if len(w1) > len(w2):        # prefix conflict — w2 is prefix of w1
                return ""
    q = deque(c for c in indeg if indeg[c] == 0)
    order = []
    while q:
        c = q.popleft()
        order.append(c)
        for nxt in graph[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return "".join(order) if len(order) == len(indeg) else ""
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | LC 207 | Medium | NC150 | baseline | Kahn's algorithm — your Step 1 problem; check `len(order) == n` for cycle |
| 2 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | LC 210 | Medium | NC150 | extension | Same algorithm, return the order itself instead of a boolean |
| 3 | [Round Trip II](https://cses.fi/problemset/task/1678) | CSES | Easy | UG | extension | Directed cycle detection — print the cycle's nodes, not just a boolean; DFS with three colours |
| 4 | [Timeline](http://www.usaco.org/index.php?page=viewproblem2&cpid=1017) | USACO Gold | Easy | UG | extension | Longest distance in a DAG — Kahn's order + dp relaxation along edges (max aggregation); preview of module 25 DAG DP |
| 5 | [Game Routes](https://cses.fi/problemset/task/1681) | CSES | Easy | UG ⭐ | extension | Same DAG DP scaffold as problem 4, but **sum** aggregation — count paths from 1 to n; shows the aggregation operator is the only thing that changes |
| 6 | [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | LC 269 | Hard | NC150 | **checkpoint** | Build the graph from word pairs (compare letter-by-letter, first difference is the edge), then topo-sort the 26 letters; handle the prefix-conflict edge case |

**Checkpoint:** LC 269 without hints. Three independent skills must combine: (1) **graph construction from indirect data** — compare consecutive words to extract edges; (2) **prefix-conflict detection** — if `w_i` is longer than `w_{i+1}` and `w_{i+1}` is a prefix of `w_i`, no valid order exists; (3) **topo-sort with possibly disconnected alphabet** — letters never compared have in-degree 0 from the start and can go anywhere. The standard Kahn's loop handles all this if the graph is built correctly.

---

## Common mistakes

- **Direction of edges.** "a depends on b" means **b must come before a**, so the edge is `b → a` (prerequisite points to dependent). LC 207's input `[[a, b]]` says "to take a, take b first", which is the edge `b → a`. Getting this backward gives a topologically-reverse order.
- **Forgetting the cycle check.** Always compare `len(order) == n` at the end. If not equal, some node never had in-degree 0 — there's a cycle. Without this check, a cyclic input silently returns a partial order.
- **Duplicate edges inflating in-degree.** When the same prerequisite is listed twice, naively incrementing in-degree double-counts. Use a `set` of edges or check before incrementing.
- **LC 269 prefix conflict.** `["abc", "ab"]` is invalid — `ab` is a prefix of `abc` and comes after, which contradicts dictionary order. Detect this with the `for/else` pattern: the `else` branch fires when the inner loop didn't `break`, meaning the words shared a common prefix.
- **Iterative DFS for the colour-based variant.** The 3-colour DFS is naturally recursive. For graphs with up to 10⁵ nodes, recursion depth can exceed Python's limit. Convert to iterative or use Kahn's, which is iterative by construction.
