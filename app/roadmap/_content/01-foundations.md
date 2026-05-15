# Foundations

**Type:** Checklist. Structurally different from modules 2+ — there is no Step 1 cold attempt, no problem ladder. Subsequent modules follow a 5-step structure ([see CLAUDE.md](../CLAUDE.md)).  
**Unlocks:** Arrays & Hashing, Recursion & Backtracking, Bit Manipulation, Number Theory

---

## How to use this module

For each item below:
1. **Read** the skill description.
2. **Try** the self-test cold — no reference material.
3. **Pass?** Check it off and move on.
4. **Fail or slow?** Follow the reading link before continuing. Don't skip.

Work through every item in order. None of this is taught again — later modules assume it fluently.

---

## Checklist

### 1. Time complexity

Given a block of code, state its Big-O. Recognise the common shapes instantly:

| Pattern | Complexity |
|---|---|
| Single loop over n elements | O(n) |
| Two nested loops | O(n²) |
| Loop that halves the problem each step | O(log n) |
| Sorting n elements | O(n log n) |
| Binary search | O(log n) |
| Dict/set lookup or insert (average) | O(1) |

**Self-test:** Why is binary search O(log n)? What's the complexity of `sorted()` inside a loop of n iterations? (O(n² log n).)

**Reading:** [USACO Guide — Time Complexity](https://usaco.guide/bronze/time-comp).

---

### 2. Space complexity

State the memory usage of an algorithm. Competitive programming memory limit is typically 256 MB. A Python list of 10⁷ ints is ~80 MB — fine. A 2D list of 10⁴ × 10⁴ ints is ~400 MB — MLE.

**Self-test:** `[[0]*n for _ in range(n)]` with n = 10⁴ — how much memory? (~400 MB.)

---

### 3. Python stdlib fluency

```python
# Lists (dynamic array, O(1) amortised append, O(1) index access)
a = []
a.append(x); a.pop()           # O(1) — last element
a.pop(0)                       # O(n) — first element; use deque instead

# Dict (hash map, O(1) avg lookup/insert)
d[key] = val
d.get(key, default)            # safe lookup with fallback
key in d                       # O(1) existence check

# Set (hash set, O(1) avg insert/lookup)
s.add(x); x in s

# Counter (frequency map shorthand)
from collections import Counter
freq = Counter(arr)
freq.most_common(k)            # k most frequent elements

# defaultdict (auto-initialises missing keys)
from collections import defaultdict
groups = defaultdict(list)
groups[key].append(val)

# deque (O(1) on both ends)
from collections import deque
d = deque(); d.appendleft(x); d.append(x)
d.popleft(); d.pop()           # all O(1)

# Heap (min-heap by default)
import heapq
heapq.heappush(h, x); heapq.heappop(h)
heapq.heapify(lst)             # in-place, O(n)

# Bisect (binary search on sorted lists)
import bisect
bisect.bisect_left(arr, x)     # leftmost insertion index
bisect.bisect_right(arr, x)    # rightmost insertion index
```

**Self-test:** Write a frequency counter over a list, then print all elements appearing more than k times — using `Counter`, in under 3 minutes.

**Reading:** [CPH Book](https://cses.fi/book/book.pdf) Chapter 4 (pp. 39–54) for the underlying concepts.

---

### 4. Fast I/O in Python

`input()` is slow for thousands of lines. For competitive programming:

```python
import sys
input = sys.stdin.readline   # drop-in replacement

# Fastest — read everything at once:
data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
a = [int(data[idx + i]) for i in range(n)]; idx += n
```

For many outputs, accumulate and print once:
```python
print('\n'.join(map(str, results)))
```

**Self-test:** Read n integers on one line into a list in one line of Python. (`a = list(map(int, input().split()))`)

---

### 5. Python recursion limit

Python's default recursion limit is 1000. Tree DFS and deep backtracking will hit `RecursionError`.

```python
import sys
sys.setrecursionlimit(300_000)   # put at the top of solutions that recurse
```

Iterative rewrites are more reliable for trees with n > 10⁵. We rewrite recursive solutions to iterative in modules 13 (Trees) and 17 (Graph Traversal).

**Self-test:** What happens if you call `fib(2000)` recursively without setting the limit? (`RecursionError: maximum recursion depth exceeded`.)

---

### 6. Integer properties in Python

Python integers have arbitrary precision — no overflow. `10**18 * 10**18` works fine. Significant advantage over C++.

Caveat: arithmetic on huge numbers isn't O(1). For 10⁶ operations on numbers with hundreds of digits, it becomes noticeable.

**Modular arithmetic:** Python's `%` operator returns a non-negative result for positive modulus — unlike C++.

```python
(-3) % 5   # → 2 in Python (mathematical result)
           # → -3 in C++ (requires manual fix)

# Standard mod pattern (positive m):
(a + b) % MOD
(a * b) % MOD
MOD = 10**9 + 7
```

**Self-test:** `(-7) % 3` in Python? (2. In Python, `a % b` has the sign of `b`.)

---

### 7. Recursion and base cases

Write a recursive function, identify every base case, and argue why it terminates.

**Self-test:**
1. Recursive factorial: `def fact(n)`. Base case? Termination?
2. Fibonacci with memoisation using `@functools.lru_cache`.
3. Why is `fact(100000)` dangerous even after raising the recursion limit? (Stack memory.)

```python
import functools

@functools.lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```

Every recursive call must strictly reduce the problem toward a base case.

---

### 8. Reading competitive programming input

```python
import sys
input = sys.stdin.readline

# Pattern 1: n followed by n numbers
n = int(input())
a = list(map(int, input().split()))

# Pattern 2: t test cases
t = int(input())
for _ in range(t):
    # solve one case
    pass

# Pattern 3: n rows of m integers each
grid = [list(map(int, input().split())) for _ in range(n)]
```

**Self-test:** Write input-reading for: "First line: n and m. Then n lines each with m integers." Two minutes.

---

## You're ready when...

Every self-test takes under 5 minutes without reference material. If three or more feel shaky, fix them here — every future module assumes these fluently.
