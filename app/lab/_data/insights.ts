// Solving Lab — curated insight registry.
//
// These are the canonical "transferable lessons" the Lab teaches. Lab problems
// across all content kinds (algo, puzzle, estimation) reference these via
// `insightTags` on LabProblem. The insight-SR engine (see ../_lib/insight-sr.ts)
// surfaces each insight at calibrated intervals, paired with a FRESH problem
// from the catalog tagged with that insight — the user can't pattern-match the
// URL; they have to recognize the underlying shape in new clothing.
//
// CURATOR NOTE: ids are STABLE kebab-case strings. Do not rename — other
// curator agents reference these as `insightTags` on LabProblem entries.

import type { Insight } from "./types";

export const INSIGHT_REGISTRY: readonly Insight[] = [
  // ── General problem-solving ────────────────────────────────────────────────
  {
    id: "small-example-discovery",
    name: "Hand-trace a Small Example",
    description:
      "Working out n=2, n=3 by hand reveals structure that the abstract problem statement hides. Almost every breakthrough starts here.",
  },
  {
    id: "invariant-search",
    name: "Find an Invariant",
    description:
      "When operations are repeated, look for a quantity that stays fixed across them. Invariants bound what's reachable and often answer feasibility questions outright.",
  },
  {
    id: "monovariant-bounds",
    name: "Monovariant Bounds Termination",
    description:
      "A strictly monotone quantity bounds the number of operations possible. Use it to prove termination or count steps.",
  },
  {
    id: "reverse-the-question",
    name: "Reverse the Question",
    description:
      "When 'distance from X to Y' is hard, try 'distance from Y to X'. The BFS source-set often inverts cleanly, turning many-to-one into one-to-many.",
  },
  {
    id: "frame-as-graph",
    name: "Frame the Problem as a Graph",
    description:
      "Implicit graphs (states, transformations, dependencies) unlock algorithms designed for explicit ones. Nodes = configurations, edges = legal moves.",
  },

  // ── Math / probability ─────────────────────────────────────────────────────
  {
    id: "linearity-of-expectation",
    name: "Linearity of Expectation",
    description:
      "E[sum] = sum of E[X_i] even when the X_i are not independent. The master tool: decompose any expectation into a sum of indicators.",
    relatedModuleIds: ["probability-foundations"],
  },
  {
    id: "tail-sum-identity",
    name: "Tail-Sum Identity",
    description:
      "For nonneg integer X, E[X] = sum over k>=1 of P(X >= k). Turns expectations into a sum of survival probabilities — often easier to compute.",
    relatedModuleIds: ["probability-foundations"],
  },
  {
    id: "conditional-as-ratio",
    name: "Conditional as Ratio",
    description:
      "P(A | B) = P(A and B) / P(B). Conditioning is re-normalizing over the surviving event space — draw the Venn diagram and shrink the universe to B.",
    relatedModuleIds: ["probability-foundations"],
  },
  {
    id: "inclusion-exclusion",
    name: "Inclusion-Exclusion",
    description:
      "|A union B| = |A| + |B| - |A intersect B|; generalizes to n sets with alternating-sign sums over intersections. Use it for counting under overlapping constraints.",
  },
  {
    id: "birthday-paradox-shape",
    name: "Birthday-Paradox Shape",
    description:
      "Probability of a collision grows as O(sqrt(N)) trials per N possibilities, not linearly. Why hash-attack costs are 2^(b/2), not 2^b.",
  },
  {
    id: "indicator-decomposition",
    name: "Decompose into Indicators",
    description:
      "To count or sum-of-expectations, write the quantity as a sum of 0/1 indicators and analyze each one separately. Pairs naturally with linearity of expectation.",
    relatedModuleIds: ["probability-foundations"],
  },

  // ── Algorithmic ────────────────────────────────────────────────────────────
  {
    id: "binary-search-on-answer",
    name: "Binary Search on the Answer",
    description:
      "When the answer space is monotone in a check predicate, binary-search the answer instead of the input. Turns optimization into a sequence of feasibility checks.",
    relatedModuleIds: ["binary-search"],
  },
  {
    id: "exchange-argument",
    name: "Exchange Argument for Greedy",
    description:
      "To prove a greedy choice optimal: show that swapping any pair of choices in any optimal solution cannot improve the objective. The cleanest proof template for greedy.",
    relatedModuleIds: ["greedy"],
  },
  {
    id: "two-pointers-converge",
    name: "Two Pointers from Opposite Ends",
    description:
      "Opposite-end pointers exploit total ordering to drop a dimension. Each step rules out a whole row or column of pairs — O(n) instead of O(n^2).",
    relatedModuleIds: ["two-pointers"],
  },
  {
    id: "sliding-window-monotone-predicate",
    name: "Sliding Window on a Monotone Predicate",
    description:
      "When the predicate is monotone in window size (longer = stricter, or vice versa), the window expands and contracts in one direction. Amortized O(n).",
    relatedModuleIds: ["sliding-window"],
  },
  {
    id: "last-action-reframe",
    name: "Reframe by the Last Action",
    description:
      "For interval DP, choose the LAST action you take in [l..r], not the first. The recursion decouples cleanly because the last action splits the interval at a known point.",
    relatedModuleIds: ["interval-dp"],
  },
  {
    id: "bitmask-state",
    name: "Bitmask the State",
    description:
      "When N is around 20 or fewer, a subset-state bitmask DP often makes a hard-looking problem tractable. 2^N states fit comfortably; transitions are bit operations.",
    relatedModuleIds: ["bitmask-dp"],
  },
  {
    id: "coord-compression",
    name: "Coordinate Compression",
    description:
      "Replace large-value coordinates with their ranks when only relative order matters. Shrinks the structure size from value-range to input-size.",
  },
  {
    id: "amortized-pop",
    name: "Amortized Pop on a Monotonic Stack",
    description:
      "Each element entering a monotonic stack or deque is popped at most once, so total work is O(n) despite worst-case O(n) per push. The amortization is the whole point.",
    relatedModuleIds: ["monotonic-stack", "monotonic-deque"],
  },
  {
    id: "prefix-sums-for-range",
    name: "Prefix Sums for Range Queries",
    description:
      "Precompute cumulative sums so any range sum becomes O(1) via subtraction. Generalizes to 2D and to any associative operation with an inverse.",
    relatedModuleIds: ["prefix-sums"],
  },

  // ── Reasoning ──────────────────────────────────────────────────────────────
  {
    id: "common-knowledge-recursion",
    name: "Common Knowledge vs Shared Knowledge",
    description:
      "What everyone knows that everyone knows... (ad infinitum) differs from what everyone simply knows. This recursion drives the blue-eyes puzzle and many multi-agent paradoxes.",
  },
  {
    id: "backward-induction",
    name: "Backward Induction",
    description:
      "In sequential games with finite horizons, the optimal strategy is found by solving from the LAST move backward. The last move's value is forced; earlier moves are then forced too.",
  },
  {
    id: "information-channel",
    name: "Identify the Information Channel",
    description:
      "Some puzzles' only resource is a side-channel (one light bulb, a single question, k queries). The design is about what information a single bit — or a single observation — can carry.",
  },
  {
    id: "optimal-stopping",
    name: "Optimal Stopping",
    description:
      "When you must commit irreversibly under uncertain future draws, the 1/e rule and its kin balance exploration vs commitment. Skip the first 37%, then take the next best you see.",
  },

  // ── Catalog-driven insights ────────────────────────────────────────────────
  // Below: tags written by the problem curators that didn't yet have a
  // registry entry. Added so every `insightTags` string in the catalog has a
  // matching Insight; each description captures the TRANSFERABLE lesson, not
  // a one-problem summary. New tags can be appended in the same shape.

  // ── Probability + sample-space reasoning ──────────────────────────────────
  {
    id: "conditional-probability",
    name: "Conditional Probability",
    description:
      "When new information arrives, re-normalize on the surviving sample space — don't reuse the prior. Most 'paradoxes' (Monty Hall, two-children, Russian roulette) are conditioning errors in disguise.",
  },
  {
    id: "sample-space-care",
    name: "Care with the Sample Space",
    description:
      "Enumerate the underlying equally-likely outcomes BEFORE conditioning. The trap is conflating 'a random child is a girl' with 'at least one of two children is a girl' — different sample spaces, different answers.",
  },
  {
    id: "information-leak",
    name: "What the Choice Leaks",
    description:
      "An adversary's or referee's action can carry information beyond the literal observation — the host opening a goat door reveals where the car ISN'T. Always ask what a choice rules out.",
  },
  {
    id: "complement-event",
    name: "Compute via Complement",
    description:
      "P(at least one X) is usually easier as 1 - P(no X), and E[max] as a tail-sum 1 - P(max < k). When the direct event is messy, its complement often factors cleanly under independence.",
  },
  {
    id: "complement-trick",
    name: "Complement Trick",
    description:
      "'At least one' phrasing is the tell: compute P(none) and subtract from 1. Works whenever the negated event factors over independent trials.",
  },
  {
    id: "independence",
    name: "Independence Multiplies",
    description:
      "Independent events multiply: P(no 6 in four rolls) = (5/6)^4. The technique only applies once you've verified independence — if the trials condition on each other, factoring breaks.",
  },
  {
    id: "de-mere-paradox",
    name: "De Mere's Paradox",
    description:
      "The Chevalier de Mere's gambling puzzle: P(at least one 6 in 4 rolls) just barely exceeds 1/2, but P(at least one double-6 in 24 rolls of two dice) just barely fails to. Small exponent differences flip the bet.",
  },
  {
    id: "expected-value",
    name: "Expected Value",
    description:
      "E[X] = sum of (value × probability). For uniform {1..n}, EV = (n+1)/2; for geometric with success p, EV = 1/p. Most one-shot probability questions reduce to a single closed-form.",
  },
  {
    id: "expected-value-of-retry",
    name: "Expected Value of Retry",
    description:
      "When a procedure may fail with probability q and you retry, the expected number of trials is 1/(1-q). Rejection sampling pays for exact uniformity with a finite expected wait.",
  },
  {
    id: "uniform-distribution",
    name: "Uniform Distribution Identities",
    description:
      "EV of uniform {1..n} is (n+1)/2; EV of k-th order statistic of n uniforms on [0,1] is k/(n+1); E[|X-Y|] for two uniforms on [0,1] is 1/3. A small set of memorized closed-forms covers most uniform questions.",
  },
  {
    id: "symmetry",
    name: "Symmetry Argument",
    description:
      "If a distribution or process is symmetric in its inputs, the answer often equals the midpoint of support or 1/2 by symmetry alone — no integral needed. Always check for symmetry before computing.",
  },
  {
    id: "symmetry-collapse",
    name: "Symmetry Collapses the Problem",
    description:
      "Many problems with apparent n-dependence collapse to a constant (1/2, 1/3, ...) by symmetry — e.g. the lost-boarding-pass answer is 1/2 for any n ≥ 2. Spot the two equally-likely terminating events.",
  },
  {
    id: "symmetry-trick",
    name: "Symmetry Trick",
    description:
      "Exploit a symmetric mechanism (burning both ends of a rope, pairing HT with TH) to extract a clean fraction or cancel an unknown bias. The symmetry IS the algorithm.",
  },
  {
    id: "symmetry-cancellation",
    name: "Symmetry Cancels Bias",
    description:
      "Pair outcomes that have equal probability for ANY value of the unknown parameter (HT and TH from a biased coin). The bias drops out, leaving a fair process.",
  },
  {
    id: "order-statistics",
    name: "Order Statistics",
    description:
      "For n i.i.d. uniforms on [0,1], the k-th order statistic has mean k/(n+1). The 'n+1 equal segments' picture turns many continuous-uniform expectations into one-line answers.",
  },
  {
    id: "geometric-distribution",
    name: "Geometric Distribution",
    description:
      "Trials until first success with per-trial probability p have mean 1/p and variance (1-p)/p². 'Expected draws until ace' problems are pure geometric.",
  },
  {
    id: "bernoulli-variance",
    name: "Bernoulli Variance",
    description:
      "Bernoulli(p) has variance p(1-p), maximized at p = 1/2 (variance = 1/4). A 0/1 random variable is most unpredictable at the fair-coin balance point.",
  },
  {
    id: "birthday-paradox",
    name: "Birthday Paradox",
    description:
      "Probability of a collision among n samples in a space of N is ~1 - exp(-n²/(2N)) — quadratic in n, not linear. ~50% at n = sqrt(2N ln 2). Count PAIRS, not elements.",
  },
  {
    id: "pairs-not-elements",
    name: "Count Pairs, Not Elements",
    description:
      "Collisions, matches, edges — these scale as C(n,2) = O(n²), not n. Counting the wrong object underestimates by a factor of n. Birthday paradoxes and hash collisions live here.",
  },
  {
    id: "coupled-vs-independent-events",
    name: "Coupled vs Independent Events",
    description:
      "100 independent 50% chances multiply to ~10^-31, but cleverly COUPLING the events (so they share a hidden structure) can lift the joint probability to ~0.31. Look for ways to bind apparently-independent trials.",
  },

  // ── Information theory / communication / channels ─────────────────────────
  {
    id: "information-channels",
    name: "Find a Second Channel",
    description:
      "When one observation can't distinguish enough states, look for a SECOND independent channel (a bulb's temperature, a parity bit, a single light switch). Each channel multiplies your distinguishable outcomes.",
  },
  {
    id: "state-vs-observation",
    name: "State vs Observation",
    description:
      "Count how many bits your observation gives vs how many bits you need to identify the answer. If they don't match, either compress the state or add a channel.",
  },
  {
    id: "information-theoretic-bound",
    name: "Information-Theoretic Bound",
    description:
      "k ternary weighings distinguish 3^k outcomes; k binary observations distinguish 2^k. If your problem has more states than your information capacity, no strategy can succeed — and counting matches feasibility.",
  },
  {
    id: "ternary-search-physical",
    name: "Ternary Information from a Balance",
    description:
      "A pan balance returns one of three outcomes (left, right, equal), so k weighings carry log_3(3^k) trits. Many coin-counterfeit puzzles reduce to assigning each coin a unique ternary signature.",
  },
  {
    id: "parity-as-information",
    name: "Parity as 1 Bit of Information",
    description:
      "A single parity bit (e.g., 'I see an even number of black hats') compresses arbitrary configurations into one observation. Downstream observers update by tracking how the parity has changed.",
  },
  {
    id: "sacrifice-for-channel",
    name: "Sacrifice One to Open a Channel",
    description:
      "The first agent absorbs the uncertainty so the rest can deduce cleanly — e.g. the first hat-prisoner encodes a parity bit at 50/50 cost so 99 others survive with certainty. Trade one expected loss for everyone else's certainty.",
  },
  {
    id: "asymmetric-protocol",
    name: "Asymmetric Protocol",
    description:
      "Give one agent a different role from all others (the COUNTER who alone may turn off the bulb). Symmetric protocols are usually weaker — role asymmetry unlocks unbounded coordination via a 1-bit channel.",
  },

  // ── Reasoning / logic / common knowledge ──────────────────────────────────
  {
    id: "common-knowledge",
    name: "Common Knowledge vs Shared Knowledge",
    description:
      "What everyone knows is weaker than 'everyone knows that everyone knows ... (n levels)'. Announcements can be informationally trivial yet logically transformative — they create the recursion that unlocks induction.",
  },
  {
    id: "recursion-of-knowledge",
    name: "Recursion of Knowledge",
    description:
      "Higher-order knowledge ('A knows that B knows that A knows ...') drives multi-day inference puzzles. The day-count is the recursion depth at which common knowledge finally bottoms out.",
  },
  {
    id: "induction-on-day-count",
    name: "Induction on Day Count",
    description:
      "Multi-day deduction puzzles solve by induction on number of agents: k=1 is trivial; assuming k-1 works, day k must trigger because the absence of a day-(k-1) outcome contradicts the assumption.",
  },
  {
    id: "rational-agent-modeling",
    name: "Model Rational Agents",
    description:
      "Predict what an opponent will do by computing what's optimal for THEM, then best-respond. Game-theoretic puzzles (pirates, prisoners) collapse once each agent's incentive at each step is made explicit.",
  },
  {
    id: "self-referential-question",
    name: "Self-Referential Question",
    description:
      "Ask a question whose truth-value is invariant under who answers — 'what would the OTHER guard say?' makes a knight and a knave produce the same response. Composition of lies cancels.",
  },
  {
    id: "operation-composition",
    name: "Composition of Operations",
    description:
      "Truth composed with lie equals lie; lie composed with lie equals truth. Nesting a question inside another lets unknown identities cancel out. The algebra of operations is the puzzle.",
  },
  {
    id: "equivalence-class-trick",
    name: "Equivalence-Class Trick",
    description:
      "Partition the configuration space into equivalence classes that every agent can recognize from their own (possibly incomplete) view. Pre-agreed class representatives let everyone make the same reference point.",
  },
  {
    id: "axiom-of-choice",
    name: "Axiom of Choice (puzzle uses)",
    description:
      "When uncountably many equivalence classes exist, the axiom of choice lets you pick a representative per class WITHOUT a constructive rule. Required for the infinite-hats puzzle's strategy.",
  },

  // ── Optimization / greedy / scheduling ────────────────────────────────────
  {
    id: "greedy-is-not-optimal",
    name: "Greedy Is Not Always Optimal",
    description:
      "The locally-best move (always send the fastest back) can be globally beaten (pair the two slowest together). When two costly items must each pay a fixed cost, pairing them often dominates.",
  },
  {
    id: "pair-costly-items",
    name: "Pair the Costly Items",
    description:
      "When several expensive items must each cross a fixed-cost barrier, group them so they share the cost in one trip. The naive 'escort each with the cheapest' loses to 'pair the expensive ones'.",
  },
  {
    id: "dominated-elimination",
    name: "Eliminate Dominated Candidates",
    description:
      "Transitive observations rule out candidates who can't possibly be in the top-k (a horse that lost to a horse who isn't top-3 can't be top-3 either). Shrink the candidate set BEFORE the final comparison.",
  },
  {
    id: "explore-vs-exploit",
    name: "Explore vs Exploit",
    description:
      "When you must commit irreversibly under uncertainty, balance exploration (sampling) against exploitation (acting on best-so-far). The secretary problem's 1/e threshold is the canonical answer.",
  },
  {
    id: "proposer-advantage",
    name: "The Proposer Wins",
    description:
      "In stable-matching markets, the side that PROPOSES gets their best-possible-stable partner; the side that disposes gets their worst-possible. Initiative chooses which Pareto-extreme of the stable set you land in.",
  },
  {
    id: "existence-by-construction",
    name: "Existence by Construction",
    description:
      "Prove a solution exists by exhibiting an algorithm that always finds one (Gale-Shapley for stable matching). The constructive proof simultaneously establishes existence and gives a procedure.",
  },
  {
    id: "adversary-thinking",
    name: "Adversary Thinking",
    description:
      "Worst-case puzzles: imagine an adversary controls outcomes to maximize your work. Pigeonhole counts answer 'how many trials before the adversary is forced to give up'.",
  },
  {
    id: "pigeonhole",
    name: "Pigeonhole Principle",
    description:
      "With more pigeons than holes, at least one hole holds two pigeons. Generalizes to 'k+1 trials guarantee a repeat among k buckets' — the backbone of worst-case existence proofs.",
  },

  // ── Stochastic processes / Markov ─────────────────────────────────────────
  {
    id: "markov-chain-states",
    name: "Markov Chain States",
    description:
      "Set up states for 'how much progress have I made toward the pattern', write linear equations for expected time from each state, and solve. Patterns whose suffix overlaps their prefix recur to weaker states on failure.",
  },
  {
    id: "pattern-self-overlap",
    name: "Pattern Self-Overlap",
    description:
      "When the suffix of a pattern overlaps its prefix (HH, HTH, ABAB), false starts after partial matches drop you LESS far back than for non-overlapping patterns. Self-overlap makes waiting time LONGER.",
  },
  {
    id: "pattern-waiting-time",
    name: "Pattern Waiting Time (Conway)",
    description:
      "Expected time until first occurrence of pattern P in fair coin flips is sum of 2^k over self-overlap lengths k (Conway's leading-number formula). HTH ≠ HHH ≠ HTT in expected wait, even at same length.",
  },
  {
    id: "autocorrelation-conway",
    name: "Conway's Autocorrelation Formula",
    description:
      "E[time until pattern P] = sum over k where P matches itself at offset k of 2^k. The 'autocorrelation polynomial' of P encodes the waiting time directly — no Markov chain solve needed.",
  },
  {
    id: "permutation-cycles",
    name: "Permutation Cycle Structure",
    description:
      "A random permutation of n is heavily weighted toward SMALL cycles — P(no cycle longer than n/2) is about 1 - ln(2) ≈ 0.31. Cycle-following strategies inherit this favorable distribution.",
  },
  {
    id: "recursion-to-base-case",
    name: "Recurse to a Trivial Base",
    description:
      "When n=2 or n=3 is solvable by enumeration and the recursion is clean, prove the answer by induction. Many 'independent of n' surprises (like 1/2 for any n in the boarding-pass puzzle) become obvious after n=2.",
  },

  // ── Algorithm complexity prediction ───────────────────────────────────────
  {
    id: "complexity-dominant-term",
    name: "Dominant Term Decides",
    description:
      "At large n, the highest-order term dominates: O(n^2) loses to O(n log n) by orders of magnitude. Always strip lower-order and constant factors first when ranking by speed.",
  },
  {
    id: "big-o-comparison",
    name: "Compare by Big-O Class",
    description:
      "Group competing algorithms by big-O class first; only within the same class do constants and cache behavior matter. The class is the headline; constants are the footnote.",
  },
  {
    id: "constant-factors",
    name: "Constants Still Matter",
    description:
      "Cache locality, branch prediction, and allocations separate algorithms within the same big-O class. Quicksort beats heapsort beats mergesort on average despite all being O(n log n).",
  },
  {
    id: "asymptotic-crossover",
    name: "Asymptotic Crossover",
    description:
      "Big-O dominance kicks in only past a crossover n. For n=1 to ~25, an 'O(n²)' algorithm with constant 1 outruns an 'O(n log n)' algorithm with constant 5. Always check whether n is past the crossover.",
  },
  {
    id: "ops-per-second",
    name: "Ops-Per-Second Calibration",
    description:
      "A tight inner loop runs at ~10^8-10^9 simple ops/sec on a modern CPU. Multiply your op-count by this rate to predict wall-clock; divide your time budget by it to pick the right big-O class.",
  },
  {
    id: "n-budget-mapping",
    name: "n → Algorithm Budget",
    description:
      "n=10^4 → cubic ok; n=10^6 → n log n; n=10^8 → linear only; n=10^18 → log or O(1). The competitive-programming heuristic maps input size to permitted complexity class.",
  },
  {
    id: "n-le-20-bitmask",
    name: "n ≤ 20 → Bitmask DP",
    description:
      "When n is small (≤ ~22), 2^n state DP fits comfortably while n! brute force does not. The 'bitmask DP' family (TSP, held-karp) is the standard answer to 'n is tiny, what algorithm?'.",
  },
  {
    id: "recursive-stack-depth",
    name: "Recursive Space = Stack Depth",
    description:
      "Recursive SPACE is the deepest single chain of calls, not the total node count. fib(n) has exponential time but only linear space; never conflate the two.",
  },
  {
    id: "time-space-decoupling",
    name: "Time and Space Decouple",
    description:
      "Time complexity counts all operations; space counts only what's live at once. A recursive call tree of size T can fit in O(depth) space if we don't memoize — they're independent dimensions.",
  },
  {
    id: "k-sum-pattern",
    name: "k-Sum Pattern",
    description:
      "k-sum on n elements is O(n^(k-1)) once you can sort: 2-sum O(n) (hash), 3-sum O(n²) (fix one + two-pointer), 4-sum O(n³). The hash trick only buys the LAST sum for free.",
  },
  {
    id: "randomized-quicksort-constant",
    name: "Randomized Quicksort Constant",
    description:
      "E[comparisons] ≈ 2n ln n ≈ 1.39 · n log_2 n — about 39% above the information-theoretic lower bound. The constant 2 ln 2 is the price of random pivots.",
  },
  {
    id: "ln-vs-log2",
    name: "ln vs log2",
    description:
      "Convert by ln x = log_2 x · ln 2 ≈ 0.693 · log_2 x. Many closed-form complexities use natural log even though our base-2 intuition is what we want to compare against.",
  },

  // ── Fermi / estimation reasoning ──────────────────────────────────────────
  {
    id: "fermi-decomposition",
    name: "Fermi Decomposition",
    description:
      "Break an unknown quantity into 3-5 multiplicative factors you can each estimate to within one order of magnitude. Independent under-/over-estimates partially cancel; the product is typically accurate to within ~3x.",
  },
  {
    id: "order-of-magnitude",
    name: "Order-of-Magnitude Reasoning",
    description:
      "Track only powers of 10 until the final step. 10^a × 10^b = 10^(a+b) lets you chain factor estimates without arithmetic errors and surfaces order-of-magnitude mistakes loudly.",
  },
  {
    id: "unit-conversion",
    name: "Disciplined Unit Conversion",
    description:
      "Carry units through every step; resolve them only at the end. Catches errors where a body-mass-in-grams accidentally becomes body-mass-in-kg, silently changing the answer by 10^3.",
  },
  {
    id: "chained-estimates",
    name: "Chained Estimates",
    description:
      "Reuse a Fermi result as input to the next problem (10^14 cells × 2 m DNA/cell). Each chain link adds another order-of-magnitude factor; comparing to a familiar reference (Earth-Sun distance) keeps it memorable.",
  },
  {
    id: "upper-bound-sanity-check",
    name: "Upper-Bound Sanity Check",
    description:
      "Anchor an estimate with a hard upper bound (population × seconds per lifetime). If your answer exceeds it, you've made a sign or unit error somewhere upstream.",
  },
  {
    id: "sum-of-subsystems",
    name: "Decompose by Subsystems",
    description:
      "For composite estimands (internet energy = data centers + transmission + end devices), estimate each subsystem independently and sum. Catches the case where one subsystem dwarfs the others.",
  },
  {
    id: "volume-ratio",
    name: "Volume-Ratio Fermi",
    description:
      "'How many X fit in Y' = volume(Y) / volume(X), adjusted by a packing factor. The reusable template for everything from golf-balls-in-a-747 to atoms-in-a-grape.",
  },
  {
    id: "packing-density",
    name: "Packing Density",
    description:
      "Real-world packing efficiency is ~0.6-0.74 for spheres (close-pack 0.74, random ~0.64). Multiply naive volume ratios by ~0.65 unless the items are cubes or fluids.",
  },

  // ── Math / search / coordinates / random misc ─────────────────────────────
  {
    id: "change-of-coordinates",
    name: "Change of Coordinates",
    description:
      "Switch to a coordinate system where the quantity of interest is invariant — track fractional position on a stretching rope instead of absolute position. The trivial-looking change often turns the problem into something you already know.",
  },
  {
    id: "harmonic-series-divergence",
    name: "Harmonic Series Diverges",
    description:
      "1 + 1/2 + 1/3 + ... grows like ln n with no upper bound. Slow-but-steady accumulating fractions eventually reach any threshold — the basis of ant-on-rope, coupon-collector, and many 'will it ever finish?' arguments.",
  },
  {
    id: "process-not-position",
    name: "Track the Process, Not the Position",
    description:
      "When a rope burns unevenly you can't predict where 'halfway' is — but a both-ends-lit rope always burns out in half its total time. Track the dynamics, not the static markers.",
  },
  {
    id: "rejection-sampling",
    name: "Rejection Sampling",
    description:
      "To sample uniformly from a non-power-of-2 set, generate from a larger uniform domain and REJECT outcomes outside the target. Trades a finite expected wait for exact uniformity.",
  },
];

export const INSIGHTS_BY_ID: Readonly<Record<string, Insight>> = Object.fromEntries(
  INSIGHT_REGISTRY.map((i) => [i.id, i]),
);
