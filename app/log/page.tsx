import { logNewProblem } from "../actions";
import { PATTERNS } from "@/lib/patterns";

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
        <p className="text-sm text-zinc-500 mt-1.5">Log the attempt and capture a trigger card.</p>
      </header>

      <form action={action} className="space-y-8">
        <Section>
          <Field label="Title" full>
            <input name="title" required placeholder="e.g. Longest Substring Without Repeating Characters" autoFocus />
          </Field>

          <Field label="LeetCode URL (optional)" full>
            <input name="url" type="url" placeholder="https://leetcode.com/problems/..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pattern">
              <select name="pattern" required defaultValue="">
                <option value="" disabled>Select…</option>
                {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select name="lcDifficulty" required defaultValue="Medium">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Time spent (min)">
              <input name="elapsedMinutes" type="number" step="0.5" min="0" required placeholder="25" />
            </Field>
            <Field label="Hints used">
              <select name="hintsUsed" defaultValue="0">
                <option value="0">None</option>
                <option value="1">Pattern hint</option>
                <option value="2">Algorithm sketch</option>
                <option value="3">Read editorial</option>
              </select>
            </Field>
          </div>

          <Field label="How did it go?" full>
            <select name="rating" required defaultValue="3">
              <option value="1">Saw the solution (lapse)</option>
              <option value="2">Struggled but solved</option>
              <option value="3">Good — solved cleanly</option>
              <option value="4">Easy — fast and confident</option>
            </select>
          </Field>
        </Section>

        <Section title="Trigger card" subtitle="The actual flashcard. Keep each line terse — one sentence.">
          <Field label="Recognition" full>
            <textarea name="recognition" rows={2} placeholder="What feature of the problem signals this pattern?" />
          </Field>
          <Field label="Key insight" full>
            <textarea name="insight" rows={2} placeholder="The one non-obvious idea." />
          </Field>
          <Field label="Failure mode" full>
            <textarea name="failureMode" rows={2} placeholder="Where you got stuck or what you'd forget." />
          </Field>
        </Section>

        <button type="submit" className="btn-primary w-full py-3">Save attempt</button>
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

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "" : ""}>
      <label>{label}</label>
      {children}
    </div>
  );
}
