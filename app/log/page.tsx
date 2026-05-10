import { logNewProblem } from "../actions";
import { PATTERNS } from "@/lib/patterns";

export default function LogPage() {
  async function action(formData: FormData) {
    "use server";
    const lcNumber = formData.get("lcNumber") ? Number(formData.get("lcNumber")) : undefined;
    await logNewProblem({
      title: String(formData.get("title")),
      lcNumber,
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
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Log new problem</h1>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label>Title</label>
            <input name="title" required placeholder="Two Sum" />
          </div>
          <div>
            <label>LC #</label>
            <input name="lcNumber" type="number" />
          </div>
          <div>
            <label>URL</label>
            <input name="url" placeholder="https://leetcode.com/problems/..." />
          </div>
          <div>
            <label>Pattern</label>
            <select name="pattern" required defaultValue="">
              <option value="" disabled>Select…</option>
              {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label>LC Difficulty</label>
            <select name="lcDifficulty" required defaultValue="Medium">
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
          <div>
            <label>Time spent (min)</label>
            <input name="elapsedMinutes" type="number" step="0.5" required />
          </div>
          <div>
            <label>Hints used</label>
            <select name="hintsUsed" defaultValue="0">
              <option value="0">0 — none</option>
              <option value="1">1 — pattern</option>
              <option value="2">2 — sketch</option>
              <option value="3">3 — editorial</option>
            </select>
          </div>
          <div className="col-span-2">
            <label>Rating</label>
            <select name="rating" required defaultValue="3">
              <option value="1">1 — Saw solution (lapse)</option>
              <option value="2">2 — Struggled</option>
              <option value="3">3 — Good</option>
              <option value="4">4 — Easy</option>
            </select>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Trigger card (the actual flashcard — keep terse)</p>
          <div>
            <label>Recognition — what feature screams this pattern?</label>
            <textarea name="recognition" rows={2} />
          </div>
          <div>
            <label>Key insight — the one non-obvious idea</label>
            <textarea name="insight" rows={2} />
          </div>
          <div>
            <label>Failure mode — where you got stuck</label>
            <textarea name="failureMode" rows={2} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">Log it</button>
      </form>
    </main>
  );
}
