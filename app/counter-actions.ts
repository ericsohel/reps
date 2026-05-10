"use server";

import { db } from "@/lib/db";
import { counters } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const KEYS = ["easy", "medium", "hard"] as const;
export type CounterKey = (typeof KEYS)[number];

export async function getCounters(): Promise<Record<CounterKey, number>> {
  const rows = await db.select().from(counters);
  const map: Record<CounterKey, number> = { easy: 0, medium: 0, hard: 0 };
  for (const r of rows) {
    if ((KEYS as readonly string[]).includes(r.key)) {
      map[r.key as CounterKey] = r.count;
    }
  }
  return map;
}

export async function bumpCounter(key: CounterKey, delta: 1 | -1) {
  const [existing] = await db.select().from(counters).where(eq(counters.key, key));
  if (!existing) {
    await db.insert(counters).values({ key, count: Math.max(0, delta) });
  } else {
    const next = Math.max(0, existing.count + delta);
    await db.update(counters).set({ count: next }).where(eq(counters.key, key));
  }
  revalidatePath("/");
}
