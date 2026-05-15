"use client";

import { useTransition, useOptimistic, useState } from "react";
import { bumpCounter, syncCountersFromRoadmap, type CounterKey } from "@/app/counter-actions";

interface Props {
  initial: Record<CounterKey, number>;
}

const ITEMS: { key: CounterKey; label: string; tone: { text: string; ring: string; glow: string; minus: string } }[] = [
  {
    key: "easy",
    label: "Easy",
    tone: {
      text: "text-emerald-300",
      ring: "border-emerald-900/60 hover:border-emerald-700 bg-emerald-950/20 hover:bg-emerald-950/40",
      glow: "shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]",
      minus: "text-emerald-300/60 hover:text-emerald-200 hover:bg-emerald-900/30",
    },
  },
  {
    key: "medium",
    label: "Medium",
    tone: {
      text: "text-amber-300",
      ring: "border-amber-900/60 hover:border-amber-700 bg-amber-950/20 hover:bg-amber-950/40",
      glow: "shadow-[0_0_20px_-8px_rgba(251,191,36,0.5)]",
      minus: "text-amber-300/60 hover:text-amber-200 hover:bg-amber-900/30",
    },
  },
  {
    key: "hard",
    label: "Hard",
    tone: {
      text: "text-rose-300",
      ring: "border-rose-900/60 hover:border-rose-700 bg-rose-950/20 hover:bg-rose-950/40",
      glow: "shadow-[0_0_20px_-8px_rgba(244,63,94,0.5)]",
      minus: "text-rose-300/60 hover:text-rose-200 hover:bg-rose-900/30",
    },
  },
];

export function SolveCounters({ initial }: Props) {
  const [base, setBase] = useState<Record<CounterKey, number>>(initial);
  const [optimistic, applyOptimistic] = useOptimistic(
    base,
    (state: Record<CounterKey, number>, action: { key: CounterKey; delta: 1 | -1 }) => ({
      ...state,
      [action.key]: Math.max(0, state[action.key] + action.delta),
    }),
  );
  const [, start] = useTransition();
  const [syncing, setSyncing] = useState(false);

  function bump(key: CounterKey, delta: 1 | -1) {
    start(async () => {
      applyOptimistic({ key, delta });
      await bumpCounter(key, delta);
    });
  }

  function sync() {
    if (!confirm(
      "Reset Easy/Medium/Hard totals to match your roadmap problem checklist? " +
      "This overwrites the current counts.",
    )) return;
    setSyncing(true);
    let solved: Record<string, number[]> = {};
    try {
      solved = JSON.parse(localStorage.getItem("dsa-v1-problems-solved") || "{}");
    } catch {
      /* ignore */
    }
    start(async () => {
      const next = await syncCountersFromRoadmap(solved);
      setBase(next);
      setSyncing(false);
    });
  }

  const total = optimistic.easy + optimistic.medium + optimistic.hard;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map((it) => (
          <div
            key={it.key}
            className={`relative rounded-lg border ${it.tone.ring} ${it.tone.glow} transition-all`}
          >
            <button
              onClick={() => bump(it.key, 1)}
              className="w-full p-5 text-center group"
              title="Click to add one"
            >
              <div className={`mono text-4xl font-semibold tabular-nums ${it.tone.text} group-hover:scale-105 transition-transform inline-block`}>
                {optimistic[it.key]}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1.5">{it.label}</div>
            </button>
            <button
              onClick={() => bump(it.key, -1)}
              disabled={optimistic[it.key] === 0}
              className={`absolute top-2 right-2 w-6 h-6 rounded-md text-sm flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed ${it.tone.minus}`}
              title="Subtract one"
            >
              −
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Total solved</span>
        <span className="mono text-xl font-semibold text-zinc-100 tabular-nums">{total}</span>
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
