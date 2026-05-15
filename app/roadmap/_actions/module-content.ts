"use server";

import { MODULES_BY_ID } from "../_data";
import type { Resource } from "../_data/types";
import type { ProblemRow } from "../_components/problems-checklist";

// Server action: returns the structured module data for a given moduleId.
// Backed by app/roadmap/_data/modules/*.ts — no markdown parsing.

export async function getModuleContent(
  moduleId: string,
): Promise<{ resources: Resource[]; problems: ProblemRow[] } | null> {
  const mod = MODULES_BY_ID[moduleId];
  if (!mod) return null;

  // Foundations is a checklist; everything else is a problem ladder.
  if (mod.checklist) {
    const problems: ProblemRow[] = mod.checklist.map((c) => ({
      num: c.num,
      title: c.title,
      url: "",
      isCheckpoint: false,
      difficulty: null,
    }));
    return { resources: [...mod.resources], problems };
  }

  const problems: ProblemRow[] = (mod.problems ?? []).map((p) => ({
    num: p.num,
    title: p.title,
    url: p.url,
    isCheckpoint: p.role === "checkpoint",
    difficulty: p.difficulty,
    teaches: p.teaches,
    source: p.source,
  }));

  return { resources: [...mod.resources], problems };
}
