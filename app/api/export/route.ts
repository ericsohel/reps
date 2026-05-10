import { db } from "@/lib/db";
import { problems, attempts, srsState } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: problems.id,
      lcNumber: problems.lcNumber,
      title: problems.title,
      pattern: problems.pattern,
      lcDifficulty: problems.lcDifficulty,
      attemptedAt: attempts.attemptedAt,
      elapsedMinutes: attempts.elapsedMinutes,
      hintsUsed: attempts.hintsUsed,
      rating: attempts.rating,
      isReview: attempts.isReview,
      stability: srsState.stability,
      difficulty: srsState.difficulty,
    })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .leftJoin(srsState, eq(srsState.problemId, attempts.problemId));

  const header = ["id","lcNumber","title","pattern","lcDifficulty","attemptedAt","elapsedMinutes","hintsUsed","rating","isReview","stability","difficulty"];
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => escape((r as Record<string, unknown>)[h])).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leetcode-srs-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
