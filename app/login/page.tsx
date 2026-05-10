import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const passphrase = String(formData.get("passphrase") ?? "");
    if (passphrase !== process.env.APP_PASSPHRASE) redirect("/login?error=1");
    const c = await cookies();
    c.set("auth", passphrase, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    redirect("/");
  }

  return (
    <main className="min-h-[60vh] flex items-center">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">reps</h1>
          <p className="text-sm text-zinc-500 mt-1">Enter your passphrase to continue.</p>
        </div>
        <form action={login} className="space-y-3">
          <input name="passphrase" type="password" placeholder="passphrase" autoFocus />
          {sp.error && <p className="text-xs text-rose-400">Incorrect passphrase.</p>}
          <button className="btn-primary w-full py-2.5">Continue</button>
        </form>
      </div>
    </main>
  );
}
