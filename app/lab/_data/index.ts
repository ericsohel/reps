import type { LabProblem } from "./types";
import { PROBLEMS_CORE_EARLY } from "./problems-core-early";
import { PROBLEMS_CORE_LATE } from "./problems-core-late";
import { PROBLEMS_FAANG_PLUS } from "./problems-faang-plus";
import { PROBLEMS_PUZZLES } from "./problems-puzzles";
import { PROBLEMS_ESTIMATION } from "./problems-estimation";
import { PROBLEMS_JANE_STREET } from "./problems-jane-street";
import { PROBLEMS_AOC } from "./problems-aoc";
import { PROBLEMS_RIDDLER } from "./problems-riddler";

export const LAB_PROBLEMS: readonly LabProblem[] = [
  ...PROBLEMS_CORE_EARLY,
  ...PROBLEMS_CORE_LATE,
  ...PROBLEMS_FAANG_PLUS,
  ...PROBLEMS_PUZZLES,
  ...PROBLEMS_ESTIMATION,
  ...PROBLEMS_JANE_STREET,
  ...PROBLEMS_AOC,
  ...PROBLEMS_RIDDLER,
];

export const LAB_PROBLEMS_BY_ID: Readonly<Record<string, LabProblem>> =
  Object.fromEntries(LAB_PROBLEMS.map((p) => [p.id, p]));

export type { LabProblem, LabSolve, LabDifficulty, LabSource } from "./types";
