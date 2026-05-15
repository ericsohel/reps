"use client";

import { useEffect, useState } from "react";
import { MODULES_BY_ID } from "@/app/roadmap/_data";
import type { Difficulty } from "@/app/roadmap/_data/types";

type CounterKey = Difficulty;

const ITEMS: {
  key: CounterKey;
  label: string;
  text: string;
  bg: string;
  glow: string;
}[] = [
  {
    key: "easy",
    label: "Easy",
    text: "text-emerald-300",
    bg: "border-emerald-900/60 bg-emerald-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]",
  },
  {
    key: "medium",
    label: "Medium",
    text: "text-amber-300",
    bg: "border-amber-900/60 bg-amber-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(251,191,36,0.5)]",
  },
  {
    key: "hard",
    label: "Hard",
    text: "text-rose-300",
    bg: "border-rose-900/60 bg-rose-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(244,63,94,0.5)]",
  },
];

const STORAGE_KEY = "dsa-v1-problems-solved";
const EMPTY: Record<CounterKey, number> = { easy: 0, medium: 0, hard: 0 };

// Derive Easy/Medium/Hard counts from the solved-problems map and the
// structured module data. Single pass; idempotent.
function computeCounts(): Record<CounterKey, number> {
  const totals: Record<CounterKey, number> = { easy: 0, medium: 0, hard: 0 };
  let solved: Record<string, number[]>;
  try {
    solved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return totals;
  }
  for (const [moduleId, nums] of Object.entries(solved)) {
    const mod = MODULES_BY_ID[moduleId];
    if (!mod?.problems) continue;
    const diffByNum = new Map<number, Difficulty>();
    for (const p of mod.problems) diffByNum.set(p.num, p.difficulty);
    for (const num of nums) {
      const d = diffByNum.get(num);
      if (d) totals[d]++;
    }
  }
  return totals;
}

export function SolveCounters() {
  const [counts, setCounts] = useState<Record<CounterKey, number>>(EMPTY);

  useEffect(() => {
    setCounts(computeCounts());

    function refresh() {
      setCounts(computeCounts());
    }

    // The roadmap modal dispatches this event after every localStorage write.
    window.addEventListener("roadmap-progress-changed", refresh);

    // Cross-tab sync — localStorage changes in another tab fire 'storage'.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) refresh();
    }
    window.addEventListener("storage", onStorage);

    // Catch any changes made while the tab was hidden.
    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("roadmap-progress-changed", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const total = counts.easy + counts.medium + counts.hard;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map((it) => (
          <div
            key={it.key}
            className={`rounded-lg border ${it.bg} ${it.glow} p-5 text-center`}
          >
            <div className={`mono text-4xl font-semibold tabular-nums ${it.text}`}>
              {counts[it.key]}
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1.5">
              {it.label}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">
          Total solved
        </span>
        <span className="mono text-xl font-semibold text-zinc-100 tabular-nums">
          {total}
        </span>
      </div>
    </div>
  );
}
