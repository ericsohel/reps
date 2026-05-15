import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ProblemsChecklist, type ProblemRow } from "./problems-checklist";

// ── Module registry ──────────────────────────────────────────────────────────

const MODULE_META = {
  "arrays-hashing":  { file: "02-arrays-hashing.md",      num: 2,  title: "Arrays & Hashing" },
  "prefix-sums":     { file: "03-prefix-sums.md",         num: 3,  title: "Prefix Sums" },
  "two-pointers":    { file: "04-two-pointers.md",        num: 4,  title: "Two Pointers" },
  "sliding-window":  { file: "05-sliding-window.md",      num: 5,  title: "Sliding Window" },
  "stack":           { file: "06-stack.md",               num: 6,  title: "Stack" },
  "monotonic-stack": { file: "07-monotonic-stack.md",     num: 7,  title: "Monotonic Stack" },
  "monotonic-deque": { file: "08-monotonic-deque.md",     num: 8,  title: "Monotonic Deque" },
  "linked-list":     { file: "09-linked-list.md",         num: 9,  title: "Linked List" },
  "binary-search":   { file: "10-binary-search.md",       num: 10, title: "Binary Search" },
  "bs-answer":       { file: "11-binary-search-answer.md",num: 11, title: "Binary Search on Answer" },
  "backtracking":    { file: "12-backtracking.md",        num: 12, title: "Recursion & Backtracking" },
  "trees":           { file: "13-trees.md",               num: 13, title: "Trees" },
  "tries":           { file: "14-tries.md",               num: 14, title: "Tries" },
  "heap":            { file: "15-heap.md",                num: 15, title: "Heap / Priority Queue" },
  "greedy":          { file: "16-greedy.md",             num: 16, title: "Greedy" },
  "intervals":       { file: "17-intervals.md",          num: 17, title: "Intervals & Sweep Line" },
  "graph-traversal": { file: "18-graph-traversal.md",    num: 18, title: "Graph Traversal" },
  "topo-sort":       { file: "19-topological-sort.md",   num: 19, title: "Topological Sort" },
} as const;

type ModuleKey = keyof typeof MODULE_META;

export function generateStaticParams() {
  return Object.keys(MODULE_META).map((module) => ({ module }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const meta = MODULE_META[module as ModuleKey];
  if (!meta) return {};
  return { title: `${meta.title} — DSA Roadmap` };
}

// ── Syntax highlighter ───────────────────────────────────────────────────────

type TT = "keyword" | "builtin" | "string" | "comment" | "number" | "decorator" | "text";
interface Token { type: TT; value: string }

const KW = new Set([
  "import","from","def","return","for","in","if","else","elif","while","pass",
  "class","and","or","not","is","None","True","False","lambda","with","as",
  "yield","raise","try","except","finally","break","continue","global","assert",
]);
const BUILTINS = new Set([
  "print","int","list","dict","set","range","len","max","min","sorted",
  "enumerate","zip","map","filter","str","type","isinstance","tuple","bool",
  "float","abs","sum","any","all","reversed","next","iter","getattr","hasattr",
]);

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      if (src.startsWith(q.repeat(3), i)) {
        const end = src.indexOf(q.repeat(3), i + 3);
        const slice = end === -1 ? src.slice(i) : src.slice(i, end + 3);
        out.push({ type: "string", value: slice });
        i = end === -1 ? src.length : end + 3;
      } else {
        let j = i + 1;
        while (j < src.length && src[j] !== q && src[j] !== "\n") {
          if (src[j] === "\\") j++;
          j++;
        }
        out.push({ type: "string", value: src.slice(i, j + 1) });
        i = j + 1;
      }
    } else if (ch === "#") {
      const end = src.indexOf("\n", i);
      out.push({ type: "comment", value: end === -1 ? src.slice(i) : src.slice(i, end) });
      i = end === -1 ? src.length : end;
    } else if (ch === "@") {
      let j = i + 1;
      while (j < src.length && /[\w.]/.test(src[j])) j++;
      out.push({ type: "decorator", value: src.slice(i, j) });
      i = j;
    } else if (/\d/.test(ch) && (i === 0 || !/\w/.test(src[i - 1]))) {
      let j = i;
      while (j < src.length && /[\d_]/.test(src[j])) j++;
      out.push({ type: "number", value: src.slice(i, j) });
      i = j;
    } else if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /\w/.test(src[j])) j++;
      const word = src.slice(i, j);
      out.push({ type: KW.has(word) ? "keyword" : BUILTINS.has(word) ? "builtin" : "text", value: word });
      i = j;
    } else {
      const last = out[out.length - 1];
      if (last?.type === "text") last.value += ch;
      else out.push({ type: "text", value: ch });
      i++;
    }
  }
  return out;
}

