# Two Pointers

**Prerequisites:** Arrays & Hashing  
**Unlocks:** Sliding Window  
**Patterns introduced:** [monotonic invariant](00-patterns.md#monotonic-invariant), [reduce by fixing one dimension](00-patterns.md#reduce-by-fixing-one-dimension)  
**Patterns reused:** none

---

## Step 1 — Try this first

Open [LC 11 — Container With Most Water](https://leetcode.com/problems/container-with-most-water/) and attempt it before reading below.

> Given n heights, find two bars i and j that maximise the water they trap: `min(height[i], height[j]) * (j - i)`.  
> Constraints: n ≤ 10⁵.

The naive solution:

```python
ans = 0
for i in range(n):
    for j in range(i + 1, n):
        ans = max(ans, min(height[i], height[j]) * (j - i))
```

n = 10⁵ gives ~5 × 10⁹ pair checks — TLE.

The question to carry into Step 2: *the area is `min(left, right) × width`. If you must converge (shrink width), in which direction should you move to give yourself the best chance of finding a larger area downstream?*

---

## Step 2 — The technique

### Converging two pointers — the monotonic invariant ([atlas](00-patterns.md#monotonic-invariant))

Start with `left = 0` and `right = n - 1`. At each step move one pointer inward. The pair you're seeking is always within `[left, right]`, and each step eliminates one candidate — at most O(n) steps total.

The decision of which pointer to move comes from a **monotonic invariant**: moving one pointer in one direction strictly worsens the relevant quantity, so the optimal pair (if it exists) cannot involve that move.

**Answer to Step 1:** the area is capped by the shorter bar. Moving the *taller* bar inward strictly shrinks width while leaving the height cap unchanged — strictly worse. So move the shorter bar; you discard nothing optimal.

```python
left, right = 0, len(height) - 1
ans = 0
while left < right:
    ans = max(ans, min(height[left], height[right]) * (right - left))
    if height[left] < height[right]:
        left += 1
    else:
        right -= 1
```

**Numeric trace** with `heights = [1, 8, 6, 2, 5]`:

```
left=0, right=4: area = min(1,5) * 4 = 4
                 height[0]=1 < height[4]=5 → move left
left=1, right=4: area = min(8,5) * 3 = 15      ← new best
                 height[1]=8 > height[4]=5 → move right
left=1, right=3: area = min(8,2) * 2 = 4
                 height[1]=8 > height[3]=2 → move right
left=1, right=2: area = min(8,6) * 1 = 6
                 height[1]=8 > height[2]=6 → move right
left=1, right=1: stop.

Result: 15.
```

O(n) — one pass.

### Preconditions

Converging two pointers requires a **monotonic relationship between pointer position and the objective**. The two recurring shapes:

- **Sorted array, looking for a pair:** if the sum is too small, move left right (only this can increase it); if too large, move right left. Each direction is forced.
- **Two ends, one dimension capped by the smaller:** container, trapping rain water. Moving the constrained side is the only direction that can possibly improve the answer.

If neither shape applies — if moving a pointer can both increase and decrease the objective unpredictably — this technique doesn't work. (Use a hash structure or sliding window instead.)

### Reduce by fixing one dimension ([atlas](00-patterns.md#reduce-by-fixing-one-dimension))

The 3Sum-style problems reduce a 3-variable search to a 2-variable one. Iterate over one index `i`, then run converging two-pointer on the remaining subarray for the 2-sum that pairs with `a[i]`.

For 3Sum specifically, the deduplication is the non-trivial part: skip `a[i]` if `a[i] == a[i-1]` (same outer choice already tried), and after recording a valid triple, advance `left` and `right` past their duplicates.

### What this module is *not*

Same-direction two pointers — where both pointers move forward and one trails the other — is its own technique. We cover it in module 5 (Sliding Window). Module 4 is converging only.

---

## Step 3 — Read

The USACO Guide's Silver Two Pointers page is the load-bearing reading for this module — it does the formal walkthrough of the sample problems and covers both converging and same-direction (read the converging half here; the same-direction half is reading for module 5).

1. [USACO Guide — Two Pointers (Silver)](https://usaco.guide/silver/two-pointers) — read through the converging examples (CSES 1640 sample). The CF Books / sliding-window section can be skipped until module 5.
2. CPH Chapter 8.1 (Two Pointers), pp. 79–81 — short, language-agnostic complement.

---

## Step 4 — Code reference

### Converging — sorted array two-sum

```python
def two_sum_sorted(a, target):
    # Invariant: the answer pair, if it exists, lies within indices [left, right]
    left, right = 0, len(a) - 1
    while left < right:
        s = a[left] + a[right]
        if s == target:
            return left, right
        elif s < target:
            left += 1          # only direction that increases sum
        else:
            right -= 1         # only direction that decreases sum
    return None
```

### Container with most water

```python
def max_water(height):
    # Invariant: ans is the maximum area among pairs (left', right') with
    # left ≤ left' < right' ≤ right.
    left, right = 0, len(height) - 1
    ans = 0
    while left < right:
        ans = max(ans, min(height[left], height[right]) * (right - left))
        if height[left] < height[right]:
            left += 1          # shorter side limits us — move it
        else:
            right -= 1
    return ans
```

### Fix one + converging — 3Sum

```python
def three_sum(a):
    a.sort()
    result = []
    for i in range(len(a) - 2):
        if i > 0 and a[i] == a[i-1]:
            continue                           # skip duplicate outer choice
        left, right = i + 1, len(a) - 1
        while left < right:
            s = a[i] + a[left] + a[right]
            if s == 0:
                result.append([a[i], a[left], a[right]])
                while left < right and a[left] == a[left+1]:
                    left += 1                  # skip duplicate left
                while left < right and a[right] == a[right-1]:
                    right -= 1                 # skip duplicate right
                left += 1
                right -= 1
            elif s < 0:
                left += 1
            else:
                right -= 1
    return result
```

### Palindrome check

```python
def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True
```

---

## Step 5 — Problems

Sources: **NC150** = NeetCode 150 · **UG** = USACO Guide curated · ⭐ = USACO Guide starred

| # | Problem | Source | Difficulty | List | Role | What it teaches |
|---|---------|--------|-----------|------|------|-----------------|
| 1 | [Sum of Two Values](https://cses.fi/problemset/task/1640) | CSES | Easy | UG ⭐ | baseline | Converging two-sum on sorted array — you solved this in module 2 with a dict (complement lookup); now sort + two pointers, then map back to original indices |
| 2 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | LC 125 | Easy | NC150 | extension | Converging on a string from both ends — character-skipping edge case (filter non-alphanumeric in place) |
| 3 | [Sum of Three Values](https://cses.fi/problemset/task/1641) | CSES | Easy | UG ⭐ | extension | Reduce by fixing one — fix outer index `i`, run two-pointer on the rest |
| 4 | [3Sum](https://leetcode.com/problems/3sum/) | LC 15 | Medium | NC150 | extension | Same skeleton as problem 3 plus deduplication — skip duplicate `a[i]` outer; skip duplicate `left`/`right` after a hit |
| 5 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | LC 11 | Medium | NC150 | extension | Different objective (max area, not match a target). Now solve the Step 1 cold attempt with the monotonic invariant from Step 2 |
| 6 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | LC 42 | Hard | NC150 | **checkpoint** | Converging while maintaining `left_max` and `right_max` simultaneously; combines the monotonic invariant with the [two-scan span](00-patterns.md#two-scan-span) idea from module 3 |

**Checkpoint:** LC 42 without hints. The two-pointer approach maintains running `left_max` and `right_max`. At each step, whichever side has the smaller max determines the water trapped on that side (because the other side guarantees a wall at least as tall). This combines the monotonic invariant (the smaller side decides) with the two-scan span idea (prefix max from the left, suffix max from the right) but in one pass rather than two — that compression is the leap.

---

## Common mistakes

- **Forgetting to sort:** converging two pointers require a sorted array (or another monotonic relationship). On an unsorted array, moving a pointer doesn't change the objective in a predictable direction. If sorting changes the output (e.g., CSES 1640 returns original indices), sort `(value, original_index)` pairs.
- **`while left <= right`:** use `while left < right`. Once they meet there is no pair left.
- **3Sum dedup placement:** skip duplicate outer `a[i]` *after* the first iteration (`if i > 0 and a[i] == a[i-1]`). Skip duplicate `left` and `right` *after* recording a valid triple, before advancing the pointers.
