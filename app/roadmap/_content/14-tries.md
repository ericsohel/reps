# Tries

**Prerequisites:** Trees  
**Unlocks:** (none directly in v1)  
**Patterns introduced:** none new (trie is a specialised tree)  
**Patterns reused:** [augmented data structure](00-patterns.md#augmented-data-structure) (LC 421's XOR trie nodes carry bit values)

---

## Step 1 — Try this first

Open [LC 208 — Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) and attempt it before reading below.

> Implement three operations:
> - `insert(word)` — add a word
> - `search(word)` — return True if the exact word was inserted
> - `startsWith(prefix)` — return True if any inserted word begins with `prefix`

Try implementing it with a `set` of strings:

```python
class Trie:
    def __init__(self): self.words = set()
    def insert(self, w):  self.words.add(w)
    def search(self, w):  return w in self.words
    def startsWith(self, p):
        return any(w.startswith(p) for w in self.words)    # O(n × L) per query
```

This works but `startsWith` is linear in the number of stored words. For 10⁴ queries over 10⁴ words it just about runs; for any heavier load it falls apart.

The question to carry into Step 2: *what's redundant about your storage? Many stored strings share common prefixes — does your data structure exploit that, or store every prefix repeatedly across different words?*

---

## Step 2 — The technique

### The trie — share prefixes by storing characters as nodes

A trie stores strings character by character. Each node represents one character; paths from root to a marked node spell a stored word. Common prefixes between words share the same path.

```
insert("app"), insert("apple"), insert("api")

root
 └─ 'a'
     └─ 'p'
         ├─ 'p' [end]            ← "app"
         │   └─ 'l'
         │       └─ 'e' [end]    ← "apple"
         └─ 'i' [end]             ← "api"
```

Each node has:
- `children`: a dict from character to child node
- `is_end`: True if a complete inserted word ends here

**Insert:** walk one character at a time, creating missing children, mark `is_end` at the last node. O(L).

**Search:** walk one character at a time. Return `is_end` at the end. False if any character is missing. O(L).

**StartsWith:** same walk, return True at the end without checking `is_end`. O(L).

All three are O(L), independent of N (the number of stored words). The space cost is also bounded by total characters across all words — common prefixes pay once.

### Numeric trace — search

Trie above contains `"app"`, `"apple"`, `"api"`. Query `search("apple")`:

```
root → 'a' (exists, descend)
'a'  → 'p' (exists, descend)
'p'  → 'p' (exists, descend)              now at "app" node; is_end=True but not the answer yet
'p'  → 'l' (exists, descend)
'l'  → 'e' (exists, descend)              now at "apple" node
End of word. Check is_end → True. Return True.
```

Query `search("appl")`: walks to the `'l'` node; `is_end` is False there → returns False.  
Query `startsWith("appl")`: walks to the `'l'` node; returns True without checking `is_end`.

### Wildcard search

For LC 211 (`'.'` matches any character), at a `'.'` node branch into every child and recurse:

```python
def dfs(node, i):
    if i == len(word):
        return node.is_end
    c = word[i]
    if c == '.':
        return any(dfs(child, i + 1) for child in node.children.values())
    if c not in node.children:
        return False
    return dfs(node.children[c], i + 1)
```

### Trie + grid DFS

For LC 212 (find all words in a grid), the naive approach is O(words × cells × 4^L). Instead, build *one* trie of all target words and run a single DFS from each cell, using the trie to guide the search. If the trie has no matching child for the current letter, prune that entire branch — the DFS stops immediately.

**Three optimisations** that compound:

1. One DFS guided by the trie, not one DFS per word.
2. Set `node.word = None` when a word is found, so duplicates in the grid don't re-add it.
3. (Optional) Prune leaf nodes from the trie after collection — speeds up future traversals.

### XOR trie (binary trie) — [augmented data structure](00-patterns.md#augmented-data-structure)

A trie over the binary representation of integers. Each node has at most two children (bit 0 and bit 1). Insert numbers bit-by-bit from the most significant bit downward.

To **maximise XOR** of a given number with any inserted number: at each bit, greedily try to follow the *opposite* bit (a 1 if the query bit is 0, and vice versa). If that child exists, descend — the XOR bit at that position is 1 (contributes to a higher result). If not, descend the same-bit child (XOR bit = 0).

This is the [augmented data structure pattern](00-patterns.md#augmented-data-structure) — the trie nodes carry positional bit information, and the greedy descent exploits the structure for O(log V) per query (V = max value).

### When NOT to use a trie

- **String set with no prefix queries:** a plain `set` is simpler and faster (O(L) average, constant overhead). Reach for a trie only when prefix queries dominate.
- **Sorted prefix lookups, no wildcards:** `sorted(words)` + `bisect_left` (module 10) gives the start of the prefix range in O(log N + L). Cleaner than a trie unless you need wildcard matching.
- **Few words, short alphabet, lots of memory:** a 2D `bool` table can outperform a trie's dict overhead.

---

## Step 3 — Read

There is no USACO Guide module for basic tries (tries appear in Platinum+ as suffix tries / Aho-Corasick / persistent tries — out of v1 scope). Two targeted reads:

1. [LeetCode editorial for LC 208 — Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/editorial/) — visual walkthrough of the node structure. Read before Step 4.
2. CPH Chapter 26.3 (Trie structure) — brief structural definition. Optional.

---

## Step 4 — Code reference

### TrieNode and Trie

```python
class TrieNode:
    __slots__ = ('children', 'is_end')      # small memory win

    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        # Invariant: at iteration i, `node` represents the prefix word[:i]
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.is_end                  # exact-word query

    def starts_with(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node.children:
                return False
            node = node.children[c]
        return True                          # prefix-only — don't check is_end
```

### Wildcard search (LC 211)

```python
def search(self, word):
    def dfs(node, i):
        if i == len(word):
            return node.is_end
        c = word[i]
        if c == '.':
            return any(dfs(child, i + 1) for child in node.children.values())
        if c not in node.children:
            return False
        return dfs(node.children[c], i + 1)
    return dfs(self.root, 0)
```

### Word Search II (trie + grid DFS)

```python
def findWords(board, words):
    root = TrieNode()
    for w in words:                                 # build trie of all targets
        node = root
        for c in w:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.word = w                               # store the word itself at end

    rows, cols = len(board), len(board[0])
    result = []

    def dfs(node, r, c):
        letter = board[r][c]
        if letter not in node.children:
            return
        next_node = node.children[letter]
        if getattr(next_node, 'word', None):
            result.append(next_node.word)
            next_node.word = None                   # avoid duplicate recording

        board[r][c] = '#'                           # mark visited
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                dfs(next_node, nr, nc)
        board[r][c] = letter                        # restore

    for r in range(rows):
        for c in range(cols):
            dfs(root, r, c)
    return result
```

### XOR trie (LC 421)

```python
def findMaximumXOR(nums):
    root = {}
    for num in nums:
        node = root
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            node = node.setdefault(bit, {})

    ans = 0
    for num in nums:
        node = root
        result = 0
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            want = 1 - bit                          # prefer opposite bit
            if want in node:
                result |= (1 << i)
                node = node[want]
            else:
                node = node[bit]
        ans = max(ans, result)
    return ans
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · ⭐ = well-known

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | LC 208 | Medium | NC150 | baseline | The three core operations — your Step 1 problem |
| 2 | [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | LC 211 | Medium | NC150 | extension | Wildcard `'.'` matching via DFS on the trie |
| 3 | [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) | LC 1268 | Medium | ⭐ | extension | Autocomplete — at each prefix, collect up to 3 lexicographically smallest completions |
| 4 | [Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) | LC 421 | Medium | ⭐ | extension | Binary (XOR) trie — different alphabet (bits), different objective (maximise XOR by greedily picking opposite bits) |
| 5 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | LC 212 | Hard | NC150 | **checkpoint** | Trie of target words + single grid DFS guided by trie; three optimisations compound |

**Checkpoint:** LC 212 without hints. The naive (run Word Search from module 12 for each target word) is exponential per word. The leap is recognising that *one* DFS from each cell, guided by a trie of all words, prunes branches with no possible word — turning N independent searches into one guided search. The duplicate-removal trick (`node.word = None`) is necessary because the same word can be found from multiple starting cells.

---

## Common mistakes

- **`startsWith` checking `is_end`.** `startsWith` returns True at the end of the prefix walk regardless of `is_end`. Checking `is_end` would only return True for prefixes that are themselves complete words.
- **Wildcard base case returns `True`.** When `i == len(word)`, return `node.is_end`, not `True`. The pattern `"a."` must match only two-character words ending at that node — `is_end` is the check.
- **Word Search II — restoring the cell.** The `board[r][c] = letter` restore must run after the DFS recursion, not inside the matching branch. Forgetting to restore corrupts subsequent DFS branches.
- **XOR trie bit range.** Use bits 31 down to 0 for typical 32-bit ints. If values fit in 30 bits (≤10⁹), using 30 is enough — but 31 is always safe and one extra iteration is cheap.
- **LC 1268 with `bisect` instead of trie.** `sorted(products)` + `bisect_left` solves this in O(M log M + |searchWord| · log M) without a trie. The trie generalises better (wildcards, deletion) but `bisect` is cleaner for this specific problem. Know both.
