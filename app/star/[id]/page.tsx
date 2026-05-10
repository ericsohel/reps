import { db } from "@/lib/db";
import { stars, starSrs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import StarReviewClient from "./review-client";

export const dynamic = "force-dynamic";

export default async function StarReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const starId = Number(id);
  const [star] = await db.select().from(stars).where(eq(stars.id, starId));
  const [state] = await db.select().from(starSrs).where(eq(starSrs.starId, starId));
  if (!star || !state) notFound();

  return (
    <StarReviewClient
      star={{
        id: star.id,
        prompt: star.prompt,
        tag: star.tag ?? "",
        situation: star.situation ?? "",
        task: star.task ?? "",
        action: star.action ?? "",
        result: star.result ?? "",
      }}
      state={{
        stability: state.stability,
        difficulty: state.difficulty,
        reps: state.reps,
        lapses: state.lapses,
      }}
    />
  );
}
