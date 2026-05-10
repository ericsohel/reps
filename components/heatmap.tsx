import type { HeatmapData, DayCell } from "@/lib/heatmap";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LABELED_DAYS = new Set([1, 3, 5]); // Mon, Wed, Fri

export function Heatmap({ data }: { data: HeatmapData }) {
  // Lay out as columns of weeks. Pad the front so the leftmost column starts on a Sunday.
  const cells = data.cells;
  const firstDate = new Date(cells[0].date + "T00:00:00Z");
  const firstDayOfWeek = firstDate.getUTCDay(); // 0=Sun..6=Sat
  const padded: (DayCell | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) padded.push(null);
  padded.push(...cells);

  // Group into weeks (columns of 7)
  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Current streak</p>
            <p className="mono text-2xl font-semibold text-zinc-100 tabular-nums">
              {data.currentStreak}
              <span className="text-sm text-zinc-500 ml-1 font-normal">{data.currentStreak === 1 ? "day" : "days"}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Longest</p>
            <p className="mono text-lg font-medium text-zinc-300 tabular-nums">{data.longestStreak}d</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Green / Active</p>
            <p className="mono text-lg font-medium text-zinc-300 tabular-nums">{data.greenDays} / {data.activeDays}</p>
          </div>
        </div>
        <Legend />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pr-1.5 pt-[14px] text-[9px] text-zinc-600 mono">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: "10px" }} className="flex items-center">
              {LABELED_DAYS.has(i) ? DAY_NAMES[i] : ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di];
                if (!cell) return <div key={di} className="w-[10px] h-[10px]" />;
                return <Cell key={di} cell={cell} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: DayCell }) {
  const cls =
    cell.intensity === 2 ? "bg-emerald-500/80 hover:bg-emerald-400"
    : cell.intensity === 1 ? "bg-emerald-900/60 hover:bg-emerald-800"
    : "bg-zinc-800/60 hover:bg-zinc-700";
  const tip = `${cell.date} · ${cell.newCount} new · ${cell.reviewCount} reviews`;
  return <div className={`w-[10px] h-[10px] rounded-[2px] ${cls} transition-colors`} title={tip} />;
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
      <span>less</span>
      <div className="w-[10px] h-[10px] rounded-[2px] bg-zinc-800/60" />
      <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-900/60" />
      <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/80" />
      <span>more</span>
    </div>
  );
}
