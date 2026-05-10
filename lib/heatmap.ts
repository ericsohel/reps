import { db } from "./db";
import { attempts, srsState } from "./schema";
import { sql, lte } from "drizzle-orm";

const DAY_MS = 86_400_000;
const NEW_TARGET = 2;
const REVIEW_TARGET = 3;

export interface DayCell {
  date: string;          // YYYY-MM-DD (UTC)
  newCount: number;
  reviewCount: number;
  intensity: 0 | 1 | 2;  // 0 empty, 1 partial, 2 target met
  isFuture: boolean;
}

export interface HeatmapData {
  cells: DayCell[];
  year: number;
  totalDays: number;
  activeDays: number;
  greenDays: number;
  currentStreak: number;
  longestStreak: number;
}

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
  const windowStart = new Date(`${year}-01-01T00:00:00Z`).getTime();
  const windowEnd = new Date(`${year + 1}-01-01T00:00:00Z`).getTime();
  const totalDays = Math.round((windowEnd - windowStart) / DAY_MS); // 365 or 366
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

  // Today's review target = min(REVIEW_TARGET, currently due) since we don't
  // retain historical "available reviews" data.
  const [{ dueCount }] = await db
    .select({ dueCount: sql<number>`count(*)` })
    .from(srsState)
    .where(lte(srsState.dueAt, new Date(now)));
  const todayReviewTarget = Math.min(REVIEW_TARGET, Number(dueCount));

  const cells: DayCell[] = [];
  let todayIdx = -1;
  for (let i = 0; i < totalDays; i++) {
    const ts = windowStart + i * DAY_MS;
    const date = isoDate(ts);
    const counts = byDate.get(date) ?? { newCount: 0, reviewCount: 0 };
    const isToday = date === todayKey;
    if (isToday) todayIdx = i;
    const isFuture = ts > now && !isToday;
    const reviewTarget = isToday ? todayReviewTarget : REVIEW_TARGET;
    const totalActivity = counts.newCount + counts.reviewCount;

    let intensity: 0 | 1 | 2 = 0;
    if (counts.newCount >= NEW_TARGET && counts.reviewCount >= reviewTarget) {
      intensity = 2;
    } else if (totalActivity > 0) {
      intensity = 1;
    }
    cells.push({ date, newCount: counts.newCount, reviewCount: counts.reviewCount, intensity, isFuture });
  }

  // If todayIdx wasn't found (e.g. running outside the year), use last past index.
  const lastPastIdx = todayIdx >= 0 ? todayIdx : cells.length - 1;
  const pastCells = cells.slice(0, lastPastIdx + 1);

  const greenDays = pastCells.filter((c) => c.intensity === 2).length;
  const activeDays = pastCells.filter((c) => c.intensity > 0).length;

  // Current streak: walk backward from today (incomplete today does NOT break streak).
  let currentStreak = 0;
  for (let i = lastPastIdx; i >= 0; i--) {
    if (cells[i].intensity === 2) currentStreak++;
    else if (i === lastPastIdx) continue;
    else break;
  }

  // Longest streak considers only past days.
  let longestStreak = 0;
  let run = 0;
  for (const c of pastCells) {
    if (c.intensity === 2) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    cells,
    year,
    totalDays,
    activeDays,
    greenDays,
    currentStreak,
    longestStreak,
  };
}
