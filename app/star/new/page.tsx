import { createStar } from "../actions";
import { SubmitButton } from "@/components/submit-button";

export default function NewStarPage() {
  async function action(formData: FormData) {
    "use server";
    await createStar({
      prompt: String(formData.get("prompt") || ""),
      tag: String(formData.get("tag") || "") || undefined,
      situation: String(formData.get("situation") || "") || undefined,
      task: String(formData.get("task") || "") || undefined,
      action: String(formData.get("action") || "") || undefined,
      result: String(formData.get("result") || "") || undefined,
    });
  }

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">New STAR story</h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Write the story once. Practice it on schedule until it comes out clean under pressure.
        </p>
      </header>

      <form action={action} className="space-y-5">
        <Field label="Prompt" hint="The interview question this story answers.">
          <input name="prompt" required autoFocus placeholder="Tell me about a time you led a team through conflict." />
        </Field>

        <Field label="Tag (optional)" hint="leadership / conflict / failure / ambiguity / scope / influence">
          <input name="tag" placeholder="leadership" />
        </Field>

        <Field label="Situation" hint="One sentence. The context — when, where, who.">
          <textarea name="situation" rows={2} />
        </Field>

        <Field label="Task" hint="One sentence. Your specific responsibility or the problem to solve.">
          <textarea name="task" rows={2} />
        </Field>

        <Field label="Action" hint="2–4 sentences. What YOU did, specifically. Use 'I', not 'we'.">
          <textarea name="action" rows={4} />
        </Field>

        <Field label="Result" hint="One sentence. Concrete outcome with a number if possible.">
          <textarea name="result" rows={2} />
        </Field>

        <SubmitButton>Save story</SubmitButton>
      </form>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
      <p className="text-[11px] text-zinc-600 mt-1.5">{hint}</p>
    </div>
  );
}
