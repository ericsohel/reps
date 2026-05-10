"use server";

import { db } from "@/lib/db";
import { stars, starSrs } from "@/lib/schema";
import { applyReview, type Grade } from "@/lib/fsrs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DAY_MS = 86_400_000;
const VALID_GRADES = new Set([1, 2, 3, 4]);

export interface NewStarInput {
  prompt: string;
  tag?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
}

export async function createStar(input: NewStarInput) {
  if (!input.prompt?.trim()) throw new Error("prompt required");

  const [star] = await db.insert(stars).values({
    prompt: input.prompt.trim(),
    tag: input.tag?.trim() || null,
    situation: input.situation?.trim() || null,
    task: input.task?.trim() || null,
    action: input.action?.trim() || null,
    result: input.result?.trim() || null,
  }).returning();

  // Initialize SRS state with grade=3 (Good) by default — they're writing it down,
  // they presumably know the story.
  const result = applyReview({
    stability: null, difficulty: null, elapsedDays: 0, grade: 3, reps: 0,
    elapsedMinutes: 25, // neutral — disables time adjustment for new STARs
    lcDifficulty: "Medium",
  });

  const now = Date.now();
  await db.insert(starSrs).values({
    starId: star.id,
    stability: result.stability,
    difficulty: result.difficulty,
    lastReviewAt: new Date(now),
    dueAt: new Date(now + result.intervalDays * DAY_MS),
    reps: 1,
    lapses: 0,
  });

  revalidatePath("/star");
  redirect("/star");
}

export async function updateStar(id: number, input: NewStarInput) {
  if (!input.prompt?.trim()) throw new Error("prompt required");
  await db.update(stars).set({
    prompt: input.prompt.trim(),
    tag: input.tag?.trim() || null,
    situation: input.situation?.trim() || null,
    task: input.task?.trim() || null,
    action: input.action?.trim() || null,
    result: input.result?.trim() || null,
  }).where(eq(stars.id, id));
  revalidatePath("/star");
  revalidatePath(`/star/${id}`);
}

export async function recordStarReview(starId: number, grade: Grade, elapsedMinutes: number) {
  if (!VALID_GRADES.has(grade)) throw new Error("invalid grade");
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0 || elapsedMinutes > 60) {
    throw new Error("invalid elapsedMinutes");
  }

  const [state] = await db.select().from(starSrs).where(eq(starSrs.starId, starId));
  if (!state) throw new Error("star not found");

  const now = Date.now();
  const elapsedDays = Math.max(0, (now - state.lastReviewAt.getTime()) / DAY_MS);

  // For STAR, hardcode lcDifficulty="Medium" and pass neutral expected time
  // so the time-aware adjustment doesn't dominate (recall is fast, FSRS-wise).
  const result = applyReview({
    stability: state.stability,
    difficulty: state.difficulty,
    elapsedDays,
    grade,
    reps: state.reps,
    elapsedMinutes: 5,
    expectedMinutes: 5,
    lcDifficulty: "Medium",
  });

  await db.update(starSrs).set({
    stability: result.stability,
    difficulty: result.difficulty,
    lastReviewAt: new Date(now),
    dueAt: new Date(now + result.intervalDays * DAY_MS),
    reps: state.reps + 1,
    lapses: state.lapses + (result.isLapse ? 1 : 0),
  }).where(eq(starSrs.starId, starId));

  revalidatePath("/star");
  redirect("/star");
}

export async function snoozeStar(starId: number, days: number) {
  if (!Number.isFinite(days) || days < 0 || days > 365) throw new Error("invalid snooze");
  await db.update(starSrs).set({
    dueAt: new Date(Date.now() + days * DAY_MS),
  }).where(eq(starSrs.starId, starId));
  revalidatePath("/star");
}

export async function deleteStar(starId: number) {
  await db.delete(stars).where(eq(stars.id, starId));
  revalidatePath("/star");
  redirect("/star");
}
