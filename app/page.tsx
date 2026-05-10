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
    <main className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            {ordered.length === 0
              ? "Nothing due"
              : `${ordered.length} due · interleaved by pattern`}
          </p>
        </div>
        <Link href="/log" className="btn-primary no-underline">
          New problem
        </Link>
      </header>

      {ordered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-zinc-400 text-sm">Inbox zero. Log a new problem to keep moving.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {ordered.map((p) => {
            const overdue = (now.getTime() - p.dueAt) / 86400000;
            return (
              <li key={p.id}>
                <Link
                  href={`/review/${p.id}`}
                  className="no-underline group flex items-center gap-4 px-4 py-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all"
                >
                  <DifficultyDot d={p.lcDifficulty} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-100 truncate">{p.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{p.pattern}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs mono text-zinc-300">
                      {overdue > 0 ? `+${overdue.toFixed(1)}d` : "due"}
                    </div>
                    <div className="text-[10px] mono text-zinc-600 mt-0.5">
                      S {p.stability.toFixed(1)}d
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function DifficultyDot({ d }: { d: string }) {
  const color =
    d === "Easy" ? "bg-emerald-500/80"
    : d === "Medium" ? "bg-amber-500/80"
    : "bg-rose-500/80";
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} title={d} />;
}
