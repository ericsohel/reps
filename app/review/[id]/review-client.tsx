"use client";

import { useEffect, useState } from "react";
import { recordReview, snoozeReview, updateTriggerCard, deleteProblem } from "@/app/actions";

interface Props {
  problem: {
    id: number; title: string; url: string | null; pattern: string;
    lcDifficulty: "Easy" | "Medium" | "Hard";
    recognition: string; insight: string; failureMode: string;
  };
  state: { stability: number; difficulty: number; reps: number; lapses: number };
}

export default function ReviewClient({ problem, state }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [revealCard, setRevealCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [card, setCard] = useState({
    recognition: problem.recognition,
    insight: problem.insight,
    failureMode: problem.failureMode,
  });

  useEffect(() => {
    const i = setInterval(() => setElapsed((Date.now() - startedAt) / 60000), 1000);
    return () => clearInterval(i);
  }, [startedAt]);

  async function rate(grade: 1 | 2 | 3 | 4) {
    setSubmitting(true);
    if (editingCard) {
      await updateTriggerCard(problem.id, card.recognition, card.insight, card.failureMode);
    }
    await recordReview(problem.id, grade, Math.max(0.1, elapsed));
  }

  async function snooze(days: number) {
    setSubmitting(true);
    await snoozeReview(problem.id, days);
    window.location.href = "/";
  }

  async function remove() {
    if (!confirm(`Delete "${problem.title}"? This cannot be undone.`)) return;
    setSubmitting(true);
    await deleteProblem(problem.id);
  }

  return (
    <main className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <DifficultyBadge d={problem.lcDifficulty} />
          <span>·</span>
          <span>{problem.pattern}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{problem.title}</h1>
        {problem.url && (
          <a href={problem.url} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-1.5">
            Open on LeetCode <span className="text-xs">↗</span>
          </a>
        )}
      </header>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-300">Cold re-solve</p>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-xs">
            Re-derive the approach from scratch, then code it. Reveal the trigger card only after you attempt — not before.
          </p>
        </div>
        <p className="mono text-3xl font-semibold text-zinc-100 tabular-nums shrink-0 ml-4">
          {elapsed.toFixed(1)}<span className="text-base text-zinc-500 ml-1">min</span>
        </p>
      </div>

      <div className="flex gap-4 text-[11px] text-zinc-500 mono px-1">
        <Stat label="rep" value={`#${state.reps + 1}`} />
        <Stat label="stability" value={`${state.stability.toFixed(1)}d`} />
        <Stat label="difficulty" value={state.difficulty.toFixed(1)} />
        <Stat label="lapses" value={state.lapses.toString()} />
      </div>

      {!revealCard ? (
        <button onClick={() => setRevealCard(true)} className="btn-secondary w-full">
          Reveal trigger card
        </button>
      ) : (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-zinc-500">Trigger card</p>
            <button onClick={() => setEditingCard((e) => !e)} className="text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1">
              {editingCard ? "done" : "edit"}
            </button>
          </div>
          {editingCard ? (
            <div className="space-y-3">
              <div><label>Recognition</label><textarea rows={2} value={card.recognition} onChange={(e) => setCard({ ...card, recognition: e.target.value })} /></div>
              <div><label>Insight</label><textarea rows={2} value={card.insight} onChange={(e) => setCard({ ...card, insight: e.target.value })} /></div>
              <div><label>Failure mode</label><textarea rows={2} value={card.failureMode} onChange={(e) => setCard({ ...card, failureMode: e.target.value })} /></div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <CardRow label="Recognition" value={card.recognition} />
              <CardRow label="Insight" value={card.insight} />
              <CardRow label="Failure mode" value={card.failureMode} />
            </dl>
          )}
        </div>
      )}

      <div className="space-y-2 pt-2">
        <div className="flex items-baseline justify-between px-1">
          <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-zinc-500">Rate this attempt</p>
          <p className="text-[11px] text-zinc-600">Based on the cold re-solve, not whether you remembered writing it.</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <RateButton grade={1} label="Lapse" hint="Saw solution" disabled={submitting} onClick={rate} />
          <RateButton grade={2} label="Hints" hint="Used hints" disabled={submitting} onClick={rate} />
          <RateButton grade={3} label="Good" hint="Solved" disabled={submitting} onClick={rate} />
          <RateButton grade={4} label="Easy" hint="Fast" disabled={submitting} onClick={rate} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs pt-2">
        <span className="text-zinc-600 mr-1">snooze</span>
        <button disabled={submitting} onClick={() => snooze(1)} className="btn-ghost text-xs px-2.5 py-1">1d</button>
        <button disabled={submitting} onClick={() => snooze(3)} className="btn-ghost text-xs px-2.5 py-1">3d</button>
        <button disabled={submitting} onClick={() => snooze(7)} className="btn-ghost text-xs px-2.5 py-1">1w</button>
        <button
          disabled={submitting}
          onClick={remove}
          className="btn-danger text-xs px-2.5 py-1 ml-auto"
        >
          delete
        </button>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-zinc-600">{label}</span> <span className="text-zinc-300">{value}</span>
    </span>
  );
}

function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500 text-[11px] uppercase tracking-[0.08em] font-medium mb-1">{label}</dt>
      <dd className="text-zinc-200 leading-relaxed">{value || <em className="text-zinc-600 not-italic">— empty —</em>}</dd>
    </div>
  );
}

function DifficultyBadge({ d }: { d: "Easy" | "Medium" | "Hard" }) {
  const color =
    d === "Easy" ? "text-emerald-400"
    : d === "Medium" ? "text-amber-400"
    : "text-rose-400";
  return <span className={`${color} font-medium`}>{d}</span>;
}

function RateButton({ grade, label, hint, disabled, onClick }: {
  grade: 1 | 2 | 3 | 4; label: string; hint: string;
  disabled: boolean; onClick: (g: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <button
      onClick={() => onClick(grade)}
      disabled={disabled}
      className={`btn-rate btn-rate-${grade}`}
    >
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-[10px] text-zinc-500">{hint}</span>
    </button>
  );
}
