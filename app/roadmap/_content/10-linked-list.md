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

When duplicating a structure with cross-references (LC 138: nodes have `random` pointers that can target anything in the list), build a dict `{old_node: new_node}` in one pass, then set `.next` and `.random` pointers in a second pass via dict lookups.

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

### Detect cycle (Floyd's)

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

All NC150. Linked list is the one module where USACO Guide has nothing analogous — interview prep drives the content.

| # | Problem | Source | Difficulty | Role | What it teaches |
|---|---------|--------|-----------|------|-----------------|
| 1 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | LC 206 | Easy | baseline | Pointer manipulation — `prev / curr / nxt` discipline |
| 2 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | LC 21 | Easy | baseline | Dummy head + merge — the subroutine reused in problems 5 and in module 16's LC 23 |
| 3 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | LC 141 | Easy | baseline | Fast/slow pointer — detect cycle in O(1) space |
| 4 | [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | LC 19 | Medium | baseline | Two pointers with a gap — your Step 1 problem |
| 5 | [Reorder List](https://leetcode.com/problems/reorder-list/) | LC 143 | Medium | combination | Find middle (fast/slow) + reverse second half (problem 1) + merge alternating (problem 2) — first multi-pattern problem |
| 6 | [Copy List With Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/) | LC 138 | Medium | extension | Hash map `{old → new}` for cross-referenced duplication — single-pass insufficient because of random pointers |
| 7 | [Find The Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | LC 287 | Medium | extension | Floyd's on an implicit functional graph (`i → a[i]`) — cycle start = duplicate value |
| 8 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | LC 146 | Medium | combination | Doubly linked list + dict — augmented structure; implement the DLL explicitly (not `OrderedDict`) for interview |
| 9 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | LC 23 | Hard | **checkpoint** | Min-heap of `(val, index, node)` tuples; combines problem 2's merge with module 16's heap |

**Checkpoint:** LC 23 without hints. Two ingredients combine: the merge subroutine from problem 2 (extended from k=2 to k=n) and a min-heap (preview of module 16). The implementation detail that catches everyone in Python: `heapq` will compare tuple elements in order; when values tie, it tries to compare `ListNode` objects and raises `TypeError`. Include an integer tiebreaker: `(val, i, node)`.

**Also doable now:** [Add Two Numbers (LC 2)](https://leetcode.com/problems/add-two-numbers/) — simulation with carry; no new technique, useful as a quick warm-up at any point in the ladder.

**Defer to after module 16:** [Reverse Nodes In K Group (LC 25)](https://leetcode.com/problems/reverse-nodes-in-k-group/) — hard pointer manipulation across k nodes at a time; no new pattern, just demanding implementation.

---

## Common mistakes

- **Losing a pointer before saving it.** `curr.next = prev` before `nxt = curr.next` orphans the rest of the list. Save `nxt` first.
- **`fast and fast.next` vs `fast.next and fast.next.next`.** The first stops when `fast` runs off the end; the second stops one step earlier. Use the first for cycle detection and "second middle of even length"; use the second for "first middle of even length".
- **Forgetting the dummy head.** Without a dummy, removing the head requires a special case. With a dummy, the same code handles head-removal and interior-removal uniformly.
- **LC 23 `TypeError`.** Tuples in `heapq` compare element-wise. When two values are equal, Python tries the next field — if it's a `ListNode`, comparison fails. Push `(node.val, i, node)` with `i` as a stable tiebreaker.
