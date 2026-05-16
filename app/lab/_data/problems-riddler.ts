import type { LabProblem } from "./types";

// Solving Lab — Riddler-class puzzles sourced from FiveThirtyEight Riddler,
// classic probability/combinatorics gems, and competition-math puzzles.
// Each puzzle teaches a generalisable lesson — a thinking tool that transfers
// to new problem shapes the user has never seen before.
//
// Sources:
//   • FiveThirtyEight / ABC News Riddler column archive
//   • Wikipedia-documented classic probability paradoxes
//   • AMC 10/12 and AIME competition math (ballot / broken-stick / coupon)
//   • Brilliant.org-class self-contained logic/combinatorics gems
//
// All entries have `kind: "puzzle"` and `requiredModules: []`.
export const PROBLEMS_RIDDLER: LabProblem[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // WARM-UP  — single clean insight, self-contained in under 5 minutes reading
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "riddler-bertrand-box",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Bertrand%27s_box_paradox",
    title: "Bertrand's Box Paradox",
    estMinutes: 12,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "You have three identical-looking boxes. Box 1 contains two gold coins, Box 2 contains two silver coins, and Box 3 contains one gold and one silver coin. You pick a box at random, reach in without looking, and pull out a gold coin. What is the probability that the other coin in the same box is also gold?",
    canonicalInsight:
      "Condition on the COIN drawn, not the box selected — there are 3 gold coins in total, 2 of which live in the all-gold box, so P(other is gold | gold drawn) = 2/3, not 1/2; counting cases without weighting by how many coins produce the observation is the classic error.",
    stuckHints: [
      "Label every coin in all three boxes individually (6 total). Which ones are gold?",
      "Of the gold coins, which ones have a gold partner in the same box?",
      "Why does observing 'gold' make the GG-box more than 1/3 likely?",
    ],
    insightTags: ["conditional-probability", "sample-space-care"],
  },
  {
    id: "riddler-nontransitive-dice",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Nontransitive_dice",
    title: "Non-Transitive Dice (Efron's Dice)",
    estMinutes: 15,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "Four dice: A shows {4,4,4,4,0,0}, B shows {3,3,3,3,3,3}, C shows {6,6,2,2,2,2}, D shows {5,5,5,1,1,1}. A second player always picks AFTER you do. Show that for every die you choose, there exists another die that beats yours with probability 2/3 — and no die is the 'best'.",
    canonicalInsight:
      "Probabilistic dominance is not transitive: A beats B, B beats C, C beats D, and D beats A, each with probability 2/3 — 'better than' in the 'more likely to win' sense can form a cycle, just as rock-paper-scissors does, so choosing first is always a disadvantage.",
    stuckHints: [
      "Compute P(A > B) directly by listing outcomes — A rolls 0 or 4, B always rolls 3.",
      "Try all six pairings. Do you get a consistent ranking?",
      "What does a cycle of dominance imply about 'who should choose first'?",
    ],
    insightTags: ["symmetry", "rational-agent-modeling"],
  },
  {
    id: "riddler-inspection-paradox",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Inspection_paradox",
    title: "The Bus Waiting Time Paradox",
    estMinutes: 15,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "warm-up",
    transferDistance: 2,
    problemStatement:
      "A bus route has buses arriving on average every 10 minutes, but the inter-arrival times are random (exponential). You arrive at a stop at a uniformly random time. Your friend, the bus driver, says the average gap between buses is 10 minutes — so you should expect to wait about 5 minutes. But you consistently wait closer to 10 minutes. Why?",
    canonicalInsight:
      "When you arrive at a random moment you are more likely to land inside a LONG gap than a short one (sampling bias proportional to interval length), so the gap you land in has expected length 2× the average gap — you wait half of that, i.e., the full average, not half of it.",
    stuckHints: [
      "Imagine a day with one 1-minute gap and one 19-minute gap. Where does a random arrival land, on average?",
      "P(landing in a specific interval) is proportional to its length — not uniform over intervals.",
      "E[gap you land in] = E[X²] / E[X] via the size-biased distribution formula.",
    ],
    insightTags: ["sample-space-care", "pairs-not-elements"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STANDARD — one or two non-obvious moves needed
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "riddler-broken-stick-triangle",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Broken_stick_problem",
    title: "Broken Stick — Triangle Probability",
    estMinutes: 20,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "A stick is broken at two independently and uniformly chosen points along its length, creating three pieces. What is the probability that the three pieces can form the sides of a triangle? (The triangle inequality requires that each piece be shorter than the sum of the other two.)",
    canonicalInsight:
      "Draw the unit square of break-point pairs (x, y); the triangle-inequality conditions each piece < 1/2 carve out 4 smaller triangles whose total area is 1/4 — a geometric probability proof that converts three simultaneous inequalities into a 2D region area calculation.",
    stuckHints: [
      "Let the two cut points be x and y on [0,1]. What are the three piece lengths?",
      "Write the three triangle inequalities as conditions on x and y.",
      "Shade the region in the unit square where ALL THREE inequalities hold — what fraction is it?",
    ],
    insightTags: ["symmetry-collapse", "inclusion-exclusion"],
  },
  {
    id: "riddler-simpson-paradox",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Simpson%27s_paradox",
    title: "Simpson's Paradox — When Aggregation Reverses the Winner",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 2,
    problemStatement:
      "Treatment A cures 93% of small kidney stones (81/87) and 73% of large stones (192/263). Treatment B cures 87% of small stones (234/270) and 69% of large stones (55/80). Treatment A is better in BOTH groups separately. Yet when all patients are combined, Treatment B shows an 83% cure rate vs. Treatment A's 78%. How is this possible? Which treatment is actually better?",
    canonicalInsight:
      "A lurking confounding variable (stone size) distributes patients unequally across groups: doctors gave more large-stone (hard) cases to Treatment A, dragging its aggregate average down — the group totals are not directly comparable; always disaggregate by the confounding variable before comparing rates.",
    stuckHints: [
      "Count how many patients each treatment saw with small vs. large stones.",
      "Which treatment was applied more often to the harder cases?",
      "What would happen to A's aggregate rate if it treated the same proportion of each stone size as B?",
    ],
    insightTags: ["information-leak", "indicator-decomposition"],
  },
  {
    id: "riddler-bertrand-paradox-prob",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Bertrand_paradox_(probability)",
    title: "Bertrand's Chord Paradox — Three Answers to One Question",
    estMinutes: 25,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "standard",
    transferDistance: 3,
    problemStatement:
      "An equilateral triangle is inscribed in a circle. A chord is drawn 'at random'. What is the probability that the chord is longer than a side of the triangle? Three natural methods give three different answers: 1/3, 1/2, and 1/4. All three analyses look valid. How can one question have three correct answers?",
    canonicalInsight:
      "The problem is under-specified: 'random chord' depends on WHICH probability measure you place on the space of chords; each method imposes a different invariance (uniform endpoints, uniform radial point, uniform midpoint), and no single choice is forced — this paradox is the canonical demonstration that 'uniform at random' requires specifying a sample space, not just a set of outcomes.",
    stuckHints: [
      "Describe exactly what 'pick a chord uniformly at random' means in each of the three methods.",
      "Each method is self-consistent. Are they describing the same experiment?",
      "What additional physical constraint (e.g., 'invariant under rotation AND translation') would select a unique measure?",
    ],
    insightTags: ["sample-space-care", "conditional-as-ratio"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STRETCH — multi-step or conceptually heavy; the framing IS the trick
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "riddler-buffon-needle",
    source: "puzzle",
    url: "https://en.wikipedia.org/wiki/Buffon%27s_needle_problem",
    title: "Buffon's Needle — π from Dropping Sticks",
    estMinutes: 40,
    kind: "puzzle",
    requiredModules: [],
    difficulty: "stretch",
    transferDistance: 3,
    problemStatement:
      "A floor is ruled with parallel lines spaced d = 1 apart. You drop a needle of length l = 1 at random (uniformly random center position, uniformly random angle). What is the probability that the needle crosses a line? Your answer should involve π — and this gives a Monte Carlo method for estimating π just by counting crossings.",
    canonicalInsight:
      "P(crossing) = 2l/(πd) = 2/π for l = d = 1, because the expected number of crossings equals the needle's projected length in the direction perpendicular to the lines, and this expected value can be computed via linearity of expectation on infinitesimal sub-needles — the π enters through the average projection of a random angle (E[|sin θ|] = 2/π).",
    stuckHints: [
      "Fix the needle's center at distance x from the nearest line. When does the needle cross?",
      "Integrate over all x ∈ [0, d/2] and all angles θ ∈ [0, π]: what is the crossing condition?",
      "Use linearity of expectation: E[# crossings] = sum of E[each small segment crosses]. Then E[|sin θ|] = ∫₀^π sin θ / π dθ — evaluate it.",
    ],
    insightTags: ["linearity-of-expectation", "symmetry"],
  },
];
