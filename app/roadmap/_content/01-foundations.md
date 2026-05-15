# Foundations

**Type:** Checklist. Structurally different from modules 2+ — no Step 1 cold attempt, no problem ladder. Subsequent modules follow the 5-step structure ([see CLAUDE.md](../CLAUDE.md)).
**Unlocks:** Arrays & Hashing (2), Recursion & Backtracking (12), Bit Manipulation (29), Number Theory (36).

---

## How to use this module

For each item:

1. **Read** the skill description.
2. **Try** the self-test cold. Each self-test has an inline answer in parentheses — cover it first.
3. **Pass cold in ≤ 2 minutes?** Tick it off and move on.
4. **Slow or unsure?** Work the linked reading where one is given; otherwise drill the snippet until it's reflex.

None of this is taught again — every later module assumes it fluently.

---

## Checklist

### 1. Time complexity & the Python ops budget

State the Big-O of a block of code, and translate it into a wall-clock estimate.

| Pattern | Complexity |
|---|---|
| Single loop over n elements | O(n) |
| Two nested loops | O(n²) |
| Halve the problem each step | O(log n) |
| Sort n elements | O(n log n) |
| Dict / set lookup or insert (average) | O(1) |

**Python ops budget (treat as ~10⁷ simple ops/sec on Codeforces, ~10⁸ on LeetCode with a generous TL):**

| n | O(n) | O(n log n) | O(n²) | O(n³) |
|---|---|---|---|---|
| 10³ | instant | instant | instant | 0.1 s |
| 10⁴ | instant | instant | 10 s | hours |
| 10⁵ | instant | 0.17 s | 1000 s | — |
| 10⁶ | 0.1 s | 2 s | hours | — |
| 10⁷ | 1 s | 24 s | — | — |

Reading "n = 2 × 10⁵, O(n²) = 4 × 10¹⁰ — off by a factor of ~4000" is the *reflex* this table trains. Asymptotics without an ops budget are useless under a 1-second TL.

**Self-test:** What's the complexity of `sorted(arr)` inside a loop of n iterations? (*O(n² log n).*) For n = 10⁵, will it pass a 1-second TL? (*No — 1.7 × 10⁷ × n = 1.7 × 10¹² ops, ~5 orders too slow.*)

