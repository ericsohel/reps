import Link from "next/link";

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
  "float","abs","sum","any","all","reversed",
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

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-zinc-100 mt-8 mb-3 tracking-tight">
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-base font-semibold text-zinc-200 mt-6 mb-2 tracking-tight scroll-mt-4">
      {children}
    </h3>
  );
}

function SelfTest({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 px-3 py-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-sm text-zinc-300">
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mr-2">Self-test</span>
      {children}
    </div>
  );
}

function Reading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 text-sm text-zinc-500">
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 mr-2">Reading</span>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  const tokens = tokenize(children);
  return (
    <div className="mt-3 relative">
      <span className="absolute top-3 right-3.5 text-[10px] font-mono font-semibold text-zinc-600 uppercase tracking-wider select-none">
        py
      </span>
      <pre className="overflow-x-auto rounded-lg border border-zinc-700/60 bg-[#0c0c0e] px-5 py-4 text-[13px] leading-[1.7] font-mono">
        {tokens.map((t, i) => (
          <span key={i} className={TOKEN_CLASS[t.type]}>{t.value}</span>
        ))}
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

function Divider() {
  return <div className="divider my-10" />;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 text-[11px] uppercase tracking-widest text-zinc-500 font-medium border-b border-zinc-800">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-zinc-400 font-mono text-[13px]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FoundationsPage() {
  return (
    <div className="space-y-1 pb-16">
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
        <Link href="/roadmap" className="no-underline text-zinc-500 hover:text-zinc-300 transition-colors">
          Roadmap
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Foundations</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1.5">Module 1</div>
          <h1 className="text-3xl font-semibold tracking-tight">Foundations</h1>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400">
            Checklist format
          </span>
          <span className="text-[11px] text-zinc-600">
            Unlocks: Arrays & Hashing, Backtracking, Bit Manipulation, Number Theory
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-500 mt-2">
        Structurally different from modules 2+ — no cold attempt, no problem ladder. Subsequent modules follow a 5-step structure. Complete every item here before moving on.
      </p>

      <Divider />

      <H2>How to use this module</H2>
      <ol className="space-y-1.5 text-sm text-zinc-400 list-decimal list-inside">
        <li><span className="text-zinc-300 font-medium">Read</span> the skill description.</li>
        <li><span className="text-zinc-300 font-medium">Try</span> the self-test cold — no reference material.</li>
        <li><span className="text-zinc-300 font-medium">Pass?</span> Check it off and move on.</li>
        <li><span className="text-zinc-300 font-medium">Fail or slow?</span> Follow the reading link before continuing. Don't skip.</li>
      </ol>
      <p className="text-sm text-zinc-500 mt-3">
        Work through every item in order. None of this is taught again — later modules assume it fluently.
      </p>

      <Divider />

      <H2>Checklist</H2>

      {/* 1 */}
      <H3 id="time-complexity">1. Time complexity</H3>
      <p className="text-sm text-zinc-400">
        Given a block of code, state its Big-O. Recognise the common shapes instantly:
      </p>
      <Table
        headers={["Pattern", "Complexity"]}
        rows={[
          ["Single loop over n elements", "O(n)"],
          ["Two nested loops", "O(n²)"],
          ["Loop that halves the problem each step", "O(log n)"],
          ["Sorting n elements", "O(n log n)"],
          ["Binary search", "O(log n)"],
          ["Dict/set lookup or insert (average)", "O(1)"],
        ]}
      />
      <SelfTest>
        Why is binary search O(log n)? What&apos;s the complexity of <InlineCode>sorted()</InlineCode> inside a loop of n iterations?{" "}
        <span className="text-zinc-500">(O(n² log n).)</span>
      </SelfTest>
      <Reading>
        <a href="https://usaco.guide/bronze/time-comp" target="_blank" rel="noopener noreferrer">
          USACO Guide — Time Complexity
        </a>
      </Reading>

      <Divider />

      {/* 2 */}
      <H3 id="space-complexity">2. Space complexity</H3>
      <p className="text-sm text-zinc-400">
        State the memory usage of an algorithm. Competitive programming memory limit is typically 256 MB.
        A Python list of 10⁷ ints is ~80 MB — fine. A 2D list of 10⁴ × 10⁴ ints is ~400 MB — MLE.
      </p>
      <SelfTest>
        <InlineCode>{"[[0]*n for _ in range(n)]"}</InlineCode> with n = 10⁴ — how much memory?{" "}
        <span className="text-zinc-500">(~400 MB.)</span>
      </SelfTest>

      <Divider />

      {/* 3 */}
      <H3 id="stdlib">3. Python stdlib fluency</H3>
      <Code>{`# Lists (dynamic array, O(1) amortised append, O(1) index access)
a = []
a.append(x); a.pop()           # O(1) — last element
a.pop(0)                       # O(n) — first element; use deque instead

# Dict (hash map, O(1) avg lookup/insert)
d[key] = val
d.get(key, default)            # safe lookup with fallback
key in d                       # O(1) existence check

# Set (hash set, O(1) avg insert/lookup)
s.add(x); x in s

# Counter (frequency map shorthand)
from collections import Counter
freq = Counter(arr)
freq.most_common(k)            # k most frequent elements

# defaultdict (auto-initialises missing keys)
from collections import defaultdict
groups = defaultdict(list)
groups[key].append(val)

# deque (O(1) on both ends)
from collections import deque
d = deque(); d.appendleft(x); d.append(x)
d.popleft(); d.pop()           # all O(1)

# Heap (min-heap by default)
import heapq
heapq.heappush(h, x); heapq.heappop(h)
heapq.heapify(lst)             # in-place, O(n)

# Bisect (binary search on sorted lists)
import bisect
bisect.bisect_left(arr, x)     # leftmost insertion index
bisect.bisect_right(arr, x)    # rightmost insertion index`}</Code>
      <SelfTest>
        Write a frequency counter over a list, then print all elements appearing more than k times — using{" "}
        <InlineCode>Counter</InlineCode>, in under 3 minutes.
      </SelfTest>
      <Reading>
        <a href="https://cses.fi/book/book.pdf" target="_blank" rel="noopener noreferrer">
          CPH Book
        </a>{" "}
        Chapter 4 (pp. 39–54) for the underlying concepts.
      </Reading>

      <Divider />

      {/* 4 */}
      <H3 id="fast-io">4. Fast I/O in Python</H3>
      <p className="text-sm text-zinc-400">
        <InlineCode>input()</InlineCode> is slow for thousands of lines. For competitive programming:
      </p>
      <Code>{`import sys
input = sys.stdin.readline   # drop-in replacement

# Fastest — read everything at once:
data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
a = [int(data[idx + i]) for i in range(n)]; idx += n`}</Code>
      <p className="text-sm text-zinc-400 mt-3">For many outputs, accumulate and print once:</p>
      <Code>{`print('\\n'.join(map(str, results)))`}</Code>
      <SelfTest>
        Read n integers on one line into a list in one line of Python.{" "}
        <span className="text-zinc-500">(<InlineCode>{"a = list(map(int, input().split()))"}</InlineCode>)</span>
      </SelfTest>

      <Divider />

      {/* 5 */}
      <H3 id="recursion-limit">5. Python recursion limit</H3>
      <p className="text-sm text-zinc-400">
        Python&apos;s default recursion limit is 1000. Tree DFS and deep backtracking will hit{" "}
        <InlineCode>RecursionError</InlineCode>.
      </p>
      <Code>{`import sys
sys.setrecursionlimit(300_000)   # put at the top of solutions that recurse`}</Code>
      <p className="text-sm text-zinc-400 mt-3">
        Iterative rewrites are more reliable for trees with n &gt; 10⁵. We rewrite recursive solutions to iterative in modules 13 (Trees) and 17 (Graph Traversal).
      </p>
      <SelfTest>
        What happens if you call <InlineCode>fib(2000)</InlineCode> recursively without setting the limit?{" "}
        <span className="text-zinc-500">(<InlineCode>RecursionError: maximum recursion depth exceeded</InlineCode>.)</span>
      </SelfTest>

      <Divider />

      {/* 6 */}
      <H3 id="integers">6. Integer properties in Python</H3>
      <p className="text-sm text-zinc-400">
        Python integers have arbitrary precision — no overflow. <InlineCode>10**18 * 10**18</InlineCode> works fine.
        Significant advantage over C++.
      </p>
      <p className="text-sm text-zinc-500 mt-2">
        Caveat: arithmetic on huge numbers isn&apos;t O(1). For 10⁶ operations on numbers with hundreds of digits, it becomes noticeable.
      </p>
      <p className="text-sm text-zinc-400 mt-3">
        <span className="text-zinc-300 font-medium">Modular arithmetic:</span> Python&apos;s <InlineCode>%</InlineCode> operator returns a non-negative result for positive modulus — unlike C++.
      </p>
      <Code>{`(-3) % 5   # → 2 in Python (mathematical result)
           # → -3 in C++ (requires manual fix)

# Standard mod pattern (positive m):
(a + b) % MOD
(a * b) % MOD
MOD = 10**9 + 7`}</Code>
      <SelfTest>
        <InlineCode>(-7) % 3</InlineCode> in Python?{" "}
        <span className="text-zinc-500">(2. In Python, <InlineCode>a % b</InlineCode> has the sign of <InlineCode>b</InlineCode>.)</span>
      </SelfTest>

      <Divider />

      {/* 7 */}
      <H3 id="recursion">7. Recursion and base cases</H3>
      <p className="text-sm text-zinc-400">
        Write a recursive function, identify every base case, and argue why it terminates.
      </p>
      <SelfTest>
        <ol className="mt-1 space-y-1 list-decimal list-inside">
          <li>Recursive factorial: <InlineCode>def fact(n)</InlineCode>. Base case? Termination?</li>
          <li>Fibonacci with memoisation using <InlineCode>@functools.lru_cache</InlineCode>.</li>
          <li>Why is <InlineCode>fact(100000)</InlineCode> dangerous even after raising the recursion limit? <span className="text-zinc-500">(Stack memory.)</span></li>
        </ol>
      </SelfTest>
      <Code>{`import functools

@functools.lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)`}</Code>
      <p className="text-sm text-zinc-500 mt-3">
        Every recursive call must strictly reduce the problem toward a base case.
      </p>

      <Divider />

      {/* 8 */}
      <H3 id="cp-input">8. Reading competitive programming input</H3>
      <Code>{`import sys
input = sys.stdin.readline

# Pattern 1: n followed by n numbers
n = int(input())
a = list(map(int, input().split()))

# Pattern 2: t test cases
t = int(input())
for _ in range(t):
    # solve one case
    pass

# Pattern 3: n rows of m integers each
grid = [list(map(int, input().split())) for _ in range(n)]`}</Code>
      <SelfTest>
        Write input-reading for: &ldquo;First line: n and m. Then n lines each with m integers.&rdquo; Two minutes.
      </SelfTest>

      <Divider />

      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
          You&apos;re ready when...
        </div>
        <p className="text-sm text-zinc-400">
          Every self-test takes under 5 minutes without reference material. If three or more feel shaky, fix them here — every future module assumes these fluently.
        </p>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Link href="/roadmap" className="no-underline text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Roadmap
        </Link>
      </div>
    </div>
  );
}
