# Arrays & Hashing

**Prerequisites:** Foundations  
**Unlocks:** Prefix Sums, Two Pointers, Stack, Linked List, Binary Search, Greedy, Coordinate Compression, Union-Find  
**Patterns introduced:** [complement lookup](00-patterns.md#complement-lookup)

---

## Step 1 — Try this first

Open [CSES 1640 — Sum of Two Values](https://cses.fi/problemset/task/1640) and attempt it before reading below.

> Given an array of n integers and a target sum x, find two values (at distinct positions) that add up to x.  
> Constraints: n ≤ 2 × 10⁵, values ≤ 10⁹.

The naive solution:

```python
for i in range(n):
    for j in range(i + 1, n):
        if a[i] + a[j] == x:
            print(i + 1, j + 1)
```

For n = 2 × 10⁵, that's ~2 × 10¹⁰ iterations — TLE by a factor of 10,000.

Before reading on, sit with this question: *the inner loop for each i is asking "is the value x − a[i] somewhere in this array?" — and answering it by scanning everything. What's being recomputed across iterations?*

---

## Step 2 — The technique

### Sets and dicts as O(1) lookup structures

A Python `set` stores values in a hash structure. `x in s` is O(1) average — hash `x`, check the bucket. A `dict` is the same structure with associated values: O(1) get, set, and existence check.

```
"Is 7 in {3, 1, 4, 7, 2}?"
With set:  O(1) — hash 7, check bucket
With list: O(n) — scan everything
```

### Pattern 1 — existence

"Have we seen this value before?" Add to a `set` as you process. Check with `x in seen`.

### Pattern 2 — frequency counting

"How many times does each value appear?" Use `Counter`:

```python
from collections import Counter
freq = Counter(a)              # {3: 2, 1: 1, ...}
```

Two strings are anagrams iff their `Counter`s are equal. Two arrays have the same multiset iff their `Counter`s are equal.

### Pattern 3 — complement lookup ([atlas](00-patterns.md#complement-lookup))

"Is there a value that, combined with the current one, completes a relationship?"

The wasted work in Step 1: for each `a[i]`, you scan the array looking for `x - a[i]`. Instead, **maintain a running record of values already seen**. For each new `a[i]`, look up `x - a[i]` in O(1).

```
Array: [3, 5, 8, 7, 2], target = 10

i=0: x=3, need 7. seen={}.                Insert: seen={3:0}
i=1: x=5, need 5. seen={3:0}, no.         Insert: seen={3:0, 5:1}
i=2: x=8, need 2. seen={3:0, 5:1}, no.    Insert: seen={3:0, 5:1, 8:2}
i=3: x=7, need 3. seen={3:0, 5:1, 8:2}. ✓ Found at index 0. Return (0, 3).
```

**Critical ordering:** check `need in seen` *before* inserting `a[i]`. If you insert first and `target = 2x`, the lookup for `x - x = x` finds the element you just inserted, returning `(i, i)` — using the same index twice. The check-then-insert order forbids this.

This complement-lookup pattern reappears in module 4, where the "seen" dict tracks prefix sums instead of raw values. Same machinery, different quantity.

### Pattern 4 — dict-of-lists for grouping

"Group items by a computed property." Use `defaultdict(list)` with a derived key. For Group Anagrams, the key is `tuple(sorted(s))` — all anagrams share the same sorted-character tuple.

### When *not* to use a dict or set

- Need sorted iteration → use `sorted()` once, or `sortedcontainers.SortedList`.
- Need range queries ("count values in [3, 7]") → sort + `bisect` (module 11) or Fenwick tree (module 35).
- Need O(log n) ordered insert/delete → `sortedcontainers.SortedList`.

A plain `dict`/`set` is fast for O(1) lookup but blind to order.

---

## Step 3 — Read

This module is a curated path through the USACO Guide's Intro Sets & Maps page — that page covers ~60% of the techniques here. The two reads:

1. [USACO Guide — Intro to Sets & Maps (Bronze)](https://usaco.guide/bronze/intro-sets) — load-bearing. Work through the page including their examples.
2. CPH Chapter 4 (Data Structures), pp. 39–48 — language-agnostic treatment; covers sorted maps too, useful context.

Move to Step 4 after both.

---

## Step 4 — Code reference

### Set — existence

```python
# Invariant: `seen` contains every element processed so far
seen = set()
for x in a:
    if x in seen:
        ...
    seen.add(x)
```

### Dict — frequency counting

```python
from collections import Counter
freq = Counter(a)
freq.most_common(3)            # top-3 most frequent

# Manual form, when you accumulate by index or condition:
from collections import defaultdict
freq = defaultdict(int)
for x in a:
    freq[x] += 1
```

### Dict — complement lookup

```python
def two_sum(a, target):
    # Invariant: `seen[v] = i` for every value v processed before position i
    seen = {}
    for i, x in enumerate(a):
        need = target - x
        if need in seen:
            return seen[need], i
        seen[x] = i             # insert AFTER check — see Step 2
```

### Dict-of-lists — group by derived key

```python
from collections import defaultdict
groups = defaultdict(list)
for s in words:
    key = tuple(sorted(s))      # canonical form of s
    groups[key].append(s)
```

### Anagram check

```python
from collections import Counter
def is_anagram(s, t):
    return Counter(s) == Counter(t)
```

---

## Step 5 — Problems

Work through in order. Roles: *baseline* (cleanest version of a sub-pattern), *extension* (adds one variable), *combination* (joins this module with another), *checkpoint* (the leap).

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | LC 217 | Easy | NC150 | baseline | Set existence — simplest possible application |
| 2 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | LC 242 | Easy | NC150 | baseline | Frequency comparison — `Counter(s) == Counter(t)` |
| 3 | [Two Sum](https://leetcode.com/problems/two-sum/) | LC 1 | Easy | NC150 | baseline | Complement lookup — this is the technique that solves your Step 1 problem (CSES 1640); now apply it cleanly |
| 4 | [Where Am I?](http://www.usaco.org/index.php?page=viewproblem2&cpid=964) | USACO Bronze | Easy | UG ⭐ | extension | Set existence in a contest problem — must recognise the pattern yourself |
| 5 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | LC 49 | Medium | NC150 | extension | Dict-of-lists with a derived key — `tuple(sorted(s))` as the canonical form |
| 6 | [Don't Be Last!](http://www.usaco.org/index.php?page=viewproblem2&cpid=687) | USACO Bronze | Medium | UG ⭐ | combination | Dict aggregation + sort to extract a ranked answer |
| 7 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | LC 128 | Medium | NC150 | **checkpoint** | Build a set, then only start chains from values where `x - 1 ∉ set` — the "use the set to *decide what to do*" insight is not derivable from problems 1–6 |

**Checkpoint:** LC 128 without hints. The mechanical part (set construction) is trivial after this module. The leap is recognising that you don't sort, and you only walk chains from their minimum — checking `x - 1 not in num_set` before starting. That observation isn't in any earlier problem; the reader has to invent it.

---

## Common mistakes

- **`x in list` is O(n).** Convert to a set before any repeated membership check.
- **Mutable keys:** lists and dicts can't be dict keys. `tuple(sorted(s))`, not `sorted(s)`.
- **`Counter` subtraction drops negatives:** `Counter({'a': 1}) - Counter({'a': 2}) == Counter()`, not `{'a': -1}`. Don't use subtraction for inequality checks; compare with `==`.
- **`dict[key]` on a missing key raises `KeyError`.** Use `dict.get(key, default)` or `key in dict`. `defaultdict` avoids the error but can silently create keys you didn't expect.
