"use client";

import { useState, useTransition } from "react";
import { advanceCompany, regressCompany, rejectCompany, reopenCompany, addCompany, deleteCompany } from "./actions";
import { TIERS, type Tier, type Status } from "@/lib/companies-seed";

interface CompanyItem {
  id: number;
  name: string;
  tier: Tier;
  status: Status;
  isCustom: boolean;
  appliedAt: number | null;
  updatedAt: number;
}

interface Props {
  tierGroups: { tier: Tier; items: CompanyItem[] }[];
  pipeline: { status: Status; label: string; items: CompanyItem[] }[];
  closed: CompanyItem[];
  activeCount: number;
  tierColors: Record<Tier, { text: string; bg: string; border: string }>;
}

export default function CompaniesClient({ tierGroups, pipeline, closed, activeCount, tierColors }: Props) {
  const [adding, setAdding] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  return (
    <main className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Internships</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            {activeCount === 0
              ? "Click a company to mark it Applied. Click again to advance through OA → Interview → Offer."
              : `${activeCount} active in pipeline.`}
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-colors">
          + Add company
        </button>
      </header>

      {adding && <AddForm onClose={() => setAdding(false)} />}

      {/* Pipeline */}
      {activeCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {pipeline.map((col) => (
              <PipelineColumn key={col.status} {...col} tierColors={tierColors} />
            ))}
          </div>
        </section>
      )}

      {/* Tier list */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Targets</h2>
        <div className="card divide-y divide-zinc-800/80">
          {tierGroups.map((g) =>
            g.items.length === 0 && g.tier !== "Custom" ? null : (
              <TierRow key={g.tier} tier={g.tier} items={g.items} colors={tierColors[g.tier]} />
            )
          )}
        </div>
      </section>

      {/* Closed */}
      {closed.length > 0 && (
        <section className="space-y-3">
          <button onClick={() => setShowClosed((s) => !s)} className="text-xs font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300">
            Closed ({closed.length}) {showClosed ? "▾" : "▸"}
          </button>
          {showClosed && (
            <div className="flex flex-wrap gap-2">
              {closed.map((c) => (
                <ClosedChip key={c.id} item={c} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function TierRow({ tier, items, colors }: { tier: Tier; items: CompanyItem[]; colors: { text: string; bg: string; border: string } }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <div className="w-12 shrink-0 pt-1">
        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${colors.text} ${colors.bg} ${colors.border}`}>
          {tier}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-600 italic pt-1">— all moved to pipeline —</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((c) => (
              <CompanyChip key={c.id} item={c} variant="tier" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineColumn({
  status,
  label,
  items,
  tierColors,
}: {
  status: Status;
  label: string;
  items: CompanyItem[];
  tierColors: Record<Tier, { text: string; bg: string; border: string }>;
}) {
  const accent =
    status === "applied"   ? "border-zinc-700"
    : status === "oa"      ? "border-blue-900/60"
    : status === "interview" ? "border-amber-900/60"
    : "border-emerald-900/60";
  return (
    <div className={`rounded-lg border ${accent} bg-zinc-900/30 p-3 space-y-2 min-h-[100px]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">{label}</span>
        <span className="text-[11px] mono text-zinc-500">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic px-1">empty</p>
        ) : (
          items.map((c) => (
            <CompanyChip key={c.id} item={c} variant="pipeline" tierColors={tierColors} />
          ))
        )}
      </div>
    </div>
  );
}

function CompanyChip({
  item,
  variant,
  tierColors,
}: {
  item: CompanyItem;
  variant: "tier" | "pipeline";
  tierColors?: Record<Tier, { text: string; bg: string; border: string }>;
}) {
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  function onClick() {
    setMenuOpen(false);
    start(() => advanceCompany(item.id));
  }

  if (variant === "tier") {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        className={`group relative px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-600 text-xs text-zinc-200 transition-all ${pending ? "opacity-50" : ""}`}
        title="Click to mark Applied"
      >
        {item.name}
        {item.isCustom && (
          <span
            onClick={(e) => { e.stopPropagation(); start(() => deleteCompany(item.id)); }}
            className="ml-1.5 text-zinc-600 hover:text-rose-400 cursor-pointer"
          >
            ×
          </span>
        )}
      </button>
    );
  }

  // pipeline variant: clickable to advance, with secondary actions
  const tierColor = tierColors?.[item.tier];
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={pending}
        className={`w-full text-left px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 hover:border-zinc-600 text-xs text-zinc-100 transition-all flex items-center gap-2 ${pending ? "opacity-50" : ""}`}
        title="Click to advance to next stage"
      >
        {tierColor && (
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${tierColor.text.replace("text-", "bg-")}`} />
        )}
        <span className="truncate flex-1">{item.name}</span>
        <span
          onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
          className="text-zinc-600 hover:text-zinc-300 cursor-pointer text-base leading-none px-0.5"
        >
          ⋯
        </span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-10 rounded-md border border-zinc-700 bg-zinc-900 shadow-lg text-xs min-w-[120px] overflow-hidden">
          <MenuItem onClick={() => { setMenuOpen(false); start(() => regressCompany(item.id)); }}>
            ← Step back
          </MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); start(() => rejectCompany(item.id)); }} danger>
            ✗ Mark rejected
          </MenuItem>
          {item.isCustom && (
            <MenuItem onClick={() => { setMenuOpen(false); start(() => deleteCompany(item.id)); }} danger>
              Delete
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 ${danger ? "text-rose-300 hover:text-rose-200" : "text-zinc-200"}`}
    >
      {children}
    </button>
  );
}

function ClosedChip({ item }: { item: CompanyItem }) {
  const [pending, start] = useTransition();
  const isAccepted = item.status === "accepted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
        isAccepted
          ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
          : "border-zinc-800 bg-zinc-900/30 text-zinc-500 line-through"
      }`}
    >
      {item.name}
      <button
        onClick={() => start(() => reopenCompany(item.id))}
        disabled={pending}
        className="text-zinc-600 hover:text-zinc-300 text-[10px]"
        title="Reopen"
      >
        ↺
      </button>
    </span>
  );
}

function AddForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("S");
  const [pending, start] = useTransition();

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Add company</p>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-200">cancel</button>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          placeholder="Gemini, Cohere, Mistral, ..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              start(async () => { await addCompany(name, tier); onClose(); });
            }
          }}
        />
        <select value={tier} onChange={(e) => setTier(e.target.value as Tier)} className="w-28">
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => start(async () => { if (name.trim()) { await addCompany(name, tier); onClose(); } })}
          disabled={pending || !name.trim()}
          className="btn-primary px-4"
        >
          Add
        </button>
      </div>
    </div>
  );
}
