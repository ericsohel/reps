import type { StuckMove } from "./types";

// Curated library of generic "thinking moves" the user can deploy when blocked
// on a Lab problem. The set is intentionally small (12 moves) and each move is
// distinct enough that the user can build a personal sense of which ones fit
// which problem shapes. None of these are domain-specific tricks — they are
// meta-strategies, the kind of advice an experienced problem-solver would give
// over the shoulder of a stuck student.
//
// Source notes: Polya's "How to Solve It", Knuth/CLRS exercise commentary,
// competitive programming editorial conventions (Codeforces, AtCoder), and
// the "rubber duck" tradition from software engineering folklore.
export const STUCK_MOVES: readonly StuckMove[] = [
  {
    id: "small-example",
    name: "Write n=2, n=3 by hand",
    description:
      "Pick the smallest possible inputs (n=1, n=2, n=3) and trace what the answer should be, longhand, before writing any code.",
    whenToUse:
      "Use when you can't articulate the operation precisely, or when the problem statement uses abstract language you can't immediately translate to a concrete case.",
    example:
      "On 'count subarrays whose XOR equals k' — write down every subarray of [1, 2, 3] (there are 6), compute each XOR, count manually. Now the pattern you need to detect in O(n) is staring at you.",
  },
  {
    id: "smallest-non-trivial",
    name: "Find the smallest non-trivial input",
    description:
      "Skip the degenerate cases (n=0, n=1) and find the smallest input where the problem is still interesting — usually n=3 or n=4. The mechanics show up here without the noise of a big example.",
    whenToUse:
      "Use when your n=1 case is trivial and gives no insight, but the full problem feels too big to hold in your head.",
    example:
      "On 'minimum swaps to sort a permutation' — n=1 and n=2 are trivial. n=3 with [3,1,2] needs exactly 2 swaps, and you can see directly that swaps = n - (number of cycles), which generalizes.",
  },
  {
    id: "brute-force-first",
    name: "Write the brute force, then optimize",
    description:
      "Write the O(n!) or O(2^n) brute force solution first — actually code it. Then stare at it and ask: what work is being repeated? What subproblems recur? The optimization usually pops out.",
    whenToUse:
      "Use when you can describe a slow solution but can't see the fast one, or when you're stuck searching for clever tricks before you've nailed down the naive approach.",
    example:
      "On 'longest increasing subsequence' — write the O(2^n) 'try every subsequence' version. You'll notice you keep recomputing the same suffix-LIS values. That observation IS the DP recurrence.",
  },
  {
    id: "inverse-problem",
    name: "Ask the inverse problem",
    description:
      "Flip the question: what problem would the answer to mine be the input to? Or: instead of 'find X that maximizes Y', ask 'given Y, can I find X?'.",
    whenToUse:
      "Use when the forward problem feels under-constrained or you have no obvious handle on the objective.",
    example:
      "On 'minimum capacity ship to deliver packages in D days' — instead of computing the minimum capacity directly, ask: 'given capacity C, can we finish in D days?'. The inverse is easy (greedy simulation), so binary search the answer.",
  },
  {
    id: "relax-constraint",
    name: "Drop the hardest constraint",
    description:
      "Identify the single constraint making the problem painful — drop it. Solve the easier problem. Then figure out how to add the constraint back without losing the solution structure.",
    whenToUse:
      "Use when you can solve a similar-looking problem but one specific requirement (online, memory, distinctness, ordering) keeps breaking your approach.",
    example:
      "On 'sliding window median in O(n log k)' — drop the 'online' constraint and just solve 'median of a fixed window' first (sort, take middle). Now ask: how do I maintain that as the window slides? Answer: two heaps.",
  },
  {
    id: "strengthen-assumption",
    name: "Strengthen the assumption",
    description:
      "Pretend the input is the most convenient possible — sorted, all distinct, all positive, a power of 2. Solve that easy version. Then ask whether the assumption was actually load-bearing.",
    whenToUse:
      "Use when the input feels chaotic and you can't even start, or when you suspect the problem doesn't actually depend on the messy parts you're worrying about.",
    example:
      "On 'two-sum' — assume the array is sorted. Two pointers solves it instantly. Going back to unsorted: do you need to sort (O(n log n)) or is there a better way (hash map, O(n))? The assumption clarified the structure.",
  },
  {
    id: "invariant-search",
    name: "Look for an invariant",
    description:
      "Ask: what quantity stays exactly the same after every operation? Invariants are powerful because they let you rule out impossible target states without simulating.",
    whenToUse:
      "Use on transformation puzzles ('can we turn A into B using these moves?') or any problem where you keep simulating and getting nowhere.",
    example:
      "On 'swap adjacent elements to make array sorted' — notice that swapping adjacent elements never changes the parity of inversions. So an odd-inversion input is unsolvable. The invariant (inversion parity) IS the answer.",
  },
  {
    id: "monovariant-search",
    name: "Look for a monovariant",
    description:
      "Find a quantity that strictly increases (or strictly decreases) after every operation. This gives you a bound on the total number of moves, and often proves termination or optimality.",
    whenToUse:
      "Use when you need to prove a process terminates, bound the number of operations, or argue a greedy is optimal.",
    example:
      "On 'each second, every cell becomes max of itself and neighbors — how many seconds until stable?' — the number of distinct values is a monovariant that only decreases. Bounds the answer at O(distinct values).",
  },
  {
    id: "work-backwards",
    name: "Work backwards from the goal",
    description:
      "Start from the desired end state and ask: what is the last move that produces it? Then: what state must we have been in one step before? Recurse.",
    whenToUse:
      "Use on construction problems, reachability puzzles, or any problem where the forward search branches wildly but the goal is uniquely specified.",
    example:
      "On 'reach (x, y) from (0, 0) using moves (a, b) -> (a+b, b) or (a, b+a)' — forward search branches every step. Backward: from (x, y), the previous state was (x-y, y) or (x, y-x). Now it's just gcd-style subtraction (basically the Euclidean algorithm).",
  },
  {
    id: "change-representation",
    name: "Change the representation",
    description:
      "Re-encode the input in a different data structure or form: array as a difference array, graph as a matrix, problem as a game tree, sequence as intervals. The new representation often makes the answer obvious.",
    whenToUse:
      "Use when an operation feels expensive in the current representation, or when the problem 'feels like' something else you know how to solve.",
    example:
      "On 'apply k range-add updates, then answer point queries' — represent the array as a difference array. Each range-add becomes O(1) instead of O(n). Final prefix sum gives the answer.",
  },
  {
    id: "explain-aloud",
    name: "Explain to a rubber duck",
    description:
      "Out loud, explain the problem from scratch to an imaginary listener who knows nothing about it. Note exactly where your explanation gets vague, hedged, or hand-wavy — that's where your understanding is broken.",
    whenToUse:
      "Use when you've been staring at the problem for 15+ minutes and feel mentally fogged, or when you 'almost' have an approach but can't quite pin it down.",
    example:
      "On any problem where you catch yourself saying 'and then we just...' — stop. What is 'just'? If you can't write the next sentence cleanly, that's the actual unsolved subproblem; everything before it was solved.",
  },
  {
    id: "find-the-trick",
    name: "Look for the one key observation",
    description:
      "Competitive-style problems usually have one specific observation that unlocks the whole solution. If you've been brute-forcing for 20+ minutes, you've missed it. Re-read the constraints — they almost always hint at the intended complexity, which hints at the trick.",
    whenToUse:
      "Use when the constraints feel oddly specific (n <= 20 suggests 2^n; n <= 5000 suggests O(n^2); sum of n <= 10^6 suggests amortized) or when the problem is rated harder than your current approach would justify.",
    example:
      "On a problem with n <= 20 — the answer is probably bitmask DP over subsets (2^20 ~= 10^6). Stop trying to find a polynomial solution; the constraint is screaming the technique.",
  },
  {
    id: "try-an-extreme",
    name: "Try an extreme case",
    description:
      "Plug in adversarial inputs: n=1, n=infinity, all-same values, all-distinct values, all-zero, all-negative, fully sorted, fully reversed. Edge cases often expose the structure (or the bug in your current approach).",
    whenToUse:
      "Use when you have a candidate solution but aren't sure it's right, or when the general case feels overwhelming and you need a sanity-check anchor.",
    example:
      "On 'maximum subarray sum' — try all-negative input. If your algorithm returns 0 (the empty subarray), check whether the problem allows that. The extreme case forces you to pin down the exact spec.",
  },
];

// Convenient by-id lookup for callers that already have a moveId in hand.
export const STUCK_MOVES_BY_ID: Readonly<Record<string, StuckMove>> =
  Object.fromEntries(STUCK_MOVES.map((m) => [m.id, m]));
