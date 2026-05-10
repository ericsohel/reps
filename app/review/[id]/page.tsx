import { db } from "@/lib/db";
import { problems, srsState } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReviewClient from "./review-client";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = Number(id);
  const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
  const [state] = await db.select().from(srsState).where(eq(srsState.problemId, problemId));
  if (!problem || !state) notFound();

  return (
    <ReviewClient
      problem={{
        id: problem.id,
        title: problem.title,
        url: problem.url ?? null,
        pattern: problem.pattern,
        lcDifficulty: problem.lcDifficulty,
        recognition: problem.recognition ?? "",
        insight: problem.insight ?? "",
        failureMode: problem.failureMode ?? "",
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
