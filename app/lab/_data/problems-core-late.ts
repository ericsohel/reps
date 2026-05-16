import type { LabProblem } from "./types";

// Lab problems whose `requiredModules` fall in roadmap modules 16-30 (core, later half).
// Curated by Agent B. Each problem must NOT duplicate any URL in
// app/roadmap/_data/modules/*.ts.
export const PROBLEMS_CORE_LATE: LabProblem[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // GREEDY (3)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "lc-1029",
    source: "leetcode",
    url: "https://leetcode.com/problems/two-city-scheduling/",
    title: "Two City Scheduling",
    estMinutes: 25,
    requiredModules: ["greedy"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "When choosing between two options per item with a global count constraint, the right key is the *differential* (cost_a − cost_b), not either cost alone — sort by that delta and the n smallest deltas go to A, the rest to B. Exchange-argument optimal in one line.",
    stuckHints: [
      "Forget the constraint for a moment — if a person had a free choice, what would they pick?",
      "What changes between two people if you swap their assignments?",
      "What number tells you who 'should' go to A?",
    ],
  },
  {
    id: "abc127-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc127/tasks/abc127_d",
    title: "Integer Cards",
    estMinutes: 30,
    requiredModules: ["greedy"],
    optionalModules: ["heap"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Replacing the smallest of n values with a larger candidate, repeated across many offers, is a min-heap operation — but the offer set is given as (count, value) pairs. The reframe: pour all candidate values into a multiset together with the originals, then keep the top n. Sorting all 2·sum(B_j) candidates and taking the largest n works in one pass.",
    stuckHints: [
      "If you only had one operation, what would you do? Now what changes with M operations?",
      "Forget the per-operation cap B_j — what if every offer were unlimited?",
      "Why does the order of operations not matter for the final multiset?",
    ],
  },
  {
    id: "cf-1304-d",
    source: "codeforces",
    url: "https://codeforces.com/contest/1304/problem/D",
    title: "Shortest and Longest LIS",
    estMinutes: 50,
    requiredModules: ["greedy", "lis-lcs"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Constructive problem hiding behind 'LIS' — the trick is that within each maximal '<' run you can pour ascending values, and within each '>' run you pour descending values. For min-LIS: greedily assign decreasing blocks of consecutive integers to each '>'-run (so the LIS length equals the longest '<' run + 1). For max-LIS: mirror by reversing roles. The block-fill insight makes both answers fall out of the same skeleton.",
    stuckHints: [
      "Try the string '<>><<>' by hand — what permutation gives the smallest LIS?",
      "Within a stretch of consecutive '<' characters, what's the LIS length forced to be?",
      "What's the most you'd want to repeat the same pattern across the array?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // INTERVALS (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "lc-1488",
    source: "leetcode",
    url: "https://leetcode.com/problems/avoid-flood-in-the-city/",
    title: "Avoid Flood in The City",
    estMinutes: 45,
    requiredModules: ["greedy", "intervals"],
    optionalModules: ["heap"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Each pair (consecutive rains on the same lake) defines an *interval*; a dry day inside that interval must be assigned to dry exactly one such lake. Question: which lake does today's dry day serve? Greedy answer: the lake whose *next* rain is soonest — earliest-deadline-first scheduling. The whole problem is EDF in disguise; once you see lakes as deadlines, the rest is mechanical.",
    stuckHints: [
      "What does a dry day represent — a slot for what?",
      "If two lakes both need drying and you only have one dry day, which one wins?",
      "Try to reduce this to a classic scheduling problem you already know.",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // GRAPH TRAVERSAL (3)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "cses-1666",
    source: "cses",
    url: "https://cses.fi/problemset/task/1666",
    title: "Building Roads",
    estMinutes: 20,
    requiredModules: ["graph-traversal"],
    optionalModules: ["union-find"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Adding k−1 edges between k components produces one component — and *which* representatives you pick doesn't matter. So the problem reduces to: count connected components, then chain one node from each to the next. Two passes: traversal to count and collect a representative per component, then n−1 print lines.",
    stuckHints: [
      "If you already had the count of components, how would you finish?",
      "Does it matter which two nodes from different components you connect?",
      "What's the minimum number of new edges to merge k components into one?",
    ],
  },
  {
    id: "cses-1668",
    source: "cses",
    url: "https://cses.fi/problemset/task/1668",
    title: "Building Teams",
    estMinutes: 25,
    requiredModules: ["graph-traversal"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Two-team assignment with 'no edge inside a team' is bipartite 2-coloring. BFS/DFS each component, alternate colors; a back-edge to the same color is a contradiction → IMPOSSIBLE. The graph may be disconnected, so iterate over all roots.",
    stuckHints: [
      "Pick a person and put them on team 1. What's forced for their friends?",
      "What kind of cycle makes the assignment impossible?",
      "Is the input graph guaranteed to be connected?",
    ],
  },
  {
    id: "cses-1194",
    source: "cses",
    url: "https://cses.fi/problemset/task/1194",
    title: "Monsters",
    estMinutes: 45,
    requiredModules: ["graph-traversal"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "'You vs. adversarial monsters that mirror your every move' is multi-source BFS in disguise — first BFS from all monsters at once to label each cell with its earliest-monster-arrival time, then BFS from your start visiting only cells whose distance is strictly less. Reconstruct the path by storing parents during the second BFS.",
    stuckHints: [
      "If the monsters all moved before you, when does each cell first become unsafe?",
      "Could you compute that 'unsafe time' for every cell in a single sweep?",
      "Once you have those times, what's the rule for which cells you can step on?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // TOPOLOGICAL SORT (2)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "abc285-d",
    source: "atcoder",
    url: "https://atcoder.jp/contests/abc285/tasks/abc285_d",
    title: "Change Usernames",
    estMinutes: 30,
    requiredModules: ["topo-sort"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "'User i wants to change handle S_i → T_i, no two users may share a handle' is cycle detection on the directed graph where each user contributes the edge S_i → T_i. The renames are achievable iff that graph has no cycle. Topo sort (Kahn's) yields a valid order; the *only* trick is realising the problem is a graph problem at all — no graph is in the input.",
    stuckHints: [
      "If user A wants name X and someone currently has X, what has to happen first?",
      "Try drawing the dependency arrows for a 3-user example with a cycle.",
      "What's the right graph here? Nodes = ? Edges = ?",
    ],
  },
  {
    id: "ac-dp-g",
    source: "atcoder",
    url: "https://atcoder.jp/contests/dp/tasks/dp_g",
    title: "Longest Path (DP G)",
    estMinutes: 20,
    requiredModules: ["topo-sort", "dp-intro"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Longest path in a DAG is one Kahn's pass with a relaxation step: when popping u, do dp[v] = max(dp[v], dp[u] + 1) for each outgoing edge. The topological order is exactly the order DP needs — that's the whole reason DAG-DP exists.",
    stuckHints: [
      "In what order can you safely compute dp[v]?",
      "What goes wrong if there's a cycle? (There isn't here.)",
      "What's the base case for a sink node?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // SHORTEST PATHS (2)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "usaco-861",
    source: "usaco",
    url: "http://www.usaco.org/index.php?page=viewproblem2&cpid=861",
    title: "Fine Dining (USACO 2018 December Gold)",
    estMinutes: 60,
    requiredModules: ["shortest-paths"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Per-cow questions of the form 'can you detour through any haybale within budget Y_i' look like O(N·K) — but adding one virtual super-haybale node, connecting it to every haybale i with edge weight −y_i, and running ONE Dijkstra from this super-node gives, for each pasture, the best (distance − yumminess) over all haybales in O((N+M) log N). The leap is recognising that 'min over haybales of (dist_to_h + dist_h_to_barn − yummy_h)' fits the shortest-path framework with a virtual source.",
    stuckHints: [
      "Run Dijkstra once from the barn. Now what's the condition for cow i to detour via haybale h?",
      "Per-cow scans are too slow — can you fold all haybales into one super-source?",
      "What edge weight do you give the super-source so that yumminess discounts the path?",
    ],
  },
  {
    id: "cses-1202",
    source: "cses",
    url: "https://cses.fi/problemset/task/1202",
    title: "Investigation",
    estMinutes: 45,
    requiredModules: ["shortest-paths"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Single Dijkstra carrying four pieces of state per node: min-cost, count-of-min-cost-paths, min-flights-among-best, max-flights-among-best. When relaxing u → v: if strictly better, overwrite all four; if equal, accumulate count and take min/max of the flight counts. The shape of Dijkstra doesn't change — only what you store at each node.",
    stuckHints: [
      "Run plain Dijkstra. Now: how would you ALSO count paths achieving that min cost?",
      "When two paths reach v with the same cost, what do you do to the count?",
      "Do the four quantities interfere with each other, or are they independent updates?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DP INTRO / 1D (2)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "ac-dp-b",
    source: "atcoder",
    url: "https://atcoder.jp/contests/dp/tasks/dp_b",
    title: "Frog 2 (DP B)",
    estMinutes: 15,
    requiredModules: ["dp-intro"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "Frog 1 had two predecessors per state; Frog 2 has K. The recurrence dp[i] = min over j in [i−K, i−1] of (dp[j] + |h[i] − h[j]|) is the obvious O(NK) extension. The lesson: the *number* of transitions per state is a parameter, not a structural change to the DP.",
    stuckHints: [
      "How would you change the Frog 1 recurrence if K=3?",
      "Is the answer order N×K acceptable for the given limits?",
      "Don't optimise yet — write the naive transition and check it on a small case.",
    ],
  },
  {
    id: "ac-dp-c",
    source: "atcoder",
    url: "https://atcoder.jp/contests/dp/tasks/dp_c",
    title: "Vacation (DP C)",
    estMinutes: 25,
    requiredModules: ["dp-intro"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Adding an 'activity choice' axis turns 1D dp[i] into 2D dp[i][a]; the constraint 'cannot repeat yesterday's activity' means dp[i][a] looks at dp[i−1][b] for b ≠ a. Three small states make the inner max O(1). The point: extra dimensions cost almost nothing when they index a small enumerated set.",
    stuckHints: [
      "What does the state need to remember to enforce the no-repeat rule?",
      "How many activity choices are there per day? Is that small?",
      "Write the recurrence for dp[i][A] in terms of dp[i−1][·] explicitly.",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // LIS / LCS (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "ac-dp-f",
    source: "atcoder",
    url: "https://atcoder.jp/contests/dp/tasks/dp_f",
    title: "LCS (DP F)",
    estMinutes: 30,
    requiredModules: ["lis-lcs"],
    difficulty: "warm-up",
    transferDistance: 1,
    canonicalInsight:
      "LCS plus reconstruction: fill the standard dp[i][j] table, then walk *backward* from (n, m) — when s[i−1] == t[j−1] include the char and step diagonally, otherwise step into whichever neighbour matches dp[i][j]. The backward walk recovers ONE optimal LCS in O(n+m) after the O(nm) fill.",
    stuckHints: [
      "Build the LCS length first (you've seen this).",
      "Now: at cell (i, j), how does the table itself tell you which character to emit?",
      "Walk from the bottom-right corner. Which direction did each cell's value 'come from'?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // KNAPSACK (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "cses-1635",
    source: "cses",
    url: "https://cses.fi/problemset/task/1635",
    title: "Coin Combinations I",
    estMinutes: 25,
    requiredModules: ["knapsack"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Counting *ordered* ways to make sum x with unlimited coin reuse — the loop order is the whole story. Outer loop over amount, inner over coins gives ordered sequences (permutations); the reverse gives unordered combinations. The recurrence is identical; which dimension is outer encodes whether order matters.",
    stuckHints: [
      "What does 'ordered' mean in your DP indexing?",
      "Try x = 3 with coins {1, 2} by hand: does your transition double-count 1+2 and 2+1?",
      "Which loop is outer — amount or coins — and why does it matter?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DP ON TREES (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "cses-1139",
    source: "cses",
    url: "https://cses.fi/problemset/task/1139",
    title: "Distinct Colors",
    estMinutes: 60,
    requiredModules: ["dp-trees"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Naively keeping a set per subtree blows up; merging large sets into small ones is O(n²). Small-to-large merging — always insert the smaller set into the larger — yields O(n log² n) total because each element changes parent set at most log n times. The wider lesson: subtree-aggregation problems with set-valued state are tractable only with this 'merge by absorbing the smaller' discipline.",
    stuckHints: [
      "Each node needs |distinct colors in subtree|. What state propagates upward?",
      "What's expensive about naively merging child sets at the parent?",
      "If you ALWAYS dump the smaller container into the larger, what's the amortised cost per element?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STRINGS (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "cf-977-d",
    source: "codeforces",
    url: "https://codeforces.com/contest/977/problem/D",
    title: "Divide by Three, Multiply by Two",
    estMinutes: 30,
    requiredModules: ["strings", "greedy"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Reorder the given multiset so each consecutive pair satisfies a/3 or 2·a. Key invariant: dividing by 3 strictly reduces the power-of-3 in the prime factorisation, multiplying by 2 leaves it untouched. So sorting by (count_of_3_in_factorisation desc, value asc) gives the unique valid chain. A pure observation problem — once you see the invariant, the code is one sort.",
    stuckHints: [
      "Try the example {4, 8, 6, 3, 12, 9} by hand — what's the chain?",
      "What quantity is monotone along any valid chain?",
      "What changes when you multiply by 2? When you divide by 3?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DESIGN (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "lc-1146",
    source: "leetcode",
    url: "https://leetcode.com/problems/snapshot-array/",
    title: "Snapshot Array",
    estMinutes: 35,
    requiredModules: ["design"],
    optionalModules: ["binary-search"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Snapshotting the whole array on every snap() is the trap — O(length) per snap. Instead, keep per-index history as a sorted list of (snap_id, value) entries; set() appends, get(i, sid) does binary search for the largest snap_id ≤ sid on that index's list. Decouples snapshot count from array length: only changed cells consume memory.",
    stuckHints: [
      "If you snapshot once per second for 10⁵ seconds with one set per snap, what's wasteful?",
      "Per index, what's the smallest amount of history you need to recover any past value?",
      "What lets you find 'most recent snap ≤ q' inside that history in log time?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // UNION-FIND (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "lc-947",
    source: "leetcode",
    url: "https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/",
    title: "Most Stones Removed with Same Row or Column",
    estMinutes: 35,
    requiredModules: ["union-find"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Answer = n − (number of connected components), where two stones are 'connected' iff they share a row or column. The clean way to build those components: introduce a virtual node per row and per column, then union(stone, row_node_x_i) and union(stone, col_node_y_i). Encoding rows and columns as nodes is the trick — it turns the implicit equivalence into linear-time DSU.",
    stuckHints: [
      "Try n = 3 stones forming an L-shape. What's the max you can remove?",
      "What's the answer in terms of connected components?",
      "How do you represent 'shares a row' as edges WITHOUT scanning all pairs?",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DP-2D (1)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "lc-174",
    source: "leetcode",
    url: "https://leetcode.com/problems/dungeon-game/",
    title: "Dungeon Game",
    estMinutes: 40,
    requiredModules: ["dp-2d"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "A forward DP from top-left fails because the optimal *minimum* starting HP depends on the *whole* downstream path — local greed misses cases where a strong room later compensates for a weak one earlier. Solve backward from bottom-right: dp[i][j] = min HP needed when entering (i,j) = max(1, min(dp[i+1][j], dp[i][j+1]) − dungeon[i][j]). Reversing the direction is the entire trick.",
    stuckHints: [
      "Why doesn't a forward DP work here? Try a 1×3 grid: [−2, +10, −5].",
      "What's the boundary condition at the bottom-right cell?",
      "If you knew the min HP needed AFTER stepping into (i,j), what's the min needed BEFORE?",
    ],
  },
];
