# Recursion & Backtracking

**Prerequisites:** Foundations  
**Unlocks:** Trees, DP Intro  
**Patterns introduced:** [backtrack template](00-patterns.md#backtrack-template-choose-explore-unchoose)  
**Patterns reused:** [reduce by fixing one dimension](00-patterns.md#reduce-by-fixing-one-dimension)

---

## Step 1 — Try this first

Open [CSES 1623 — Apple Division](https://cses.fi/problemset/task/1623) and attempt it before reading below.

> Given n apples with weights, divide them into two groups to minimise the absolute difference of their sums.  
> Constraints: n ≤ 20.

The key constraint is n ≤ 20, so 2ⁿ ≈ 10⁶ — enumeration of every possible split is fast enough.

The question to carry into Step 2: *there are exactly 2ⁿ ways to assign n apples to two groups. What's the cleanest way to enumerate all of them — visiting each exactly once, with bookkeeping no more complex than "the choice we're currently making"?*

---

## Step 2 — The technique

### The backtrack template ([atlas](00-patterns.md#backtrack-template-choose-explore-unchoose))

Every backtracking algorithm follows the same three-step pattern: **make a choice, recurse to explore consequences, unmake the choice**. The "unmake" step is what makes it backtracking rather than just recursion — the same data structure is reused across branches by undoing each decision before trying the next.

```python
def backtrack(state):
    if is_complete(state):
        record(state)
        return
    for choice in get_choices(state):
        make(choice, state)        # choose
        backtrack(state)           # explore
        unmake(choice, state)      # unchoose
```

**Answer to Step 1:** at index i, two choices — put apple i in group A or group B. Recurse on i+1 with the choice applied to a running diff. 2ⁿ leaves, each reachable through exactly one sequence of n binary choices.

```python
def solve(weights):
    n, best = len(weights), [float('inf')]

    def backtrack(i, diff):
        if i == n:
            best[0] = min(best[0], abs(diff))
            return
        backtrack(i + 1, diff + weights[i])    # group A
        backtrack(i + 1, diff - weights[i])    # group B

    backtrack(0, 0)
    return best[0]
```

### The four sub-patterns

**Pattern 1 — Subsets (include/exclude).** For each element, two choices: include it in the current subset or skip. 2ⁿ subsets.

```python
def backtrack(i):
    if i == n:
        record(path)
        return
    backtrack(i + 1)                  # exclude
    path.append(a[i])
    backtrack(i + 1)                  # include
    path.pop()
```

**Pattern 2 — Permutations.** Fix one element at the current position, recurse on remaining positions. The standard implementation uses swap-and-restore.

```python
def backtrack(i):
    if i == n:
        record(nums[:])
        return
    for j in range(i, n):
        nums[i], nums[j] = nums[j], nums[i]
        backtrack(i + 1)
        nums[i], nums[j] = nums[j], nums[i]
```

**Pattern 3 — Combination sum (accumulate until target).** At each step, add any element from `start` onward. Pass `i` (allow reuse) or `i+1` (no reuse) to the recursive call.

```python
def backtrack(start, remaining):
    if remaining == 0:
        record(path)
        return
    if remaining < 0:                 # constraint pruning
        return
    for i in range(start, n):
        path.append(a[i])
        backtrack(i, remaining - a[i])    # i (with reuse) vs i+1 (no reuse)
        path.pop()
```

**Pattern 4 — Grid backtracking.** Walk a grid in 4 directions. Mark a cell as visited before recursing, unmark on the way back.

```python
def dfs(r, c, idx):
    if out_of_bounds(r, c) or board[r][c] != target[idx]:
        return False
    board[r][c] = '#'                  # mark visited
    for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
        if dfs(r + dr, c + dc, idx + 1):
            return True
    board[r][c] = target[idx]          # unmark
    return False
```

### Pruning

Pruning eliminates entire subtrees of the search space.

- **Constraint pruning:** if the current path can't satisfy the remaining requirement, stop. (`if remaining < 0: return` in combination sum.)
- **Bound pruning:** if the best possible result from this branch can't improve the current best, stop. (Used in branch-and-bound problems beyond the v1 scope.)
- **Duplicate pruning:** sort the input, then within a loop skip `a[i]` if `i > start and a[i] == a[i-1]`. The same value already tried at this position will reach the same set of solutions.

Without pruning, N-Queens and Word Search would be too slow for reasonable inputs.

### Duplicate-handling skip rule

When the input has duplicates and you want unique results:

```python
nums.sort()
for i in range(start, n):
    if i > start and nums[i] == nums[i-1]:
        continue                       # skip duplicate at this depth
    path.append(nums[i])
    backtrack(i + 1, ...)              # i + 1 = no reuse
    path.pop()
```

**The condition is `i > start`, not `i > 0`.** A duplicate at the same recursion depth (relative to `start`) was already tried. A duplicate at a deeper depth (different recursion call) is a fresh occurrence and shouldn't be skipped.

This rule appears in problems 4 (Creating Strings I, permutations) and 7 (Combination Sum II, combinations) below. The rule is identical; the surrounding machinery differs.

### Reduce by fixing one dimension ([atlas](00-patterns.md#reduce-by-fixing-one-dimension))

Permutations and Subsets both apply this pattern: at each recursion depth, fix one decision (which element here, or include/exclude this one), then recurse on the smaller subproblem. Same as 3Sum (module 4) and contribution counting (module 7) — fix one variable, reduce to a simpler problem.

---

## Step 3 — Read

1. [USACO Guide — Complete Search with Recursion (Bronze)](https://usaco.guide/bronze/complete-rec) — covers subsets and permutations with USACO examples.
2. CPH Chapter 5.1 (Backtracking), pp. 55–57 — N-Queens and subsets concisely.

---

## Step 4 — Code reference

### Subsets

```python
def subsets(nums):
    # Invariant: `path` is the subset currently being built.
    result, path = [], []
    def backtrack(start):
        result.append(path[:])              # record at every node, not just leaves
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()
    backtrack(0)
    return result
```

### Permutations

```python
def permutations(nums):
    # Invariant: nums[0..start-1] is the prefix already fixed; nums[start..] is the pool.
    result = []
    def backtrack(start):
        if start == len(nums):
            result.append(nums[:])
            return
        for i in range(start, len(nums)):
            nums[start], nums[i] = nums[i], nums[start]
            backtrack(start + 1)
            nums[start], nums[i] = nums[i], nums[start]
    backtrack(0)
    return result
```

### Combination sum with pruning

```python
def combination_sum(candidates, target):
    candidates.sort()                       # enables the `break` pruning below
    result, path = [], []
    def backtrack(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining:
                break                       # sorted → all subsequent are too large
            path.append(candidates[i])
            backtrack(i, remaining - candidates[i])    # `i` allows reuse
            path.pop()
    backtrack(0, target)
    return result
```

### Duplicate skip rule (Combination Sum II / Subsets II)

```python
nums.sort()
for i in range(start, len(nums)):
    if i > start and nums[i] == nums[i-1]:
        continue                            # skip duplicate at this depth
    path.append(nums[i])
    backtrack(i + 1, ...)                   # i + 1 = no reuse
    path.pop()
```

### Generate parentheses

```python
def generate_parentheses(n):
    # Invariant: open_count = number of '(' in path; close_count = number of ')'.
    result = []
    def backtrack(path, open_count, close_count):
        if len(path) == 2 * n:
            result.append(''.join(path))
            return
        if open_count < n:
            path.append('(')
            backtrack(path, open_count + 1, close_count)
            path.pop()
        if close_count < open_count:
            path.append(')')
            backtrack(path, open_count, close_count + 1)
            path.pop()
    backtrack([], 0, 0)
    return result
```

### Word search (grid backtracking)

```python
def word_search(board, word):
    rows, cols = len(board), len(board[0])
    def dfs(r, c, idx):
        if idx == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[idx]:
            return False
        tmp, board[r][c] = board[r][c], '#'
        found = any(dfs(r+dr, c+dc, idx+1)
                    for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)])
        board[r][c] = tmp
        return found
    return any(dfs(r, c, 0)
               for r in range(rows) for c in range(cols))
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Apple Division](https://cses.fi/problemset/task/1623) | CSES | Easy | UG | baseline | Subset recursion with a running aggregate — your Step 1 problem |
| 2 | [Subsets](https://leetcode.com/problems/subsets/) | LC 78 | Medium | NC150 | reskin | Same subset recursion, generate-all framing — interview canon |
| 3 | [Permutations](https://leetcode.com/problems/permutations/) | LC 46 | Medium | NC150 | baseline | New sub-pattern: swap-based permutations |
| 4 | [Creating Strings I](https://cses.fi/problemset/task/1622) | CSES | Easy | UG | extension | Permutations with duplicates — introduces the `i > start` skip rule |
| 5 | [Combination Sum](https://leetcode.com/problems/combination-sum/) | LC 39 | Medium | NC150 | extension | Accumulate-with-reuse plus sorted+break pruning |
| 6 | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/) | LC 22 | Medium | NC150 | extension | Count-constrained recursion — `open < n` to add `(`, `close < open` to add `)` |
| 7 | [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/) | LC 40 | Medium | NC150 | extension | Skip rule from problem 4 + no-reuse (pass `i+1`) |
| 8 | [Word Search](https://leetcode.com/problems/word-search/) | LC 79 | Medium | NC150 | extension | Grid backtracking — mark with `#`, recurse 4 directions, restore on return |
| 9 | [Livestock Lineup](http://www.usaco.org/index.php?page=viewproblem2&cpid=965) | USACO Bronze | Medium | UG ⭐ | extension | Permutation backtracking in a problem statement that doesn't name the pattern — must identify it |
| 10 | [N-Queens](https://leetcode.com/problems/n-queens/) | LC 51 | Hard | NC150 | **checkpoint** | Place queens row by row; prune on `cols`, `r − c`, `r + c` simultaneously |

**Checkpoint:** LC 51 without hints. Track three sets — occupied columns, occupied diagonals (`r − c`), occupied anti-diagonals (`r + c`). Try every column in the current row; skip if any set contains the relevant key. The leap is recognising that diagonal collisions are encoded by simple arithmetic on row/column indices — `r − c` for one diagonal direction, `r + c` for the other.

**Also doable as warm-up:** [Letter Combinations of a Phone Number (LC 17, NC150)](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) and [Subsets II (LC 90, NC150)](https://leetcode.com/problems/subsets-ii/) — both follow patterns covered in the ladder above (Cartesian product enumeration for LC 17, subset + skip rule for LC 90).

---

## Common mistakes

- **Forgetting to undo.** Every `path.append(x)` needs a matching `path.pop()` after the recursive call. Every `board[r][c] = '#'` needs a restore. Missed undos contaminate sibling branches.
- **Appending the reference, not a copy.** `result.append(path)` stores a live reference that all subsequent mutations corrupt. Use `result.append(path[:])` or `path.copy()`.
- **`i > 0` instead of `i > start` in the skip rule.** `i > 0` skips legitimate fresh occurrences at deeper recursion depths. The condition must compare against `start`, the index of the first choice at *this depth*.
- **Reuse parameter (`i` vs `i+1`).** Pass `i` when an element may appear multiple times in the result (Combination Sum). Pass `i+1` when it may not (Combination Sum II, Subsets II).
- **N-Queens diagonal encoding.** Two queens at `(r1, c1)` and `(r2, c2)` share a `\` diagonal iff `r1 − c1 == r2 − c2`. They share a `/` anti-diagonal iff `r1 + c1 == r2 + c2`. Use both as set keys.
