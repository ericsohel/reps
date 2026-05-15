# Advanced Graphs

**Prerequisites:** Topological Sort, Shortest Paths  
**Track:** cp  
**Patterns introduced:** SCC condensation, 2-SAT reduction, Eulerian path  
**Patterns reused:** [BFS/DFS skeleton](00-patterns.md#bfs-dfs-skeleton) (Kosaraju's two-pass DFS)

---

## Step 1 — Try this first

Open [CSES 1683 — Planets & Kingdoms](https://cses.fi/problemset/task/1683) and attempt it before reading below.

> A universe has n planets and m one-way paths. Two planets are in the same kingdom if each can reach the other. Find the number of kingdoms and assign each planet to its kingdom.

Unlike module 19 (connected components in undirected graphs), paths here are directed. Just because planet A can reach B doesn't mean B can reach A.

The question to carry into Step 2: *you run DFS from planet 1 and reach planet 5. Does that mean planet 5 can reach planet 1? What's the condition that would guarantee mutual reachability?*

---

## Step 2 — The technique

### Strongly Connected Components (SCC)

A **strongly connected component** is a maximal set of nodes where every node can reach every other. In an undirected graph every component is trivially strongly connected; in a directed graph it's a non-trivial structural property.

**Answer to Step 1.** Planet 5 can reach planet 1 only if there's a directed path from 5 back to 1. Mutual reachability ⟺ existence of a directed cycle containing both nodes. The SCC algorithm finds all such maximal groups.

### Kosaraju's algorithm — two DFS passes

**Pass 1:** DFS on the original graph; record nodes in **post-order** (node appended when DFS finishes it). This gives a topological-like ordering on the SCC condensation.

**Pass 2:** Process nodes in **reverse post-order** (last finished = first processed). For each unvisited node, DFS on the **reverse graph** (all edges flipped). All nodes reached in this DFS form one SCC.

```python
import sys
from collections import defaultdict

def kosaraju(n, edges):
    graph = defaultdict(list)
    rev   = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        rev[v].append(u)

    # Pass 1: post-order on original graph
    visited = [False] * (n + 1)
    order   = []
    def dfs1(u):
        visited[u] = True
        for v in graph[u]:
            if not visited[v]: dfs1(v)
        order.append(u)
    for u in range(1, n + 1):
        if not visited[u]: dfs1(u)

    # Pass 2: DFS on reverse graph in reverse post-order
    comp   = [0] * (n + 1)
    n_comp = 0
    visited = [False] * (n + 1)
    def dfs2(u, c):
        visited[u] = True
        comp[u] = c
        for v in rev[u]:
            if not visited[v]: dfs2(v, c)
    for u in reversed(order):
        if not visited[u]:
            n_comp += 1
            dfs2(u, n_comp)
    return n_comp, comp
```

**Numeric trace** on the graph `1→2, 2→3, 3→1, 3→4, 4→5, 5→4`:

```
Pass 1 post-order DFS from 1:
  1→2→3→1 (cycle). 3 finishes first → order=[3]
  3→4→5→4 (cycle). 5 finishes → order=[3,5], 4 finishes → order=[3,5,4]
  3 already done, 2 finishes → order=[3,5,4,2], 1 finishes → order=[3,5,4,2,1]

Pass 2 reverse post-order (1,2,4,5,3):
  Start at 1. Reverse graph from 1: only 3→1, so reach 3, from 3 reach 2.
  SCC 1 = {1, 2, 3}
  Start at 4. Reverse: 5→4, reach 5. SCC 2 = {4, 5}
```

### SCC condensation

After finding SCCs, contract each into a single node. The result is always a **DAG** (if it had a cycle, those nodes would be one SCC). This condensation enables DAG DP on the SCC structure: max collectible reward, number of paths from source to sink, etc.

### 2-SAT — SCC as a reduction

2-SAT asks: given n boolean variables and m clauses of the form `(x OR y)`, is there a satisfying assignment?

**Construction:** for each clause `(x OR y)`, add implications `¬x → y` and `¬y → x`. This gives a 2n-node implication graph. Run SCC on it.

**Result:** a satisfying assignment exists iff no variable and its negation are in the same SCC. If an assignment exists, the value of each variable is determined by the relative topological position of its SCC vs its negation's SCC.

**Numeric trace** — clauses `(x₁ ∨ x₂)` and `(¬x₁ ∨ ¬x₂)`:

```
Implications added:
  (x₁ ∨ x₂)   →   ¬x₁ → x₂   and   ¬x₂ → x₁
  (¬x₁ ∨ ¬x₂) →   x₁ → ¬x₂  and    x₂ → ¬x₁

Nodes: x₁=0, x₂=1, ¬x₁=2, ¬x₂=3
Edges: 2→1, 3→0, 0→3, 1→2

SCCs after Kosaraju's:
  Component A: {x₁=0, ¬x₂=3}
  Component B: {¬x₁=2, x₂=1}

Check each variable: x₁ in A, ¬x₁ in B → different SCCs ✓
                     x₂ in B, ¬x₂ in A → different SCCs ✓

Topological order of components: B before A (B has no incoming, A has incoming from B).
Assignment: variable = (negation's SCC comes BEFORE variable's SCC)
  x₁: ¬x₁ in B (earlier than A which contains x₁) → x₁ = True
  x₂: ¬x₂ in A (later than B which contains x₂) → x₂ = False

Verify: (True ∨ False) = T ✓   (¬True ∨ ¬False) = (F ∨ T) = T ✓
```

```python
def two_sat(n, clauses):
    # nodes: 0..n-1 = true literals, n..2n-1 = false literals
    def lit(x, neg): return x + n if neg else x
    graph = defaultdict(list)
    for u, u_neg, v, v_neg in clauses:
        # clause: (u as u_neg) OR (v as v_neg)
        graph[lit(u, not u_neg)].append(lit(v, v_neg))     # ¬u → v
        graph[lit(v, not v_neg)].append(lit(u, u_neg))     # ¬v → u
    _, comp = kosaraju(2 * n, ...)                          # run on the implication graph
    for x in range(n):
        if comp[lit(x, False)] == comp[lit(x, True)]:
            return None                                      # unsatisfiable
    return [comp[lit(x, False)] > comp[lit(x, True)] for x in range(n)]
```

### Eulerian paths and circuits

An **Eulerian circuit** visits every edge exactly once and returns to the start. An **Eulerian path** visits every edge exactly once (without needing to return).

**Existence conditions:**
- Eulerian circuit: all nodes have equal in-degree and out-degree (directed), OR all nodes have even degree (undirected).
- Eulerian path: exactly two nodes have odd degree in undirected, or exactly one node has out-degree = in-degree + 1 (start) and one has in-degree = out-degree + 1 (end) in directed.

**Hierholzer's algorithm:** DFS that backtracks when stuck, building the path in reverse.

**Numeric trace** on directed edges `0→1, 1→2, 2→0, 0→2` (Eulerian circuit on 4 edges):

```
Start at 0 (degree 2 in, 2 out — could start anywhere; pick 0).
stack=[0], path=[]
  graph[0]=[1,2]. pop 1.  stack=[0,1]
    graph[1]=[2]. pop 2.  stack=[0,1,2]
      graph[2]=[0]. pop 0. stack=[0,1,2,0]
        graph[0]=[2]. pop 2. stack=[0,1,2,0,2]
          graph[2]=[]. dead end. append 2 to path; pop stack. path=[2]
        graph[0]=[]. append 0. path=[2,0]
      graph[2]=[] (already used). append 2. path=[2,0,2]
    graph[1]=[]. append 1. path=[2,0,2,1]
  graph[0]=[]. append 0. path=[2,0,2,1,0]

Reverse path: [0,1,2,0,2] — uses every edge exactly once ✓
```

```python
from collections import defaultdict

def eulerian_path(n, edges):
    graph = defaultdict(list)
    in_deg = [0] * n
    out_deg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        out_deg[u] += 1
        in_deg[v] += 1
    # Find start: prefer node with out-deg = in-deg + 1, else any node with edges
    start = next((u for u in range(n) if out_deg[u] - in_deg[u] == 1), 
                 next(u for u in range(n) if out_deg[u] > 0))
    path = []
    stack = [start]
    while stack:
        u = stack[-1]
        if graph[u]:
            stack.append(graph[u].pop())
        else:
            path.append(stack.pop())
    return path[::-1]                    # reverse to get start→end order
```

---

## Step 3 — Read

1. [USACO Guide — SCC (Advanced)](https://usaco.guide/adv/SCC) — covers Kosaraju's, Tarjan's, condensation, and 2-SAT. Load-bearing for SCC and 2-SAT problems.
2. CPH Chapter 17 (Strong Connectivity), pp. 167–175 — covers Kosaraju's and Eulerian paths. Good complement.

For bridges and articulation points (not covered in this module's problems but architecturally adjacent): CPH Chapter 17.3, pp. 174–175.

---

## Step 4 — Code reference

### Kosaraju's SCC (iterative — avoids recursion limit)

```python
from collections import defaultdict

def kosaraju(n, adj):
    # adj[u] = list of neighbours in original graph; radj = reversed graph
    radj = defaultdict(list)
    for u in range(n):
        for v in adj[u]:
            radj[v].append(u)

    # Pass 1: iterative post-order on original graph
    visited = [False] * n
    order   = []
    for start in range(n):
        if visited[start]: continue
        stack = [(start, False)]
        while stack:
            u, returning = stack.pop()
            if returning: order.append(u); continue
            if visited[u]: continue
            visited[u] = True
            stack.append((u, True))
            for v in adj[u]:
                if not visited[v]: stack.append((v, False))

    # Pass 2: assign SCCs via reverse graph in reverse post-order
    comp    = [-1] * n
    n_comp  = 0
    visited = [False] * n
    for u in reversed(order):
        if visited[u]: continue
        stack = [u]
        visited[u] = True
        while stack:
            node = stack.pop()
            comp[node] = n_comp
            for v in radj[node]:
                if not visited[v]:
                    visited[v] = True
                    stack.append(v)
        n_comp += 1
    return n_comp, comp
```

### Hierholzer's Eulerian path (directed)

```python
from collections import defaultdict

def eulerian_path(n_nodes, edges):
    # Invariant: graph[u] shrinks as edges are used; path built by backtracking
    graph  = defaultdict(list)
    in_d   = [0] * n_nodes
    out_d  = [0] * n_nodes
    for u, v in edges:
        graph[u].append(v)
        out_d[u] += 1
        in_d[v]  += 1
    # Start at node with out-in == 1; if none, any node with edges
    start = next((i for i in range(n_nodes) if out_d[i] - in_d[i] == 1),
                 next(i for i in range(n_nodes) if out_d[i] > 0, None))
    if start is None: return []
    path, stack = [], [start]
    while stack:
        while graph[stack[-1]]:
            stack.append(graph[stack[-1]].pop())
        path.append(stack.pop())
    path.reverse()
    return path if len(path) == len(edges) + 1 else []   # all edges used?
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Planets & Kingdoms](https://cses.fi/problemset/task/1683) | CSES | Easy | UG | baseline | Kosaraju's SCC — your Step 1 problem |
| 2 | [Coin Collector](https://cses.fi/problemset/task/1686) | CSES | Easy | UG | extension | SCC condensation + DAG DP — collect max coins; each SCC contributes its total coin sum |
| 3 | [Grass Cownoisseur](http://www.usaco.org/index.php?page=viewproblem2&cpid=516) | USACO Old Gold | Medium | UG | extension | SCC condensation + greedy on DAG — contest problem where the algorithm isn't named |
| 4 | [Giant Pizza](https://cses.fi/problemset/task/1684) | CSES | Medium | UG | extension | 2-SAT — implication graph, SCC, variable assignment from topological position |
| 5 | [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/) | LC 332 | Hard | NC150 | extension | Eulerian path via Hierholzer's — the itinerary visits every flight once |
| 6 | [Proving Equivalences](https://open.kattis.com/problems/equivalences) | Kattis | Hard | UG | **checkpoint** | SCC application with counting — min edges to add to make all nodes mutually reachable; `max(sources, sinks)` in condensation where `sources = SCCs with in-degree 0`, `sinks = SCCs with out-degree 0` |

**Checkpoint:** Kattis Proving Equivalences without hints. The condensation DAG has some SCCs with no incoming edges (sources) and some with no outgoing (sinks). To make the whole graph strongly connected, you need `max(#sources, #sinks)` new edges. Proving this bound is the leap — not the SCC algorithm itself.

---

## Common mistakes

- **Kosaraju's pass-2 order.** Pass 2 must process nodes in *reverse* post-order from pass 1, not forward. The last node to finish in DFS pass 1 is the source of the condensation; reversing gives sources first, which are correctly processed before sinks in pass 2.
- **Iterative DFS for SCC.** Graphs with 10⁵ nodes hit Python's recursion limit. Use iterative DFS with the `(node, returning)` pattern — push `(u, True)` before exploring u's children so `order.append(u)` fires when the DFS unwinds from u, replicating post-order behaviour.
- **2-SAT literal indexing.** Standard convention: variable x = node x, negation ¬x = node x + n. Off-by-one or wrong mapping of `¬x → y` implications breaks the construction silently — wrong assignments look like correct type-checks.
- **Eulerian path exists check.** Hierholzer's always produces *some* path; it may not use all edges if the graph isn't Eulerian. Always verify `len(path) == len(edges) + 1` after construction.
- **LC 332 tie-breaking.** Reconstruct Itinerary requires lexicographically smallest path. Sort each airport's outgoing flights alphabetically and Hierholzer's naturally produces the smallest path via greedy pop-from-sorted-list.
