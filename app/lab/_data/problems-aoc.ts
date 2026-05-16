import type { LabProblem } from "./types";

// Solving Lab — Advent of Code + Project Euler problems with rich mathematical
// or structural insights. These are NOT routine implementation exercises; each
// problem's key move is a non-obvious mathematical observation (LCM, CRT,
// modular arithmetic, polynomial interpolation, etc.) that transfers to a
// wide class of problems.
//
// AoC problems: `source: "custom"` (AoC is not in the LabSource enum).
//   Real source noted in the title comment.
// Project Euler: `source: "project-euler"` (in enum).
//
// Kind guide:
//   kind: "algo"   — still requires coding / submission on the judge
//   kind: "puzzle" — can be solved with pure mathematical reasoning, no coding

export const PROBLEMS_AOC: LabProblem[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ADVENT OF CODE  (source: "custom")
  // ══════════════════════════════════════════════════════════════════════════

  // ── AoC 2019 Day 12 — The N-Body Problem ──────────────────────────────────
  {
    id: "aoc-2019-12",
    source: "custom",
    url: "https://adventofcode.com/2019/day/12",
    title: "AoC 2019 Day 12 — N-Body Problem (Period Finding via LCM)",
    estMinutes: 40,
    kind: "algo",
    requiredModules: ["number-theory"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "The three spatial axes (x, y, z) evolve completely independently under this gravity rule, so you can find the period of each axis separately and take the LCM. The problem looks like a brute-force simulation until you notice the dimensional decoupling — the same pattern appears in any system whose state space is a Cartesian product of independent sub-systems.",
    stuckHints: [
      "How many independent variables does the gravity update rule touch at once — one per axis, or all three?",
      "Write the update rule for x velocities only. Does it reference y or z at all?",
      "Once you have three separate periods T_x, T_y, T_z, when is the JOINT state first repeated?",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2019 Day 22 — Slam Shuffle ───────────────────────────────────────
  {
    id: "aoc-2019-22",
    source: "custom",
    url: "https://adventofcode.com/2019/day/22",
    title: "AoC 2019 Day 22 — Slam Shuffle (Modular Linear Functions)",
    estMinutes: 60,
    kind: "algo",
    requiredModules: ["number-theory"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Every shuffle operation (reverse, cut, deal-with-increment) is a linear function of position mod deck-size: f(x) = (a·x + b) mod n. Multiple shuffles COMPOSE as affine maps, so the entire sequence collapses to a single (a, b) pair. To repeat the shuffle k times, use fast modular exponentiation on the composed map — O(log k) instead of O(k·sequence_length). The pattern: 'chain of structured operations repeated many times' → collapse to one algebraic structure, exponentiate.",
    stuckHints: [
      "Write each of the three operations as a formula: new_pos = f(old_pos). What form do they share?",
      "If f(x) = ax+b and g(x) = cx+d, what is g(f(x))? What form is that?",
      "You need to apply the composed map 101741582076661 times. What algorithm handles 'apply function k times' efficiently?",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2020 Day 13 — Shuttle Search (CRT) ───────────────────────────────
  {
    id: "aoc-2020-13",
    source: "custom",
    url: "https://adventofcode.com/2020/day/13",
    title: "AoC 2020 Day 13 — Shuttle Search (Chinese Remainder Theorem)",
    estMinutes: 35,
    kind: "algo",
    requiredModules: ["number-theory"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Part 2 asks for a timestamp t such that bus id_i departs at time t+offset_i — i.e. t ≡ −offset_i (mod id_i) for each bus. This is a system of simultaneous congruences. When the moduli are pairwise coprime (which they are — all bus IDs in the input are prime), CRT guarantees a unique solution mod the product and gives an O(n·log(max_mod)) algorithm. The transferable pattern: 'find X satisfying multiple remainder constraints' = CRT.",
    stuckHints: [
      "Rewrite 'bus departs at t+offset_i' as a congruence on t modulo the bus ID.",
      "If you have t ≡ r1 (mod m1) and t ≡ r2 (mod m2) with gcd(m1,m2)=1, how do you combine them into one congruence?",
      "The moduli in the input are all prime — does that simplify the CRT combination step?",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2020 Day 23 — Crab Cups (Linked List DS Insight) ─────────────────
  {
    id: "aoc-2020-23",
    source: "custom",
    url: "https://adventofcode.com/2020/day/23",
    title: "AoC 2020 Day 23 — Crab Cups (O(1) vs O(n) per Move)",
    estMinutes: 30,
    kind: "algo",
    requiredModules: ["linked-list"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Part 1 (9 cups, 100 moves) fits in a naive array. Part 2 (1 000 000 cups, 10 000 000 moves) demands O(1) per removal and insertion: a next[] array indexed by cup label serves as an implicit circular linked list. The key move: when you need O(1) arbitrary insertion/deletion into a sequence, and elements have small integer labels, an index-as-pointer array IS a linked list without the heap overhead.",
    stuckHints: [
      "What does each move actually DO to the sequence? Removal of 3, insertion elsewhere — how many pointer updates?",
      "Can you represent 'next cup after cup k' in O(1) with a single array?",
      "Why does naive array-shift fail at 10M moves on 1M elements?",
    ],
    insightTags: ["frame-as-graph"],
  },

  // ── AoC 2021 Day 21 — Dirac Dice (DP over Game States) ───────────────────
  {
    id: "aoc-2021-21",
    source: "custom",
    url: "https://adventofcode.com/2021/day/21",
    title: "AoC 2021 Day 21 — Dirac Dice (Memoized Game-State DP)",
    estMinutes: 35,
    kind: "algo",
    requiredModules: ["dp-intro", "game-theory"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Part 2 explodes the game into 'quantum universes': each 3-die roll splits into 27 branches. The naive count is astronomically large, but the GAME STATE (pos1, pos2, score1, score2, whose_turn) has only ~4·4·21·21·2 ≈ 14 000 distinct values. Memoize the number of universes where each player wins from every state — the entire problem collapses to table lookup. Pattern: if the state space is small even though the branching factor is large, DP over states beats tree enumeration.",
    stuckHints: [
      "What information is needed to determine the future of the game from any point? List it explicitly.",
      "How many distinct values can each component of the state take? Is the total state count manageable?",
      "The three dice can each be 1,2,3 — how many (d1,d2,d3) triples are there and what sums do they produce?",
    ],
    insightTags: ["bitmask-state", "backward-induction"],
  },

  // ── AoC 2021 Day 23 — Amphipod (Dijkstra on Implicit State Graph) ─────────
  {
    id: "aoc-2021-23",
    source: "custom",
    url: "https://adventofcode.com/2021/day/23",
    title: "AoC 2021 Day 23 — Amphipod (Dijkstra on State Space)",
    estMinutes: 60,
    kind: "algo",
    requiredModules: ["shortest-paths"],
    difficulty: "stretch",
    transferDistance: 2,
    canonicalInsight:
      "The puzzle is a minimum-cost rearrangement problem that looks like a physical puzzle but IS a shortest-path problem on an implicit graph: states = complete configurations of amphipod positions, edges = legal single-move transitions with costs. Once you realize 'state' fits in memory and you can enumerate neighbors, Dijkstra runs cleanly. The lesson: whenever you have a minimum-cost sequence of moves with variable costs, ask 'does this state graph fit in memory?' — if yes, Dijkstra handles it.",
    stuckHints: [
      "What uniquely determines 'where the game is at'? Can you represent that as a data structure?",
      "How do you enumerate all legal next moves from a given configuration?",
      "Is there a useful lower-bound heuristic for A* (each amphipod's minimum distance to its room)?",
    ],
    insightTags: ["frame-as-graph"],
  },

  // ── AoC 2022 Day 17 — Pyroclastic Flow (Cycle Detection) ─────────────────
  {
    id: "aoc-2022-17",
    source: "custom",
    url: "https://adventofcode.com/2022/day/17",
    title: "AoC 2022 Day 17 — Pyroclastic Flow (Cycle Detection)",
    estMinutes: 45,
    kind: "algo",
    requiredModules: ["dp-intro"],
    difficulty: "standard",
    transferDistance: 2,
    canonicalInsight:
      "Part 2 asks for height after 1 000 000 000 000 rocks — impossible to simulate directly. The simulation is driven by two finite cycles (5 rock shapes, L jet instructions) so the system state is periodic. Key move: hash the visible top of the tower + rock_index + jet_index; when the same triple recurs you've found the period. Then height = (full_cycles × period_height) + tail_height, computed in O(L·5) not O(10^12). Pattern: 'very large step count, deterministic rule' → detect the cycle, extrapolate.",
    stuckHints: [
      "What determines the future of the simulation at any moment? How many bits is that state?",
      "When does the system definitely repeat? Bound the period from above.",
      "Once you have period P and per-period height gain H, write the formula for height after N rocks.",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2023 Day 8 — Haunted Wasteland (LCM Cycle Detection) ─────────────
  {
    id: "aoc-2023-08",
    source: "custom",
    url: "https://adventofcode.com/2023/day/8",
    title: "AoC 2023 Day 8 — Haunted Wasteland (LCM Simultaneous Cycles)",
    estMinutes: 25,
    kind: "algo",
    requiredModules: ["number-theory"],
    difficulty: "warm-up",
    transferDistance: 2,
    canonicalInsight:
      "Part 2 has multiple 'ghost' walkers that must all land on **Z-ending nodes simultaneously. Each walker has its own cycle length. The earliest simultaneous arrival is the LCM of those cycle lengths. The problem requires recognizing that the input is specifically crafted so each walker's Z-hit times form a perfectly regular cycle — the LCM shortcut only works because of this (non-obvious) structural property of the puzzle input.",
    stuckHints: [
      "Simulate one starting node and record every step count where you land on a **Z node.",
      "Does each ghost's Z-hit pattern look periodic? With what period?",
      "If ghost A hits Z every T_A steps and ghost B every T_B steps, at what step do they coincide?",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2023 Day 21 — Step Counter (Quadratic Polynomial Fit) ────────────
  {
    id: "aoc-2023-21",
    source: "custom",
    url: "https://adventofcode.com/2023/day/21",
    title: "AoC 2023 Day 21 — Step Counter (Quadratic Extrapolation)",
    estMinutes: 60,
    kind: "algo",
    requiredModules: ["dp-2d"],
    difficulty: "stretch",
    transferDistance: 3,
    canonicalInsight:
      "Part 2 asks for reachable plots after 26 501 365 steps on an infinite tiling — impossible to simulate. The actual input has a diamond-clear path from start to edge (no rocks blocking the axis), making the reachable count a QUADRATIC function of full-grid-widths traversed. Sample the BFS at steps n, n+W, n+2W (W = grid width) to get three data points, fit the unique quadratic, and evaluate at the target. Pattern: when a quantity grows polynomially in a structured way, three samples determine the polynomial.",
    stuckHints: [
      "How does the reachable area scale after the 'light' reaches a grid boundary and starts filling the next copy?",
      "Run BFS and record reachable count at steps 65, 65+131, 65+262 (the real input's dimensions). Plot it.",
      "Three points uniquely determine a quadratic. Write the Lagrange interpolation formula for three points.",
    ],
    insightTags: ["small-example-discovery"],
  },

  // ── AoC 2016 Day 15 — Timing is Everything (CRT) ─────────────────────────
  {
    id: "aoc-2016-15",
    source: "custom",
    url: "https://adventofcode.com/2016/day/15",
    title: "AoC 2016 Day 15 — Timing is Everything (CRT Congruences)",
    estMinutes: 25,
    kind: "algo",
    requiredModules: ["number-theory"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Each disc gives a constraint: (t + disc_number + initial_pos) ≡ 0 (mod num_positions). The problem is a clean system of linear congruences — exactly Chinese Remainder Theorem. The puzzle doesn't say 'use CRT'; the modular constraint structure forces it. Whenever you have 'find X such that X+k_i ≡ 0 (mod m_i) for several i', you're looking at CRT.",
    stuckHints: [
      "Write the constraint for disc i: what must (t + i + start_i) equal modulo num_positions_i?",
      "Simplify each constraint to the form t ≡ r_i (mod m_i). What is r_i?",
      "Use sieving: start with t satisfying the first constraint, then filter by the second, and so on.",
    ],
    insightTags: ["invariant-search"],
  },

  // ── AoC 2018 Day 12 — Subterranean Sustainability (Cellular Automaton Shift)
  {
    id: "aoc-2018-12",
    source: "custom",
    url: "https://adventofcode.com/2018/day/12",
    title: "AoC 2018 Day 12 — Subterranean Sustainability (Steady-State Shift)",
    estMinutes: 30,
    kind: "algo",
    requiredModules: ["dp-intro"],
    difficulty: "standard",
    transferDistance: 3,
    canonicalInsight:
      "Part 2 asks for the sum of pot indices after 50 000 000 000 generations. The cellular automaton reaches a 'translating steady state': the pattern stops changing shape and just slides right by a fixed offset per generation. Detect this by comparing the SET of relative plant positions between consecutive generations — once they match, the pattern is just shifting. Then: sum = (initial_sum_at_steady_gen) + (shift_per_gen × remaining_gens). Pattern: 'simulation for huge N' → detect when qualitative behavior simplifies.",
    stuckHints: [
      "Simulate 200 generations and print the plant pattern each time. What do you notice after ~100?",
      "Define the 'shape' of a generation as plant positions shifted so the leftmost is 0. When does the shape stop changing?",
      "Once shape is fixed, each generation just shifts the whole pattern. By how much per step?",
    ],
    insightTags: ["invariant-search", "monovariant-bounds"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECT EULER  (source: "project-euler")
  // ══════════════════════════════════════════════════════════════════════════

  // ── PE 1 — Multiples of 3 or 5 (Inclusion-Exclusion + Gauss) ─────────────
  {
    id: "pe-001",
    source: "project-euler",
    url: "https://projecteuler.net/problem=1",
    title: "PE 1 — Multiples of 3 or 5 (Gauss + Inclusion-Exclusion)",
    estMinutes: 10,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 1,
    problemStatement:
      "Find the sum of all natural numbers below 1000 that are multiples of 3 or 5. (Example: multiples of 3 or 5 below 10 are 3, 5, 6, 9; their sum is 23.)",
    canonicalInsight:
      "Sum of multiples of k below N = k·(1+2+…+⌊(N-1)/k⌋) = k·m·(m+1)/2 where m=⌊(N-1)/k⌋. Apply inclusion-exclusion: S(3) + S(5) − S(15). This O(1) formula generalizes to 'sum of multiples of any set below N' and is the foundation of many number-theory optimizations.",
    stuckHints: [
      "What is the sum 1 + 2 + ... + m in closed form?",
      "Multiples of 3 AND 5 are multiples of what?",
      "Can you compute the answer without a loop?",
    ],
    insightTags: ["inclusion-exclusion"],
  },

  // ── PE 9 — Special Pythagorean Triplet (Parametric Form) ──────────────────
  {
    id: "pe-009",
    source: "project-euler",
    url: "https://projecteuler.net/problem=9",
    title: "PE 9 — Special Pythagorean Triplet (Euclid's Parametric Form)",
    estMinutes: 15,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "A Pythagorean triplet satisfies a² + b² = c² with a < b < c. There exists exactly one triplet with a + b + c = 1000. Find the product abc.",
    canonicalInsight:
      "Every primitive Pythagorean triple has the form a = m²−n², b = 2mn, c = m²+n² for integers m > n > 0 with gcd(m,n)=1 and m−n odd. Substituting the sum constraint gives a linear equation in m and n with two unknowns — a double loop over m,n is O(sqrt(N)), far better than triple-nested brute force. The parametric form is the key that unlocks all Pythagorean-triple problems.",
    stuckHints: [
      "Can you express all three of a, b, c in terms of two parameters m and n?",
      "Substitute a+b+c=1000 into the parametric form — what equation do you get?",
      "m+n must divide 500; loop over valid m and solve for n.",
    ],
    insightTags: ["small-example-discovery"],
  },

  // ── PE 15 — Lattice Paths (Binomial Coefficients) ─────────────────────────
  {
    id: "pe-015",
    source: "project-euler",
    url: "https://projecteuler.net/problem=15",
    title: "PE 15 — Lattice Paths (Binomial Coefficient C(2n, n))",
    estMinutes: 10,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "Starting in the top-left corner of a 20×20 grid, moving only right or down, how many routes are there to the bottom-right corner?",
    canonicalInsight:
      "Any path makes exactly 20 right-moves and 20 down-moves in some order — a total of 40 moves. Counting paths = counting which 20 of the 40 steps are 'right': C(40, 20). No DP needed. The general lesson: grid-path counting on an m×n grid is always C(m+n, m) — recognize this pattern and skip the table.",
    stuckHints: [
      "How many total moves does any valid path make from corner to corner?",
      "What varies between paths — the total count or just the ORDER of moves?",
      "In how many ways can you choose 20 positions (for 'right') from 40 slots?",
    ],
    insightTags: ["inclusion-exclusion"],
  },

  // ── PE 26 — Reciprocal Cycles (Multiplicative Order of 10 mod n) ──────────
  {
    id: "pe-026",
    source: "project-euler",
    url: "https://projecteuler.net/problem=26",
    title: "PE 26 — Reciprocal Cycles (Multiplicative Order mod n)",
    estMinutes: 20,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "The decimal fraction 1/7 has a 6-digit repeating cycle: 0.142857142857... Find the value of d < 1000 for which 1/d contains the longest recurring decimal cycle.",
    canonicalInsight:
      "The cycle length of 1/d (after removing any leading non-repeating part) equals the multiplicative order of 10 modulo d — the smallest k > 0 with 10^k ≡ 1 (mod d). This only applies when gcd(d, 10) = 1; factors of 2 and 5 produce the non-repeating prefix. The multiplicative order is the key quantity in many modular periodicity problems: hash-table period analysis, RSA key sizes, linear-feedback shift registers.",
    stuckHints: [
      "Simulate long division for 1/7 and record the remainders. When does a remainder repeat?",
      "If remainder r at step k equals remainder r at step j < k, the cycle length is k − j. When does remainder 1 recur?",
      "What does it mean for 10^k ≡ 1 (mod d)? Can you loop over k to find the smallest such k?",
    ],
    insightTags: ["invariant-search"],
  },

  // ── PE 35 — Circular Primes (Sieve + Rotation Set) ────────────────────────
  {
    id: "pe-035",
    source: "project-euler",
    url: "https://projecteuler.net/problem=35",
    title: "PE 35 — Circular Primes (Sieve of Eratosthenes + Rotation)",
    estMinutes: 20,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "A circular prime is one where all rotations of its digits are also prime (e.g. 197 → 197, 971, 719, all prime). How many circular primes are there below one million?",
    canonicalInsight:
      "Build a boolean prime-sieve array in O(N log log N). Then for each prime p, generate all digit-rotations and check membership in the sieve — O(digits) per rotation. This 'build-a-set-then-query' pattern is more powerful than testing primality per rotation individually. The deeper lesson: whenever you need to answer many 'is X in class C?' queries, precompute a membership table for C rather than re-running the test each time.",
    stuckHints: [
      "How do you generate all digit-rotations of an integer?",
      "What property must ALL rotations of a circular prime have (besides being prime)?",
      "Build the sieve once; then each candidate's rotations are O(log N) membership lookups.",
    ],
    insightTags: ["inclusion-exclusion"],
  },
];