const TOKEN_CLASS: Record<TT, string> = {
  keyword:   "text-violet-400",
  builtin:   "text-sky-400",
  string:    "text-amber-300",
  comment:   "text-zinc-500",
  number:    "text-orange-300",
  decorator: "text-emerald-400",
  text:      "text-zinc-300",
};

// ── Markdown components ───────────────────────────────────────────────────────

function CodeBlock({ lang, children }: { lang: string; children: string }) {
  const isPython = lang === "python" || lang === "py";
  return (
    <div className="mt-3 mb-4 relative">
      {lang && (
        <span className="absolute top-3 right-3.5 text-[10px] font-mono font-semibold text-zinc-600 uppercase tracking-wider select-none">
          {lang}
        </span>
      )}
      <pre className="overflow-x-auto rounded-lg border border-zinc-700/60 bg-[#0c0c0e] px-5 py-4 text-[13px] leading-[1.7] font-mono">
        {isPython
          ? tokenize(children).map((t, i) => (
              <span key={i} className={TOKEN_CLASS[t.type]}>{t.value}</span>
            ))
          : <span className="text-zinc-400">{children}</span>
        }
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md border border-zinc-700/50 bg-zinc-900 text-zinc-200 text-[12px] font-mono">
      {children}
    </code>
  );
}

