"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHASES = [
  { time: "0 – 8 min",   label: "Understand",        start: 0,    end: 480,  color: "emerald",
    desc: "Read twice. Restate the problem out loud in your own words. Identify input, output, and constraints. State the brute force and its complexity — don't code it, just say it." },
  { time: "8 – 25 min",  label: "Attempt",            start: 480,  end: 1500, color: "blue",
    desc: "Genuine shot at optimal. Scratch paper first, then code. If you have the approach by minute 20, finish coding it." },
  { time: "25 – 32 min", label: "Hint 1 — Orient",    start: 1500, end: 1920, color: "yellow",
    desc: "Generate Hint 1 using the prompt below. It is a question — use it to redirect your attention, then think before reading further. Re-attempt." },
  { time: "32 – 38 min", label: "Hint 2 — Pattern",   start: 1920, end: 2280, color: "orange",
    desc: "Reveal Hint 2. Names the pattern and data structure only. Re-attempt from scratch using this framing." },
  { time: "38 – 45 min", label: "Hint 3 → Editorial", start: 2280, end: 2700, color: "rose",
    desc: "Read Hint 3. Attempt once more. If still stuck, read the editorial fully — then close it. Do not implement while reading." },
] as const;

const CONSOLIDATION = [
  { step: "1", label: "Re-derive", desc: "Close everything. Explain the approach out loud: the invariant, why the data structure works, the complexity. If you can't, re-read and repeat." },
  { step: "2", label: "Implement cold", desc: "Blank file. Implement from scratch, zero reference. If you peek, delete and restart. This is the actual learning." },
  { step: "3", label: "Log the trigger card", desc: "Open the Log page. Fill all three trigger card fields — one sentence each: recognition signal, key insight, failure mode." },
];

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

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function activePhase(elapsed: number) {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (elapsed >= PHASES[i].start) return i;
  }
  return 0;
}

const PHASE_COLORS: Record<string, { border: string; bg: string; label: string; dot: string }> = {
  emerald: { border: "border-l-emerald-500",  bg: "bg-emerald-950/30",  label: "text-emerald-300", dot: "bg-emerald-500" },
  blue:    { border: "border-l-blue-500",     bg: "bg-blue-950/30",    label: "text-blue-300",    dot: "bg-blue-500" },
  yellow:  { border: "border-l-yellow-500",   bg: "bg-yellow-950/30",  label: "text-yellow-300",  dot: "bg-yellow-500" },
  orange:  { border: "border-l-orange-500",   bg: "bg-orange-950/30",  label: "text-orange-300",  dot: "bg-orange-500" },
  rose:    { border: "border-l-rose-500",     bg: "bg-rose-950/30",    label: "text-rose-300",    dot: "bg-rose-500" },
};

export default function ProcessPage() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => setElapsed((e) => e + 1), []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const current = activePhase(elapsed);
  const done = elapsed >= 2700;

  function reset() {
    setRunning(false);
    setElapsed(0);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(HINT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="space-y-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">The process</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Follow this exactly every time.</p>
      </header>

      {/* Timer */}
      <div className="card p-5 flex items-center gap-6">
        <p className="mono text-4xl font-semibold tabular-nums text-zinc-100 w-28">{fmt(elapsed)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="btn-secondary px-5"
          >
            {running ? "Pause" : elapsed === 0 ? "Start" : "Resume"}
          </button>
          <button onClick={reset} className="btn-ghost px-3">Reset</button>
        </div>
        {done && <p className="text-xs text-zinc-500 ml-auto">Attempt window over — move to consolidation.</p>}
      </div>

      {/* Attempt phases */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Attempt — 45 min cap</h2>
        <div className="space-y-1.5">
          {PHASES.map((phase, i) => {
            const isActive = current === i && elapsed > 0 && !done;
            const isPast = elapsed >= phase.end;
            const c = PHASE_COLORS[phase.color];
            return (
              <div
                key={i}
                className={[
                  "flex gap-4 px-4 py-3.5 rounded-lg border border-l-4 transition-all duration-500",
                  isActive
                    ? `${c.border} ${c.bg} border-t-zinc-800/80 border-r-zinc-800/80 border-b-zinc-800/80`
                    : "border-zinc-800/80 border-l-zinc-800/80 bg-zinc-900/20",
                  isPast && !isActive ? "opacity-40" : "",
                ].join(" ")}
              >
                <div className="shrink-0 w-28 text-right pt-0.5">
                  <span className="text-[11px] mono text-zinc-500">{phase.time}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isActive && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />}
                    <p className={`text-sm font-medium ${isActive ? c.label : "text-zinc-300"}`}>{phase.label}</p>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{phase.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Consolidation */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Consolidation — 15 min mandatory</h2>
        <div className="space-y-1.5">
          {CONSOLIDATION.map((s) => (
            <div key={s.step} className="flex gap-4 px-4 py-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/20">
              <div className="shrink-0 w-28 text-right pt-0.5">
                <span className="text-[11px] mono text-zinc-500">Step {s.step}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">{s.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rating guide */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Rating guide</h2>
        <div className="card divide-y divide-zinc-800/80 text-sm">
          {[
            { grade: "Lapse", color: "text-rose-400",    desc: "You read the editorial before solving it yourself." },
            { grade: "Hard",  color: "text-amber-400",   desc: "Solved it, but needed significant hints or struggled badly." },
            { grade: "Good",  color: "text-zinc-200",    desc: "Solved it cleanly within expected time." },
            { grade: "Easy",  color: "text-emerald-400", desc: "Fast and confident. You'd solve this in a contest without hesitation." },
          ].map(({ grade, color, desc }) => (
            <div key={grade} className="flex items-start gap-4 px-4 py-3">
              <span className={`w-12 shrink-0 font-medium ${color}`}>{grade}</span>
              <span className="text-zinc-400">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hint prompt */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Hint generation prompt</h2>
            <p className="text-xs text-zinc-600 mt-1">Paste into Claude or GPT, append the problem. Reveal hints one at a time.</p>
          </div>
          <button onClick={copyPrompt} className="btn-secondary text-xs px-4 shrink-0">
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </section>
    </main>
  );
}
