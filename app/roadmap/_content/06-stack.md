# Stack

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Monotonic Stack  
**Patterns introduced:** [augmented data structure](00-patterns.md#augmented-data-structure)  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [LC 20 — Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) and attempt it before reading below.

> Given a string of brackets `()[]{}`, return whether every open bracket is closed by the same type in the correct order.  
> `"()[]{}"` → valid. `"([)]"` → invalid.

This is a correctness problem, not a TLE problem — the naive approach is to count brackets:

```python
def is_valid(s):
    counts = {'(': 0, '[': 0, '{': 0}
    pairs = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in counts:
            counts[c] += 1
        else:
            counts[pairs[c]] -= 1
    return all(v == 0 for v in counts.values())
```

This passes `"()[]{}"` and rejects `"((("` and `")))"`. But it accepts `"([)]"` — opens and closes balance per-type, yet the brackets close out of order. Counting throws away ordering information.

The question to carry into Step 2: *the failure case `"([)]"` has equal opens and closes of every type. What extra information about each open bracket would you need at the moment you encounter the matching close, to reject this sequence?*

---

## Step 2 — The technique

### The stack — LIFO

A stack stores elements with two operations: `push(x)` adds to the top, `pop()` removes from the top. Both O(1). The defining property: **the most recently pushed element is the first to come out** (last-in, first-out).

In Python, a list is a stack: `append` = push, `pop` = pop (returns and removes the last element), `stack[-1]` = peek the top.

### Why a stack solves bracket matching

**Answer to Step 1:** at every closing bracket, you need to know which open bracket was opened *most recently and not yet closed*. That's exactly what `stack[-1]` is — the top is the most recent open.

**Numeric trace** with `"({[]})"`:

```
i=0 '(' : push    stack=['(']
i=1 '{' : push    stack=['(', '{']
i=2 '[' : push    stack=['(', '{', '[']
i=3 ']' : top=='[' matches → pop          stack=['(', '{']
i=4 '}' : top=='{' matches → pop          stack=['(']
i=5 ')' : top=='(' matches → pop          stack=[]
end: stack empty → valid ✓
```

Failing case `"([)]"`:

```
i=0 '(' : push    stack=['(']
i=1 '[' : push    stack=['(', '[']
i=2 ')' : top=='[' ≠ '(' → INVALID
```

### When a stack is the right tool

Three recurring shapes:

1. **Matching pairs across nesting** — closing brackets pair with the most recent unmatched open. Push on open, match-and-pop on close.
2. **Nested context** — a new context opens (open bracket, function call, repeat count); push the *current* state, work on the new state, pop back when the context closes. This is how Decode String (LC 394) unwinds nested repetitions.
3. **Reverse order processing** — anything that needs to process items in the opposite order of arrival. Undo, reverse, RPN evaluation.

### Augmented stacks ([atlas](00-patterns.md#augmented-data-structure))

Sometimes a stack needs to answer a query about its contents — for example, "what's the minimum of all elements currently in the stack?" Walking the stack to compute this is O(n) per query.

The fix: **store extra precomputed state alongside each element**, snapshotted at the moment of push. Each entry carries the running answer for the prefix-of-stack ending at that entry.

```python
stack = []                          # entries: (value, current_min)
def push(x):
    cur_min = min(x, stack[-1][1]) if stack else x
    stack.append((x, cur_min))

def get_min():
    return stack[-1][1]             # O(1)
```

This is the [augmented data structure pattern](00-patterns.md#augmented-data-structure). It reappears in module 8 (a deque whose entries are indices into a precomputed prefix-sum array) and module 9 (an LRU cache's doubly linked list nodes carry key/value).

### Expression evaluation

Reverse Polish Notation puts operators *after* their operands: `3 4 +` means `3 + 4`. A stack handles this by-construction: push numbers, pop two on an operator, push the result. The stack's LIFO order matches the order operators expect.

**Operand order matters:** `stack.pop()` returns the second operand first (it was pushed last). For `a − b` where `a` was pushed before `b`, write `b = stack.pop(); a = stack.pop()`.

---

## Step 3 — Read

There is no USACO Guide module for basic stack — their Gold Stacks page covers monotonic stack only (module 7's reading). Two targeted reads:

1. CPH Chapter 5.2 (Stacks), p. 57 — brief, definitional, covers the bracket-matching example.
2. The implementation of Min Stack you wrote in Step 4 is the augmented-stack reference. Study it carefully before LC 155.

---

## Step 4 — Code reference

### Bracket matching

```python
def is_valid(s):
    # Invariant: stack holds all opens seen so far that have not yet been matched.
    stack = []
    match = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in '([{':
            stack.append(c)
        else:
            if not stack or stack[-1] != match[c]:
                return False
            stack.pop()
    return len(stack) == 0
```

### Min stack (augmented)

```python
class MinStack:
    def __init__(self):
        self.stack = []                       # each entry: (value, running_min)

    def push(self, val):
        cur_min = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, cur_min))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def get_min(self):
        return self.stack[-1][1]              # O(1)
```

### RPN evaluation

```python
def eval_rpn(tokens):
    stack = []
    ops = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),         # truncate toward zero, not floor
    }
    for t in tokens:
        if t in ops:
            b, a = stack.pop(), stack.pop()   # order matters: b was pushed last
            stack.append(ops[t](a, b))
        else:
            stack.append(int(t))
    return stack[0]
```

### Nested decode

```python
def decode_string(s):
    # Invariant: each stack entry (prev_string, repeat_count) is the state
    # outside the current '[ ]' nesting level.
    stack = []
    cur, k = "", 0
    for c in s:
        if c.isdigit():
            k = k * 10 + int(c)
        elif c == '[':
            stack.append((cur, k))
            cur, k = "", 0
        elif c == ']':
            prev, repeat = stack.pop()
            cur = prev + cur * repeat
        else:
            cur += c
    return cur
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · ⭐ = well-known

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | LC 20 | Easy | NC150 | baseline | Push on open, match-and-pop on close; this was your Step 1 problem |
| 2 | [Min Stack](https://leetcode.com/problems/min-stack/) | LC 155 | Medium | NC150 | extension | Augmented data structure — each entry carries `(value, current_min)`; first appearance of the pattern |
| 3 | [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | LC 150 | Medium | NC150 | extension | Expression evaluation — operands on stack, operator pops two |
| 4 | [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/) | LC 735 | Medium | ⭐ | extension | Simulation — each new asteroid processed against the top of the stack; tricky case logic (both survive, both die, one survives) |
| 5 | [Decode String](https://leetcode.com/problems/decode-string/) | LC 394 | Medium | ⭐ | extension | Nested structure — push current `(string, count)` state on `[`, pop and unwind on `]` |
| 6 | [Remove All Adjacent Duplicates In String II](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string-ii/) | LC 1209 | Medium | ⭐ | **checkpoint** | Augmented stack of `(char, run_length)` with threshold pop when `run_length == k` |

**Checkpoint:** LC 1209 without hints. Two ideas combine: the augmented-stack pattern from problem 2 (entries carry a count alongside the value), and a threshold-driven pop logic similar to but distinct from problem 4 (pop when the *count* hits k, not on a specific condition involving the new element). The combination is what makes it harder than either parent problem.

### NC150 problems handed off to other modules

- *Generate Parentheses* (LC 22) → module 12 (Recursion & Backtracking). The recursive structure builds strings by adding `(` while `open < n` and `)` while `close < open` — a backtracking problem that happens to involve brackets, not a stack problem.
- *Daily Temperatures* (LC 739), *Car Fleet* (LC 853), *Largest Rectangle in Histogram* (LC 84) → module 7 (Monotonic Stack). All three need a stack ordered by value, not just LIFO.

---

## Common mistakes

- **Empty stack on `peek` / `pop`.** Check `if not stack: return False` (or your equivalent failure) before `stack[-1]` or `stack.pop()`. An unexpected close bracket on an empty stack is invalid input, not a runtime error.
- **RPN operand order.** `stack.pop()` returns the second operand first. `b = stack.pop(); a = stack.pop()` matches `a OP b`. Forgetting this breaks subtraction and division silently — addition and multiplication look correct.
- **Final emptiness check.** In bracket matching, the loop completing without rejection isn't sufficient — the stack must also be empty (no unmatched opens). Return `len(stack) == 0`, not `True`.
