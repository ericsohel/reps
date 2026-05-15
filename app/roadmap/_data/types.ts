// Single source of truth for the DSA roadmap.
// Add/edit problems and resources in app/roadmap/_data/modules/*.ts.
// NODES, EDGES, ORDER, PROBLEM_COUNTS are derived from MODULES — never edited directly.

export type Track = "both" | "interview" | "cp";
export type Section = "0" | "1" | "2a" | "2b" | "2c" | "2d" | "2e" | "2f" | "2g";
export type Difficulty = "easy" | "medium" | "hard";
export type Role = "baseline" | "extension" | "combination" | "checkpoint";

export interface Resource {
  title: string;
  url: string;
}

export interface Problem {
  num: number;
  title: string;
  url: string;
  source: string;       // "LC 974", "CSES", "UG ⭐", "CF 1826D", etc.
  difficulty: Difficulty;
  list: string;         // "NC150" | "UG" | "UG ⭐" | "new"
  role: Role;
  teaches: string;      // inline markdown — bold, italic, code, links supported
}

export interface ChecklistItem {
  num: number;
  title: string;
}

export interface Module {
  id: string;            // "prefix-sums"
  num: number;           // 1..42
  name: string;          // "Prefix Sums"
  label?: string;        // optional display override (may contain \n for line break)
  section: Section;
  track: Track;
  order: number;         // learning-path position
  prereqIds: string[];   // ids of modules that gate this one
  isNew?: boolean;       // not in NeetCode 150
  isUtility?: boolean;   // small module supporting exactly one downstream
  resources: Resource[];
  problems?: Problem[];     // present for all topic modules
  checklist?: ChecklistItem[];  // foundations only
}

export const isCheckpoint = (p: Problem) => p.role === "checkpoint";
