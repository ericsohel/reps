// Lightweight runtime health check. Catches schema drift on the first request
// after a deploy by issuing one cheap query against each table. Cached per server
// instance so subsequent requests are free.

import { db } from "./db";
import { problems, attempts, srsState, patternState } from "./schema";
import { sql } from "drizzle-orm";

let healthy = false;

export async function ensureSchemaHealthy() {
  if (healthy) return;
  try {
    await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(problems).limit(1),
      db.select({ n: sql<number>`count(*)` }).from(attempts).limit(1),
      db.select({ n: sql<number>`count(*)` }).from(srsState).limit(1),
      db.select({ n: sql<number>`count(*)` }).from(patternState).limit(1),
    ]);
    healthy = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Database schema check failed: ${msg}. ` +
      `Run "npm run db:push" with your Turso credentials in .env.local to apply pending migrations.`,
    );
  }
}
