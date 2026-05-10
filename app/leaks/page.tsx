import { db } from "@/lib/db";
import { problems, attempts, patternState } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import { PATTERNS } from "@/lib/patterns";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

export default async function LeaksPage() {
  const perPattern = await db
    .select({
      pattern: problems.pattern,
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
    return {
      pattern: p,
      attempts: stats?.count ?? 0,
      problems: stats?.problems ?? 0,
      lapseRate: stats?.lapseRate ?? 0,
      avgMin: stats?.avgMin ?? 0,
      daysSince: last ? (now - last) / DAY_MS : null,
    };
  });

  const conceptGaps = rows.filter((r) => r.attempts >= 3 && r.lapseRate > 0.3);
  const stale = rows.filter((r) => r.daysSince !== null && r.daysSince > 14);
  const untouched = rows.filter((r) => r.attempts === 0);
  const active = rows.filter((r) => r.attempts > 0);

  return (
    <main className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Leaks</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Patterns that need attention.</p>
      </header>

      <Section
        title="Concept gaps"
        hint="≥3 attempts with >30% lapse rate. Stop grinding — study the technique."
        empty={conceptGaps.length === 0}
      >
        {conceptGaps.map((r) => (
          <Row key={r.pattern} label={r.pattern}>
            <Pill tone="rose">{(r.lapseRate * 100).toFixed(0)}% lapse</Pill>
            <span className="text-zinc-500 mono text-xs">{r.attempts} attempts</span>
          </Row>
        ))}
      </Section>

      <Section
        title="Stale"
        hint="More than 14 days untouched. Schedule a fresh problem."
        empty={stale.length === 0}
      >
        {stale.map((r) => (
          <Row key={r.pattern} label={r.pattern}>
            <Pill tone="amber">{r.daysSince?.toFixed(0)}d ago</Pill>
            <span className="text-zinc-500 mono text-xs">{r.problems} problems</span>
          </Row>
        ))}
      </Section>

      <Section title="Never touched" hint="Patterns missing from your queue." empty={untouched.length === 0}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {untouched.map((r) => (
            <div key={r.pattern} className="text-sm text-zinc-400">{r.pattern}</div>
          ))}
        </div>
      </Section>

      <Section title="All active patterns" hint="" empty={active.length === 0}>
        <div className="card divide-y divide-zinc-800/80">
          {active.map((r) => (
            <div key={r.pattern} className="flex items-center gap-4 px-4 py-3 text-sm">
              <span className="flex-1 text-zinc-200">{r.pattern}</span>
              <span className="text-xs text-zinc-500 mono w-16 text-right">{r.problems}p · {r.attempts}a</span>
              <span className="text-xs text-zinc-500 mono w-20 text-right">{(r.lapseRate * 100).toFixed(0)}% lapse</span>
              <span className="text-xs text-zinc-500 mono w-16 text-right">{r.avgMin > 0 ? `${r.avgMin.toFixed(0)}m` : "—"}</span>
              <span className="text-xs text-zinc-500 mono w-16 text-right">{r.daysSince !== null ? `${r.daysSince.toFixed(0)}d` : "—"}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({ title, hint, empty, children }: { title: string; hint: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        {hint && <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>}
      </div>
      {empty ? (
        <p className="text-sm text-zinc-600 italic">— none —</p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800/80 bg-zinc-900/20">
      <span className="flex-1 text-sm text-zinc-200">{label}</span>
      {children}
    </div>
  );
}

function Pill({ tone, children }: { tone: "rose" | "amber" | "emerald"; children: React.ReactNode }) {
  const cls = tone === "rose"
    ? "text-rose-300 bg-rose-950/40 border-rose-900/40"
    : tone === "amber"
    ? "text-amber-300 bg-amber-950/40 border-amber-900/40"
    : "text-emerald-300 bg-emerald-950/40 border-emerald-900/40";
  return <span className={`text-[11px] mono px-2 py-0.5 rounded border ${cls}`}>{children}</span>;
}
