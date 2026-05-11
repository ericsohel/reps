import { db } from "@/lib/db";
import { companies, applications } from "@/lib/schema";
import { ensureSeeded } from "./actions";
import { TIERS, TIER_COLORS, PIPELINE_STATUSES, STATUS_LABEL, type Tier, type Status } from "@/lib/companies-seed";
import { eq } from "drizzle-orm";
import CompaniesClient from "./client";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  await ensureSeeded();

  const [allCompanies, allApps] = await Promise.all([
    db.select().from(companies),
    db.select().from(applications),
  ]);

  // Map companies → list of their applications.
  const appsByCompany = new Map<number, typeof allApps>();
  for (const c of allCompanies) appsByCompany.set(c.id, []);
  for (const a of allApps) appsByCompany.get(a.companyId)?.push(a);

  // Pipeline = applications with active status. Sorted most recent first.
  const pipelineApps = allApps
    .filter((a) => PIPELINE_STATUSES.includes(a.status as Status))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Closed = accepted/rejected.
  const closedApps = allApps
    .filter((a) => a.status === "accepted" || a.status === "rejected")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Group pipeline by status.
  const byStatus = new Map<Status, typeof pipelineApps>();
  for (const s of PIPELINE_STATUSES) byStatus.set(s, []);
  for (const a of pipelineApps) byStatus.get(a.status as Status)?.push(a);

  // Tier list shows every company in catalog, with active-application count badge.
  const byTier = new Map<Tier, typeof allCompanies>();
  for (const t of TIERS) byTier.set(t, []);
  for (const c of allCompanies) byTier.get(c.tier as Tier)?.push(c);
  for (const arr of byTier.values()) arr.sort((a, b) => a.name.localeCompare(b.name));

  const companyById = new Map(allCompanies.map((c) => [c.id, c]));

  const serializeApp = (a: typeof allApps[number]) => {
    const company = companyById.get(a.companyId);
    return {
      id: a.id,
      companyId: a.companyId,
      companyName: company?.name ?? "?",
      tier: (company?.tier ?? "Custom") as Tier,
      role: a.role ?? "",
      url: a.url ?? "",
      status: a.status as Status,
      appliedAt: a.appliedAt.getTime(),
      updatedAt: a.updatedAt.getTime(),
    };
  };

  const serializeCompany = (c: typeof allCompanies[number]) => {
    const apps = appsByCompany.get(c.id) ?? [];
    const active = apps.filter((a) => PIPELINE_STATUSES.includes(a.status as Status));
    return {
      id: c.id,
      name: c.name,
      tier: c.tier as Tier,
      isCustom: c.isCustom,
      activeApplicationCount: active.length,
      hasAnyApplication: apps.length > 0,
    };
  };

  return (
    <CompaniesClient
      tierGroups={TIERS.map((t) => ({
        tier: t,
        items: (byTier.get(t) ?? []).map(serializeCompany),
      }))}
      pipeline={PIPELINE_STATUSES.map((s) => ({
        status: s,
        label: STATUS_LABEL[s],
        items: (byStatus.get(s) ?? []).map(serializeApp),
      }))}
      closed={closedApps.map(serializeApp)}
      activeCount={pipelineApps.length}
      tierColors={TIER_COLORS}
    />
  );
}
