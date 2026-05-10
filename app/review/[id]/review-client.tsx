"use client";

import { useEffect, useState } from "react";
import { recordReview, snoozeReview, updateTriggerCard } from "@/app/actions";

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

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{problem.pattern} · {problem.lcDifficulty}</p>
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        {problem.url && (
          <a href={problem.url} target="_blank" rel="noreferrer" className="text-sm">Open on LeetCode →</a>
        )}
      </header>

      <div className="rounded border border-zinc-800 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-zinc-400">Cold re-solve. Don&apos;t look at the trigger card or your old code.</p>
          <p className="font-mono text-2xl">{elapsed.toFixed(1)} min</p>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Rep #{state.reps + 1} · S = {state.stability.toFixed(1)}d · D = {state.difficulty.toFixed(1)} · {state.lapses} lapses
        </p>
      </div>

      {!revealCard ? (
        <button onClick={() => setRevealCard(true)} className="btn-secondary w-full">
          Reveal trigger card (only after attempt)
        </button>
      ) : (
        <div className="rounded border border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Trigger card</p>
            <button onClick={() => setEditingCard((e) => !e)} className="text-xs text-zinc-400 hover:text-zinc-100 underline">
              {editingCard ? "stop editing" : "edit"}
            </button>
          </div>
          {editingCard ? (
            <div className="space-y-3">
              <div><label>Recognition</label><textarea rows={2} value={card.recognition} onChange={(e) => setCard({ ...card, recognition: e.target.value })} /></div>
              <div><label>Insight</label><textarea rows={2} value={card.insight} onChange={(e) => setCard({ ...card, insight: e.target.value })} /></div>
              <div><label>Failure mode</label><textarea rows={2} value={card.failureMode} onChange={(e) => setCard({ ...card, failureMode: e.target.value })} /></div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-zinc-500 text-xs">Recognition</dt><dd>{card.recognition || <em className="text-zinc-600">none</em>}</dd></div>
              <div><dt className="text-zinc-500 text-xs">Insight</dt><dd>{card.insight || <em className="text-zinc-600">none</em>}</dd></div>
              <div><dt className="text-zinc-500 text-xs">Failure mode</dt><dd>{card.failureMode || <em className="text-zinc-600">none</em>}</dd></div>
            </dl>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <button disabled={submitting} onClick={() => rate(1)} className="btn-danger">Saw solution</button>
        <button disabled={submitting} onClick={() => rate(2)} className="btn-secondary">Struggled</button>
        <button disabled={submitting} onClick={() => rate(3)} className="btn-secondary">Good</button>
        <button disabled={submitting} onClick={() => rate(4)} className="btn-primary">Easy</button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500">snooze:</span>
        <button disabled={submitting} onClick={() => snooze(1)} className="btn-secondary text-xs">1d</button>
        <button disabled={submitting} onClick={() => snooze(3)} className="btn-secondary text-xs">3d</button>
        <button disabled={submitting} onClick={() => snooze(7)} className="btn-secondary text-xs">7d</button>
      </div>
    </main>
  );
}
