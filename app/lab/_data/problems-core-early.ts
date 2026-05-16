import type { LabProblem } from "./types";

// Lab problems whose `requiredModules` fall in roadmap modules 1-15 (core, early half).
// Curated by Agent A. Each problem must NOT duplicate any URL in
// app/roadmap/_data/modules/*.ts.
export const PROBLEMS_CORE_EARLY: LabProblem[] = [
  // -------- arrays-hashing (warm-up tier) --------
  {
    id: "cf-1399-b",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1399/B",
    title: "Gifts Fixing",
    estMinutes: 12,
    requiredModules: ["arrays-hashing"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Combining a candy-and-orange removal costs the same as the max of two separate removals, so total work per gift is max(a_i - min_a, b_i - min_b) — the two coordinates decouple.",
    stuckHints: [
      "What's the cheapest way to reduce one pair (a, b) by (x, y)?",
      "Do the two coordinates ever fight with each other?",
      "What's the global lower bound everyone must hit?",
    ],
  },
  {
    id: "usaco-1060",
    source: "usaco",
    url: "http://www.usaco.org/index.php?page=viewproblem2&cpid=1060",
    title: "Daisy Chains (Bronze)",
    estMinutes: 25,
    requiredModules: ["arrays-hashing"],
    difficulty: "warm-up",
    transferDistance: 2,
    canonicalInsight:
      "The average over a subarray may not be an integer, so multiply through: 'some flower equals sum/length' becomes 'sum equals length × value' — and now you're testing an integer condition against the subarray's actual elements, no floating-point needed.",
    stuckHints: [
      "What's special about the average vs the integer petal counts?",
      "How would you avoid floating-point comparisons?",
      "Can you multiply both sides of the equation?",
    ],
  },

  // -------- prefix-sums --------
  {
    id: "abc-265-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc265/tasks/abc265_d",
    title: "Iroha and Haiku (New Version)",
    estMinutes: 25,
    requiredModules: ["prefix-sums", "arrays-hashing"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Three consecutive subarray-sum constraints become three prefix-sum lookups: for each i, ask whether prefix[i]+P, prefix[i]+P+Q, and prefix[i]+P+Q+R all appear in the set of prefix sums.",
    stuckHints: [
      "What does 'subarray sums to X starting at index i' look like in prefix-sum land?",
      "How would you check existence in O(1)?",
      "Pin down one endpoint and chain the others.",
    ],
  },
  {
    id: "usaco-715",
    source: "usaco",
    url: "https://usaco.org/index.php?page=viewproblem2&cpid=715",
    title: "Why Did the Cow Cross the Road II (Silver)",
    estMinutes: 20,
    requiredModules: ["prefix-sums"],
    difficulty: "warm-up",
    transferDistance: 2,
    canonicalInsight:
      "Translate broken-signal positions into a 0/1 array first — only then does the obvious 'count broken in window' query collapse to a single prefix-sum subtraction over all length-K windows.",
    stuckHints: [
      "What's the cost of a single window if you computed it directly?",
      "What information do consecutive windows share?",
      "What if the input were 1s and 0s instead?",
    ],
  },
  // -------- two-pointers --------
  {
    id: "cf-1352-d",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1352/D",
    title: "Alice, Bob and Candies",
    estMinutes: 20,
    requiredModules: ["two-pointers"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Two pointers converging from opposite ends — the asymmetry isn't in the pointer mechanics, it's in the alternating 'must-strictly-exceed-last-turn' termination per side.",
    stuckHints: [
      "Simulate one turn by hand — what state do you need to remember?",
      "Who eats next is purely alternating; what determines how much they eat?",
      "What stops a single turn?",
    ],
  },
  {
    id: "cf-1399-c",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1399/C",
    title: "Boats Competition",
    estMinutes: 25,
    requiredModules: ["two-pointers", "arrays-hashing"],
    optionalModules: ["sorting"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "The target sum s lives in a tiny range (≤ 2·max(w)), so the answer is max-over-s of (count pairs summing to s) — the outer enumeration on s is what makes the otherwise-quadratic per-pair check tractable.",
    stuckHints: [
      "What's the search space for the target sum?",
      "If you knew the target, how would you count valid pairs?",
      "How big can the target plausibly be?",
    ],
  },

  // -------- sliding-window --------
  {
    id: "abc-229-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc229/tasks/abc229_d",
    title: "Longest X",
    estMinutes: 18,
    requiredModules: ["sliding-window"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "'Replace at most K dots' becomes a longest-window template with the single-integer predicate `dot_count_in_window ≤ K` — the window state collapses to one counter.",
    stuckHints: [
      "What invariant must hold inside a valid window?",
      "What does the window state collapse to?",
      "When the window stops being valid, what's the smallest fix?",
    ],
  },

  // -------- stack --------
  {
    id: "abc-283-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc283/tasks/abc283_d",
    title: "Scope",
    estMinutes: 30,
    requiredModules: ["stack"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Nested scopes map to a stack of letter-sets: push an empty set on `(`, add letters into the top set (failing if already present anywhere), pop the top set and erase its letters on `)`.",
    stuckHints: [
      "What persists across a `(` ... `)` pair from the outside?",
      "What needs to be undone on `)` that wasn't undone before?",
      "How would you check the 'already present' condition cheaply?",
    ],
  },

  // -------- linked-list (Floyd-style implicit graph reasoning lives in `arrays-hashing`,
  // but this slot stays for the enumeration insight) --------
  {
    id: "abc-241-c",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc241/tasks/abc241_c",
    title: "Connect 6",
    estMinutes: 35,
    requiredModules: ["arrays-hashing"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Invert the search: don't enumerate the ≤ 2 paintable cells — enumerate every length-6 line segment (4 directions × O(N²) starts) and accept iff at least 4 of its 6 cells are already black.",
    stuckHints: [
      "What's the answer if the paint budget were 0?",
      "Which kind of object should you enumerate — paint pairs, or candidate winning lines?",
      "How many length-6 lines exist in the grid?",
    ],
  },

  // -------- binary-search --------
  {
    id: "abc-217-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc217/tasks/abc217_d",
    title: "Cutting Woods",
    estMinutes: 30,
    requiredModules: ["binary-search"],
    optionalModules: ["arrays-hashing"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Maintain the sorted set of cut positions in a dynamic sorted container; a length query is `next_cut(x) - prev_cut(x)`, two bisect calls — no segment tree needed.",
    stuckHints: [
      "What information about cuts do you need to answer a length query?",
      "Could you binary-search inside a structure you keep updated?",
      "What does the piece containing x look like in terms of neighbouring cuts?",
    ],
  },

  // -------- bit-manip --------
  {
    id: "abc-269-c",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc269/tasks/abc269_c",
    title: "Submask",
    estMinutes: 20,
    requiredModules: ["bit-manip"],
    difficulty: "warm-up",
    transferDistance: 2,
    canonicalInsight:
      "Iterating submasks via `s = (s - 1) & N` (starting at s = N, stopping after s = 0) costs exactly 2^popcount(N) steps and mechanically skips the bit positions N doesn't set.",
    stuckHints: [
      "How many submasks are there as a function of popcount(N)?",
      "What does `s - 1` do to the bit pattern just above the lowest set bit?",
      "What does `& N` enforce after each subtraction?",
    ],
  },
  {
    id: "abc-244-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc244/tasks/abc244_d",
    title: "Swap Hats",
    estMinutes: 30,
    requiredModules: ["foundations"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Each swap is a transposition and flips permutation parity; 10^18 is even, so reachability collapses to 'do S and T have the same parity?'. The astronomical operation count is a red herring.",
    stuckHints: [
      "What is the smallest invariant a single swap changes?",
      "Does the count of swaps matter, or only its parity?",
      "Try n = 3 by hand for both same- and different-parity targets.",
    ],
  },

  // -------- bs-on-answer / foundations enumeration --------
  {
    id: "abc-227-c",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc227/tasks/abc227_c",
    title: "ABC Tuple",
    estMinutes: 30,
    requiredModules: ["foundations"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Under A ≤ B ≤ C, A ranges up to cube_root(N) and B up to sqrt(N/A); for each (A,B) the count of valid C is `floor(N/(A·B)) - B + 1`. The cube/square bounds make N = 10^11 tractable.",
    stuckHints: [
      "What ranges can A, B, C realistically take given A ≤ B ≤ C and ABC ≤ N?",
      "If you fix A and B, what's the count of valid C?",
      "What's the largest A can be? The largest B given A?",
    ],
  },

  // -------- backtracking --------
  {
    id: "cf-1118-c",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1118/C",
    title: "Palindromic Matrix",
    estMinutes: 35,
    requiredModules: ["arrays-hashing"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "A palindromic n×n matrix partitions cells into orbits of size 4 (corner mirror group), 2 (axis-of-symmetry pairs when n is odd), and 1 (the centre). Greedily place numbers into the largest-orbit class first, consuming exactly that many copies per pick.",
    stuckHints: [
      "How many distinct 'roles' does a cell play under the symmetry?",
      "What multiplicity constraint does each role impose on counts?",
      "Try n=3 and n=4 by hand.",
    ],
  },
  {
    id: "abc-275-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc275/tasks/abc275_d",
    title: "Yet Another Recursive Function",
    estMinutes: 25,
    requiredModules: ["backtracking"],
    optionalModules: ["arrays-hashing"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "The recursion only ever halves or thirds, so the set of arguments visited is sparse (≈ O(log²N)) — recurse with a dict memo on N itself; an array-DP up to 10^18 is impossible but also unnecessary.",
    stuckHints: [
      "How many distinct values does the recursion actually visit?",
      "Could you cache the results without preallocating an array?",
      "What's the depth of the recursion?",
    ],
  },

  // -------- trees --------
  {
    id: "cf-1490-d",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1490/D",
    title: "Permutation Transformation",
    estMinutes: 20,
    requiredModules: ["backtracking"],
    optionalModules: ["trees"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "The tree's construction rule is recursive by definition; mirror it — recurse on the array slice, find the max as root, recurse on the left and right halves, and pass depth downward.",
    stuckHints: [
      "Read the tree-build rule literally — what's the recursive structure?",
      "What state needs to flow downward?",
      "What's the base case?",
    ],
  },
  {
    id: "abc-274-c",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc274/tasks/abc274_c",
    title: "Ameba",
    estMinutes: 15,
    requiredModules: ["trees"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Each amoeba's parent is given directly, so depth[child] = depth[parent] + 1 in a single forward pass over the inputs — no recursion, no graph build, just a parent array.",
    stuckHints: [
      "What does each input line tell you directly?",
      "If you know depth[parent], what's depth[child]?",
      "Can you process the amoebas in order?",
    ],
  },

  // -------- heap --------
  {
    id: "abc-234-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc234/tasks/abc234_d",
    title: "Prefix K-th Max",
    estMinutes: 18,
    requiredModules: ["heap"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Keep a min-heap of size K, fed one element at a time: push, then pop-min while size > K. The heap's root is the K-th largest of the prefix, at O(log K) per step.",
    stuckHints: [
      "Which K elements of the prefix do you actually need?",
      "What invariant on heap size lets the top answer the query?",
      "Could you avoid resorting from scratch each step?",
    ],
  },

  // -------- stretch: prefix-sum with two-scan span on a transformed problem --------
  {
    id: "cf-1547-e",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1547/E",
    title: "Air Conditioners",
    estMinutes: 50,
    requiredModules: ["prefix-sums", "sorting"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Rewrite the per-cell answer as min over j of (t_j + |a_j - i|); split |a_j - i| by direction so it becomes a forward pass (best 'so-far' temperature increased by 1 each step) and a backward pass (same from the right), then take the min of the two arrays.",
    stuckHints: [
      "Try n = 3 and walk left-to-right by hand — what's the cheapest 'AC influence' arriving from the left?",
      "Can you split |a_j - i| into the two cases a_j ≤ i and a_j > i?",
      "What pattern do you know that produces a forward-and-backward scan?",
    ],
  },

  // -------- stretch: tries-style or string + multi-source BFS --------
  {
    id: "cf-1283-d",
    source: "codeforces",
    url: "https://codeforces.com/problemset/problem/1283/D",
    title: "Christmas Trees",
    estMinutes: 40,
    requiredModules: ["heap"],
    optionalModules: ["arrays-hashing"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Treat positions as nodes in an implicit line graph and run a multi-source BFS from every tree at distance 0; expand to nearest unoccupied integers in distance order, and the first m fresh positions popped are the optimal placement (sum of their pop distances is the answer).",
    stuckHints: [
      "What's special about the positions claimed at distance d from any tree?",
      "Could you reuse a classic graph algorithm if you defined the right graph?",
      "What guarantees you don't double-count positions claimed by two trees?",
    ],
  },
];
