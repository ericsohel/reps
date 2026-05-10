import { db } from "./db";
import { attempts, srsState } from "./schema";
import { sql, lte, gte } from "drizzle-orm";

const DAY_MS = 86_400_000;
export const HEATMAP_DAYS = 84; // 12 weeks
const NEW_TARGET = 2;
const REVIEW_TARGET = 3;

export interface DayCell {
  date: string;          // YYYY-MM-DD in user's local timezone (server-side approximation: UTC)
  newCount: number;
  reviewCount: number;
  intensity: 0 | 1 | 2;  // 0 empty, 1 partial activity, 2 target met
}

export interface HeatmapData {
  cells: DayCell[];
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
  const startOfToday = new Date(isoDate(now) + "T00:00:00Z").getTime();
  const windowStart = startOfToday - (HEATMAP_DAYS - 1) * DAY_MS;

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${attempts.attemptedAt} / 1000, 'unixepoch')`,
      isReview: attempts.isReview,
      count: sql<number>`count(*)`,
    })
    .from(attempts)
    .where(gte(attempts.attemptedAt, new Date(windowStart)))
    .groupBy(sql`strftime('%Y-%m-%d', ${attempts.attemptedAt} / 1000, 'unixepoch')`, attempts.isReview);

  const byDate = new Map<string, { newCount: number; reviewCount: number }>();
  for (const r of rows) {
    const cur = byDate.get(r.date) ?? { newCount: 0, reviewCount: 0 };
    if (r.isReview) cur.reviewCount += Number(r.count);
    else cur.newCount += Number(r.count);
    byDate.set(r.date, cur);
  }

  // For TODAY: compute target as min(REVIEW_TARGET, reviews_due_count) since
  // historical "available reviews" data is not retained.
  const todayKey = isoDate(now);
  const [{ dueCount }] = await db
    .select({ dueCount: sql<number>`count(*)` })
    .from(srsState)
    .where(lte(srsState.dueAt, new Date(now)));
  const todayReviewTarget = Math.min(REVIEW_TARGET, Number(dueCount));

  const cells: DayCell[] = [];
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const ts = windowStart + i * DAY_MS;
    const date = isoDate(ts);
    const counts = byDate.get(date) ?? { newCount: 0, reviewCount: 0 };
    const isToday = date === todayKey;
    const reviewTarget = isToday ? todayReviewTarget : REVIEW_TARGET;
    const totalActivity = counts.newCount + counts.reviewCount;

    let intensity: 0 | 1 | 2 = 0;
    if (counts.newCount >= NEW_TARGET && counts.reviewCount >= reviewTarget) {
      intensity = 2;
    } else if (totalActivity > 0) {
      intensity = 1;
    }
    cells.push({ date, newCount: counts.newCount, reviewCount: counts.reviewCount, intensity });
  }

  const greenDays = cells.filter((c) => c.intensity === 2).length;
  const activeDays = cells.filter((c) => c.intensity > 0).length;

  // Current streak: walk backward from today
  let currentStreak = 0;
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i].intensity === 2) currentStreak++;
    else if (cells[i].date === todayKey) {
      // today incomplete doesn't break streak yet — only count if green
      continue;
    } else break;
  }

  // Longest streak in window
  let longestStreak = 0;
  let run = 0;
  for (const c of cells) {
    if (c.intensity === 2) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    cells,
    totalDays: HEATMAP_DAYS,
    activeDays,
    greenDays,
    currentStreak,
    longestStreak,
  };
}
