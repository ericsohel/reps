"use client";

// Stage subcomponents for /lab. Pure presentational — every interaction is a
// prop callback; no localStorage, no global state. The parent page owns the
// solve-state machine and decides which stage to render.

import type { LabProblem, LabSolve, StuckMove } from "../_data/types";
import { INSIGHTS_BY_ID } from "../_data/insights";
import type { ReviewRating } from "../_lib/insight-sr";

export type Stage = "frame" | "approach" | "solve" | "distill" | "done";

export function ProblemHeader({
  problem,
  stage,
}: {
  problem: LabProblem;
  stage: Stage;
}) {
  const kind = problem.kind ?? "algo";
  const diffColor =
    problem.difficulty === "warm-up"
      ? "text-emerald-400"
      : problem.difficulty === "stretch"
      ? "text-amber-400"
      : "text-zinc-300";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${diffColor}`}>
          {problem.difficulty}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          {kind}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-700">
          {problem.source} · ~{problem.estMinutes}min
        </span>
      </div>
      <h2 className="text-lg font-semibold text-zinc-100">{problem.title}</h2>
      {/* Problem statement — shown for puzzle/estimation (always), algo (after frame) */}
      {problem.problemStatement && (kind !== "algo" || stage !== "frame") && (
        <p className="text-sm text-zinc-300 leading-relaxed mt-2 bg-zinc-800/40 rounded-md px-3 py-2.5 border border-zinc-700/50">
          {problem.problemStatement}
        </p>
      )}

      {/* External link — shown after frame for algo; always for puzzle/estimation */}
      {(kind !== "algo" || stage !== "frame") && (
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors mt-1"
        >
          <span>Open {kind === "algo" ? "problem" : "reference"} ↗</span>
        </a>
      )}
    </div>
  );
}

export function FrameStage({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const ok = value.trim().length > 0;
  return (
    <div className="space-y-3">
      <label className="!text-zinc-300 !normal-case !tracking-normal !text-xs !font-normal">
        What&apos;s this problem asking? (Restate it in your own words before solving)
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="The problem is asking me to…"
      />
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!ok}
          className="btn-primary"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

export function ApproachStage({
  problem,
  value,
  onChange,
  onStart,
}: {
  problem: LabProblem;
  value: string;
  onChange: (v: string) => void;
  onStart: () => void;
}) {
  const kind = problem.kind ?? "algo";
  const prompt =
    kind === "puzzle"
      ? "What's your initial guess and why?"
      : kind === "estimation"
      ? "What decomposition will you use? (Estimate each factor before submitting.)"
      : "Before solving: what approach will you try first? Predicted complexity?";
  const ok = value.trim().length > 0;
  return (
    <div className="space-y-3">
      <label className="!text-zinc-300 !normal-case !tracking-normal !text-xs !font-normal">
        {prompt}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={kind === "estimation" ? "factor 1 × factor 2 ÷ factor 3 = …" : "Try…"}
      />
      <div className="flex justify-end">
        <button
          onClick={onStart}
          disabled={!ok}
          className="btn-primary"
        >
          {kind === "estimation" ? "Submit answer →" : "Start solving"}
        </button>
      </div>
    </div>
  );
}

function formatElapsed(startedAt: number | null, now: number): string {
  if (!startedAt) return "00:00";
  const totalSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function SolveStage({
  problem,
  startedAt,
  now,
  hintsUsed,
  onSolved,
  onGaveUp,
  onSkip,
  onStuck,
  estimationAnswer,
  setEstimationAnswer,
  estimationCorrect,
  onSubmitEstimation,
}: {
  problem: LabProblem;
  startedAt: number | null;
  now: number;
  hintsUsed: number;
  onSolved: () => void;
  onGaveUp: () => void;
  onSkip: () => void;
  onStuck: () => void;
  estimationAnswer: string;
  setEstimationAnswer: (v: string) => void;
  estimationCorrect: boolean | null;
  onSubmitEstimation: () => void;
}) {
  const kind = problem.kind ?? "algo";

  if (kind === "estimation") {
    const ok = estimationAnswer.trim().length > 0;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono tabular-nums text-zinc-300">
            ⧖ {formatElapsed(startedAt, now)}
          </span>
          {hintsUsed > 0 && (
            <span className="text-zinc-600">
              {hintsUsed} hint{hintsUsed === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <label className="!text-zinc-300 !normal-case !tracking-normal !text-xs !font-normal">
          Your answer:
        </label>
        <input
          type="text"
          value={estimationAnswer}
          onChange={(e) => setEstimationAnswer(e.target.value)}
          placeholder={
            problem.answerType === "ordering"
              ? "ranked list, comma-separated"
              : problem.answerType === "categorical"
              ? "technique / complexity / category"
              : "a number, ~10^N also OK"
          }
        />
        {estimationCorrect !== null && (
          <div
            className={`text-xs ${
              estimationCorrect ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {estimationCorrect
              ? "Within tolerance."
              : "Off-mark. See canonical below."}
          </div>
        )}
        <div className="flex justify-between gap-2">
          <button onClick={onSkip} className="btn-ghost text-xs">
            Skip
          </button>
          <button
            onClick={onSubmitEstimation}
            disabled={!ok}
            className="btn-primary"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs">
        <span className="font-mono tabular-nums text-zinc-300">
          ⧖ {formatElapsed(startedAt, now)}
        </span>
        {hintsUsed > 0 && (
          <span className="text-zinc-600">
            {hintsUsed} hint{hintsUsed === 1 ? "" : "s"} used
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onStuck}
          className="btn-secondary text-xs"
          title="Get a generic thinking move to try"
        >
          Stuck?
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={onSkip} className="btn-ghost text-xs">
            Skip
          </button>
          <button onClick={onGaveUp} className="btn-danger text-xs">
            Gave up
          </button>
          <button onClick={onSolved} className="btn-primary">
            Solved
          </button>
        </div>
      </div>
    </div>
  );
}

