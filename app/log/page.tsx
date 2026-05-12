import { logNewProblem } from "../actions";
import { PATTERNS } from "@/lib/patterns";
import { SubmitButton } from "@/components/submit-button";

export default function LogPage() {
  async function action(formData: FormData) {
    "use server";
    await logNewProblem({
      title: String(formData.get("title")),
      url: String(formData.get("url") || "") || undefined,
      pattern: String(formData.get("pattern")),
      lcDifficulty: formData.get("lcDifficulty") as "Easy" | "Medium" | "Hard",
      elapsedMinutes: Number(formData.get("elapsedMinutes")),
      hintsUsed: Number(formData.get("hintsUsed")),
      rating: Number(formData.get("rating")) as 1 | 2 | 3 | 4,
      recognition: String(formData.get("recognition") || "") || undefined,
      insight: String(formData.get("insight") || "") || undefined,
      failureMode: String(formData.get("failureMode") || "") || undefined,
    });
  }

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">New problem</h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Log after you finish — including contest problems and editorial read-throughs.
        </p>
      </header>

      <form action={action} className="space-y-8">
        <Section>
          <Field label="Title" hint="The problem name. Contest problems work too.">
            <input name="title" required placeholder="e.g. Longest Substring Without Repeating Characters" autoFocus />
          </Field>

          <Field label="LeetCode URL" hint="Optional — lets you open it directly from the review page.">
            <input name="url" type="url" placeholder="https://leetcode.com/problems/..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pattern" hint="Pick the dominant pattern.">
              <select name="pattern" required defaultValue="">
                <option value="" disabled>Select…</option>
                {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Difficulty" hint="LC's rating, not your feeling.">
              <select name="lcDifficulty" required defaultValue="Medium">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </Field>
          </div>

          <Field label="Time spent (min)" hint="Total time including reading.">
            <input name="elapsedMinutes" type="number" step="0.5" min="0" required placeholder="25" />
          </Field>

          <Field
            label="Rating"
            hint="Pick the option that matches how the attempt actually went."
          >
            <select name="rating" required defaultValue="3">
              <option value="1">Lapse — read the editorial</option>
              <option value="2">Hints — used hints / struggled significantly</option>
              <option value="3">Good — solved cleanly without hints</option>
              <option value="4">Easy — fast and confident</option>
            </select>
          </Field>
        </Section>

        <div className="divider" />

        <Section
          title="Trigger card"
          subtitle="Fill this after you re-derive the solution with the editorial closed. One sentence each."
        >
          <Field
            label="Recognition"
            hint="What in the problem statement signals this pattern? e.g. 'find subarray with constraint → sliding window'"
          >
            <textarea name="recognition" rows={2} placeholder="e.g. Next greater element → monotonic stack" />
          </Field>
          <Field
            label="Key insight"
            hint="The one non-obvious idea that makes the solution work."
          >
            <textarea name="insight" rows={2} placeholder="e.g. Expand right, contract left when the invariant breaks" />
          </Field>
          <Field
            label="Failure mode"
            hint="What tripped you up, or what you'd likely forget under pressure."
          >
            <textarea name="failureMode" rows={2} placeholder="e.g. Forgot to reset the window when left > right" />
          </Field>
        </Section>

        <SubmitButton>Save attempt</SubmitButton>
      </form>
    </main>
  );
}

function Section({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      {title && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600 mt-1.5">{hint}</p>}
    </div>
  );
}
