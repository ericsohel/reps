"use server";

import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { counters } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

// ── Sync counters from roadmap solved-problems data ──────────────────────────

const MODULE_FILES: Record<string, string> = {
  "arrays-hashing":  "02-arrays-hashing.md",
  "prefix-sums":     "03-prefix-sums.md",
  "two-pointers":    "04-two-pointers.md",
  "sliding-window":  "05-sliding-window.md",
  "stack":           "06-stack.md",
  "monotonic-stack": "07-monotonic-stack.md",
  "monotonic-deque": "08-monotonic-deque.md",
  "linked-list":     "09-linked-list.md",
  "binary-search":   "10-binary-search.md",
  "bs-answer":       "11-binary-search-answer.md",
  "backtracking":    "12-backtracking.md",
  "trees":           "13-trees.md",
  "tries":           "14-tries.md",
  "heap":            "15-heap.md",
  "greedy":          "16-greedy.md",
  "intervals":       "17-intervals.md",
  "graph-traversal": "18-graph-traversal.md",
  "topo-sort":       "19-topological-sort.md",
  "union-find":      "20-union-find.md",
  "shortest-paths":  "21-shortest-paths.md",
  "mst":             "22-mst.md",
  "adv-graphs":      "23-advanced-graphs.md",
};

function normalizeDifficulty(s: string): CounterKey | null {
  const t = s.toLowerCase().trim();
  if (t === "easy" || t === "very easy") return "easy";
  if (t === "medium" || t === "normal") return "medium";
  if (t === "hard") return "hard";
  return null;
}

function parseDifficulties(md: string): Record<number, CounterKey> {
  const m = md.match(/^## Step 5.*$/m);
  if (!m || m.index === undefined) return {};
  const lines = md.slice(m.index).split("\n");

  let tStart = -1;
  let tEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|");
    if (isTableLine) {
      if (tStart === -1) tStart = i;
      tEnd = i;
    } else if (tStart !== -1) {
      break;
    }
  }
  if (tStart === -1 || tEnd - tStart < 2) return {};

  const parseRow = (line: string) =>
    line.split("|").slice(1, -1).map((s) => s.trim());
  const headers = parseRow(lines[tStart]);
  const diffIdx = headers.findIndex((h) => h.toLowerCase() === "difficulty");
  if (diffIdx === -1) return {};

  const result: Record<number, CounterKey> = {};
  for (let i = tStart + 2; i <= tEnd; i++) {
    const cells = parseRow(lines[i]);
    const num = parseInt(cells[0]);
    if (isNaN(num)) continue;
    const d = normalizeDifficulty(cells[diffIdx] || "");
    if (d) result[num] = d;
  }
  return result;
}

/**
 * Wipe the counters and reseed them from the roadmap solved-problems map.
 * Called from the home page; the client passes in its localStorage state.
 */
export async function syncCountersFromRoadmap(
  solved: Record<string, number[]>,
): Promise<Record<CounterKey, number>> {
  const totals: Record<CounterKey, number> = { easy: 0, medium: 0, hard: 0 };

  for (const [moduleId, nums] of Object.entries(solved)) {
    const file = MODULE_FILES[moduleId];
    if (!file) continue;
    const fullPath = path.join(process.cwd(), "app/roadmap/_content", file);
    let content: string;
    try {
      content = fs.readFileSync(fullPath, "utf-8");
    } catch {
      continue;
    }
    const map = parseDifficulties(content);
    for (const num of nums) {
      const diff = map[num];
      if (diff) totals[diff]++;
    }
  }

  await db.delete(counters);
  await db.insert(counters).values([
    { key: "easy",   count: totals.easy },
    { key: "medium", count: totals.medium },
    { key: "hard",   count: totals.hard },
  ]);
  revalidatePath("/");
  return totals;
}