export function DistillStage({
  problem,
  takeaway,
  onChange,
  outcome,
  estimationCorrect,
  estimationAnswer,
  isReview,
  onSave,
  onRate,
}: {
  problem: LabProblem;
  takeaway: string;
  onChange: (v: string) => void;
  outcome: LabSolve["outcome"];
  estimationCorrect: boolean | null;
  estimationAnswer: string;
  isReview: boolean;
  onSave: () => void;
  onRate: (r: ReviewRating) => void;
}) {
  const kind = problem.kind ?? "algo";
  const ok = takeaway.trim().length > 0;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Canonical insight
        </div>
        <div className="text-sm text-zinc-200 leading-relaxed">
          {problem.canonicalInsight}
        </div>
      </div>

      {kind === "estimation" && (
        <div className="space-y-1 text-xs">
          <div className="text-zinc-600 uppercase tracking-widest font-bold text-[10px]">
            Canonical answer
          </div>
          <div className="text-zinc-300 font-mono">{problem.answer}</div>
          {estimationAnswer && (
            <div className="text-zinc-500">
              Your answer:{" "}
              <span className="text-zinc-300 font-mono">{estimationAnswer}</span>{" "}
              <span
                className={estimationCorrect ? "text-emerald-400" : "text-rose-400"}
              >
                {estimationCorrect ? "✓" : "✗"}
              </span>
            </div>
          )}
        </div>
      )}

      {outcome === "gave-up" && (
        <div className="text-[11px] text-rose-500 uppercase tracking-widest font-bold">
          Marked as gave up
        </div>
      )}

      <div className="space-y-2">
        <label className="!text-zinc-300 !normal-case !tracking-normal !text-xs !font-normal">
          Your own one-sentence takeaway:
        </label>
        <textarea
          rows={3}
          value={takeaway}
          onChange={(e) => onChange(e.target.value)}
          placeholder="The lesson I'll carry forward is…"
        />
      </div>

      {isReview ? (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            How well did you recognise the underlying insight?
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onRate("again")}
              disabled={!ok}
              className="btn-rate btn-rate-1 text-xs"
            >
              Again
            </button>
            <button
              onClick={() => onRate("hard")}
              disabled={!ok}
              className="btn-rate btn-rate-2 text-xs"
            >
              Hard
            </button>
            <button
              onClick={() => onRate("good")}
              disabled={!ok}
              className="btn-rate btn-rate-3 text-xs"
            >
              Good
            </button>
            <button
              onClick={() => onRate("easy")}
              disabled={!ok}
              className="btn-rate btn-rate-4 text-xs"
            >
              Easy
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={onSave} disabled={!ok} className="btn-primary">
            Save + next
          </button>
        </div>
      )}
    </div>
  );
}

export function StuckPanel({
  move,
  onClose,
  onWorked,
  onStillStuck,
  onAnother,
}: {
  move: StuckMove | null;
  onClose: () => void;
  onWorked: () => void;
  onStillStuck: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="border border-amber-700/40 bg-amber-950/20 rounded-md px-4 py-3 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest flex-shrink-0 leading-5">
          Try this
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-zinc-600 hover:text-zinc-300 text-xs"
          title="Hide"
        >
          ×
        </button>
      </div>
      {move ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-zinc-100">{move.name}</div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            {move.description}
          </div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">
            <span className="text-zinc-600 font-semibold uppercase tracking-widest mr-1.5">
              Example.
            </span>
            {move.example}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={onWorked} className="btn-primary text-xs">
              It helped
            </button>
            <button onClick={onStillStuck} className="btn-secondary text-xs">
              Still stuck — log + try another
            </button>
            <button onClick={onAnother} className="btn-ghost text-xs">
              Try another (don&apos;t log)
            </button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500">
          No more moves to suggest in this session.
        </div>
      )}
    </div>
  );
}

export function ReviewBanner({ insightId }: { insightId: string }) {
  const insight = INSIGHTS_BY_ID[insightId];
  if (!insight) return null;
  return (
    <div className="border border-cyan-700/40 bg-cyan-950/20 rounded-md px-3.5 py-3 space-y-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
        Review · insight is due
      </div>
      <div className="text-sm font-semibold text-zinc-100">{insight.name}</div>
      <div className="text-[11px] text-zinc-400 leading-relaxed">
        {insight.description}
      </div>
      <div className="text-[10px] text-zinc-600 italic pt-1">
        Recognise this insight in the fresh problem below — then rate your recall.
      </div>
    </div>
  );
}

export function ConceptOnlyReview({
  insightId,
  onRate,
}: {
  insightId: string;
  onRate: (r: ReviewRating) => void;
}) {
  const insight = INSIGHTS_BY_ID[insightId];
  if (!insight) return null;
  return (
    <div className="card px-5 py-5 space-y-4">
      <ReviewBanner insightId={insightId} />
      <div className="text-xs text-zinc-500 leading-relaxed">
        No tagged problem available right now — review the concept and rate your recall.
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => onRate("again")} className="btn-rate btn-rate-1 text-xs">
          Again
        </button>
        <button onClick={() => onRate("hard")} className="btn-rate btn-rate-2 text-xs">
          Hard
        </button>
        <button onClick={() => onRate("good")} className="btn-rate btn-rate-3 text-xs">
          Good
        </button>
        <button onClick={() => onRate("easy")} className="btn-rate btn-rate-4 text-xs">
          Easy
        </button>
      </div>
    </div>
  );
}