const mdComponents: Components = {
  h1() { return null; }, // stripped — rendered in header
  h2({ children }) {
    return (
      <h2 className="text-lg font-semibold text-zinc-100 mt-10 mb-3 tracking-tight border-b border-zinc-800/60 pb-2">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="text-base font-semibold text-zinc-200 mt-7 mb-2 tracking-tight">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    return (
      <h4 className="text-sm font-semibold text-zinc-300 mt-5 mb-1.5 tracking-tight">
        {children}
      </h4>
    );
  },
  p({ children }) {
    return <p className="text-sm text-zinc-400 leading-relaxed mb-3">{children}</p>;
  },
  strong({ children }) {
    return <strong className="text-zinc-200 font-semibold">{children}</strong>;
  },
  em({ children }) {
    return <em className="text-zinc-300 italic">{children}</em>;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children }) {
    const lang = className?.replace("language-", "") ?? "";
    const src = String(children).replace(/\n$/, "");
    if (lang || src.includes("\n")) {
      return <CodeBlock lang={lang}>{src}</CodeBlock>;
    }
    return <InlineCode>{src}</InlineCode>;
  },
  table({ children }) {
    return (
      <div className="mt-3 mb-5 overflow-x-auto">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }) { return <thead>{children}</thead>; },
  tbody({ children }) { return <tbody>{children}</tbody>; },
  tr({ children }) {
    return (
      <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
        {children}
      </tr>
    );
  },
  th({ children }) {
    return (
      <th className="text-left px-3 py-2 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="px-3 py-2.5 text-zinc-400 text-[13px] align-top">{children}</td>;
  },
  ul({ children }) {
    return (
      <ul className="space-y-1.5 text-sm text-zinc-400 list-disc list-outside pl-5 mb-4">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="space-y-1.5 text-sm text-zinc-400 list-decimal list-outside pl-5 mb-4">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <div className="my-4 pl-4 border-l-2 border-zinc-700 bg-zinc-900/30 rounded-r-lg py-3 pr-4">
        {children}
      </div>
    );
  },
  a({ href, children }) {
    return (
      <a
        href={href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-300 underline decoration-zinc-600 underline-offset-2 hover:text-emerald-400 hover:decoration-emerald-700 transition-colors"
      >
        {children}
      </a>
    );
  },
  hr() {
    return <div className="divider my-10" />;
  },
};

// ── Step 5 problems-table extraction ─────────────────────────────────────────

function extractProblemsSection(md: string): {
  before: string;
  step5Intro: string;
  problems: ProblemRow[];
  after: string;
} | null {
  const m = md.match(/^## Step 5.*$/m);
  if (!m || m.index === undefined) return null;

  const step5Start = m.index;
  const before = md.slice(0, step5Start);
  const fromStep5 = md.slice(step5Start);
  const lines = fromStep5.split("\n");

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
  if (tStart === -1 || tEnd - tStart < 2) return null;

  const step5Intro = lines.slice(0, tStart).join("\n");
  const tableLines = lines.slice(tStart, tEnd + 1);
  const after = lines.slice(tEnd + 1).join("\n");

  const parseRow = (line: string) =>
    line.split("|").slice(1, -1).map((s) => s.trim());

  const headers = parseRow(tableLines[0]);
  const rows = tableLines.slice(2).map(parseRow);
  const roleIdx = headers.findIndex((h) => h.toLowerCase() === "role");
  const diffIdx = headers.findIndex((h) => h.toLowerCase() === "difficulty");

  const normDifficulty = (s: string): "easy" | "medium" | "hard" | null => {
    const t = s.toLowerCase().trim();
    if (t === "easy" || t === "very easy") return "easy";
    if (t === "medium" || t === "normal") return "medium";
    if (t === "hard") return "hard";
    return null;
  };

  const problems: ProblemRow[] = rows.map((cells, i) => {
    const num = parseInt(cells[0]) || i + 1;
    const problemCell = cells[1] || "";
    const linkMatch = problemCell.match(/\[(.+?)\]\((.+?)\)/);
    const title = linkMatch ? linkMatch[1] : problemCell;
    const url = linkMatch ? linkMatch[2] : "";

    const roleCell = roleIdx >= 0 ? cells[roleIdx] || "" : "";
    const isCheckpoint = roleCell.toLowerCase().includes("checkpoint");
    const difficulty = diffIdx >= 0 ? normDifficulty(cells[diffIdx] || "") : null;

    return {
      num,
      title,
      url,
      isCheckpoint,
      difficulty,
      extraHeaders: headers.slice(2),
      extraCells: cells.slice(2),
    };
  });

  return { before, step5Intro, problems, after };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const meta = MODULE_META[module as ModuleKey];
  if (!meta) notFound();

  const contentPath = path.join(
    process.cwd(),
    "app/roadmap/_content",
    meta.file,
  );
  const raw = fs.readFileSync(contentPath, "utf-8");
  // Strip the h1 title line — we render it in the header
  const content = raw.replace(/^# .+\n/, "");

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
        <Link
          href="/roadmap"
          className="no-underline text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Roadmap
        </Link>
        <span>/</span>
        <span className="text-zinc-400">{meta.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
            Module {meta.num}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        </div>
      </div>

      <div className="divider mb-0" />

      {(() => {
        const section = extractProblemsSection(content);
        if (!section) {
          return (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content}
            </ReactMarkdown>
          );
        }
        return (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {section.before}
            </ReactMarkdown>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {section.step5Intro}
            </ReactMarkdown>
            <ProblemsChecklist moduleId={module} problems={section.problems} />
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {section.after}
            </ReactMarkdown>
          </>
        );
      })()}

      <div className="divider mt-6" />
      <div className="flex justify-between items-center pt-4">
        <Link
          href="/roadmap"
          className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Roadmap
        </Link>
        {(() => {
          const ids = Object.keys(MODULE_META) as ModuleKey[];
          const idx = ids.findIndex((k) => MODULE_META[k].num === meta.num + 1);
          if (idx === -1) return null;
          return (
            <Link
              href={`/roadmap/${ids[idx]}`}
              className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Next module →
            </Link>
          );
        })()}
      </div>
    </div>
  );
}
