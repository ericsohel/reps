import { db } from "./db";
import { attempts, srsState } from "./schema";
import { sql, lte } from "drizzle-orm";

const DAY_MS = 86_400_000;
const NEW_TARGET = 2;
const REVIEW_TARGET = 3;

// Window: May 1 → Dec 31 of the current year.
const START_MONTH = 4;  // May (0-indexed)
const END_MONTH = 11;   // December (inclusive)

export interface DayCell {
  date: string;          // YYYY-MM-DD (UTC)
  newCount: number;
  reviewCount: number;
  intensity: 0 | 1 | 2;  // 0 empty, 1 partial, 2 target met
  isFuture: boolean;
}

export interface MonthBlock {
  year: number;
  month: number;       // 0-indexed
  label: string;       // 'May', 'Jun', ...
  weeks: (DayCell | null)[][];  // [weekIdx][dow] — null = day not in month
}

export interface HeatmapData {
  months: MonthBlock[];
  year: number;
  totalDays: number;
  activeDays: number;
  greenDays: number;
  currentStreak: number;
  longestStreak: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isoDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getHeatmapData(): Promise<HeatmapData> {
  const now = Date.now();
  const year = new Date(now).getUTCFullYear();
  const windowStart = Date.UTC(year, START_MONTH, 1);
  const windowEnd = Date.UTC(year, END_MONTH + 1, 1); // exclusive (start of next month)
  const totalDays = Math.round((windowEnd - windowStart) / DAY_MS);
  const todayKey = isoDate(now);

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${attempts.attemptedAt} / 1000, 'unixepoch')`,
      isReview: attempts.isReview,
      count: sql<number>`count(*)`,
    })
    .from(attempts)
    .where(
      sql`${attempts.attemptedAt} >= ${windowStart} AND ${attempts.attemptedAt} < ${windowEnd}`,
    )
    .groupBy(sql`strftime('%Y-%m-%d', ${attempts.attemptedAt} / 1000, 'unixepoch')`, attempts.isReview);

  const byDate = new Map<string, { newCount: number; reviewCount: number }>();
  for (const r of rows) {
    const cur = byDate.get(r.date) ?? { newCount: 0, reviewCount: 0 };
    if (r.isReview) cur.reviewCount += Number(r.count);
    else cur.newCount += Number(r.count);
    byDate.set(r.date, cur);
  }

  const [{ dueCount }] = await db
    .select({ dueCount: sql<number>`count(*)` })
    .from(srsState)
    .where(lte(srsState.dueAt, new Date(now)));
  const todayReviewTarget = Math.min(REVIEW_TARGET, Number(dueCount));

  function buildCell(date: Date): DayCell {
    const ts = date.getTime();
    const dateKey = isoDate(ts);
    const counts = byDate.get(dateKey) ?? { newCount: 0, reviewCount: 0 };
    const isToday = dateKey === todayKey;
    const isFuture = ts > now && !isToday;
    const reviewTarget = isToday ? todayReviewTarget : REVIEW_TARGET;
    const totalActivity = counts.newCount + counts.reviewCount;
    let intensity: 0 | 1 | 2 = 0;
    if (counts.newCount >= NEW_TARGET && counts.reviewCount >= reviewTarget) intensity = 2;
    else if (totalActivity > 0) intensity = 1;
    return { date: dateKey, newCount: counts.newCount, reviewCount: counts.reviewCount, intensity, isFuture };
  }

  // Build month blocks. Each month is a proper Sun–Sat calendar with the
  // right number of weeks. Days not in the month (leading/trailing padding)
  // are stored as null.
  const months: MonthBlock[] = [];
  for (let m = START_MONTH; m <= END_MONTH; m++) {
    const firstDay = new Date(Date.UTC(year, m, 1));
    const startDow = firstDay.getUTCDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    const numWeeks = Math.ceil((startDow + daysInMonth) / 7);

    // weeks[weekIdx][dow]
    const weeks: (DayCell | null)[][] = Array.from({ length: numWeeks }, () => Array(7).fill(null));
    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (startDow + day - 1) % 7;
      const week = Math.floor((startDow + day - 1) / 7);
      weeks[week][dow] = buildCell(new Date(Date.UTC(year, m, day)));
    }
    months.push({ year, month: m, label: MONTH_NAMES[m], weeks });
  }

  // Flatten past cells for streak/stats (keeps streak logic simple).
  const flat: DayCell[] = [];
  for (const mb of months) {
    for (const w of mb.weeks) for (const c of w) if (c) flat.push(c);
  }
  const lastPastIdx = (() => {
    for (let i = flat.length - 1; i >= 0; i--) {
      if (!flat[i].isFuture) return i;
    }
    return -1;
  })();
  const pastCells = lastPastIdx >= 0 ? flat.slice(0, lastPastIdx + 1) : [];

  const greenDays = pastCells.filter((c) => c.intensity === 2).length;
  const activeDays = pastCells.filter((c) => c.intensity > 0).length;

  let currentStreak = 0;
  for (let i = lastPastIdx; i >= 0; i--) {
    if (flat[i].intensity === 2) currentStreak++;
    else if (flat[i].date === todayKey) continue;
    else break;
  }

  let longestStreak = 0;
  let run = 0;
  for (const c of pastCells) {
    if (c.intensity === 2) { run++; longestStreak = Math.max(longestStreak, run); }
    else run = 0;
  }

  return { months, year, totalDays, activeDays, greenDays, currentStreak, longestStreak };
}