**Reading:** [USACO Guide — Time Complexity](https://usaco.guide/bronze/time-comp).

---

### 2. Space complexity

State the memory usage of a data structure. CP memory limit is typically 256 MB; LC is more generous but a 2D list still bites.

| Structure | Bytes per entry (CPython 3.11) | n = 10⁶ | n = 10⁷ |
|---|---|---|---|
| `list[int]` | ~28 (small int cache) to 56 | ~50 MB | ~500 MB |
| `dict[int, int]` | ~200 | ~200 MB | OOM |
| `set[int]` | ~200 | ~200 MB | OOM |
| `array.array('i', ...)` | 4 | 4 MB | 40 MB |
| 2D `[[0]*n for _ in range(n)]` | ~28 per cell | n = 10⁴ → ~2.8 GB → **MLE** |

The hash structures are ~4× a list of the same length — common surprise.

**Self-test:** Adjacency list for a graph with n = 10⁵ nodes, m = 5 × 10⁵ edges — list-of-lists, roughly? (*~30 MB; safe. The matrix would be 10¹⁰ entries — instant MLE.*)

---

### 3. Python stdlib fluency

```python
# Lists — dynamic array; O(1) amortised append, O(1) index, O(n) middle insert
a.append(x); a.pop()             # O(1) — last element
a.pop(0)                         # O(n) — use a deque instead

# Tuples — immutable, hashable; usable as dict/set keys
seen = set(); seen.add((r, c))   # canonical 2D-grid visited marker

# Dict — hash map; O(1) avg lookup/insert
d.get(key, default)              # safe lookup
key in d                         # O(1) existence

# Set — hash set
s.add(x); s.discard(x)           # discard is no-op if absent; remove raises

# Counter — frequency map
from collections import Counter
freq = Counter(arr)
freq.most_common(k)              # list of (value, count) tuples
(Counter(a) - Counter(b))        # multiset difference, keeps positive counts

# defaultdict — auto-init missing keys
from collections import defaultdict
graph = defaultdict(list); graph[u].append(v)

# deque — O(1) both ends
from collections import deque
dq = deque([1, 2, 3])
dq.appendleft(0); dq.popleft()   # both O(1)

# heapq — min-heap only; negate values for a max-heap
import heapq
heapq.heappush(h, x); heapq.heappop(h)
heapq.heapify(lst)               # in-place, O(n)
heapq.nlargest(k, lst)           # O(n log k) top-k without sorting
heapq.nsmallest(k, lst)

# bisect — binary search on a *sorted* list
import bisect
bisect.bisect_left(arr, x)       # leftmost insertion index
bisect.bisect_right(arr, x)      # rightmost insertion index
bisect.insort(arr, x)            # O(log n) lookup + O(n) shift

# Iteration helpers
for i, x in enumerate(arr): ...           # paired index/value
for x, y in zip(a, b): ...                # parallel iteration; stops at shorter
for x, y in zip(a, b, strict=True): ...   # raises on length mismatch (3.10+)

# String building — never use += in a loop
out = ''.join(parts)             # O(total length); `+=` is O(n²)
```

**Self-test:** Given `arr`, print every element appearing more than `k` times, ordered by frequency descending. ≤ 4 lines, ≤ 3 minutes. (*`for v, c in Counter(arr).most_common(): if c > k: print(v)`.*)

**Reading:** [Python docs — collections](https://docs.python.org/3/library/collections.html), [heapq](https://docs.python.org/3/library/heapq.html), [bisect](https://docs.python.org/3/library/bisect.html). CPH Ch. 5 (Data Structures, pp. 53–67) covers the C++ analogs if you want the cross-walk.

---

### 4. Sorting with custom keys

Used in every greedy (16) and interval (17) module. Two patterns cover ~95% of cases.

```python
# Sort by one field
intervals.sort(key=lambda iv: iv[0])               # by start

# Compound key — tuple comparison is lexicographic
events.sort(key=lambda e: (e.time, -e.priority))   # earliest time; ties → highest priority first
tasks.sort(key=lambda t: (t.deadline, t.duration)) # earliest deadline; ties → shorter first

# Reverse the whole sort
arr.sort(key=lambda x: x.score, reverse=True)

# Stability — Python's sort is stable. Two sorts in sequence = sort by secondary, then by primary:
items.sort(key=lambda x: x.name)        # secondary first
items.sort(key=lambda x: x.priority)    # primary last; primary ties retain name order

# Full comparator (rare — only when keys can't express the order, e.g. LC 179 Largest Number)
from functools import cmp_to_key
arr.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else 1))
```

**Self-test:** Sort intervals by start ascending, break ties by end descending. (*`intervals.sort(key=lambda iv: (iv[0], -iv[1]))`.*)

---

### 5. I/O

`input()` re-reads stdin per line — too slow above ~10⁴ lines. Two patterns:

```python
# Pattern A — drop-in replacement, fine up to ~10⁵ lines
import sys
input = sys.stdin.readline

n = int(input())
a = list(map(int, input().split()))

t = int(input())
for _ in range(t):
    ...

grid = [list(map(int, input().split())) for _ in range(n)]

# Pattern B — slurp everything when input is huge or irregularly shaped
data = sys.stdin.buffer.read().split()
it = iter(data)
n = int(next(it))
a = [int(next(it)) for _ in range(n)]
```

For many outputs, batch the prints — calling `print` 10⁵ times is its own bottleneck:

```python
sys.stdout.write('\n'.join(map(str, results)) + '\n')
```

LeetCode never reads stdin — Pattern A only matters in CP. The cost of Pattern A is negligible, so use it by default.

**Self-test:** First line `n m`; next `n` lines have `m` integers. Read into a 2D list. ≤ 2 minutes.
(*`n, m = map(int, input().split()); grid = [list(map(int, input().split())) for _ in range(n)]`.*)

---

### 6. Integer arithmetic and modular ops

Python ints are arbitrary precision — no overflow, no `long long`. But arithmetic on huge numbers is **not** O(1); a 1000-digit multiplication is non-trivial.

Python's `%` returns a non-negative result for positive modulus — unlike C++:

```python
(-3) % 5   # → 2   (Python: sign follows the divisor)
           # → -3 in C++ (sign follows the dividend)

MOD = 10**9 + 7
(a + b) % MOD
(a * b) % MOD
```

Two built-ins that show up constantly in math modules:

```python
pow(a, b, MOD)            # fast modular exponentiation, O(log b). Always use this.

# Modular inverse when MOD is prime (Fermat's little theorem):
inv = pow(a, MOD - 2, MOD)
(a * inv) % MOD           # division mod p

q, r = divmod(a, b)       # quotient + remainder in one call; cleaner than (a // b, a % b)
```

**Self-test:** `(-7) % 3` in Python? (*2 — Python's `%` has the sign of the divisor.*) Compute `2^(10⁹) mod (10⁹ + 7)`. (*`pow(2, 10**9, 10**9 + 7)` — milliseconds; naive loop would never finish.*)

---

### 7. Recursion: limits, base cases, memoisation

Python's default recursion limit is 1000. Deep tree DFS and backtracking hit `RecursionError` long before logic bugs:

```python
import sys
sys.setrecursionlimit(300_000)   # top of any recursive solution
```

But `setrecursionlimit(10**9)` is a trap — the **C stack** is the real limit. On CPython 3.11 a frame is ~500 bytes; an 8 MB OS stack ≈ 16k frames. Raising the limit past that segfaults the interpreter, not raises an exception. Once recursion depth genuinely exceeds ~10⁴–10⁵, rewrite iteratively — this is why modules 13 (Trees) and 18 (Graph Traversal) cover explicit-stack DFS.

Recursion correctness reduces to three obligations:

1. Identify every base case explicitly.
2. Each recursive call strictly reduces the problem toward a base case.
3. State the **return contract** — what the function returns at each level — and verify the recursive case respects it.

Top-down DP is "recursion + memo". The stdlib makes this one decorator:

```python
import functools

@functools.cache              # 3.9+; equivalent to lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n - 1) + fib(n - 2)
```

This is the same pattern that opens DP Intro (24); the only addition there is the state-design discipline.

**Self-test:** Why is `fact(100_000)` dangerous even after raising the recursion limit? (*Stack memory — ~100k frames × ~500 B = ~50 MB of C stack; well past the OS default. Rewrite as a loop.*) What does `@functools.cache` do that plain recursion doesn't? (*Memoises calls by argument tuple — collapses exponential recomputation to one call per distinct input.*)

---

## You're ready when…

You can clear each of these cold, with a stopwatch, in under the time given:

- [ ] **1.** Time complexity — given a code block, state Big-O and translate to seconds using the budget table. (1 min)
- [ ] **2.** Space complexity — given a data structure shape, estimate bytes; flag MLE risk. (1 min)
- [ ] **3.** Stdlib fluency — write a Counter / defaultdict / deque / heapq / bisect snippet from memory. (2 min each)
- [ ] **4.** Custom-key sort — write a compound-key sort with a tie-breaker direction reversed. (1 min)
- [ ] **5.** Fast I/O — write the read-and-parse block for `n` then `n` numbers, and a batched write. (2 min)
- [ ] **6.** Integer / modular — write `pow(a, b, MOD)` and the Fermat inverse. (1 min)
- [ ] **7.** Recursion — set the limit, identify base cases for a given recursion, add `@functools.cache`. (2 min)

If three or more feel shaky, fix them here. The pattern atlas at [`00-patterns.md`](00-patterns.md) is what you'll be filling in across the rest of the curriculum; this checklist is the language it's written in.
