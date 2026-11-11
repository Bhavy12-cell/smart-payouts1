"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HelpChat from "./HelpChat";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create rule" },
  { href: "/payouts", label: "Payouts" },
  { href: "/insights", label: "Insights" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="app-bg relative text-slate-100">
      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block">
        <div className="coin h-14 w-14 text-xl" style={{ top: "14%", right: "6%" }}>$</div>
        <div className="coin h-9 w-9 text-sm" style={{ top: "45%", left: "3%", animationDelay: "1.5s" }}>$</div>
        <div className="coin h-11 w-11 text-base" style={{ bottom: "12%", right: "10%", animationDelay: "3s" }}>$</div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b24]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="btn-grad flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white">$</div>
            <span className="text-lg font-bold text-white">Smart Payouts</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {LINKS.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-pill rounded-full px-4 py-2 ${
                    active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={() => window.dispatchEvent(new Event("open-help"))}
              className="nav-pill rounded-full px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Help
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200 ring-1 ring-amber-400/30 sm:inline">
              Sandbox
            </span>
            <Link href="/create" className="btn-grad rounded-full px-5 py-2 text-sm font-medium text-white">
              Try it →
            </Link>
          </div>
        </div>
      </header>

      <div className="relative">{children}</div>
      <HelpChat />
    </div>
  );
}