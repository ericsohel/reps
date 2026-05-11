"use server";

import { db } from "@/lib/db";
import { companies, applications } from "@/lib/schema";
import { SEED_COMPANIES, type Tier } from "@/lib/companies-seed";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type AppStatus = "applied" | "oa" | "interview" | "offer" | "accepted" | "rejected";
const FORWARD: Record<AppStatus, AppStatus> = {
  applied: "oa",
  oa: "interview",
  interview: "offer",
  offer: "accepted",
  accepted: "accepted",
  rejected: "rejected",
};
const ORDER: AppStatus[] = ["applied", "oa", "interview", "offer", "accepted"];

export async function ensureSeeded() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(companies);
  if (Number(count) > 0) return;
  await db.insert(companies).values(
    SEED_COMPANIES.map((c) => ({ name: c.name, tier: c.tier, isCustom: false })),
  );
}

// Catalog operations -----------------------------------------------------------

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

export async function deleteCompany(companyId: number) {
  // Cascade deletes applications via FK.
  await db.delete(companies).where(eq(companies.id, companyId));
  revalidatePath("/companies");
}

// Application operations -------------------------------------------------------

export async function createApplication(companyId: number, role?: string, url?: string) {
  const now = new Date();
  await db.insert(applications).values({
    companyId,
    role: role?.trim() || null,
    url: url?.trim() || null,
    status: "applied",
    appliedAt: now,
    updatedAt: now,
  });
  revalidatePath("/companies");
}

export async function advanceApplication(appId: number) {
  const [app] = await db.select().from(applications).where(eq(applications.id, appId));
  if (!app) throw new Error("application not found");
  const next = FORWARD[app.status as AppStatus];
  if (next === app.status) return; // no change for terminal states
  await db.update(applications).set({
    status: next,
    updatedAt: new Date(),
  }).where(eq(applications.id, appId));
  revalidatePath("/companies");
}

export async function regressApplication(appId: number) {
  const [app] = await db.select().from(applications).where(eq(applications.id, appId));
  if (!app) throw new Error("application not found");
  // Closed states regress to applied (reopen).
  if (app.status === "rejected") {
    await db.update(applications).set({ status: "applied", updatedAt: new Date() }).where(eq(applications.id, appId));
  } else {
    const idx = ORDER.indexOf(app.status as AppStatus);
    const prev = idx > 0 ? ORDER[idx - 1] : "applied";
    await db.update(applications).set({ status: prev, updatedAt: new Date() }).where(eq(applications.id, appId));
  }
  revalidatePath("/companies");
}

export async function rejectApplication(appId: number) {
  await db.update(applications).set({
    status: "rejected",
    updatedAt: new Date(),
  }).where(eq(applications.id, appId));
  revalidatePath("/companies");
}

export async function reopenApplication(appId: number) {
  await db.update(applications).set({
    status: "applied",
    updatedAt: new Date(),
  }).where(eq(applications.id, appId));
  revalidatePath("/companies");
}

export async function deleteApplication(appId: number) {
  await db.delete(applications).where(eq(applications.id, appId));
  revalidatePath("/companies");
}

export async function updateApplication(
  appId: number,
  fields: { role?: string | null; url?: string | null },
) {
  const updates: Partial<{ role: string | null; url: string | null }> = {};
  if (fields.role !== undefined) updates.role = fields.role?.trim() || null;
  if (fields.url !== undefined) updates.url = fields.url?.trim() || null;
  await db.update(applications).set(updates).where(eq(applications.id, appId));
  revalidatePath("/companies");
}
