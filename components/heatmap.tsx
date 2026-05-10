import type { HeatmapData, DayCell } from "@/lib/heatmap";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LABELED_DAYS = new Set([1, 3, 5]); // Mon, Wed, Fri
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CELL = 10;       // px
const GAP = 2;         // px between cells/columns
const MONTH_GAP = 6;   // px extra space before a new-month column

export function Heatmap({ data }: { data: HeatmapData }) {
  // Pad the front so the leftmost column starts on a Sunday.
  const cells = data.cells;
  const firstDate = new Date(cells[0].date + "T00:00:00Z");
  const firstDayOfWeek = firstDate.getUTCDay(); // 0=Sun..6=Sat
  const padded: (DayCell | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) padded.push(null);
  padded.push(...cells);

  // Group into weeks (columns of 7).
  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // For each column, figure out the month of its first non-null day,
  // and decide whether this column is the start of a new month.
  let lastMonth = -1;
  const cols = weeks.map((week, wi) => {
    const firstReal = week.find((c) => c !== null) ?? null;
    if (!firstReal) return { wi, monthLabel: null as string | null, isMonthStart: false };
    const month = new Date(firstReal.date + "T00:00:00Z").getUTCMonth();
    const isMonthStart = month !== lastMonth;
    const monthLabel = isMonthStart ? MONTHS[month] : null;
    if (isMonthStart) lastMonth = month;
    return { wi, monthLabel, isMonthStart: isMonthStart && wi > 0 };
  });

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-y-3">
        <div className="flex items-baseline gap-6">
          <Stat label="Current streak" value={`${data.currentStreak}`} unit={data.currentStreak === 1 ? "day" : "days"} large />
          <Stat label="Longest"        value={`${data.longestStreak}d`} />
          <Stat label={`Lit / Active`} value={`${data.greenDays} / ${data.activeDays}`} />
          <Stat label="Year"           value={`${data.year}`} />
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ display: "inline-block" }}>
          {/* Month labels row */}
          <div className="flex" style={{ marginBottom: 4, marginLeft: 28 }}>
            {cols.map((col) => (
              <div
                key={col.wi}
                style={{
                  width: CELL,
                  marginLeft: col.wi === 0 ? 0 : col.isMonthStart ? GAP + MONTH_GAP : GAP,
                  position: "relative",
                  height: 12,
                }}
              >
                {col.monthLabel && (
                  <span
                    className="text-[10px] text-zinc-400 mono whitespace-nowrap absolute left-0 top-0"
                  >
                    {col.monthLabel}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day labels + grid */}
          <div className="flex">
            <div className="flex flex-col mr-1.5 text-[9px] text-zinc-600 mono" style={{ width: 22 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: CELL, marginTop: i === 0 ? 0 : GAP }}
                  className="flex items-center justify-end pr-0.5"
                >
                  {LABELED_DAYS.has(i) ? DAY_NAMES[i] : ""}
                </div>
              ))}
            </div>

            <div className="flex">
              {cols.map((col, wi) => (
                <div
                  key={col.wi}
                  className="flex flex-col"
                  style={{ marginLeft: wi === 0 ? 0 : col.isMonthStart ? GAP + MONTH_GAP : GAP }}
                >
                  {weeks[wi].map((cell, di) => (
                    <div
                      key={di}
                      style={{ width: CELL, height: CELL, marginTop: di === 0 ? 0 : GAP }}
                    >
                      {cell ? <Cell cell={cell} /> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: DayCell }) {
  // Fire palette: bright orange for full days, dim ember for partial, dark for none.
  // Future days render fainter so the year visibly fills as it progresses.
  const cls = cell.isFuture
    ? "bg-zinc-900/50"
    : cell.intensity === 2
    ? "bg-orange-500 hover:bg-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.45)]"
    : cell.intensity === 1
    ? "bg-orange-900/55 hover:bg-orange-800"
    : "bg-zinc-800/60 hover:bg-zinc-700";
  const tip = cell.isFuture
    ? `${cell.date} · upcoming`
    : `${cell.date} · ${cell.newCount} new · ${cell.reviewCount} reviews`;
  return <div className={`w-full h-full rounded-[2px] ${cls} transition-colors`} title={tip} />;
}

function Stat({ label, value, unit, large }: { label: string; value: string; unit?: string; large?: boolean }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
      <p className={`mono ${large ? "text-2xl font-semibold" : "text-lg font-medium"} ${large ? "text-zinc-100" : "text-zinc-300"} tabular-nums`}>
        {value}
        {unit && <span className="text-sm text-zinc-500 ml-1 font-normal">{unit}</span>}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
      <span>cold</span>
      <div className="w-[10px] h-[10px] rounded-[2px] bg-zinc-800/60" />
      <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-900/55" />
      <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-500" />
      <span>fire</span>
    </div>
  );
}
