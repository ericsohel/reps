"use client";

import { useState, useTransition } from "react";
import {
  createApplication,
  advanceApplication,
  regressApplication,
  rejectApplication,
  reopenApplication,
  deleteApplication,
  updateApplication,
  addCompany,
  deleteCompany,
} from "./actions";
import { TIERS, type Tier, type Status } from "@/lib/companies-seed";

interface CompanyItem {
  id: number;
  name: string;
  tier: Tier;
  isCustom: boolean;
  activeApplicationCount: number;
  hasAnyApplication: boolean;
}

interface AppItem {
  id: number;
  companyId: number;
  companyName: string;
  tier: Tier;
  role: string;
  url: string;
  status: Status;
  appliedAt: number;
  updatedAt: number;
}

interface Props {
  tierGroups: { tier: Tier; items: CompanyItem[] }[];
  pipeline: { status: Status; label: string; items: AppItem[] }[];
  closed: AppItem[];
  activeCount: number;
  tierColors: Record<Tier, { text: string; bg: string; border: string }>;
}

const DAY_MS = 86_400_000;
const STALE_DAYS = 14;

function daysSince(ts: number) {
  return Math.floor((Date.now() - ts) / DAY_MS);
}

function formatTiming(appliedDays: number, stageDays: number) {
  const applied =
    appliedDays === 0 ? "applied today"
    : appliedDays === 1 ? "applied yesterday"
    : `applied ${appliedDays}d ago`;
  // Same value means status never changed; don't repeat the number.
  if (stageDays >= appliedDays) return applied;
  return `${applied} · ${stageDays}d here`;
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
              ? "Click a target to add an application. You can apply to multiple roles per company."
              : `${activeCount} active application${activeCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-colors">
          + Add
        </button>
      </header>

      {adding && <AddCompanyForm onClose={() => setAdding(false)} />}

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
        <div className="space-y-2">
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
          <button onClick={() => setShowClosed((s) => !s)} className="text-xs font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 inline-flex items-center gap-1.5">
            <span>Closed</span>
            <span className="text-zinc-700">{closed.length}</span>
            <span className="text-zinc-700 text-[10px]">{showClosed ? "▾" : "▸"}</span>
          </button>
          {showClosed && (
            <div className="flex flex-wrap gap-2">
              {closed.map((a) => (
                <ClosedChip key={a.id} app={a} />
              ))}
            </div>
          )}
        </section>
      )}

      <Resources />
    </main>
  );
}

const RESOURCES = [
  {
    group: "Internships",
    links: [
      { label: "GitHub · Summer 2026",    sub: "SimplifyJobs",    href: "https://github.com/SimplifyJobs/Summer2026-Internships" },
      { label: "Discord · Internship feed", sub: "CS Career Hub",  href: "https://discord.com/channels/519640186167099402/1269342448057057301" },
      { label: "LinkedIn Jobs",            sub: "SWE Intern",      href: "https://www.linkedin.com/jobs/search-results/?currentJobId=4332425058&keywords=software%20engineer%20intern&origin=SEMANTIC_SEARCH_LANDING_PAGE" },
    ],
  },
  {
    group: "New Grad",
    links: [
      { label: "GitHub · New Grad 2026",  sub: "SimplifyJobs",    href: "https://github.com/SimplifyJobs/New-Grad-Positions#-software-engineering-new-grad-roles" },
      { label: "Discord · New Grad feed", sub: "CS Career Hub",   href: "https://discord.com/channels/519640186167099402/1276389560129028096" },
      { label: "LinkedIn Jobs",            sub: "SWE New Grad",    href: "https://www.linkedin.com/jobs/search-results/?currentJobId=4411728704&keywords=software%20engineer%20new%20grad&origin=SEMANTIC_SEARCH_LANDING_PAGE" },
    ],
  },
  {
    group: "Follow",
    links: [
      { label: "zero2sudo",               sub: "Instagram",        href: "https://www.instagram.com/zero2sudo/" },
    ],
  },
] as const;

const PLATFORM_ICON: Record<string, string> = {
  GitHub: "⑂",
  Discord: "◈",
  LinkedIn: "in",
  Instagram: "◎",
};

function Resources() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RESOURCES.map((group) => (
          <div key={group.group} className="card p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 px-1 pb-0.5">{group.group}</p>
            {group.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="no-underline flex items-center gap-3 px-2.5 py-2 rounded-md border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
              >
                <span className="text-[11px] mono text-zinc-600 group-hover:text-zinc-400 w-5 text-center">
                  {PLATFORM_ICON[link.sub] ?? "↗"}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 font-medium truncate">{link.label}</p>
                  <p className="text-[10px] text-zinc-600">{link.sub}</p>
                </div>
                <span className="ml-auto text-zinc-700 group-hover:text-zinc-400 text-xs">↗</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TierRow({ tier, items, colors }: { tier: Tier; items: CompanyItem[]; colors: { text: string; bg: string; border: string } }) {
  return (
    <div className="flex items-stretch rounded-lg border border-zinc-800/80 bg-zinc-900/20 overflow-hidden">
      <div className={`flex items-center justify-center px-3 ${colors.bg} ${colors.text} border-r border-zinc-800/80 min-w-[56px]`}>
        <span className="text-sm mono font-bold tracking-wider">{tier}</span>
      </div>
      <div className="min-w-0 flex-1 px-3 py-3">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-600 italic pt-0.5">— empty —</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((c) => (
              <CompanyChip key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyChip({ company }: { company: CompanyItem }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-zinc-950/50 text-[12px] text-zinc-200 transition-all border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 ${pending ? "opacity-50" : ""}`}
        title="Click to add an application"
      >
        <span>{company.name}</span>
        {company.activeApplicationCount > 0 && (
          <span className="text-[10px] mono px-1 rounded bg-amber-900/40 text-amber-300">
            {company.activeApplicationCount}
          </span>
        )}
        {company.isCustom && (
          <span
            onClick={(e) => { e.stopPropagation(); start(() => deleteCompany(company.id)); }}
            className="ml-0.5 text-zinc-600 hover:text-rose-400 cursor-pointer text-xs"
            title="Delete company"
          >
            ×
          </span>
        )}
      </button>
      {open && (
        <NewApplicationModal company={company} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function NewApplicationModal({ company, onClose }: { company: CompanyItem; onClose: () => void }) {
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      await createApplication(company.id, role, url);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">New application</p>
          <h3 className="text-base font-semibold text-zinc-100 mt-0.5">{company.name}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label>Role (optional)</label>
            <input
              autoFocus
              placeholder="SWE Intern, ML Research, ..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
              className="text-sm"
            />
          </div>
          <div>
            <label>URL (optional)</label>
            <input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
              className="text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={pending} className="btn-primary flex-1">
            {pending ? "Adding…" : "Add application"}
          </button>
          <button onClick={onClose} className="btn-ghost px-4">cancel</button>
        </div>
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
  items: AppItem[];
  tierColors: Record<Tier, { text: string; bg: string; border: string }>;
}) {
  const accent =
    status === "applied"   ? { border: "border-zinc-800", dot: "bg-zinc-500", text: "text-zinc-300" }
    : status === "oa"      ? { border: "border-blue-900/40 bg-blue-950/10", dot: "bg-blue-400", text: "text-blue-200" }
    : status === "interview" ? { border: "border-amber-900/40 bg-amber-950/10", dot: "bg-amber-400", text: "text-amber-200" }
    : { border: "border-emerald-900/50 bg-emerald-950/10", dot: "bg-emerald-400", text: "text-emerald-200" };

  return (
    <div className={`rounded-lg border ${accent.border} bg-zinc-900/30 p-3 space-y-2.5 min-h-[110px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
          <span className={`text-xs font-semibold ${accent.text}`}>{label}</span>
        </div>
        <span className="text-[10px] mono text-zinc-600 tabular-nums">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-700 italic px-1 py-0.5">empty</p>
        ) : (
          items.map((a) => <ApplicationCard key={a.id} app={a} tierColors={tierColors} />)
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  tierColors,
}: {
  app: AppItem;
  tierColors: Record<Tier, { text: string; bg: string; border: string }>;
}) {
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(app.role);
  const [url, setUrl] = useState(app.url);

  const tierColor = tierColors[app.tier];
  const dotClass = tierColor.text.replace("text-", "bg-");
  const daysInStage = daysSince(app.updatedAt);
  const daysSinceApplied = daysSince(app.appliedAt);
  const isStale = daysInStage >= STALE_DAYS;

  function advance() {
    if (menuOpen || editing) return;
    start(() => advanceApplication(app.id));
  }

  function saveEdits() {
    start(async () => {
      await updateApplication(app.id, { role, url });
      setEditing(false);
    });
  }

  return (
    <div
      className={`relative rounded-md border ${
        isStale ? "border-amber-900/50 shadow-[0_0_0_1px_rgba(180,83,9,0.15)]" : "border-zinc-800"
      } bg-zinc-950/40 hover:bg-zinc-900 hover:border-zinc-600 transition-all ${pending ? "opacity-50" : ""}`}
    >
      <button
        onClick={advance}
        disabled={pending || editing}
        className="w-full text-left p-2 disabled:cursor-default"
        title={editing ? "" : "Click to advance"}
      >
        <div className="flex items-start gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass} mt-1.5 shrink-0`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-zinc-100 font-medium truncate">{app.companyName}</span>
              {app.url && (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-zinc-600 hover:text-zinc-300 text-[10px] no-underline shrink-0"
                  title={app.url}
                >
                  ↗
                </a>
              )}
            </div>
            {app.role && (
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">{app.role}</div>
            )}
            <div className="text-[10px] text-zinc-600 mono mt-1">
              {formatTiming(daysSinceApplied, daysInStage)}
            </div>
          </div>
          <span
            onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
            className="text-zinc-600 hover:text-zinc-300 cursor-pointer text-base leading-none px-0.5 shrink-0"
          >
            ⋯
          </span>
        </div>
      </button>

      {editing && (
        <div className="px-2 pb-2 space-y-1.5">
          <input
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdits(); if (e.key === "Escape") setEditing(false); }}
            className="text-xs"
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdits(); if (e.key === "Escape") setEditing(false); }}
            className="text-xs"
          />
          <div className="flex gap-1.5">
            <button onClick={saveEdits} disabled={pending} className="btn-primary text-xs flex-1 py-1">save</button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-2">cancel</button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="absolute right-2 top-full mt-1 z-10 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl text-xs min-w-[140px] overflow-hidden">
          <MenuItem onClick={() => { setMenuOpen(false); setEditing(true); }}>Edit details</MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); start(() => regressApplication(app.id)); }}>← Step back</MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); start(() => rejectApplication(app.id)); }} danger>✗ Mark rejected</MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); start(() => deleteApplication(app.id)); }} danger>Delete application</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 transition-colors ${danger ? "text-rose-300 hover:text-rose-200" : "text-zinc-200"}`}
    >
      {children}
    </button>
  );
}

function ClosedChip({ app }: { app: AppItem }) {
  const [pending, start] = useTransition();
  const isAccepted = app.status === "accepted";
  const label = app.role ? `${app.companyName} — ${app.role}` : app.companyName;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
        isAccepted
          ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
          : "border-zinc-800 bg-zinc-900/30 text-zinc-500 line-through"
      }`}
    >
      {label}
      <button
        onClick={() => start(() => reopenApplication(app.id))}
        disabled={pending}
        className="text-zinc-600 hover:text-zinc-300 text-[10px] no-underline"
        title="Reopen"
      >
        ↺
      </button>
    </span>
  );
}

function AddCompanyForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("S");
  const [pending, start] = useTransition();

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Add company to catalog</p>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-200">cancel</button>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          placeholder="Company name (e.g. Cohere)"
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
      <p className="text-[11px] text-zinc-600">This adds the company to your tier list. Click it later to create an application.</p>
    </div>
  );
}
