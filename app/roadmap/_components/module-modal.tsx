"use client";

import { useEffect, useState } from "react";
import { getModuleContent } from "../_actions/module-content";
import { ProblemsChecklist } from "../[module]/problems-checklist";
import type { ProblemRow } from "../[module]/problems-checklist";

interface Props {
  moduleId: string;
  title: string;
  onClose: () => void;
}

function ResourceLink({ line }: { line: string }) {
  const m = line.match(/\[(.+?)\]\((.+?)\)/);
  if (!m) return null;
  return (
    <a
      href={m[2]}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm text-zinc-300 underline decoration-zinc-700 underline-offset-2 hover:text-emerald-400 hover:decoration-emerald-700 transition-colors mb-1.5"
    >
      {m[1]}
    </a>
  );
}

function Resources({ text }: { text: string }) {
  const lines = text.split("\n").filter(l => l.trim());
  const links = lines.filter(l => l.match(/\[.+\]\(.+\)/));
  const prose = lines.filter(l => !l.match(/\[.+\]\(.+\)/) && !l.startsWith("#"));

  if (links.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">
        Resources
      </p>
      {prose.length > 0 && (
        <p className="text-xs text-zinc-500 mb-2.5 leading-relaxed">
          {prose[0].replace(/^\d+\.\s*/, "").replace(/\*\*/g, "")}
        </p>
      )}
      {links.map((l, i) => <ResourceLink key={i} line={l} />)}
    </div>
  );
}

export function ModuleModal({ moduleId, title, onClose }: Props) {
  const [data, setData] = useState<{ resources: string; problems: ProblemRow[] } | null>(null);

  useEffect(() => {
    getModuleContent(moduleId).then(setData);
  }, [moduleId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        className="relative w-full sm:max-w-xl max-h-[82vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800/60">
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</span>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          {!data ? (
            <p className="text-sm text-zinc-600 py-4 text-center">Loading…</p>
          ) : (
            <>
              <Resources text={data.resources} />
              {data.problems.length > 0 && (
                <ProblemsChecklist moduleId={moduleId} problems={data.problems} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
