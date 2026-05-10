import type { HeatmapData, MonthBlock, DayCell } from "@/lib/heatmap";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LABELED_DAYS = new Set([1, 3, 5]); // Mon, Wed, Fri

const CELL = 11;        // px
const GAP = 2;          // px between cells in a month
const MONTH_GAP = 12;   // px between months
const LABEL_HEIGHT = 14;

export function Heatmap({ data }: { data: HeatmapData }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-y-3">
        <div className="flex items-baseline gap-6">
          <Stat label="Current streak" value={`${data.currentStreak}`} unit={data.currentStreak === 1 ? "day" : "days"} large />
          <Stat label="Longest"        value={`${data.longestStreak}d`} />
          <Stat label="Lit / Active"   value={`${data.greenDays} / ${data.activeDays}`} />
          <Stat label="Year"           value={`${data.year}`} />
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex" style={{ gap: MONTH_GAP }}>
          <DayLabels />
          {data.months.map((m) => (
            <Month key={`${m.year}-${m.month}`} block={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayLabels() {
  return (
    <div className="flex flex-col" style={{ marginTop: LABEL_HEIGHT, marginRight: 2 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{ height: CELL, marginTop: i === 0 ? 0 : GAP }}
          className="flex items-center justify-end text-[9px] text-zinc-600 mono pr-1 w-[22px]"
        >
          {LABELED_DAYS.has(i) ? DAY_NAMES[i] : ""}
        </div>
      ))}
    </div>
  );
}

function Month({ block }: { block: MonthBlock }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-400 mono mb-1" style={{ height: LABEL_HEIGHT - 4 }}>
        {block.label}
      </div>
      <div className="flex" style={{ gap: GAP }}>
        {block.weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
            {Array.from({ length: 7 }).map((_, dow) => {
              const cell = week[dow];
              return (
                <div key={dow} style={{ width: CELL, height: CELL }}>
                  {cell ? <Cell cell={cell} /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: DayCell }) {
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
      <p className={`mono ${large ? "text-2xl font-semibold text-zinc-100" : "text-lg font-medium text-zinc-300"} tabular-nums`}>
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
