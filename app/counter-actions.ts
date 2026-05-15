// Difficulty key type kept here for backwards-compatible imports.
// The Easy/Medium/Hard counters are now derived at render time from
// localStorage + the structured module data in app/roadmap/_data/.
// See components/solve-counters.tsx for the computation.

export type CounterKey = "easy" | "medium" | "hard";
