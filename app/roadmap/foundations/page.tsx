import fs from "fs";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

export const metadata = { title: "Foundations — DSA Roadmap" };

// ── Syntax highlighter ────────────────────────────────────────────────────────

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
  h1() { return null; },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FoundationsPage() {
  const contentPath = path.join(process.cwd(), "app/roadmap/_content/01-foundations.md");
  const raw = fs.readFileSync(contentPath, "utf-8");
  // Strip the h1 title line — rendered in the header below
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
        <span className="text-zinc-400">Foundations</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
            Module 1
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Foundations</h1>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400">
            Checklist format
          </span>
          <span className="text-[11px] text-zinc-600">
            Unlocks: Arrays &amp; Hashing, Backtracking, Bit Manipulation, Number Theory
          </span>
        </div>
      </div>

      <div className="divider mb-0" />

      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>

      <div className="divider mt-6" />
      <div className="flex justify-between items-center pt-4">
        <Link
          href="/roadmap"
          className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Roadmap
        </Link>
        <Link
          href="/roadmap/arrays-hashing"
          className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Next module →
        </Link>
      </div>
    </div>
  );
}
