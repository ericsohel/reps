import { db } from "@/lib/db";
import { problems, attempts, srsState, patternState } from "@/lib/schema";
import { sql, eq, desc } from "drizzle-orm";
import { PATTERNS } from "@/lib/patterns";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

export default async function LeaksPage() {
  // Lapse rate per pattern (problems with 3+ attempts where saw-solution rate >30%)
  const perPattern = await db
    .select({
      pattern: problems.pattern,
      problemId: problems.id,
      title: problems.title,
      attemptsCount: sql<number>`count(${attempts.id})`,
      lapses: sql<number>`sum(case when ${attempts.rating} = 1 then 1 else 0 end)`,
      avgMinutes: sql<number>`avg(${attempts.elapsedMinutes})`,
    })
    .from(problems)
    .leftJoin(attempts, eq(attempts.problemId, problems.id))
    .groupBy(problems.id);

  const patternStats = new Map<string, { count: number; lapseRate: number; avgMin: number; problems: number }>();
  for (const row of perPattern) {
    const cur = patternStats.get(row.pattern) ?? { count: 0, lapseRate: 0, avgMin: 0, problems: 0 };
    const lapseRate = row.attemptsCount > 0 ? Number(row.lapses) / Number(row.attemptsCount) : 0;
    cur.count += Number(row.attemptsCount);
    cur.lapseRate = (cur.lapseRate * cur.problems + lapseRate) / (cur.problems + 1);
    cur.avgMin = (cur.avgMin * cur.problems + Number(row.avgMinutes ?? 0)) / (cur.problems + 1);
    cur.problems += 1;
    patternStats.set(row.pattern, cur);
  }

  const pStates = await db.select().from(patternState);
  const lastSeen = new Map(pStates.map((p) => [p.pattern, p.lastUpdatedAt.getTime()]));

  const now = Date.now();
  const rows = PATTERNS.map((p) => {
    const stats = patternStats.get(p);
    const last = lastSeen.get(p);
    const daysSince = last ? (now - last) / DAY_MS : null;
    return {
      pattern: p,
      attempts: stats?.count ?? 0,
      problems: stats?.problems ?? 0,
      lapseRate: stats?.lapseRate ?? 0,
      avgMin: stats?.avgMin ?? 0,
      daysSince,
    };
  });

  const conceptGaps = rows.filter((r) => r.attempts >= 3 && r.lapseRate > 0.3);
  const stale = rows.filter((r) => r.daysSince !== null && r.daysSince > 14);
  const untouched = rows.filter((r) => r.attempts === 0);

  return (
    <main className="space-y-8">
      <h1 className="text-2xl font-bold">Leak detection</h1>

      <Section title="Concept gaps" hint="≥3 attempts with >30% lapse rate. Stop grinding — go study the underlying technique.">
        {conceptGaps.length === 0 ? <Empty /> : (
          <Table rows={conceptGaps.map((r) => [r.pattern, `${(r.lapseRate * 100).toFixed(0)}%`, `${r.attempts} attempts`])} />
        )}
      </Section>

      <Section title="Stale patterns" hint=">14 days since last touched. Schedule a fresh problem.">
        {stale.length === 0 ? <Empty /> : (
          <Table rows={stale.map((r) => [r.pattern, `${r.daysSince?.toFixed(0)} days`, `${r.problems} problems`])} />
        )}
      </Section>

      <Section title="Never touched" hint="Patterns you've never logged.">
        {untouched.length === 0 ? <Empty /> : (
          <ul className="text-sm text-zinc-300 space-y-1">{untouched.map((r) => <li key={r.pattern}>· {r.pattern}</li>)}</ul>
        )}
      </Section>

      <Section title="All patterns" hint="">
        <Table rows={rows.map((r) => [
          r.pattern,
          `${r.problems}p / ${r.attempts}a`,
          `${(r.lapseRate * 100).toFixed(0)}% lapse`,
          r.avgMin > 0 ? `${r.avgMin.toFixed(0)}m avg` : "—",
          r.daysSince !== null ? `${r.daysSince.toFixed(0)}d ago` : "never",
        ])} />
      </Section>
    </main>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      <div>{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-zinc-500 italic">none</p>;
}

function Table({ rows }: { rows: (string | number)[][] }) {
  return (
    <div className="rounded border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((cols, i) => (
            <tr key={i} className="border-b border-zinc-800 last:border-0">
              {cols.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium" : "text-zinc-400 text-right"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
