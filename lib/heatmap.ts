import { db } from "./db";
import { attempts, srsState } from "./schema";
import { sql, lte } from "drizzle-orm";
import { cookies } from "next/headers";

const DAY_MS = 86_400_000;
const NEW_TARGET = 2;
const REVIEW_TARGET = 3;

const START_MONTH = 4;  // May (0-indexed)
const END_MONTH = 11;   // December (inclusive)

export interface DayCell {
  date: string;          // YYYY-MM-DD in user's local timezone
  newCount: number;
  reviewCount: number;
  intensity: 0 | 1 | 2;
  isFuture: boolean;
}

export interface MonthBlock {
  year: number;
  month: number;
  label: string;
  weeks: (DayCell | null)[][];
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

// Format a UTC timestamp as YYYY-MM-DD using a given timezone offset.
// `offsetMinutes` follows JS getTimezoneOffset() convention: minutes WEST of UTC
// (e.g. EDT = 240, JST = -540).
function isoDateInTz(ts: number, offsetMinutes: number): string {
  const shifted = new Date(ts - offsetMinutes * 60_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function readTzOffsetMinutes(): Promise<number> {
  const c = await cookies();
  const v = c.get("tz_offset_minutes")?.value;
  if (!v) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function getHeatmapData(): Promise<HeatmapData> {
  const tzOffsetMinutes = await readTzOffsetMinutes();
  const tzOffsetSec = tzOffsetMinutes * 60;
  const tzOffsetMs = tzOffsetMinutes * 60_000;

  const now = Date.now();
  // "Local" year derived from the user's timezone, not server UTC.
  const localNow = new Date(now - tzOffsetMs);
  const year = localNow.getUTCFullYear();

  // Window: May 1 LOCAL 00:00 → start of (Dec 31 + 1) LOCAL 00:00.
  // Date.UTC(year, m, d) returns UTC timestamp for that wall-clock date in UTC,
  // so we add tzOffsetMs to shift to the equivalent LOCAL midnight in UTC.
  const windowStart = Date.UTC(year, START_MONTH, 1) + tzOffsetMs;
  const windowEnd = Date.UTC(year, END_MONTH + 1, 1) + tzOffsetMs;
  const totalDays = Math.round((windowEnd - windowStart) / DAY_MS);
  const todayKey = isoDateInTz(now, tzOffsetMinutes);

  const rows = await db
    .select({
      // Group attempts by LOCAL date by subtracting the offset before strftime.
      date: sql<string>`strftime('%Y-%m-%d', (${attempts.attemptedAt} / 1000) - ${tzOffsetSec}, 'unixepoch')`,
      isReview: attempts.isReview,
      count: sql<number>`count(*)`,
    })
    .from(attempts)
    .where(
      sql`${attempts.attemptedAt} >= ${windowStart} AND ${attempts.attemptedAt} < ${windowEnd}`,
    )
    .groupBy(
      sql`strftime('%Y-%m-%d', (${attempts.attemptedAt} / 1000) - ${tzOffsetSec}, 'unixepoch')`,
      attempts.isReview,
    );

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

  function buildCell(year: number, month: number, day: number): DayCell {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const counts = byDate.get(dateKey) ?? { newCount: 0, reviewCount: 0 };
    const isToday = dateKey === todayKey;
    const localMidnightUtc = Date.UTC(year, month, day) + tzOffsetMs;
    const isFuture = localMidnightUtc > now && !isToday;
    // For today: use the live due count as the review target.
    // For past days: if zero reviews were done, assume nothing was due (early
    // in the queue lifecycle) and only require the new-problem target.
    // If some reviews were done, hold the full REVIEW_TARGET bar.
    const reviewTarget = isToday
      ? todayReviewTarget
      : counts.reviewCount === 0 ? 0 : REVIEW_TARGET;
    const totalActivity = counts.newCount + counts.reviewCount;
    let intensity: 0 | 1 | 2 = 0;
    if (counts.newCount >= NEW_TARGET && counts.reviewCount >= reviewTarget) intensity = 2;
    else if (totalActivity > 0) intensity = 1;
    return { date: dateKey, newCount: counts.newCount, reviewCount: counts.reviewCount, intensity, isFuture };
  }

  const months: MonthBlock[] = [];
  for (let m = START_MONTH; m <= END_MONTH; m++) {
    // Day-of-week of the 1st is the same in every timezone for the same wall date.
    const startDow = new Date(Date.UTC(year, m, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    const numWeeks = Math.ceil((startDow + daysInMonth) / 7);

    const weeks: (DayCell | null)[][] = Array.from({ length: numWeeks }, () => Array(7).fill(null));
    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (startDow + day - 1) % 7;
      const week = Math.floor((startDow + day - 1) / 7);
      weeks[week][dow] = buildCell(year, m, day);
    }
    months.push({ year, month: m, label: MONTH_NAMES[m], weeks });
  }

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
