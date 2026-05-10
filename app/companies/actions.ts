"use server";

import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { NEXT_STATUS, SEED_COMPANIES, type Status, type Tier } from "@/lib/companies-seed";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function ensureSeeded() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(companies);
  if (Number(count) > 0) return;
  await db.insert(companies).values(
    SEED_COMPANIES.map((c) => ({ name: c.name, tier: c.tier, isCustom: false })),
  );
}

export async function advanceCompany(id: number) {
  const [c] = await db.select().from(companies).where(eq(companies.id, id));
  if (!c) throw new Error("not found");
  const next = NEXT_STATUS[c.status];
  await db.update(companies).set({
    status: next,
    appliedAt: c.status === "not_applied" ? new Date() : c.appliedAt,
    updatedAt: new Date(),
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
}

export async function regressCompany(id: number) {
  const [c] = await db.select().from(companies).where(eq(companies.id, id));
  if (!c) throw new Error("not found");
  const order: Status[] = ["not_applied", "applied", "oa", "interview", "offer", "accepted"];
  const idx = order.indexOf(c.status);
  const prev = idx > 0 ? order[idx - 1] : "not_applied";
  await db.update(companies).set({
    status: prev,
    updatedAt: new Date(),
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
}

export async function rejectCompany(id: number) {
  await db.update(companies).set({
    status: "rejected",
    updatedAt: new Date(),
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
}

export async function reopenCompany(id: number) {
  // Move a rejected/accepted company back to not_applied to retry next cycle.
  await db.update(companies).set({
    status: "not_applied",
    appliedAt: null,
    updatedAt: new Date(),
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
}

export async function addCompany(name: string, tier: Tier) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name required");
  await db.insert(companies).values({
    name: trimmed,
    tier,
    isCustom: true,
  });
  revalidatePath("/companies");
}

export async function deleteCompany(id: number) {
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/companies");
}
