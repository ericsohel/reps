import { db } from "@/lib/db";
import { problems, srsState } from "@/lib/schema";
import { eq, lte } from "drizzle-orm";
import Link from "next/link";
import { interleaveByPattern } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const due = await db
    .select({
      id: problems.id,
      title: problems.title,
      pattern: problems.pattern,
      lcDifficulty: problems.lcDifficulty,
      url: problems.url,
      dueAt: srsState.dueAt,
      stability: srsState.stability,
      reps: srsState.reps,
    })
    .from(srsState)
    .innerJoin(problems, eq(problems.id, srsState.problemId))
    .where(lte(srsState.dueAt, now));

  const ordered = interleaveByPattern(
    due.map((d) => ({ ...d, dueAt: d.dueAt.getTime() })),
  );

  return (
    <main className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-zinc-400">{ordered.length} due · interleaved by pattern</p>
        </div>
        <Link href="/log" className="btn-primary no-underline">+ New problem</Link>
      </header>

      {ordered.length === 0 && (
        <div className="rounded border border-zinc-800 p-8 text-center text-zinc-400">
          Nothing due. Log a new problem.
        </div>
      )}

      <ul className="space-y-2">
        {ordered.map((p) => {
          const overdue = (now.getTime() - p.dueAt) / 86400000;
          return (
            <li key={p.id}>
              <Link
                href={`/review/${p.id}`}
                className="no-underline flex items-center gap-3 p-3 rounded border border-zinc-800 hover:border-zinc-600"
              >
                <span className={`text-xs px-2 py-0.5 rounded ${diffColor(p.lcDifficulty)}`}>{p.lcDifficulty}</span>
                <span className="font-medium">{p.title}</span>
                <span className="text-xs text-zinc-500">{p.pattern}</span>
                <span className="ml-auto text-xs text-zinc-500">
                  {overdue > 0 ? `+${overdue.toFixed(1)}d overdue` : "due"} · S={p.stability.toFixed(1)}d
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function diffColor(d: string) {
  return d === "Easy" ? "bg-green-900/40 text-green-300"
    : d === "Medium" ? "bg-yellow-900/40 text-yellow-300"
    : "bg-red-900/40 text-red-300";
}
