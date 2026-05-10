import "./globals.css";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "reps · leetcode srs",
  description: "Spaced recall for LeetCode patterns",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <nav className="flex items-center gap-1 mb-12 text-sm">
            <Link href="/" className="font-semibold text-zinc-100 no-underline mr-4 tracking-tight">
              reps
            </Link>
            <NavLink href="/">Today</NavLink>
            <NavLink href="/star">STAR</NavLink>
            <NavLink href="/leaks">Leaks</NavLink>
            <NavLink href="/process">Process</NavLink>
            <a
              href="/api/export"
              className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 no-underline"
            >
              export
            </a>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 no-underline transition-colors"
    >
      {children}
    </Link>
  );
}
