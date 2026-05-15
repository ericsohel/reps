# Trees

**Prerequisites:** Recursion & Backtracking  
**Unlocks:** Tries, Heap / Priority Queue, Graph Traversal, DP on Trees  
**Patterns introduced:** [state down vs return up](00-patterns.md#state-down-vs-return-up-tree-dfs)  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [LC 543 — Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) and attempt it before reading below.

> Given the root of a binary tree, return the length of the longest path between any two nodes (counted in edges). The path does not need to pass through the root.  
> Constraints: n ≤ 10⁴.

The obvious solution: for each node, the diameter through it is `height(left) + height(right)`. Take the max across all nodes.

```python
def diameterOfBinaryTree(root):
    def height(node):
        if not node: return 0
        return 1 + max(height(node.left), height(node.right))

    if not root: return 0
    through_root = height(root.left) + height(root.right)
    left_subtree = diameterOfBinaryTree(root.left)
    right_subtree = diameterOfBinaryTree(root.right)
    return max(through_root, left_subtree, right_subtree)
```

Correct but O(n²) — `height` is recomputed on every subtree.

The question to carry into Step 2: *every recursive call to `height` already walks the entire subtree. While that walk happens, can you also compute the diameter passing through each node — without a separate pass?*

---

## Step 2 — The technique

### Post-order DFS — return up, update global as side effect

When a node's answer depends on its subtrees, process the subtrees first (post-order), use their results, return one value upward, and optionally record another value globally.

**Answer to Step 1:** return the *height* upward, and update a *global maximum diameter* as a side effect at each node.

```python
def diameterOfBinaryTree(root):
    ans = 0
    def dfs(node):
        nonlocal ans
        if not node: return 0
        left_h = dfs(node.left)
        right_h = dfs(node.right)
        ans = max(ans, left_h + right_h)        # diameter through this node
        return 1 + max(left_h, right_h)         # height of this subtree
    dfs(root)
    return ans
```

One pass, O(n). **The value returned upward is the single-arm height. The value recorded globally is the full path through this node.** Confusing these is the most common bug in this pattern.

This appears in module 14's checkpoint (LC 124 Max Path Sum), where the distinction is the entire problem.

### State down — pass info from parent to child

When a node needs information from its *ancestors* (not subtrees), pass it as a parameter. Examples: Count Good Nodes (pass `max_seen` down), Validate BST (pass `(lo, hi)` range down — see [atlas](00-patterns.md#state-down-vs-return-up-tree-dfs)).

```python
def dfs(node, state_from_parent):
    if not node: return base
    left  = dfs(node.left,  update(state_from_parent, node))
    right = dfs(node.right, update(state_from_parent, node))
    return combine(left, right)
```

### Level-order BFS

```python
from collections import deque

def level_order(root):
    if not root: return []
    queue = deque([root])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):           # SNAPSHOT this level's size
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result
```

The `for _ in range(len(queue))` snapshot is load-bearing — it freezes the level's size before children of this level are enqueued.

### BSTs — in-order is sorted

In a valid BST, **in-order traversal produces a sorted sequence**. This is the single load-bearing fact about BSTs:

- **Kth smallest:** do in-order, stop at the k-th yield.
- **Validate:** in-order values must be strictly increasing (equivalently, pass `(lo, hi)` ranges down recursively).
- **LCA:** the LCA of `p` and `q` is the first node `n` with `min(p, q) ≤ n.val ≤ max(p, q)`. Walk down: if both are smaller, go left; both larger, go right; otherwise found.

### General trees — adjacency list with parent guard

Competitive-programming trees use adjacency lists: `adj[u] = [neighbours of u]`. Since there are no explicit parent pointers, DFS must avoid revisiting the parent:

```python
def dfs(u, parent):
    for v in adj[u]:
        if v == parent: continue            # don't walk back
        dfs(v, u)
```

### Tree diameter on an unrooted tree — two BFS passes

For an unrooted tree, the diameter is found by:

1. BFS from any node → the farthest node `u` is one endpoint of the diameter.
2. BFS from `u` → the farthest node from `u` is the other endpoint.
3. Distance `u` → `(found node)` is the diameter.

**Why this works** (sketch): if `u` weren't an endpoint of the diameter, then for any actual diameter endpoint pair `(a, b)`, the BFS from `u` to its farthest node would still terminate at one of `a` or `b` — `u`'s farthest point is always a diameter endpoint. Then the second BFS finds the other endpoint.

### Numeric trace — Diameter post-order

```
Tree:        1
            / \
           2   3
          / \
         4   5

dfs(4): leaves return 0. left_h=right_h=0. ans = max(0, 0+0) = 0. return 1.
dfs(5): same. return 1.
dfs(2): left_h=1, right_h=1. ans = max(0, 1+1) = 2. return 1+max(1,1) = 2.
dfs(3): return 1.
dfs(1): left_h=2 (from dfs(2)), right_h=1 (from dfs(3)).
        ans = max(2, 2+1) = 3. return 1+max(2,1) = 3.

Result: ans = 3 (path 4 → 2 → 5 → ... wait, 4→2→1→3 has length 3. ✓)
```

---

## Step 3 — Read

1. [USACO Guide — Introduction to Trees (Silver)](https://usaco.guide/silver/intro-tree) — covers general tree DFS with the CSES Subordinates and Tree Diameter samples. Load-bearing for problems 1 and 9.
2. CPH Chapter 11, pp. 105–108 — trees as a special case of graphs; concise treatment of DFS and tree diameter.

---

## Step 4 — Code reference

### Post-order with global update

```python
ans = 0

def dfs(node):
    global ans
    if not node: return 0
    left = dfs(node.left)
    right = dfs(node.right)
    ans = max(ans, left + right)        # update through-this-node value
    return 1 + max(left, right)         # return single-arm to parent
```

### Pass state down

```python
def dfs(node, max_so_far):
    if not node: return 0
    count = 1 if node.val >= max_so_far else 0
    new_max = max(max_so_far, node.val)
    return count + dfs(node.left, new_max) + dfs(node.right, new_max)
```

### Level-order BFS

```python
from collections import deque

def bfs(root):
    if not root: return
    queue = deque([root])
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            # process node
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
```

### BST in-order (iterative — short-circuits cleanly)

```python
def inorder(root):
    # Invariant: stack holds the chain of left-ancestors of `curr` not yet visited
    stack, result = [], []
    curr = root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        result.append(curr.val)
        curr = curr.right
    return result
```

### Validate BST (range)

```python
def is_valid(node, lo=float('-inf'), hi=float('inf')):
    if not node: return True
    if not (lo < node.val < hi): return False
    return (is_valid(node.left, lo, node.val) and
            is_valid(node.right, node.val, hi))
```

### General tree DFS (with recursion limit)

```python
import sys
sys.setrecursionlimit(300_000)

def dfs(u, parent, adj, subtree_size):
    subtree_size[u] = 1
    for v in adj[u]:
        if v == parent: continue
        dfs(v, u, adj, subtree_size)
        subtree_size[u] += subtree_size[v]
```

### Tree diameter on an unrooted tree (two BFS)

```python
from collections import deque

def find_farthest(start, adj, n):
    dist = [-1] * (n + 1)
    dist[start] = 0
    queue = deque([start])
    farthest = start
    while queue:
        u = queue.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                if dist[v] > dist[farthest]:
                    farthest = v
                queue.append(v)
    return farthest, dist[farthest]

u, _ = find_farthest(1, adj, n)
v, diameter = find_farthest(u, adj, n)
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Subordinates](https://cses.fi/problemset/task/1674) | CSES | Easy | UG | baseline | General tree DFS — adjacency list, parent guard, return subtree size |
| 2 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | LC 104 | Easy | NC150 | baseline | Height aggregation — the foundation for all post-order problems |
| 3 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | LC 543 | Easy | NC150 | extension | Your Step 1 problem — return height upward, update global diameter as side effect |
| 4 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | LC 102 | Medium | NC150 | baseline | BFS with the level-size snapshot trick |
| 5 | [Count Good Nodes in Binary Tree](https://leetcode.com/problems/count-good-nodes-in-binary-tree/) | LC 1448 | Medium | NC150 | extension | State down — pass `max_so_far` to each recursive call |
| 6 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | LC 98 | Medium | NC150 | baseline | BST range validation — pass `(lo, hi)` down, tighten at each step |
| 7 | [Lowest Common Ancestor of BST](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | LC 235 | Medium | NC150 | extension | BST navigation — first node with `min(p, q) ≤ node ≤ max(p, q)` |
| 8 | [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | LC 230 | Medium | NC150 | extension | In-order = sorted; stop at the k-th yield; iterative in-order short-circuits, recursive does not |
| 9 | [Tree Diameter](https://cses.fi/problemset/task/1131) | CSES | Medium | UG ⭐ | extension | Unrooted general tree — two-pass BFS algorithm; first farthest is one endpoint, second farthest from it is the other |
| 10 | [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | LC 124 | Hard | NC150 | **checkpoint** | Same post-order pattern as LC 543, but the distinction between *returned value* and *globally recorded value* is the entire problem |

**Checkpoint:** LC 124 without hints. The leap: the value *returned* to the parent is `node.val + max(0, max(left, right))` — a single-arm extension that the parent can plug into its own answer. The value *recorded globally* is `node.val + max(0, left) + max(0, right)` — the full path through this node, useless to the parent. Confusing these gives wrong answers on trees with negative values. The `max(0, ...)` clipping (don't take a negative subtree contribution) is the second insight.

**Also doable** — alongside the ladder, when you reach the relevant pattern:

- After #2: [Invert Binary Tree (LC 226)](https://leetcode.com/problems/invert-binary-tree/) — swap left/right at every node. [Balanced Binary Tree (LC 110)](https://leetcode.com/problems/balanced-binary-tree/) — same recursion as height, return `-1` to propagate failure upward.
- After #3: [Same Tree (LC 100)](https://leetcode.com/problems/same-tree/) and [Subtree of Another Tree (LC 572)](https://leetcode.com/problems/subtree-of-another-tree/) — parallel traversal of two trees.
- After #4: [Binary Tree Right Side View (LC 199)](https://leetcode.com/problems/binary-tree-right-side-view/) — same BFS, record only the last node per level.
- After #6: [Construct Binary Tree from Preorder and Inorder (LC 105)](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) — divide and conquer; preorder gives root, inorder splits left/right.

**Deferred to after module 16 (Heap):**
- [Serialize and Deserialize Binary Tree (LC 297)](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) — design problem; BFS serialisation, level-order reconstruction.

---

## Common mistakes

- **BST range with `≤`.** BSTs use *strict* inequalities: `lo < val < hi`. A node equal to its ancestor violates BST property. Using `≤` accepts invalid trees.
- **General tree recursion depth.** Worst-case tree (a path) has recursion depth n. For n = 2 × 10⁵, Python's default limit (1000) crashes. Always `sys.setrecursionlimit(300_000)` for general-tree problems, or rewrite iteratively.
- **Construct from traversals — slice indices.** With root at preorder index 0, the inorder root index `idx` splits the trees: left has `idx` nodes, right has the rest. Recurse on `preorder[1:1+idx]` + `inorder[:idx]` for the left subtree. Off-by-one here cascades into every subsequent call.
- **Recursive in-order can't short-circuit cleanly.** For LC 230 Kth Smallest, the recursive version traverses the whole tree even after finding the answer. Use the iterative template from Step 4.
