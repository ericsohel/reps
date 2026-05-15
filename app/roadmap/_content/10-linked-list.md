# Linked List

**Prerequisites:** Arrays & Hashing  
**Unlocks:** (techniques reappear in Trees and Graphs)  
**Patterns introduced:** [fast/slow pointer](00-patterns.md#fast-slow-pointer-floyds-tortoise-and-hare)  
**Patterns reused:** [augmented data structure](00-patterns.md#augmented-data-structure) (LRU's DLL+dict)

---

## Step 1 — Try this first

Open [LC 19 — Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) and attempt it before reading below.

> Given the head of a linked list, remove the nth node from the end and return the head. Do it in **one pass**.

The two-pass solution is immediate — traverse once to count length L, traverse again to stop at position L − n.

The constraint says one pass. The question to carry into Step 2: *you don't know L until you reach the end. But if a second pointer were already n steps ahead of yours, what would happen when *it* reached the end?*

---

## Step 2 — The technique

### Pointer manipulation — save before overwriting

Every linked list operation reduces to manipulating `prev`, `curr`, and `next` pointers. The universal mistake: overwriting `curr.next` before saving it.

```python
next_node = curr.next     # save BEFORE the assignment that destroys it
curr.next = prev          # redirect
prev = curr
curr = next_node
```

### The dummy head

When the head itself might be removed or reassigned, prepend a dummy node so you always operate on `node.next`, never on `node`. Return `dummy.next` at the end. Eliminates the special case for the head.

```python
dummy = ListNode(0, head)
curr = dummy
# ... operate on curr.next throughout
return dummy.next
```

### Fast/slow pointer ([atlas](00-patterns.md#fast-slow-pointer-floyds-tortoise-and-hare))

Two pointers traversing the same structure at different speeds extract structural information without auxiliary storage.

**Cycle detection.** Fast moves 2 steps, slow 1. If a cycle exists, fast eventually laps slow and they meet. If `fast` or `fast.next` becomes `None`, no cycle.

**Find middle.** Same speeds, no cycle. When `fast` reaches the end, `slow` is at the midpoint. For even-length lists, the exact position depends on the stop condition (`fast` vs `fast.next`) — pick the one matching your need.

### Floyd's cycle-start trick

After cycle detection (fast and slow have met inside the cycle), **reset one pointer to `head`** and advance both one step at a time. They meet at the cycle's starting node.

**Why:** let L = distance head → cycle start, C = cycle length, and m = distance cycle start → meeting point. At the meeting moment, slow has travelled L + m, fast has travelled L + m + kC for some integer k. Fast moved twice as fast: 2(L + m) = L + m + kC, so L + m = kC, i.e. L = kC − m. Resetting one pointer to head: that pointer walks L steps to reach the cycle start. The other walks from the meeting point — it's m steps into the cycle, walks L = kC − m more, ending at position m + L = kC (a full loop) past the meeting point = the cycle start. They meet there.

### Two pointers with a gap — answer to Step 1

A specialised fast/slow: same speed, fixed offset. Advance `fast` n steps ahead, then advance both together until `fast` reaches the end. `slow` is now exactly n nodes from the end.

```python
fast = slow = dummy
for _ in range(n):
    fast = fast.next        # gap of n
while fast.next:
    fast = fast.next
    slow = slow.next
slow.next = slow.next.next   # remove the nth from end
```

### Hash map for structural duplication

When duplicating a structure with cross-references (LC 138: nodes have `random` pointers that can target *anything* in the list, including nodes that haven't been visited yet), a single pass can't work — at the moment you copy node `A` whose `random` points to node `Z`, the copy of `Z` doesn't exist yet.

The fix is two passes through one shared dict `{old_node: new_node}`:

```
Original list:  A → B → C → D
                ↑       ↓
                └──random──┘     (A.random = D, C.random = A)

Pass 1: walk the original list. For each old node, allocate a fresh
        new node (value only, no pointers set yet). Insert into the dict.
        dict = {A: A', B: B', C: C', D: D'}

Pass 2: walk the original list again. For each old node `n`:
        new_node = dict[n]
        new_node.next   = dict[n.next]   if n.next   else None
        new_node.random = dict[n.random] if n.random else None
        # Every dict[...] succeeds because pass 1 already populated it.
```

The dict converts "follow a pointer in the old list" into "look up the corresponding new node" — turning the cross-reference problem into two independent linear walks.

### Doubly linked list + dict — LRU Cache ([atlas](00-patterns.md#augmented-data-structure))

LRU needs O(1) get *and* O(1) put-with-eviction. Two structures combined:

- A dict `{key: node}` for O(1) key lookup
- A doubly linked list ordering nodes by recency for O(1) insertion/deletion at any position

This is the [augmented data structure pattern](00-patterns.md#augmented-data-structure) — neither structure alone is enough, but together they cover all operations in O(1).

---

## Step 3 — Read

There is no USACO Guide module for linked lists — this is an interview-focused section. Two targeted reads:

1. CPH Chapter 4.1, p. 39 — brief definition of the data model.
2. [Wikipedia — Floyd's cycle detection, "Tortoise and hare" section](https://en.wikipedia.org/wiki/Cycle_detection#Floyd's_tortoise_and_hare) — the proof of why resetting to head finds the cycle start. Step 2 sketches the algebra; this is the formal version.

---

## Step 4 — Code reference

### Reverse linked list (iterative)

```python
def reverse_list(head):
    # Invariant: `prev` is the head of the already-reversed prefix;
    #            `curr` is the start of the still-original suffix.
    prev, curr = None, head
    while curr:
        nxt = curr.next            # save BEFORE the next line overwrites it
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
```

### Detect cycle (Floyd's, phase 1)

```python
def has_cycle(head):
    # Invariant: slow moves 1 step per iteration, fast moves 2.
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

### Find cycle start (Floyd's, full algorithm)

```python
def cycle_start(head):
    # Phase 1: detect a cycle by collision (slow=1x, fast=2x speed).
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            break
    else:
        return None                         # fast reached the end → no cycle
    # Phase 2: reset one pointer to head; advance both at speed 1.
    # They re-meet exactly at the cycle start (proof: Step 2).
    slow = head
    while slow is not fast:
        slow, fast = slow.next, fast.next
    return slow
```

Note the `while/else` — `else` runs only when the loop completed without `break`, i.e. no cycle was found. Without it, the meeting check has to be repeated awkwardly outside the loop.

### Find middle

```python
def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow    # for even length, returns the second of two middle nodes
```

### Merge two sorted lists

```python
def merge(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            curr.next, l1 = l1, l1.next
        else:
            curr.next, l2 = l2, l2.next
        curr = curr.next
    curr.next = l1 or l2          # attach whichever still has nodes
    return dummy.next
```

### Two-pointer with gap — remove nth from end

```python
def remove_nth(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n):
        fast = fast.next           # gap of n
    while fast.next:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **new** = NC250 / well-known interview problem. USACO Guide has no analogous section — interview prep drives the content here.

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | LC 206 | Easy | NC150 | baseline | Pointer manipulation — `prev / curr / nxt` discipline; reused in problem 6 |
| 2 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | LC 21 | Easy | NC150 | baseline | Dummy head + merge — the subroutine reused in problem 6 and at the checkpoint |
| 3 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | LC 141 | Easy | NC150 | baseline | Fast/slow pointer — detect cycle in O(1) space; phase 1 of Floyd's |
| 4 | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | LC 142 | Medium | new | extension | Floyd's *full* algorithm — phase 2 reset trick that Step 2 derives; return the cycle-start node, not just a boolean |
| 5 | [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | LC 19 | Medium | NC150 | extension | Two pointers with a *fixed gap* — same fast/slow chassis as problem 3 with the gap controlling distance-from-end; your Step 1 problem |
| 6 | [Reorder List](https://leetcode.com/problems/reorder-list/) | LC 143 | Medium | NC150 | combination | Find middle (fast/slow, no gap) + reverse second half (problem 1) + merge alternating (problem 2) — three patterns in one pass |
| 7 | [Copy List With Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/) | LC 138 | Medium | NC150 | extension | Hash map `{old → new}` for cross-referenced duplication — single-pass insufficient because `.random` can point forward |
| 8 | [Find The Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | LC 287 | Medium | NC150 | extension | Floyd's reused on an *implicit* functional graph (`i → a[i]`) — the "list" exists only conceptually; cycle start = duplicate value |
| 9 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | LC 146 | Medium | NC150 | combination | Doubly linked list + dict — the [augmented data structure](00-patterns.md#augmented-data-structure) pattern reused from module 7's Min Stack; implement the DLL explicitly (not `OrderedDict`) for interview |
| 10 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | LC 23 | Hard | NC150 | **checkpoint** | Min-heap of `(val, index, node)` tuples + the merge subroutine from problem 2 |

**Checkpoint:** LC 23 without hints. The synthesis is k-way merge: instead of choosing min(L[i], R[j]) at each step (binary merge), choose min across k current heads (k-way). A min-heap maintains those k heads in O(log k) per pop, giving O(N log k) total for N elements across k lists.

`heapq` from Foundations §3 is the stdlib primitive — no need to wait for module 16. The Python gotcha that catches everyone: `heapq` compares tuple elements in order; when two `val`s tie, Python tries to compare the next field, which is a `ListNode` — `TypeError: '<' not supported`. Include an integer tiebreaker that *is* comparable: push `(node.val, i, node)` where `i` is the list index (or any unique counter). The middle field is never tied across different pushes, so the `ListNode` comparison is never reached.

If you stall: the leap from problem 2 (k=2 merge) to k-way isn't algorithmic — it's "use a heap to scale the same idea". The merge body is otherwise identical.

**Also doable now:** [Add Two Numbers (LC 2)](https://leetcode.com/problems/add-two-numbers/) — simulation with carry. No new technique; useful as a quick warm-up at any point in the ladder.

**Defer:** [Reverse Nodes In K Group (LC 25)](https://leetcode.com/problems/reverse-nodes-in-k-group/) — extends problem 1's reversal to *segments* of length k, leaving the tail (length < k) in place. No new algorithmic pattern; the difficulty is purely implementation — keeping track of the segment-start-prev, the segment-end-next, and the boundary stitching as you reverse each block. Worth doing once you can write problem 1 cold and want a pointer-manipulation stretch.

---

## Common mistakes

- **Losing a pointer before saving it.** `curr.next = prev` before `nxt = curr.next` orphans the rest of the list. Save `nxt` first.
- **`fast and fast.next` vs `fast.next and fast.next.next`.** The first stops when `fast` runs off the end; the second stops one step earlier. Use the first for cycle detection and "second middle of even length"; use the second for "first middle of even length".
- **Forgetting the dummy head.** Without a dummy, removing the head requires a special case. With a dummy, the same code handles head-removal and interior-removal uniformly.
- **LC 23 `TypeError`.** Tuples in `heapq` compare element-wise. When two values are equal, Python tries the next field — if it's a `ListNode`, comparison fails. Push `(node.val, i, node)` with `i` as a stable tiebreaker.
- **LC 142: returning the meeting point instead of the cycle start.** Phase 1's collision happens *inside* the cycle, not at its entrance. You still need phase 2's reset-and-converge step to find the start. Also: compare nodes by identity (`slow is fast`), not value (`slow.val == fast.val`) — duplicate values are common in test inputs.
