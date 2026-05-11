import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const problems = sqliteTable("problems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lcNumber: integer("lc_number"),
  title: text("title").notNull(),
  url: text("url"),
  pattern: text("pattern").notNull(),
  lcDifficulty: text("lc_difficulty", { enum: ["Easy", "Medium", "Hard"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  // Trigger card
  recognition: text("recognition"),
  insight: text("insight"),
  failureMode: text("failure_mode"),
});

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  attemptedAt: integer("attempted_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  elapsedMinutes: real("elapsed_minutes").notNull(),
  hintsUsed: integer("hints_used").notNull().default(0), // 0=none, 1=pattern, 2=sketch, 3=editorial
  rating: integer("rating").notNull(), // 1=Saw solution, 2=Struggled, 3=Good, 4=Easy
  isReview: integer("is_review", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
});

export const srsState = sqliteTable("srs_state", {
  problemId: integer("problem_id").primaryKey().references(() => problems.id, { onDelete: "cascade" }),
  stability: real("stability").notNull(),
  difficulty: real("difficulty").notNull(),
  lastReviewAt: integer("last_review_at", { mode: "timestamp_ms" }).notNull(),
  dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
});

export const patternState = sqliteTable("pattern_state", {
  pattern: text("pattern").primaryKey(),
  stability: real("stability").notNull().default(1),
  lastUpdatedAt: integer("last_updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type Problem = typeof problems.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type SrsState = typeof srsState.$inferSelect;
export type PatternState = typeof patternState.$inferSelect;

// STAR-method behavioral interview questions, with their own SRS schedule.
export const stars = sqliteTable("stars", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prompt: text("prompt").notNull(),
  tag: text("tag"), // optional category: leadership, conflict, failure, etc.
  situation: text("situation"),
  task: text("task"),
  action: text("action"),
  result: text("result"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const starSrs = sqliteTable("star_srs", {
  starId: integer("star_id").primaryKey().references(() => stars.id, { onDelete: "cascade" }),
  stability: real("stability").notNull(),
  difficulty: real("difficulty").notNull(),
  lastReviewAt: integer("last_review_at", { mode: "timestamp_ms" }).notNull(),
  dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
});

export type Star = typeof stars.$inferSelect;
export type StarSrs = typeof starSrs.$inferSelect;

// Internship application tracker.
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  tier: text("tier", { enum: ["SSS", "SS", "SS-", "S", "A+", "A", "B+", "Custom"] }).notNull(),
  status: text("status", {
    enum: ["not_applied", "applied", "oa", "interview", "offer", "accepted", "rejected"],
  }).notNull().default("not_applied"),
  notes: text("notes"),
  appliedAt: integer("applied_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
});

export type Company = typeof companies.$inferSelect;

// Each application = one role at one company. A company can have multiple
// applications. Replaces the (status, appliedAt, updatedAt) fields previously
// stored directly on `companies` — those columns are kept for backwards-compat
// migration but are no longer read or written by the app.
export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  role: text("role"),
  url: text("url"),
  status: text("status", {
    enum: ["applied", "oa", "interview", "offer", "accepted", "rejected"],
  }).notNull().default("applied"),
  appliedAt: integer("applied_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type Application = typeof applications.$inferSelect;

// Standalone counters for self-reported solve totals (Easy/Medium/Hard).
// Not tied to any other table; pure tally.
export const counters = sqliteTable("counters", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
});

export type Counter = typeof counters.$inferSelect;
