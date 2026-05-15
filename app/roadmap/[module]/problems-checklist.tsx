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

  return (
    <div className="my-5">
      <div
        className={`mb-4 rounded-lg border px-4 py-3 transition-colors ${
          unlocked
            ? "border-emerald-900/50 bg-emerald-950/25"
            : "border-zinc-800 bg-zinc-900/40"
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <strong
              className={
                unlocked ? "text-emerald-300" : "text-zinc-200"
              }
            >
              {hydrated ? solvedCount : "—"}
            </strong>
            <span className="text-zinc-500"> / {total} solved</span>
            <span className="ml-2 text-xs text-zinc-600">
              (need {target} to unlock)
            </span>
            {unlocked && (
              <span className="ml-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                ✓ Next module unlocked
              </span>
            )}
          </div>
          {hydrated && !unlocked && (
            <span className="text-xs text-zinc-500">
              {remaining} more to go
            </span>
          )}
        </div>
        <div className="mt-2.5 h-1 rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              unlocked ? "bg-emerald-500/70" : "bg-zinc-600/60"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-900/40">
              <th className="text-left px-3 py-2 w-9 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800"></th>
              <th className="text-left px-3 py-2 w-9 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800">
                #
              </th>
              <th className="text-left px-3 py-2 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800">
                Problem
              </th>
              {problems[0]?.extraHeaders.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => {
              const isDone = hydrated && solved.has(p.num);
              return (
                <tr
                  key={p.num}
                  onClick={() => toggle(p.num)}
                  className={`cursor-pointer border-b border-zinc-800/40 last:border-b-0 transition-colors ${
                    isDone
                      ? "bg-emerald-950/15 hover:bg-emerald-950/30"
                      : p.isCheckpoint
                      ? "bg-amber-950/10 hover:bg-zinc-900/40"
                      : "hover:bg-zinc-900/40"
                  }`}
                >
                  <td className="px-3 py-2.5 align-top">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggle(p.num)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Mark problem ${p.num} as solved`}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                    />
                  </td>
                  <td
                    className={`px-3 py-2.5 text-[13px] font-mono align-top ${
                      isDone ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {p.num}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] align-top">
                    {p.url ? <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`underline decoration-zinc-700 underline-offset-2 transition-colors ${
                        isDone
                          ? "text-zinc-500 hover:text-zinc-400"
                          : "text-zinc-200 hover:text-emerald-400 hover:decoration-emerald-700"
                      }`}
                    >
                      {p.title}
                    </a> : <span className={isDone ? "text-zinc-500" : "text-zinc-200"}>{p.title}</span>}
                    {p.isCheckpoint && (
                      <span className="ml-2 inline-block text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        ★ checkpoint
                      </span>
                    )}
                  </td>
                  {p.extraCells.map((c, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2.5 text-[13px] align-top ${
                        isDone ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      <InlineMd
                        text={c}
                        onLinkClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
