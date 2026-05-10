"use server";

import { db } from "@/lib/db";
import { problems, attempts, srsState, patternState } from "@/lib/schema";
import { applyReview, updatePatternStability, type Grade } from "@/lib/fsrs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DAY_MS = 86_400_000;

export interface LogProblemInput {
  title: string;
  lcNumber?: number;
  url?: string;
  pattern: string;
  lcDifficulty: "Easy" | "Medium" | "Hard";
  elapsedMinutes: number;
  hintsUsed: number;
  rating: Grade;
  recognition?: string;
  insight?: string;
  failureMode?: string;
}

export async function logNewProblem(input: LogProblemInput) {
  const [problem] = await db.insert(problems).values({
    title: input.title,
    lcNumber: input.lcNumber,
    url: input.url,
    pattern: input.pattern,
    lcDifficulty: input.lcDifficulty,
    recognition: input.recognition,
    insight: input.insight,
    failureMode: input.failureMode,
  }).returning();

  await db.insert(attempts).values({
    problemId: problem.id,
    elapsedMinutes: input.elapsedMinutes,
    hintsUsed: input.hintsUsed,
    rating: input.rating,
    isReview: false,
  });

  const result = applyReview({
    stability: null, difficulty: null, elapsedDays: 0, grade: input.rating,
    reps: 0, elapsedMinutes: input.elapsedMinutes, lcDifficulty: input.lcDifficulty,
  });

  const now = Date.now();
  await db.insert(srsState).values({
    problemId: problem.id,
    stability: result.stability,
    difficulty: result.difficulty,
    lastReviewAt: new Date(now),
    dueAt: new Date(now + result.intervalDays * DAY_MS),
    reps: 1,
    lapses: result.isLapse ? 1 : 0,
  });

  await bumpPatternStability(input.pattern, result.stability);

  revalidatePath("/");
  redirect("/");
}

export async function recordReview(
  problemId: number,
  grade: Grade,
  elapsedMinutes: number,
) {
  const [state] = await db.select().from(srsState).where(eq(srsState.problemId, problemId));
  const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
  if (!state || !problem) throw new Error("not found");

  const now = Date.now();
  const elapsedDays = (now - state.lastReviewAt.getTime()) / DAY_MS;

  const [pState] = await db.select().from(patternState).where(eq(patternState.pattern, problem.pattern));

  const result = applyReview({
    stability: state.stability,
    difficulty: state.difficulty,
    elapsedDays,
    grade,
    reps: state.reps,
    elapsedMinutes,
    lcDifficulty: problem.lcDifficulty,
    patternStability: pState?.stability,
  });

  await db.insert(attempts).values({
    problemId,
    elapsedMinutes,
    hintsUsed: 0,
    rating: grade,
    isReview: true,
  });

  await db.update(srsState).set({
    stability: result.stability,
    difficulty: result.difficulty,
    lastReviewAt: new Date(now),
    dueAt: new Date(now + result.intervalDays * DAY_MS),
    reps: state.reps + 1,
    lapses: state.lapses + (result.isLapse ? 1 : 0),
  }).where(eq(srsState.problemId, problemId));

  await bumpPatternStability(problem.pattern, result.stability);

  revalidatePath("/");
  redirect("/");
}

export async function deleteProblem(problemId: number) {
  await db.delete(problems).where(eq(problems.id, problemId));
  revalidatePath("/");
  redirect("/");
}

export async function snoozeReview(problemId: number, days: number) {
  await db.update(srsState).set({
    dueAt: new Date(Date.now() + days * DAY_MS),
  }).where(eq(srsState.problemId, problemId));
  revalidatePath("/");
}

export async function updateTriggerCard(
  problemId: number,
  recognition: string,
  insight: string,
  failureMode: string,
) {
  await db.update(problems).set({
    recognition, insight, failureMode,
  }).where(eq(problems.id, problemId));
  revalidatePath(`/review/${problemId}`);
}

async function bumpPatternStability(pattern: string, problemS: number) {
  const [existing] = await db.select().from(patternState).where(eq(patternState.pattern, pattern));
  if (!existing) {
    await db.insert(patternState).values({ pattern, stability: problemS });
  } else {
    const newS = updatePatternStability(existing.stability, problemS);
    await db.update(patternState).set({
      stability: newS,
      lastUpdatedAt: new Date(),
    }).where(eq(patternState.pattern, pattern));
  }
}
