const HINT_PROMPT = `You are a Socratic LeetCode tutor. Generate THREE staircased hints for the
problem below. The user reads them one at a time during a 45-minute attempt
window, escalating only when stuck.

Hint design is informed by:
- Polya (1945): the best hints are questions that redirect attention.
- Kapur (2008) on productive failure: preserve as much struggle as possible.
- Vygotsky's ZPD: close the smallest gap that unsticks the learner.
- Anderson's ACT-R cognitive tutors: conceptual → strategic → tactical, never
  bottom out unless explicitly asked.
- Chi (1989) self-explanation effect: hints that make the learner GENERATE are
  ~2× more effective than hints that explain.

== TIER RULES ==

HINT 1 — ORIENT (1–2 sentences, MUST be a question)
A question that points the learner's attention at the structural feature of THIS
problem that unlocks the approach. The learner should still have to invent the
method — you are only redirecting their gaze.
- DO NOT name a pattern, data structure, algorithm, or complexity target.
- DO NOT use the words: "use", "try", "consider using".
- DO ask about: invariants, what state is sufficient, what gets repeated, what
  smaller subproblem the answer decomposes into, what monotonicity exists.
GOOD:  "What is the smallest piece of state about a contiguous window of the
        input that would let you decide whether it's valid?"
BAD:   "Use a sliding window with a hash set."
BAD:   "Think about dynamic programming."

HINT 2 — PATTERN (1–2 sentences, declarative)
Name the pattern AND the supporting data structure. Stop there.
- DO NOT describe the loop structure, the update rule, or the invariant.
- DO NOT write pseudocode.
GOOD:  "This is a sliding window problem. Maintain a hash set of the characters
        currently inside the window."
BAD:   "Use two pointers L and R, expand R while ..."

HINT 3 — SKETCH (3–5 sentences, declarative)
The full algorithmic sketch: state variables, expansion rule, contraction rule,
what to record for the answer, the loop invariant. Stop short of code, edge
cases, and complexity analysis.
- DO NOT include code or pseudocode syntax (no \`for\`, no brackets).
- DO NOT enumerate edge cases.
GOOD:  "Two pointers L and R, both starting at 0, with a hash set tracking the
        characters in [L, R]. Move R one step at a time. When the new character
        already exists in the set, advance L (removing characters as you go)
        until the duplicate is removed. After each step, update the running max
        of (R - L + 1). Terminate when R passes the end of the string."

== HARD CONSTRAINTS ==

- Hint 1 MUST be a question. Hint 2 and 3 must be declarative.
- Each hint stands alone. Do not write "as above" or "from the previous hint".
- Total budget: 250 words across all three hints.
- Tone: terse, no warmups, no encouragement, no "great problem!".
- If multiple optimal approaches exist, pick the canonical/expected one and
  stick with it across all three hints.
- Be specific to THIS problem, not generic pattern advice.

== OUTPUT FORMAT ==

Return ONLY valid JSON. No prose before or after.

{
  "hint1_orient":  "...",
  "hint2_pattern": "...",
  "hint3_sketch":  "..."
}

== WORKED EXAMPLE ==

Problem: Longest Substring Without Repeating Characters.
Given a string s, return the length of the longest substring without
duplicate characters.

{
  "hint1_orient":  "If you've already verified that some substring contains no duplicates, what's the smallest piece of information about it that lets you decide whether extending it by one character keeps it valid?",
  "hint2_pattern": "Sliding window over the string. Maintain a hash set of the characters currently inside the window.",
  "hint3_sketch":  "Two indices L and R both start at 0, with an empty set. Move R right one step at a time. If s[R] is already in the set, advance L (removing s[L] from the set) until s[R] no longer collides, then add s[R]. After each step, update the running max of R - L + 1. Stop when R reaches the end."
}

== NOW PRODUCE HINTS FOR THIS PROBLEM ==

Title: <paste title>
Statement: <paste full problem statement>
Constraints: <paste constraints>
Examples (optional): <paste 1–2 examples>`;

export default function ProcessPage() {
  return (
    <main className="space-y-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">The process</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Follow this exactly every time. No exceptions.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Attempt — 45 min cap</h2>
        <div className="space-y-1">
          <Step time="0 – 8 min" label="Understand">
            Read twice. Restate the problem out loud in your own words. Identify the input, output, and constraints.
            State the brute force approach and its complexity — don&apos;t code it, just say it aloud.
          </Step>
          <Step time="8 – 25 min" label="Attempt">
            Genuine shot at optimal. Scratch paper or whiteboard first, then code.
            If you have the approach by minute 20, finish coding it.
          </Step>
          <Step time="25 – 32 min" label="Hint 1 — Orient">
            Generate Hint 1 using the prompt below. Read it. Re-attempt.
            Hint 1 is a question — use it to redirect your attention, then think before reading further.
          </Step>
          <Step time="32 – 38 min" label="Hint 2 — Pattern">
            Generate or reveal Hint 2. Names the pattern and data structure only.
            Re-attempt from scratch using this framing.
          </Step>
          <Step time="38 – 45 min" label="Hint 3 → Editorial">
            Read Hint 3 (the algorithm sketch). Attempt one more time.
            If still stuck, read the editorial fully — then close it.
          </Step>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Consolidation — 15 min mandatory</h2>
        <div className="space-y-1">
          <Step time="Step 1" label="Re-derive">
            Close everything. Explain the approach out loud to a rubber duck:
            the invariant, why the data structure works, why the complexity is what it is.
            If you can&apos;t, re-read the editorial and repeat.
          </Step>
          <Step time="Step 2" label="Implement cold">
            Open a blank file. Implement the solution from scratch, zero reference.
            If you peek at your own code, delete and restart.
            This step is the actual learning — don&apos;t skip it.
          </Step>
          <Step time="Step 3" label="Write the trigger card">
            Log the problem. Fill all three trigger card fields — one sentence each:
            what recognition feature signals the pattern, the key non-obvious insight,
            and what tripped you up.
          </Step>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Rating guide</h2>
        <div className="card divide-y divide-zinc-800/80 text-sm">
          <RatingRow grade="Lapse" color="text-rose-400" desc="You read the editorial or solution before solving it yourself." />
          <RatingRow grade="Hard" color="text-amber-400" desc="You solved it but needed significant hints or struggled badly throughout." />
          <RatingRow grade="Good" color="text-zinc-200" desc="You solved it cleanly within expected time, maybe with one small hint." />
          <RatingRow grade="Easy" color="text-emerald-400" desc="Fast, confident, no friction. You would solve this in a contest without hesitation." />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Hint generation prompt</h2>
          <p className="text-xs text-zinc-500 mt-1.5">
            Paste this into Claude or GPT, then append the problem title, statement, constraints, and 1–2 examples.
            Reveal the three JSON fields one at a time, in order.
            Do not read the next hint until you have spent at least 5 minutes after the previous one.
          </p>
        </div>
        <div className="relative">
          <pre className="card p-5 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
            {HINT_PROMPT}
          </pre>
        </div>
      </section>
    </main>
  );
}

function Step({ time, label, children }: { time: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-4 py-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/20">
      <div className="shrink-0 w-28 text-right">
        <span className="text-[11px] mono text-zinc-500">{time}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function RatingRow({ grade, color, desc }: { grade: string; color: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className={`w-12 shrink-0 text-sm font-medium ${color}`}>{grade}</span>
      <span className="text-zinc-400 text-sm">{desc}</span>
    </div>
  );
}
