"use client";

import { useEffect, useState } from "react";
import { recordStarReview, snoozeStar, deleteStar, updateStar } from "../actions";

interface Props {
  star: {
    id: number;
    prompt: string;
    tag: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  state: { stability: number; difficulty: number; reps: number; lapses: number };
}

export default function StarReviewClient({ star, state }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    prompt: star.prompt,
    tag: star.tag,
    situation: star.situation,
    task: star.task,
    action: star.action,
    result: star.result,
  });

  useEffect(() => {
    const i = setInterval(() => setElapsed((Date.now() - startedAt) / 60000), 1000);
    return () => clearInterval(i);
  }, [startedAt]);

  async function rate(grade: 1 | 2 | 3 | 4) {
    setSubmitting(true);
    if (editing) {
      await updateStar(star.id, draft);
    }
    await recordStarReview(star.id, grade, Math.max(0.1, elapsed));
  }

  async function snooze(days: number) {
    setSubmitting(true);
    await snoozeStar(star.id, days);
    window.location.href = "/star";
  }

  async function remove() {
    if (!confirm(`Delete this story? This cannot be undone.`)) return;
    setSubmitting(true);
    await deleteStar(star.id);
  }

  async function saveEdits() {
    setSubmitting(true);
    await updateStar(star.id, draft);
    setEditing(false);
    setSubmitting(false);
  }

  return (
    <main className="space-y-6">
      <header className="space-y-3">
        {star.tag && <p className="text-xs text-zinc-500">{star.tag}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{star.prompt}</h1>
      </header>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-300">Tell the story out loud</p>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-xs">
            Recall the full STAR cold. Reveal the written version only after you finish.
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

      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="btn-secondary w-full">
          Reveal STAR
        </button>
      ) : (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-zinc-500">Your story</p>
            <button
              onClick={() => editing ? saveEdits() : setEditing(true)}
              className="text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1"
              disabled={submitting}
            >
              {editing ? "save" : "edit"}
            </button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <EditField label="Prompt" value={draft.prompt} onChange={(v) => setDraft({ ...draft, prompt: v })} />
              <EditField label="Tag" value={draft.tag} onChange={(v) => setDraft({ ...draft, tag: v })} single />
              <EditField label="Situation" value={draft.situation} onChange={(v) => setDraft({ ...draft, situation: v })} />
              <EditField label="Task" value={draft.task} onChange={(v) => setDraft({ ...draft, task: v })} />
              <EditField label="Action" value={draft.action} onChange={(v) => setDraft({ ...draft, action: v })} rows={4} />
              <EditField label="Result" value={draft.result} onChange={(v) => setDraft({ ...draft, result: v })} />
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <Row label="Situation" value={star.situation} />
              <Row label="Task" value={star.task} />
              <Row label="Action" value={star.action} />
              <Row label="Result" value={star.result} />
            </dl>
          )}
        </div>
      )}

      <div className="space-y-2 pt-2">
        <div className="flex items-baseline justify-between px-1">
          <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-zinc-500">Rate this attempt</p>
          <p className="text-[11px] text-zinc-600">Was the story crisp and complete?</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Rate grade={1} label="Lapse" hint="Blanked" disabled={submitting} onClick={rate} />
          <Rate grade={2} label="Hard" hint="Stumbled" disabled={submitting} onClick={rate} />
          <Rate grade={3} label="Good" hint="Crisp" disabled={submitting} onClick={rate} />
          <Rate grade={4} label="Easy" hint="Effortless" disabled={submitting} onClick={rate} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs pt-2">
        <span className="text-zinc-600 mr-1">snooze</span>
        <button disabled={submitting} onClick={() => snooze(1)} className="btn-ghost text-xs px-2.5 py-1">1d</button>
        <button disabled={submitting} onClick={() => snooze(3)} className="btn-ghost text-xs px-2.5 py-1">3d</button>
        <button disabled={submitting} onClick={() => snooze(7)} className="btn-ghost text-xs px-2.5 py-1">1w</button>
        <button disabled={submitting} onClick={remove} className="btn-danger text-xs px-2.5 py-1 ml-auto">delete</button>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500 text-[11px] uppercase tracking-[0.08em] font-medium mb-1">{label}</dt>
      <dd className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
        {value || <em className="text-zinc-600 not-italic">— empty —</em>}
      </dd>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  rows = 2,
  single = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  single?: boolean;
}) {
  return (
    <div>
      <label>{label}</label>
      {single ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Rate({
  grade,
  label,
  hint,
  disabled,
  onClick,
}: {
  grade: 1 | 2 | 3 | 4;
  label: string;
  hint: string;
  disabled: boolean;
  onClick: (g: 1 | 2 | 3 | 4) => void;
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
