"use client";

import { useEffect, useState } from "react";
import { bumpCounter, type CounterKey } from "@/app/counter-actions";

export interface ProblemRow {
  num: number;
  title: string;
  url: string;
  isCheckpoint: boolean;
  difficulty: CounterKey | null;
  extraHeaders: string[];
  extraCells: string[];
}

export const REQUIRED_PROBLEMS = 5;

// ── Tiny inline markdown renderer (bold, italic, code, links) ────────────────

function InlineMd({
  text,
  onLinkClick,
}: {
  text: string;
  onLinkClick?: (e: React.MouseEvent) => void;
}) {
  const parts: React.ReactNode[] = [];
  let rem = text;
  let key = 0;

  while (rem.length > 0) {
    let m: RegExpMatchArray | null = null;

    if ((m = rem.match(/^\*\*(.+?)\*\*/))) {
      parts.push(
        <strong key={key++} className="font-semibold text-zinc-200">
          {m[1]}
        </strong>,
      );
    } else if ((m = rem.match(/^\*([^*]+?)\*/))) {
      parts.push(
        <em key={key++} className="italic">
          {m[1]}
        </em>,
      );
    } else if ((m = rem.match(/^`([^`]+?)`/))) {
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded border border-zinc-700/50 bg-zinc-900 text-zinc-300 text-[11px] font-mono"
        >
          {m[1]}
        </code>,
      );
    } else if ((m = rem.match(/^\[(.+?)\]\((.+?)\)/))) {
      parts.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkClick}
          className="text-zinc-300 underline decoration-zinc-700 underline-offset-2 hover:text-emerald-400 transition-colors"
        >
          {m[1]}
        </a>,
      );
    }

    if (m) {
      rem = rem.slice(m[0].length);
      continue;
    }

    const nextSpecial = rem.slice(1).search(/[*`[]/);
    if (nextSpecial === -1) {
      parts.push(<span key={key++}>{rem}</span>);
      break;
    }
    const take = nextSpecial + 1;
    parts.push(<span key={key++}>{rem.slice(0, take)}</span>);
    rem = rem.slice(take);
  }

  return <>{parts}</>;
}

// ── Checklist ────────────────────────────────────────────────────────────────

export function ProblemsChecklist({
  moduleId,
  problems,
}: {
  moduleId: string;
  problems: ProblemRow[];
}) {
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("dsa-v1-problems-solved") || "{}",
      );
      setSolved(new Set(data[moduleId] || []));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [moduleId]);

  function toggle(num: number) {
    const wasSolved = solved.has(num);
    const next = new Set(solved);
    if (wasSolved) next.delete(num);
    else next.add(num);
    setSolved(next);

    try {
      const data = JSON.parse(
        localStorage.getItem("dsa-v1-problems-solved") || "{}",
      );
      if (next.size === 0) delete data[moduleId];
      else data[moduleId] = [...next].sort((a, b) => a - b);
      localStorage.setItem("dsa-v1-problems-solved", JSON.stringify(data));
    } catch {
      /* ignore */
    }

    // Bump the home-page Easy/Medium/Hard counter to stay in sync.
    // Fire-and-forget — the UI doesn't need to wait.
    const problem = problems.find((p) => p.num === num);
    if (problem?.difficulty) {
      void bumpCounter(problem.difficulty, wasSolved ? -1 : 1);
    }
  }

  const solvedCount = solved.size;
  const total = problems.length;
  const target = Math.min(REQUIRED_PROBLEMS, total);
  const remaining = Math.max(0, target - solvedCount);
  const unlocked = hydrated && solvedCount >= target;
  const progressPct = hydrated
    ? Math.min(100, (solvedCount / target) * 100)
    : 0;

  const diffColor = (d: string | null, done: boolean) => {
    if (!d) return "";
    if (done) return d === "easy" ? "bg-emerald-800/50" : d === "medium" ? "bg-amber-800/50" : "bg-rose-800/50";
    return d === "easy" ? "bg-emerald-500/70" : d === "medium" ? "bg-amber-500/70" : "bg-rose-500/70";
  };

  return (
    <div className="my-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1 rounded-full bg-zinc-800/70 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${unlocked ? "bg-emerald-500" : "bg-zinc-600/70"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-zinc-500 flex-shrink-0">
          <span className={unlocked ? "text-emerald-400 font-semibold" : "text-zinc-300"}>
            {hydrated ? solvedCount : "—"}
          </span>
          {" / "}{total}
          {unlocked
            ? <span className="ml-1.5 text-emerald-500">✓</span>
            : <span className="ml-1.5 text-zinc-600">({remaining} left)</span>
          }
        </span>
      </div>

      {/* Problem list */}
      <div className="space-y-0.5">
        {problems.map((p) => {
          const isDone = hydrated && solved.has(p.num);
          return (
            <div
              key={p.num}
              onClick={() => toggle(p.num)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                isDone
                  ? "bg-emerald-950/20"
                  : "hover:bg-zinc-900/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(p.num)}
                onClick={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 flex-shrink-0 rounded border-zinc-700 bg-zinc-900 cursor-pointer accent-emerald-500"
              />
              <span className={`text-[11px] font-mono w-4 text-right flex-shrink-0 ${isDone ? "text-zinc-600" : "text-zinc-600"}`}>
                {p.num}
              </span>
              {p.difficulty && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${diffColor(p.difficulty, isDone)}`} />
              )}
              <span className="flex-1 min-w-0">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`text-sm no-underline transition-colors truncate block ${
                      isDone ? "text-zinc-500 hover:text-zinc-400" : "text-zinc-200 hover:text-emerald-400"
                    }`}
                  >
                    {p.title}
                  </a>
                ) : (
                  <span className={`text-sm ${isDone ? "text-zinc-500" : "text-zinc-300"}`}>{p.title}</span>
                )}
              </span>
              {p.isCheckpoint && (
                <span className="text-[9px] font-bold text-amber-500/80 flex-shrink-0">★</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
