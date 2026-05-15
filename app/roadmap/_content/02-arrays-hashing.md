# Arrays & Hashing

**Prerequisites:** Foundations  
**Unlocks:** Sorting, Prefix Sums, Two Pointers, Stack, Linked List, Binary Search, Greedy, Coordinate Compression, Union-Find  
**Patterns introduced:** [complement lookup](00-patterns.md#complement-lookup)  
**Patterns reused:** none

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

The question to carry into Step 2: *for each `i`, the inner loop is asking "is the value `x − a[i]` somewhere in this array?" and answering it by scanning everything. What data structure answers "is value v present?" in O(1) instead of O(n)?*

---

## Step 2 — The technique

### The core invariant

A Python `set` or `dict` stores values in a hash structure. Lookup, insertion, and deletion are **O(1) average**. A `list` is O(n) for search.

```
"Is 7 in this collection?"
With set:  O(1) — hash 7, check the bucket. Independent of collection size.
With list: O(n) — scan every element until found or exhausted.
```

This single property — O(1) membership — is what all four patterns below exploit.

### Pattern 1 — existence

"Have we seen this value before?" Build a `set` as you process. Check with `v in seen` before inserting.

**Numeric trace** with `a = [3, 1, 3, 2]`, looking for any duplicate:

```
i=0: x=3.  3 not in seen={}        → insert. seen={3}
i=1: x=1.  1 not in seen={3}       → insert. seen={3, 1}
i=2: x=3.  3 IN seen={3, 1}        → duplicate found. Done.
```

The set never grows larger than the array, and each step is O(1).

### Pattern 2 — frequency counting

"How many times does each value appear?" Use `Counter`:

```python
from collections import Counter
freq = Counter(a)    # one pass, O(n)
```

**Numeric trace** with `a = [3, 1, 3, 2, 1, 1]`:

```
Counter([3, 1, 3, 2, 1, 1])
→ {1: 3, 3: 2, 2: 1}     (3 most-common first)
```

Two strings are anagrams iff `Counter(s) == Counter(t)`. Two arrays have the same multiset iff their `Counter`s are equal.

### Pattern 3 — complement lookup ([atlas](00-patterns.md#complement-lookup))

"Is there a value that, combined with the current one, satisfies a relationship?"

The wasted work in Step 1: for each `a[i]`, the inner loop scans for `x − a[i]`. Instead, **maintain a dict of values already seen and their indices**. For each new element, look up its complement in O(1).

**Numeric trace** with `a = [3, 5, 8, 7, 2]`, target = 10:

```
i=0: x=3, need 7. seen={}.               7 absent → insert. seen={3:0}
i=1: x=5, need 5. seen={3:0}.            5 absent → insert. seen={3:0, 5:1}
i=2: x=8, need 2. seen={3:0, 5:1}.       2 absent → insert. seen={3:0, 5:1, 8:2}
i=3: x=7, need 3. seen={3:0, 5:1, 8:2}. 3 FOUND at index 0. → return (0, 3). ✓
```

**Critical ordering:** check `need in seen` *before* inserting `a[i]`. If you insert first and `target == 2 * x`, the lookup for `x − x = x` finds the element you just inserted — returning `(i, i)`, using the same index twice.

This complement-lookup pattern reappears in module 4, where the "seen" dict tracks *prefix sums* instead of raw values. Same machinery, different quantity.

### Pattern 4 — grouping by derived key

"Collect all items that share a canonical form." Use `defaultdict(list)` with a computed key.

**Numeric trace** with `words = ["eat", "tan", "ate", "nat", "bat"]`:

```
"eat" → key = tuple(sorted("eat")) = ('a','e','t') → groups[('a','e','t')] = ["eat"]
"tan" → key = ('a','n','t')                        → groups[('a','n','t')]  = ["tan"]
"ate" → key = ('a','e','t')                        → groups[('a','e','t')] = ["eat", "ate"]
"nat" → key = ('a','n','t')                        → groups[('a','n','t')]  = ["tan", "nat"]
"bat" → key = ('a','b','t')                        → groups[('a','b','t')]  = ["bat"]
```

The derived key must be **hashable** (tuples are; lists are not) and must be **identical for equivalent items** (sorted characters collapse all anagrams to one key).

### Pattern 5 — set-guided iteration

"Use the membership test not just to look up a value, but to *decide which items to process at all*."

This is the step up from patterns 1–4. In all of those, you look up every element. Here, the set gates which elements are worth processing — skipping work that would be redundant.

**Numeric trace** for Longest Consecutive Sequence with `a = [4, 3, 2, 1, 100, 101]`:

```
s = {4, 3, 2, 1, 100, 101}

x=4:   4-1=3  in s → 4 is not a chain minimum. Skip.
x=3:   3-1=2  in s → not a chain minimum. Skip.
x=2:   2-1=1  in s → not a chain minimum. Skip.
x=1:   1-1=0  NOT in s → chain minimum found. Walk: 1→2→3→4. Length=4.
x=100: 100-1=99 NOT in s → chain minimum. Walk: 100→101. Length=2.
x=101: 101-1=100 in s → not a chain minimum. Skip.

Answer: max(4, 2) = 4.
```

Why is this O(n) despite the inner walk? Each element is walked **at most once** across all chains — the inner loop for chain starting at `x` runs `len(chain)` times, and every element belongs to exactly one chain. Total work: O(n). The naive approach without the gate visits every element as a potential start, giving O(n²).

The pattern generalises: any time you have an O(n) scan that would repeat work on items that can't be "first" or "canonical", use a set to prune.

### Preconditions

Hash structures are only valid when:

- **Keys are hashable.** `list`, `dict`, `set` and any mutable type cannot be a key. Use `tuple` for ordered collections (`tuple(sorted(s))`), `frozenset` for unordered ones.
- **O(1) is average, not worst-case.** Python's hash map can degrade to O(n) with adversarial inputs (hash collisions), but this is never an issue in practice on judge inputs.
- **You need lookup, not order.** A `set`/`dict` does not preserve insertion order for arbitrary iteration purposes (Python 3.7+ dicts *are* insertion-ordered, but that's incidental). If you need sorted iteration, min/max queries, or range queries:
  - Sorted iteration → `sorted(d.keys())` once, then index. O(n log n).
  - Range queries ("count values in [3, 7]") → sort + `bisect` (module 11) or Fenwick tree (module 35).
  - O(log n) ordered insert/delete → `sortedcontainers.SortedList`.

---

## Step 3 — Read

This module is a curated path through the USACO Guide's Intro Sets & Maps page — that page covers ~60% of the techniques here.

1. [USACO Guide — Intro to Sets & Maps (Bronze)](https://usaco.guide/bronze/intro-sets) — load-bearing. Work through the page including their examples.
2. [CPH Book](https://cses.fi/book/book.pdf) Chapter 4 (Data Structures), pp. 39–48 — language-agnostic treatment; covers sorted maps and the distinction between ordered/unordered containers.

Move to Step 4 after both.

---

## Step 4 — Code reference

### Set — existence check

```python
# Invariant: `seen` contains every element processed before index i
seen = set()
for x in a:
    if x in seen:
        ...                # x was seen earlier
    seen.add(x)
```

### Counter — frequency

```python
from collections import Counter
freq = Counter(a)          # one-pass frequency map; O(n)
freq.most_common(k)        # k most frequent elements, O(n log k)
```

### Dict — complement lookup

```python
def two_sum(a, target):
    # Invariant: seen[v] = i for every element v processed before position i
    seen = {}
    for i, x in enumerate(a):
        need = target - x
        if need in seen:
            return seen[need], i
        seen[x] = i        # insert AFTER check — prevents reusing the same index
```

### defaultdict — grouping by derived key

```python
from collections import defaultdict
groups = defaultdict(list)
for s in words:
    key = tuple(sorted(s))   # canonical form; must be hashable
    groups[key].append(s)
```

### Set-guided iteration

```python
# Invariant: only process x when x is a chain/sequence minimum (x-1 not in s)
s = set(a)
best = 0
for x in s:
    if x - 1 not in s:               # x is a minimum → worth walking from
        length = 0
        while x + length in s:
            length += 1
        best = max(best, length)
```

---

## Step 5 — Problems

Work through in order. Roles: *baseline* (cleanest version of a sub-pattern), *extension* (adds one variable), *combination* (joins this module with another), *checkpoint* (the leap).

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | LC 217 | Easy | NC150 | baseline | Pattern 1 — set existence; simplest application |
| 2 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | LC 242 | Easy | NC150 | baseline | Pattern 2 — `Counter(s) == Counter(t)` |
| 3 | [Two Sum](https://leetcode.com/problems/two-sum/) | LC 1 | Easy | NC150 | baseline | Pattern 3 — complement lookup; solves your Step 1 problem (CSES 1640) |
| 4 | [Where Am I?](http://www.usaco.org/index.php?page=viewproblem2&cpid=964) | USACO Bronze | Easy | UG ⭐ | extension | Pattern 1 in a contest framing — must recognise the pattern without scaffolding |
| 5 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | LC 49 | Medium | NC150 | extension | Pattern 4 — `tuple(sorted(s))` as the canonical key; grouping by derived property |
| 6 | [Don't Be Last!](http://www.usaco.org/index.php?page=viewproblem2&cpid=687) | USACO Bronze | Medium | UG ⭐ | combination | Dict aggregation + sort to extract a ranked answer; first combination of Pattern 2 with downstream processing |
| 7 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | LC 128 | Medium | NC150 | **checkpoint** | Pattern 5 — set-guided iteration; only walk chains from their minimum |

**Checkpoint:** LC 128 without hints. After building the set, the question is which elements to walk from. The naive approach (walk from every element) is O(n²). The leap: only start a chain from x if `x - 1 not in s` — i.e., x is a minimum. This gates the inner walk so each element is visited at most once across all chains. The gate is exactly Pattern 5's structure; the inner walk is Pattern 1. Together they give O(n).

### NC150 problems handed off to other modules

- *Product of Array Except Self* (LC 238, NC150) → module 4 (Prefix Sums). It's a forward-and-backward prefix product problem, not a hash problem; NC150 misfiles it.

---

## Common mistakes

- **`x in list` is O(n).** Convert to a `set` before any repeated membership check: `s = set(a)`.
- **Mutable keys raise `TypeError`.** `tuple(sorted(s))`, not `list(sorted(s))`. Same for using a list as a dict key.
- **`Counter` subtraction drops negatives.** `Counter({'a': 1}) - Counter({'a': 2})` gives `Counter()`, not `{'a': -1}`. Don't use subtraction for inequality checks; compare with `==` or check individual counts.
- **`dict[key]` on a missing key raises `KeyError`.** Use `dict.get(key, default)` or test `key in dict` first. `defaultdict` auto-initialises missing keys — useful but can silently create entries you didn't intend.
- **Inserting before checking in complement lookup.** `seen[x] = i` then `seen.get(target - x)` will find `x` itself when `target == 2 * x`. Always check first, insert after.
- **Set iteration order.** Python 3.7+ `dict` is insertion-ordered, but `set` is not. Don't rely on the order elements come out of a `set` — if order matters, convert to a sorted list first.
