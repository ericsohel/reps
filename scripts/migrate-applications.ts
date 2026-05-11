// One-time migration: for every company that has been touched (status != not_applied),
// create a corresponding row in `applications` carrying over its status and dates.
// Idempotent — checks whether an application already exists for that company before inserting.

import { db } from "../lib/db";
import { companies, applications } from "../lib/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const allCompanies = await db.select().from(companies);
  let migrated = 0;
  let skipped = 0;

  for (const c of allCompanies) {
    if (c.status === "not_applied") {
      skipped++;
      continue;
    }
    // Map old company status to application status.
    const appStatus = c.status as "applied" | "oa" | "interview" | "offer" | "accepted" | "rejected";

    // Check whether an application already exists for this company.
    const existing = await db
      .select()
      .from(applications)
      .where(eq(applications.companyId, c.id));
    if (existing.length > 0) {
      console.log(`SKIP  ${c.name} — application already exists`);
      skipped++;
      continue;
    }

    await db.insert(applications).values({
      companyId: c.id,
      role: null,
      url: null,
      status: appStatus,
      appliedAt: c.appliedAt ?? c.updatedAt,
      updatedAt: c.updatedAt,
    });
    console.log(`MIGRATE  ${c.name} → ${appStatus}`);
    migrated++;
  }

  console.log(`\n${migrated} migrated, ${skipped} skipped, ${allCompanies.length} total companies.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
