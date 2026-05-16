import type { LabProblem } from "./types";

// Solving Lab — puzzles, brain teasers, and logic problems.
// These are the "Jane Street first-round" / "Citadel phone screen" class:
// pure reasoning under uncertainty, no coding required. Their job is to train
// the META-LOOP of problem-solving — framing, small cases, invariants,
// information-theoretic bounds, conditional reasoning, backward induction.
//
// Every entry has `kind: "puzzle"` and `requiredModules: []` — puzzles need
// NO algorithmic prereqs and are available from day one. `insightTags` is the
// SR hook: when an insight comes due, the system pulls a fresh problem with
// that tag, forcing the user to recognise the underlying shape without the
// URL or category labels as a crutch.
export const PROBLEMS_PUZZLES: LabProblem[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // WARM-UP (~30%) — short, single-insight, the canonical training reps
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "puzzle-sock-drawer",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Pigeonhole_principle",
    title: "Sock Drawer (Pigeonhole Warm-up)",
    estMinutes: 5,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 1,
    problemStatement:
      "A drawer contains socks in 3 different colors, with many socks of each color. You reach in without looking and pull out socks one at a time. What is the minimum number of socks you must draw to guarantee you have at least one matching pair?",
    canonicalInsight:
      "With k colors of socks and worst-case draws, you need k+1 socks to guarantee a matching pair — the adversary fills each color once before you can force a collision.",
    stuckHints: [
      "What's the WORST the drawer can do to you on each draw?",
      "Could you get unlucky for arbitrarily many draws? Why not?",
      "Count the 'holes' and the 'pigeons'.",
    ],
    insightTags: ["pigeonhole", "adversary-thinking"],
  },
  {
    id: "puzzle-light-switch-bulb",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Three_switches_puzzle",
    title: "Three Switches, One Bulb",
    estMinutes: 10,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 3,
    problemStatement:
      "Outside a room are three light switches. Inside is a single incandescent bulb. The door is closed and you cannot see inside from outside. You may flip the switches in any combination, but you may only enter the room once. After entering, you must correctly identify which switch controls the bulb. How can you always determine the correct switch?",
    canonicalInsight:
      "When you have more states to distinguish than your observation can directly resolve, find a SECOND independent channel — here, the bulb's temperature is an information channel orthogonal to its on/off state, doubling your bits per observation.",
    stuckHints: [
      "How many bits of observation does 'walk in and look' give you?",
      "How many bits do you need to identify the right switch?",
      "What ELSE can you sense about a bulb besides whether it is on?",
    ],
    insightTags: ["information-channels", "state-vs-observation"],
  },
  {
    id: "puzzle-fair-from-biased-coin",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Fair_coin#Fair_results_from_a_biased_coin",
    title: "Fair Coin from a Biased Coin (von Neumann)",
    estMinutes: 12,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "You have a biased coin that lands heads with some unknown probability p (where 0 < p < 1). Using this coin, describe a procedure that produces a fair 50/50 outcome — each result equally likely — using only flips of this biased coin.",
    canonicalInsight:
      "Flip the biased coin twice: HT and TH have IDENTICAL probability p(1-p) regardless of p, so map HT→Heads, TH→Tails, and reflip on HH/TT — symmetry of disagreeing outcomes lets you cancel the unknown bias.",
    stuckHints: [
      "Flip twice. Which two-flip outcomes have equal probability for any p?",
      "What do you do when the two flips match?",
      "Can you cancel the unknown p by pairing outcomes?",
    ],
    insightTags: ["symmetry-cancellation", "rejection-sampling"],
  },
  {
    id: "puzzle-7-from-fair-coin",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Rejection_sampling",
    title: "Pick 1 of 7 Fairly with a Fair Coin",
    estMinutes: 12,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "You have a fair coin and need to pick one of 7 outcomes each with exactly probability 1/7. Describe a procedure using only fair coin flips that achieves this, where each of the 7 outcomes is equally likely.",
    canonicalInsight:
      "Flip 3 times to get a uniform integer in [0, 7]; if it's 7, REJECT and reflip — rejection sampling trades a finite expected wait for exact uniformity, because biasing the 8th outcome would corrupt the other 7.",
    stuckHints: [
      "What's the smallest number of flips that covers 7 outcomes?",
      "What goes wrong if you map the 8th outcome to one of the seven?",
      "How long does it take on average?",
    ],
    insightTags: ["rejection-sampling", "expected-value-of-retry"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STANDARD (~50%) — the meaty middle, one or two observations needed
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "puzzle-12-coins",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Balance_puzzle",
    title: "12 Coins — Counterfeit Detection in 3 Weighings",
    estMinutes: 35,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "You have 12 coins that are identical in appearance. One coin is counterfeit and differs in weight from the genuine coins — it may be heavier or lighter, you don't know which. Using a balance scale (no weights), you may perform at most 3 weighings. How can you always identify the counterfeit coin and determine whether it is heavier or lighter?",
    canonicalInsight:
      "A 3-outcome balance can distinguish at most 3^k states, so 3 weighings → 27 outcomes; you must identify both the coin (12 options) AND its weight direction (2 options) = 24 < 27, so a strategy exists. The CONSTRUCTION is to make each coin land in a different (left, right, off) pattern across the three weighings.",
    stuckHints: [
      "How much information does ONE weighing actually give you?",
      "How many distinct (coin, heavy-or-light) outcomes must you distinguish?",
      "Try to assign each coin a unique 'signature' across the 3 weighings.",
    ],
    insightTags: ["information-theoretic-bound", "ternary-search-physical"],
  },
  {
    id: "puzzle-100-prisoners-boxes",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/100_prisoners_problem",
    title: "100 Prisoners and 100 Boxes",
    estMinutes: 40,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "100 prisoners are each assigned a number 1–100. In a room, 100 boxes are labeled 1–100, each containing a random slip with one prisoner's number. Each prisoner enters the room alone, may open at most 50 boxes, and must find their own number. Prisoners may plan a strategy beforehand but cannot communicate once the process starts. What strategy gives the prisoners the best chance that every single prisoner finds their number?",
    canonicalInsight:
      "Following the permutation cycle from your own number turns 100 INDEPENDENT 50% chances (≈10^-31) into a single global probability — survival ↔ no cycle longer than 50, which happens with probability ≈ 0.31 because the random-permutation cycle-length distribution is heavily weighted toward small cycles.",
    stuckHints: [
      "What's the trivial strategy's success rate? Why is it astronomically small?",
      "What if prisoners could COORDINATE their box choices via a shared rule?",
      "Think of the boxes-and-numbers as a permutation — what's its cycle structure?",
    ],
    insightTags: ["coupled-vs-independent-events", "permutation-cycles"],
  },
  {
    id: "puzzle-100-hats",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Hat_puzzle",
    title: "100 Hats in a Line (Black/White)",
    estMinutes: 30,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "100 prisoners stand in a line. Each is given a hat — either black or white — at random. Each prisoner can see every hat in front of them but not their own or those behind. Starting from the back, each prisoner must publicly call out the color of their own hat. Any prisoner who guesses wrong is executed. Prisoners may discuss strategy beforehand. What strategy maximizes the number of survivors, and how many can be guaranteed to survive?",
    canonicalInsight:
      "The first prisoner sacrifices himself to encode 1 bit of parity (e.g., 'I see an even number of black hats ahead'); every subsequent prisoner deduces their own hat by tracking how the parity has changed — 99 guaranteed correct, 1 at 50%.",
    stuckHints: [
      "The first guesser can't be saved by anyone — what's their best ROLE?",
      "What 1-bit summary of everyone-else's hats would help the next person?",
      "If person k knows the parity of everyone ahead, and hears persons 1..k-1 guess, what can they deduce?",
    ],
    insightTags: ["parity-as-information", "sacrifice-for-channel"],
  },
  {
    id: "puzzle-bridge-and-torch",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Bridge_and_torch_problem",
    title: "Bridge and Torch",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "Four people must cross a bridge at night. They have one torch, and the bridge holds at most two people at a time. Each person walks at a different speed: 1, 2, 5, and 10 minutes. When two people cross together, they go at the slower person's pace. The torch must be walked back for others to cross. What is the minimum total time needed for all four to cross?",
    canonicalInsight:
      "The naive greedy 'always send the fastest back' (17 minutes) is BEATEN by 'send the two slowest together' (15 minutes) — when two costly items must each pay a fixed crossing cost, pairing them so they share that cost dominates pairing each with a cheap escort.",
    stuckHints: [
      "Who has to walk back? Does it have to be the fastest?",
      "Try sending the two SLOWEST together — what happens?",
      "Whose times appear twice in the total, and whose only once?",
    ],
    insightTags: ["greedy-is-not-optimal", "pair-costly-items"],
  },
  {
    id: "puzzle-25-horses-5-tracks",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Tournament_sort",
    title: "25 Horses, 5 Tracks — Top 3 in Min Races",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "You have 25 horses and a track that fits exactly 5 horses per race. Horses always run in the same time, and you have no stopwatch — you can only know the relative finishing order of each race. What is the minimum number of races needed to identify the 3 fastest horses overall?",
    canonicalInsight:
      "7 races suffice — 5 group races + 1 race-of-winners + 1 final among the only horses that COULD still be top-3 (the 2nd of group A, 2nd & 3rd of A's race & winner B's group, etc.). Eliminating dominated horses with transitive reasoning collapses the candidate set from 25 to 6.",
    stuckHints: [
      "After 5 group races + 1 race-of-winners, which horses are PROVABLY not top-3?",
      "Who could still beat the 2nd-place finisher of the winner's group?",
      "How small can you shrink the candidate set for the final race?",
    ],
    insightTags: ["dominated-elimination", "information-theoretic-bound"],
  },
  {
    id: "puzzle-pirates-and-gold",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Pirate_game",
    title: "Pirates and Gold (Backward Induction)",
    estMinutes: 35,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "5 strictly rational, rank-ordered pirates must divide 100 gold coins. The most senior pirate proposes a split; all pirates vote. If at least half vote yes, the split is enacted. Otherwise, the proposer is thrown overboard and the process repeats with the remaining pirates. Pirates prioritize survival first, then maximizing gold, then killing others. What split does the senior pirate propose, and does it pass?",
    canonicalInsight:
      "Solve from the END forward: if only pirate 5 is left, he keeps all 100. Knowing that, with 2 pirates pirate 4 needs only his own vote. Knowing THAT, with 3 pirates pirate 3 bribes pirate 5 with 1 coin... — each step's solution is determined by the NEXT step's known outcome.",
    stuckHints: [
      "What happens if only ONE pirate is left?",
      "If you knew exactly what would happen with k pirates, what would you do with k+1?",
      "What's the cheapest vote each proposer can buy?",
    ],
    insightTags: ["backward-induction", "rational-agent-modeling"],
  },
  {
    id: "puzzle-knights-and-knaves",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Knights_and_Knaves",
    title: "Knights, Knaves, and the Fork in the Road",
    estMinutes: 20,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "You stand at a fork in the road. One path leads to safety; the other to danger. Two guards stand watch — one always tells the truth (a knight), one always lies (a knave) — but you cannot tell them apart. You may ask exactly one question to one guard. What single yes/no question can you ask any guard to reliably learn which path leads to safety?",
    canonicalInsight:
      "Ask a question whose TRUTH-VALUE is invariant under who's answering: 'If I asked the OTHER guard which road leads to safety, what would they say?' — the lie composes with the asked-about lie to cancel out, so both knight and knave produce the same wrong-direction answer; you take the OTHER road.",
    stuckHints: [
      "You don't know which guard is which. What question gives the SAME answer regardless?",
      "Can you nest a question inside another to cancel the lie?",
      "Think about composition of 'truth' and 'lie' as operations.",
    ],
    insightTags: ["self-referential-question", "operation-composition"],
  },
  {
    id: "puzzle-secretary",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Secretary_problem",
    title: "Secretary Problem (37% Rule)",
    estMinutes: 30,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "You are interviewing n candidates for a single position, one at a time in random order. After each interview you must immediately and irrevocably decide to hire or reject that candidate. You can rank any candidate relative to those you've already seen. What strategy maximizes the probability of hiring the single best candidate overall?",
    canonicalInsight:
      "Reject the first n/e candidates outright, then accept the first one better than all those seen — the optimal stopping threshold converges to 1/e ≈ 0.368, the unique balance between 'sampled too few to know the bar' and 'wasted too much of the sequence learning'.",
    stuckHints: [
      "What's the optimal strategy if you had to decide BEFORE seeing any candidate?",
      "What's the optimal strategy if you could see ALL candidates first?",
      "Try a 'sample then pick' threshold strategy — how do you optimize the threshold?",
    ],
    insightTags: ["optimal-stopping", "explore-vs-exploit"],
  },
  {
    id: "puzzle-100-dice-expected-max",
    source: "jane-street",
    url: "https://www.janestreet.com/puzzles/archive/",
    title: "Expected Max of 100 d6 Rolls",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "You roll a fair six-sided die 100 times. What is the expected value of the maximum result across all 100 rolls? Express your answer as an exact fraction or a decimal to at least 4 significant figures.",
    canonicalInsight:
      "E[max] = Σ_{k=1}^{6} P(max ≥ k) by the tail-sum identity = Σ (1 - (k/6)^100) for k=1..6 — turning a 'max of many' question into a sum of survival probabilities is the trick; the answer is essentially 6, since (5/6)^100 ≈ 0.00000012.",
    stuckHints: [
      "P(max ≤ k) is much easier to compute than P(max = k) — why?",
      "Try E[X] = Σ P(X ≥ k) for nonnegative integer X.",
      "What's the probability the max is LESS than 6 over 100 rolls?",
    ],
    insightTags: ["tail-sum-identity", "complement-event"],
  },
  {
    id: "puzzle-expected-flips-hh",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Penney%27s_game",
    title: "Expected Flips Until HH vs. HT",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "You flip a fair coin repeatedly. What is the expected number of flips until you see the pattern HH (two heads in a row)? What about until you see HT (heads then tails)? Which pattern appears sooner on average, and why?",
    canonicalInsight:
      "E[flips until HT] = 4, but E[flips until HH] = 6 — losing the second flip after H restarts you to 'just saw nothing' for HH (the H is wasted) but only to 'just saw H' for HT; overlap with the pattern's own PREFIX is what makes HH slower.",
    stuckHints: [
      "Set up Markov chain states: 'seen nothing', 'seen H', 'done'. Write E[states] equations.",
      "When you're in state 'just saw H' and flip a T, where do you land for each pattern?",
      "What's special about patterns where the suffix overlaps the prefix?",
    ],
    insightTags: ["markov-chain-states", "pattern-self-overlap"],
  },
  {
    id: "puzzle-russian-roulette-chamber",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Conditional_probability",
    title: "Russian Roulette — Spin or Don't Spin?",
    estMinutes: 18,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "A revolver has 6 chambers. Two bullets are loaded into adjacent chambers, and the cylinder is spun randomly. The gun is fired once and you survive — the chamber was empty. You must now fire again. Is it better to spin the cylinder again before firing, leave it as-is and fire, or does it not matter? Justify your answer.",
    canonicalInsight:
      "Two bullets in ADJACENT chambers, one click survived: the surviving chamber sequence eliminates 4 of 6 starting positions; of the 2 remaining, only 1 has a bullet next — so don't spin (P = 1/2 → 1/4 vs. 1/3 if you re-spin).",
    stuckHints: [
      "Enumerate where the 2 adjacent bullets could be (6 rotations).",
      "Cross out the ones inconsistent with 'the first chamber was empty'.",
      "Of what's left, how many fire on the next pull?",
    ],
    insightTags: ["conditional-probability", "sample-space-care"],
  },
  {
    id: "puzzle-airplane-seating",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Airplane_seating_problem",
    title: "Lost Boarding Pass (100 Passengers)",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "A plane has 100 seats. The first passenger lost their boarding pass and sits in a random seat. Each subsequent passenger sits in their assigned seat if available, or otherwise picks a random empty seat. What is the probability that the 100th passenger ends up in their own assigned seat?",
    canonicalInsight:
      "P(last passenger gets their seat) = 1/2 exactly — the answer is independent of n ≥ 2. Reason: the process terminates the moment seat 1 or seat n is taken by a displaced passenger, and by symmetry those two events are equally likely whenever they're both still 'live' options.",
    stuckHints: [
      "Try n=2 by hand. Then n=3. Spot the pattern.",
      "What are the only TWO ways the process can end?",
      "Why is the answer independent of how MANY passengers there are?",
    ],
    insightTags: ["symmetry-collapse", "recursion-to-base-case"],
  },
  {
    id: "puzzle-ant-on-rubber-band",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Ant_on_a_rubber_rope",
    title: "Ant on a Stretching Rubber Band",
    estMinutes: 30,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "An ant starts at one end of a rubber rope that is 1 km long. The ant walks toward the far end at 1 cm/second. After each second, the rope is uniformly stretched by 1 km. Will the ant ever reach the far end? If so, prove it; if not, explain why.",
    canonicalInsight:
      "Track the ant's FRACTIONAL position (it grows additively each second as 1/(t·rope_length_0)) instead of absolute position (which grows linearly with rope). Fractional progress = harmonic series, which diverges — so the ant ALWAYS reaches the end, however slowly.",
    stuckHints: [
      "Why does tracking absolute distance lead nowhere?",
      "What quantity DOESN'T get rescaled when the rope stretches?",
      "What does the ant's position as a FRACTION of total rope length do each step?",
    ],
    insightTags: ["change-of-coordinates", "harmonic-series-divergence"],
  },
  {
    id: "puzzle-rope-burning-45min",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Rope_burning_puzzle",
    title: "Burn Two Ropes to Measure 45 Minutes",
    estMinutes: 15,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "You have two ropes. Each rope takes exactly 60 minutes to burn completely, but they burn unevenly — you cannot use length to measure time. You have a lighter. Using only these two ropes and the lighter, how can you measure exactly 45 minutes?",
    canonicalInsight:
      "Burning a rope from BOTH ends halves its remaining time, regardless of uneven burn rate — exploit the symmetry of two simultaneous burn-fronts to extract clean fractions from a process with no intermediate calibration marks.",
    stuckHints: [
      "How can you measure 30 minutes from a 60-minute rope without knowing where '30 minutes worth' is?",
      "What if you lit BOTH ends of a rope simultaneously?",
      "Combine ropes started at different events.",
    ],
    insightTags: ["symmetry-trick", "process-not-position"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STRETCH (~20%) — multi-step, the FRAMING itself is the hard part
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "puzzle-blue-eyes",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Common_knowledge_(logic)#The_blue_eyes_puzzle",
    title: "Blue Eyes — The Hardest Logic Puzzle in the World",
    estMinutes: 60,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "stretch",
    transferDistance: 3,
    problemStatement:
      "On an island, 100 people have blue eyes and 100 have brown eyes. Everyone can see everyone else's eye color but not their own; no one ever discusses eye colors. Anyone who deduces their own eye color must leave the island that night. One day a visitor announces publicly, 'I can see at least one person with blue eyes.' What happens, and when?",
    canonicalInsight:
      "Common knowledge ≠ shared knowledge: with n blue-eyed islanders, EVERYONE already knows there's a blue-eyed person (for n ≥ 2), but the guru's announcement creates the new fact 'everyone knows that everyone knows... (n levels)' that someone has blue eyes — that n-level recursion of mutual knowledge is what makes day n the suicide day.",
    stuckHints: [
      "Try n=1, n=2, n=3 blue-eyed islanders and trace the days carefully.",
      "Before the guru speaks, what did EVERYONE already know that the guru repeated?",
      "Articulate the difference between 'everyone knows X' and 'everyone knows that everyone knows X'.",
    ],
    insightTags: ["common-knowledge", "recursion-of-knowledge"],
  },
  {
    id: "puzzle-100-prisoners-light-bulb",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/100_prisoners_problem#The_light_bulb_variant",
    title: "100 Prisoners and a Light Bulb",
    estMinutes: 50,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "stretch",
    transferDistance: 3,
    problemStatement:
      "100 prisoners are in solitary cells. Each day, one prisoner (chosen at random, possibly repeating) is brought to a room with a single light bulb that can be toggled on or off. A prisoner may claim that all 100 prisoners have been in the room. If correct, all are freed; if wrong, all are executed. Prisoners may plan a strategy before confinement. What strategy guarantees eventual freedom?",
    canonicalInsight:
      "Elect one COUNTER who is the only person ever allowed to turn the bulb off; every non-counter turns it on EXACTLY ONCE in their life when they enter and find it off. When the counter has switched off 99 times, all prisoners have visited — single-bit channel + role asymmetry gives unbounded communication.",
    stuckHints: [
      "Can prisoners communicate via the bulb if everyone uses it symmetrically?",
      "What if ONE prisoner had a different role from all the others?",
      "How do you count to 99 with only a 1-bit signal?",
    ],
    insightTags: ["information-channels", "asymmetric-protocol"],
  },
];
