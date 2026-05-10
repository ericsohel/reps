import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
    <main className="space-y-4 max-w-sm">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form action={login} className="space-y-3">
        <input name="passphrase" type="password" placeholder="passphrase" autoFocus />
        <button className="btn-primary w-full">Enter</button>
      </form>
    </main>
  );
}
