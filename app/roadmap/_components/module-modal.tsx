"use client";

import { useEffect, useState } from "react";
import { getModuleContent } from "../_actions/module-content";
import { ProblemsChecklist } from "./problems-checklist";
import type { ProblemRow } from "./problems-checklist";
import type { Resource } from "../_data/types";

interface Props {
  moduleId: string;
  title: string;
  onClose: () => void;
  previewMode?: boolean;
  unmetPrereqs?: { id: string; label: string }[];
  moduleTarget?: number;
  onMarkKnown?: () => void;
  onOpenPrereq?: (id: string) => void;
}

function Resources({ items }: { items: Resource[] }) {
  if (!items.length) return null;

  return (
    <div className="mb-5 border-b border-zinc-800/60 pb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
        Resources
      </p>
      <div className="space-y-1">
        {items.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-1 text-sm text-zinc-400 no-underline hover:text-zinc-100 transition-colors group"
          >
            <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors text-xs">↗</span>
            {l.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export function ModuleModal({ moduleId, title, onClose, previewMode = false, unmetPrereqs, moduleTarget, onMarkKnown, onOpenPrereq }: Props) {
  const [data, setData] = useState<{ resources: Resource[]; problems: ProblemRow[] } | null>(null);

  useEffect(() => {
    getModuleContent(moduleId).then(setData);
  }, [moduleId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        className="relative w-full sm:max-w-lg max-h-[80vh] overflow-y-auto bg-zinc-950 border border-zinc-800/80 rounded-t-2xl sm:rounded-2xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800/60">
          <span className="text-sm font-medium text-zinc-100">{title}</span>
          <div className="flex items-center gap-1">
            {!previewMode && onMarkKnown && (
              <button
                onClick={onMarkKnown}
                className="text-[11px] text-zinc-600 hover:text-emerald-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
              >
                Mark complete
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-300 transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-800"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          {!data ? (
            <p className="text-sm text-zinc-600 py-6 text-center">Loading…</p>
          ) : (
            <>
              {previewMode && (
                <div className="mb-5 border border-amber-700/40 bg-amber-950/20 rounded-md px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest flex-shrink-0 leading-5">Locked</span>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-200">Preview only.</strong>{" "}
                      Finish the prerequisites to start solving:
                      {unmetPrereqs && unmetPrereqs.length > 0 && (
                        <span className="block mt-1 text-zinc-300">
                          {unmetPrereqs.map((p, i) => (
                            <span key={p.id}>
                              {i > 0 && ", "}
                              <button
                                onClick={() => { onClose(); onOpenPrereq?.(p.id); }}
                                className="font-medium underline decoration-zinc-600 underline-offset-2 hover:text-emerald-400 cursor-pointer bg-transparent border-0 p-0"
                              >
                                {p.label}
                              </button>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <Resources items={data.resources} />
              {data.problems.length > 0 && (
                <ProblemsChecklist
                  moduleId={moduleId}
                  problems={data.problems}
                  hideProgress={moduleId === "foundations"}
                  readOnly={previewMode}
                  moduleTarget={moduleTarget}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
