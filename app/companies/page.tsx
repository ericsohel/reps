import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { ensureSeeded } from "./actions";
import { TIERS, TIER_COLORS, PIPELINE_STATUSES, STATUS_LABEL, type Tier, type Status } from "@/lib/companies-seed";
import CompaniesClient from "./client";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  await ensureSeeded();
  const all = await db.select().from(companies);

  // Group by tier (only not_applied for tier display) and by status (for pipeline).
  const byTier = new Map<Tier, typeof all>();
  for (const t of TIERS) byTier.set(t, []);
  for (const c of all) {
    if (c.status === "not_applied") byTier.get(c.tier as Tier)?.push(c);
  }
  for (const arr of byTier.values()) arr.sort((a, b) => a.name.localeCompare(b.name));

  const byStatus = new Map<Status, typeof all>();
  for (const s of PIPELINE_STATUSES) byStatus.set(s, []);
  for (const c of all) {
    if (PIPELINE_STATUSES.includes(c.status as Status)) {
      byStatus.get(c.status as Status)?.push(c);
    }
  }
  for (const arr of byStatus.values()) arr.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

  const closed = all.filter((c) => c.status === "accepted" || c.status === "rejected")
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

  const activeCount = PIPELINE_STATUSES.reduce((sum, s) => sum + (byStatus.get(s)?.length ?? 0), 0);

  return (
    <CompaniesClient
      tierGroups={TIERS.map((t) => ({
        tier: t,
        items: (byTier.get(t) ?? []).map(serialize),
      }))}
      pipeline={PIPELINE_STATUSES.map((s) => ({
        status: s,
        label: STATUS_LABEL[s],
        items: (byStatus.get(s) ?? []).map(serialize),
      }))}
      closed={closed.map(serialize)}
      activeCount={activeCount}
      tierColors={TIER_COLORS}
    />
  );
}

function serialize(c: typeof companies.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    tier: c.tier as Tier,
    status: c.status as Status,
    isCustom: c.isCustom,
    appliedAt: c.appliedAt?.getTime() ?? null,
    updatedAt: c.updatedAt.getTime(),
  };
}
