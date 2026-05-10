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
