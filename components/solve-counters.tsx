"use client";

import { useState, useTransition } from "react";
import { syncCountersFromRoadmap, type CounterKey } from "@/app/counter-actions";

interface Props {
  initial: Record<CounterKey, number>;
}

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

export function SolveCounters({ initial }: Props) {
  const [counts, setCounts] = useState<Record<CounterKey, number>>(initial);
  const [syncing, setSyncing] = useState(false);
  const [, start] = useTransition();

  function sync() {
    if (
      !confirm(
        "Reset Easy/Medium/Hard totals to match your roadmap problem checklist? " +
          "This overwrites the current counts.",
      )
    )
      return;
    setSyncing(true);
    let solved: Record<string, number[]> = {};
    try {
      solved = JSON.parse(
        localStorage.getItem("dsa-v1-problems-solved") || "{}",
      );
    } catch {
      /* ignore */
    }
    start(async () => {
      const next = await syncCountersFromRoadmap(solved);
      setCounts(next);
      setSyncing(false);
    });
  }

  const total = counts.easy + counts.medium + counts.hard;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map((it) => (
          <div
            key={it.key}
            className={`rounded-lg border ${it.bg} ${it.glow} p-5 text-center`}
          >
            <div
              className={`mono text-4xl font-semibold tabular-nums ${it.text}`}
            >
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

      <div className="flex justify-end">
        <button
          onClick={sync}
          disabled={syncing}
          className="text-[11px] text-zinc-600 hover:text-emerald-400 transition-colors px-2 py-1 disabled:opacity-50"
          title="Wipe counters and reseed them from your roadmap problem checklist"
        >
          {syncing ? "Syncing…" : "↻ Sync from roadmap"}
        </button>
      </div>
    </div>
  );
}
