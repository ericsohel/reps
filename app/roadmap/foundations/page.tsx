import fs from "fs";
import path from "path";
import Link from "next/link";
import { ProblemsChecklist } from "../[module]/problems-checklist";
import type { ProblemRow } from "../[module]/problems-checklist";

export const metadata = { title: "Foundations — DSA Roadmap" };

function parseItems(md: string): ProblemRow[] {
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

export default function FoundationsPage() {
  const md = fs.readFileSync(
    path.join(process.cwd(), "app/roadmap/_content/01-foundations.md"),
    "utf-8",
  );
  const items = parseItems(md);

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
        <Link href="/roadmap" className="no-underline text-zinc-500 hover:text-zinc-300 transition-colors">
          Roadmap
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Foundations</span>
      </div>

      <div className="mb-2">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1.5">Module 1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Foundations</h1>
        <p className="text-sm text-zinc-500 mt-2">
          Python fluency checklist. Tick each skill when you can demonstrate it cold in under 2 minutes. Complete 5 to unlock the next modules.
        </p>
      </div>

      <div className="divider mt-6" />

      <ProblemsChecklist moduleId="foundations" problems={items} />

      <div className="divider mt-4" />

      <Link href="/roadmap" className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back to Roadmap
      </Link>
    </div>
  );
}
