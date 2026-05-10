import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// "libsql://localhost" is a valid URL format so createClient won't throw at
// build time. At runtime TURSO_DATABASE_URL is always set via env vars.
export const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL ?? "libsql://localhost",
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
  { schema },
);
