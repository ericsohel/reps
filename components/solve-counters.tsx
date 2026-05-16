"use client";

import { useEffect, useState, useCallback } from "react";
import { MODULES_BY_ID } from "@/app/roadmap/_data";
import type { Difficulty } from "@/app/roadmap/_data/types";

type CounterKey = Difficulty;

const ITEMS: {
  key: CounterKey;
  label: string;
  text: string;
  bg: string;
  glow: string;
  btn: string;
}[] = [
  {
    key: "easy",
    label: "Easy",
    text: "text-emerald-300",
    bg: "border-emerald-900/60 bg-emerald-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]",
    btn: "text-emerald-600 hover:text-emerald-300 hover:bg-emerald-950/40",
  },
  {
    key: "medium",
    label: "Medium",
    text: "text-amber-300",
    bg: "border-amber-900/60 bg-amber-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(251,191,36,0.5)]",
    btn: "text-amber-600 hover:text-amber-300 hover:bg-amber-950/40",
  },
  {
    key: "hard",
    label: "Hard",
    text: "text-rose-300",
    bg: "border-rose-900/60 bg-rose-950/20",
    glow: "shadow-[0_0_20px_-8px_rgba(244,63,94,0.5)]",
    btn: "text-rose-600 hover:text-rose-300 hover:bg-rose-950/40",
  },
];

const SOLVED_KEY = "dsa-v1-problems-solved";
const DIRECT_KEY = "dsa-v1-direct-solves";        // { easy: N, medium: M, hard: K }
const SOLVED_AT_KEY = "dsa-v1-problems-solved-at"; // timestamps for heatmap

type DirectCounts = Record<CounterKey, number>;
const EMPTY_DIRECT: DirectCounts = { easy: 0, medium: 0, hard: 0 };

function readDirectCounts(): DirectCounts {
  try {
    const raw = localStorage.getItem(DIRECT_KEY);
    if (!raw) return { ...EMPTY_DIRECT };
    const p = JSON.parse(raw);
    return {
      easy: Number(p.easy) || 0,
      medium: Number(p.medium) || 0,
      hard: Number(p.hard) || 0,
    };
  } catch {
    return { ...EMPTY_DIRECT };
  }
}

function computeModuleCounts(): DirectCounts {
  const totals: DirectCounts = { easy: 0, medium: 0, hard: 0 };
  try {
    const solved: Record<string, number[]> = JSON.parse(
      localStorage.getItem(SOLVED_KEY) || "{}"
    );
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
  } catch {}
  return totals;
}

// Write a timestamp into solved-at under a synthetic key so the heatmap's
// countRoadmapSolvesToday() picks it up automatically.
function stampDirectSolve(diff: CounterKey) {
  try {
    const all: Record<string, Record<string, number>> = JSON.parse(
      localStorage.getItem(SOLVED_AT_KEY) || "{}"
    );
    const key = `__direct-${diff}`;
    const existing = all[key] ?? {};
    const nextIdx = String(Object.keys(existing).length + 1);
    all[key] = { ...existing, [nextIdx]: Date.now() };
    localStorage.setItem(SOLVED_AT_KEY, JSON.stringify(all));
  } catch {}
}

export function SolveCounters() {
  const [counts, setCounts] = useState<DirectCounts>({ easy: 0, medium: 0, hard: 0 });

  const refresh = useCallback(() => {
    const module = computeModuleCounts();
    const direct = readDirectCounts();
    setCounts({
      easy: module.easy + direct.easy,
      medium: module.medium + direct.medium,
      hard: module.hard + direct.hard,
    });
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("roadmap-progress-changed", refresh);
    function onStorage(e: StorageEvent) {
      if (e.key === SOLVED_KEY || e.key === DIRECT_KEY) refresh();
    }
    window.addEventListener("storage", onStorage);
    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("roadmap-progress-changed", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  function increment(diff: CounterKey) {
    const direct = readDirectCounts();
    direct[diff]++;
    localStorage.setItem(DIRECT_KEY, JSON.stringify(direct));
    stampDirectSolve(diff);
    window.dispatchEvent(new Event("roadmap-progress-changed"));
    refresh();
  }

  function decrement(diff: CounterKey) {
    const direct = readDirectCounts();
    if (direct[diff] <= 0) return;
    direct[diff]--;
    localStorage.setItem(DIRECT_KEY, JSON.stringify(direct));
    refresh();
  }

  const total = counts.easy + counts.medium + counts.hard;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map((it) => (
          <div
            key={it.key}
            className={`rounded-lg border ${it.bg} ${it.glow} p-4 flex flex-col items-center gap-2`}
          >
            <div className={`mono text-4xl font-semibold tabular-nums ${it.text}`}>
              {counts[it.key]}
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              {it.label}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => decrement(it.key)}
                className={`w-7 h-7 rounded flex items-center justify-center text-lg font-medium transition-colors ${it.btn}`}
                aria-label={`Remove ${it.label}`}
              >
                −
              </button>
              <button
                onClick={() => increment(it.key)}
                className={`w-7 h-7 rounded flex items-center justify-center text-lg font-medium transition-colors ${it.btn}`}
                aria-label={`Add ${it.label}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Total solved</span>
        <span className="mono text-xl font-semibold text-zinc-100 tabular-nums">{total}</span>
      </div>
    </div>
  );
}
