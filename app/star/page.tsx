import { db } from "@/lib/db";
import { stars, starSrs } from "@/lib/schema";
import { eq, lte, asc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StarPage() {
  const now = new Date();

  const all = await db
    .select({
      id: stars.id,
      prompt: stars.prompt,
      tag: stars.tag,
      dueAt: starSrs.dueAt,
      stability: starSrs.stability,
      reps: starSrs.reps,
    })
    .from(stars)
    .leftJoin(starSrs, eq(starSrs.starId, stars.id))
    .orderBy(asc(starSrs.dueAt));

  const due = all.filter((s) => s.dueAt && s.dueAt <= now);
  const upcoming = all.filter((s) => s.dueAt && s.dueAt > now);

  return (
    <main className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">STAR</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Behavioral stories on spaced recall. {due.length === 0 ? "Nothing due." : `${due.length} due.`}
          </p>
        </div>
        <Link
          href="/star/new"
          className="no-underline inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <span className="text-zinc-500 text-base leading-none">+</span>
          New story
        </Link>
      </header>

      {all.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <p className="text-zinc-300 text-sm">No stories yet.</p>
          <p className="text-zinc-500 text-xs">
            Add 5–10 STAR stories covering your strongest examples — leadership, conflict, failure, ambiguity, scope.
            Practice them on schedule so they come out clean under pressure.
          </p>
        </div>
      ) : (
        <>
          {due.length > 0 && (
            <Section title="Due now">
              {due.map((s) => (
                <StarRow key={s.id} s={s} now={now.getTime()} accent />
              ))}
            </Section>
          )}
          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map((s) => (
                <StarRow key={s.id} s={s} now={now.getTime()} />
              ))}
            </Section>
          )}
        </>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</h2>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  );
}

function StarRow({
  s,
  now,
  accent,
}: {
  s: { id: number; prompt: string; tag: string | null; dueAt: Date | null; stability: number | null; reps: number | null };
  now: number;
  accent?: boolean;
}) {
  const overdue = s.dueAt ? (now - s.dueAt.getTime()) / 86400000 : 0;
  const future = s.dueAt && s.dueAt.getTime() > now;
  return (
    <li>
      <Link
        href={`/star/${s.id}`}
        className={[
          "no-underline group flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all",
          accent
            ? "border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60"
            : "border-zinc-800/80 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-zinc-700",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-zinc-100 truncate">{s.prompt}</div>
          {s.tag && <div className="text-xs text-zinc-500 mt-0.5">{s.tag}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs mono text-zinc-300">
            {future
              ? `in ${Math.ceil(-overdue)}d`
              : overdue > 0
              ? `+${overdue.toFixed(1)}d`
              : "due"}
          </div>
          {s.stability !== null && (
            <div className="text-[10px] mono text-zinc-600 mt-0.5">S {s.stability.toFixed(1)}d</div>
          )}
        </div>
      </Link>
    </li>
  );
}
