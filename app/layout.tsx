import "./globals.css";
import Link from "next/link";

export const metadata = { title: "LeetCode SRS", description: "Spaced recall for LeetCode patterns" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-6 mb-8 text-sm">
            <Link href="/" className="font-bold no-underline">leet/srs</Link>
            <Link href="/" className="no-underline text-zinc-400 hover:text-zinc-100">Today</Link>
            <Link href="/log" className="no-underline text-zinc-400 hover:text-zinc-100">Log</Link>
            <Link href="/leaks" className="no-underline text-zinc-400 hover:text-zinc-100">Leaks</Link>
            <a href="/api/export" className="ml-auto no-underline text-zinc-500 hover:text-zinc-300 text-xs">export csv</a>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
