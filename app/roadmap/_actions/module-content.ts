"use server";

import fs from "fs";
import path from "path";
import type { ProblemRow } from "../[module]/problems-checklist";
import type { CounterKey } from "@/app/counter-actions";

const MODULE_FILES: Record<string, string> = {
  "foundations":     "01-foundations.md",
  "arrays-hashing":  "02-arrays-hashing.md",
  "sorting":         "03-sorting.md",
  "prefix-sums":     "04-prefix-sums.md",
  "two-pointers":    "05-two-pointers.md",
  "sliding-window":  "06-sliding-window.md",
  "stack":           "07-stack.md",
  "monotonic-stack": "08-monotonic-stack.md",
  "monotonic-deque": "09-monotonic-deque.md",
  "linked-list":     "10-linked-list.md",
  "binary-search":   "11-binary-search.md",
  "bs-answer":       "12-binary-search-answer.md",
  "backtracking":    "13-backtracking.md",
  "trees":           "14-trees.md",
  "tries":           "15-tries.md",
  "heap":            "16-heap.md",
  "greedy":          "17-greedy.md",
  "intervals":       "18-intervals.md",
  "graph-traversal": "19-graph-traversal.md",
  "topo-sort":       "20-topological-sort.md",
  "union-find":      "21-union-find.md",
  "shortest-paths":  "22-shortest-paths.md",
  "mst":             "23-mst.md",
  "adv-graphs":      "24-advanced-graphs.md",
  "dp-intro":        "25-dp-intro.md",
  "dp-2d":           "26-dp-2d.md",
};

function normalizeDifficulty(s: string): CounterKey | null {
  const t = s.toLowerCase().trim();
  if (t === "easy" || t === "very easy") return "easy";
  if (t === "medium" || t === "normal") return "medium";
  if (t === "hard") return "hard";
  return null;
}

// Foundations has no Step 3 — reading links are embedded as **Reading:** lines.
function extractFoundationsResources(md: string): string {
  const links: string[] = [];
  for (const m of md.matchAll(/\*\*Reading:\*\*\s*(.+)/g)) {
    links.push(m[1].trim().replace(/\.$/, ""));
  }
  return links.join("\n");
}

function extractFoundationsProblems(md: string): ProblemRow[] {
  const items: ProblemRow[] = [];
  for (const m of md.matchAll(/^### (\d+)\. (.+)$/gm)) {
    items.push({
      num: parseInt(m[1]),
      title: m[2],
      url: "",
      isCheckpoint: false,
      difficulty: null,
      extraHeaders: [],
      extraCells: [],
    });
  }
  return items;
}

function extractResources(md: string): string {
  const m = md.match(/^## Step 3.*$/m);
  if (!m || m.index === undefined) return "";
  const fromStep3 = md.slice(m.index);
  const nextH2 = fromStep3.slice(m[0].length + 1).match(/^## /m);
  const section = nextH2
    ? fromStep3.slice(0, m[0].length + 1 + nextH2.index!)
    : fromStep3;
  return section
    .replace(/^## Step 3.*$/m, "")
    .replace(/^Move to Step \d+ after .*\.?\s*$/gm, "")
    .trim();
}

function extractProblems(md: string): ProblemRow[] {
  const m = md.match(/^## Step 5.*$/m);
  if (!m || m.index === undefined) return [];

  const fromStep5 = md.slice(m.index);
  const lines = fromStep5.split("\n");

  let tStart = -1;
  let tEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (tStart === -1) tStart = i;
      tEnd = i;
    } else if (tStart !== -1) {
      break;
    }
  }
  if (tStart === -1 || tEnd - tStart < 2) return [];

  const parseRow = (line: string) =>
    line.split("|").slice(1, -1).map((s) => s.trim());

  const headers = parseRow(lines[tStart]);
  const rows = lines.slice(tStart + 2, tEnd + 1).map(parseRow);
  const roleIdx = headers.findIndex((h) => h.toLowerCase() === "role");
  const diffIdx = headers.findIndex((h) => h.toLowerCase() === "difficulty");

  return rows.map((cells, i) => {
    const num = parseInt(cells[0]) || i + 1;
    const problemCell = cells[1] || "";
    const linkMatch = problemCell.match(/\[(.+?)\]\((.+?)\)/);
    const title = linkMatch ? linkMatch[1] : problemCell;
    const url = linkMatch ? linkMatch[2] : "";
    const roleCell = roleIdx >= 0 ? cells[roleIdx] || "" : "";
    const isCheckpoint = roleCell.toLowerCase().includes("checkpoint");
    const difficulty = diffIdx >= 0 ? normalizeDifficulty(cells[diffIdx] || "") : null;

    return {
      num, title, url, isCheckpoint, difficulty,
      extraHeaders: headers.slice(2),
      extraCells: cells.slice(2),
    };
  });
}

export async function getModuleContent(
  moduleId: string,
): Promise<{ resources: string; problems: ProblemRow[] } | null> {
  const file = MODULE_FILES[moduleId];
  if (!file) return null;
  try {
    const md = fs.readFileSync(
      path.join(process.cwd(), "app/roadmap/_content", file),
      "utf-8",
    );
    const content = md.replace(/^# .+\n/, "");
    if (moduleId === "foundations") {
      return {
        resources: extractFoundationsResources(content),
        problems: extractFoundationsProblems(content),
      };
    }
    return { resources: extractResources(content), problems: extractProblems(content) };
  } catch {
    return null;
  }
}
