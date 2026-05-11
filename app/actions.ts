"use server";

import { db } from "@/lib/db";
import { problems, attempts, srsState, patternState } from "@/lib/schema";
import { applyReview, updatePatternStability, type Grade } from "@/lib/fsrs";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DAY_MS = 86_400_000;
const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const VALID_GRADES = new Set([1, 2, 3, 4]);

export interface LogProblemInput {
  title: string;
  url?: string;
  pattern: string;
  lcDifficulty: "Easy" | "Medium" | "Hard";
  elapsedMinutes: number;
  hintsUsed?: number;
  rating: Grade;
  recognition?: string;
  insight?: string;
  failureMode?: string;
}

function validateLogInput(input: LogProblemInput) {
  if (!input.title?.trim()) throw new Error("title required");
  if (!input.pattern?.trim()) throw new Error("pattern required");
  if (!VALID_DIFFICULTIES.has(input.lcDifficulty)) throw new Error("invalid difficulty");
  if (!Number.isFinite(input.elapsedMinutes) || input.elapsedMinutes < 0 || input.elapsedMinutes > 600) {
    throw new Error("invalid elapsedMinutes (must be 0–600)");
  }
  if (!VALID_GRADES.has(input.rating)) throw new Error("invalid rating");
  if (![0, 1, 2, 3].includes(input.hintsUsed ?? 0)) throw new Error("invalid hintsUsed");
}

export async function logNewProblem(input: LogProblemInput) {
  validateLogInput(input);
  const expectedMin = await getExpectedMinutes(input.lcDifficulty);

  const [problem] = await db.insert(problems).values({
    title: input.title.trim(),
    url: input.url?.trim() || null,
    pattern: input.pattern,
    lcDifficulty: input.lcDifficulty,
    recognition: input.recognition?.trim() || null,
    insight: input.insight?.trim() || null,
    failureMode: input.failureMode?.trim() || null,
  }).returning();

  await db.insert(attempts).values({
    problemId: problem.id,
    elapsedMinutes: input.elapsedMinutes,
    hintsUsed: input.hintsUsed ?? 0,
    rating: input.rating,
    isReview: false,
  });

  const result = applyReview({
    stability: null,
    difficulty: null,
    elapsedDays: 0,
    grade: input.rating,
    reps: 0,
    elapsedMinutes: input.elapsedMinutes,
    expectedMinutes: expectedMin,
    lcDifficulty: input.lcDifficulty,
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
  hintsUsed: number = 0,
) {
  if (!VALID_GRADES.has(grade)) throw new Error("invalid grade");
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0 || elapsedMinutes > 600) {
    throw new Error("invalid elapsedMinutes");
  }
  if (![0, 1, 2, 3].includes(hintsUsed)) throw new Error("invalid hintsUsed");

  const [state] = await db.select().from(srsState).where(eq(srsState.problemId, problemId));
  const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
  if (!state || !problem) throw new Error("problem not found");

  const now = Date.now();
  const elapsedDays = Math.max(0, (now - state.lastReviewAt.getTime()) / DAY_MS);

  const [pState] = await db.select().from(patternState).where(eq(patternState.pattern, problem.pattern));
  const expectedMin = await getExpectedMinutes(problem.lcDifficulty);

  const result = applyReview({
    stability: state.stability,
    difficulty: state.difficulty,
    elapsedDays,
    grade,
    reps: state.reps,
    elapsedMinutes,
    expectedMinutes: expectedMin,
    lcDifficulty: problem.lcDifficulty,
    patternStability: pState?.stability,
  });

  await db.insert(attempts).values({
    problemId,
    elapsedMinutes,
    hintsUsed,
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
  if (!Number.isFinite(days) || days < 0 || days > 365) throw new Error("invalid snooze");
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
    recognition: recognition.trim() || null,
    insight: insight.trim() || null,
    failureMode: failureMode.trim() || null,
  }).where(eq(problems.id, problemId));
  revalidatePath(`/review/${problemId}`);
}

// Compute median solve time for the user at this difficulty over the last 30 days.
// Falls back to defaults until 5+ samples exist. Cached effectively by Next's request memoization.
async function getExpectedMinutes(lcDifficulty: "Easy" | "Medium" | "Hard"): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * DAY_MS);
  const rows = await db
    .select({ elapsedMinutes: attempts.elapsedMinutes })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(
      and(
        eq(problems.lcDifficulty, lcDifficulty),
        sql`${attempts.attemptedAt} >= ${cutoff.getTime()}`,
        sql`${attempts.rating} >= 3`, // only Good/Easy attempts inform the baseline
      ),
    );

  if (rows.length < 5) {
    return ({ Easy: 12, Medium: 25, Hard: 45 } as const)[lcDifficulty];
  }
  const times = rows.map((r) => r.elapsedMinutes).sort((a, b) => a - b);
  const mid = Math.floor(times.length / 2);
  return times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
}

async function bumpPatternStability(pattern: string, problemS: number) {
  const [existing] = await db.select().from(patternState).where(eq(patternState.pattern, pattern));

  // Count distinct problems with this pattern that have an SRS state.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(problems)
    .innerJoin(srsState, eq(srsState.problemId, problems.id))
    .where(eq(problems.pattern, pattern));

  if (!existing) {
    await db.insert(patternState).values({ pattern, stability: problemS });
  } else {
    const newS = updatePatternStability(existing.stability, problemS, Number(count));
    await db.update(patternState).set({
      stability: newS,
      lastUpdatedAt: new Date(),
    }).where(eq(patternState.pattern, pattern));
  }
}
