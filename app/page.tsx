import Link from "next/link";

const FEATURES = [
  { icon: "✍️", title: "Write one sentence", text: "Describe who gets paid, how much and when, in plain English.", href: "/create", cta: "Create a rule" },
  { icon: "🛡️", title: "Safety checks", text: "New recipient, big amount or duplicate? You see a warning first.", href: "/payouts", cta: "See payouts" },
  { icon: "📒", title: "Full ledger", text: "Sort, filter and export every payout to CSV.", href: "/payouts", cta: "Open ledger" },
  { icon: "📈", title: "Live insights", text: "Total paid chart and a complete audit trail.", href: "/insights", cta: "View insights" },
];

const STEPS = [
  { n: 1, t: "Write the rule", d: "AI reads your sentence. It never touches money." },
  { n: 2, t: "Preview", d: "Code calculates exact amounts (gross or net)." },
  { n: 3, t: "Approve", d: "Safety checks run. You press approve." },
  { n: 4, t: "Delivered", d: "PayPal sends it and we confirm delivery." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-5 py-12">
      {/* Hero */}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-200 ring-1 ring-indigo-400/30">
            PayPal AI Hackathon
          </span>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-white md:text-6xl">
            Pay your team with <span className="gradient-text">one sentence</span>
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            AI reads your rule. Code does the math. You approve. PayPal sends the money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="btn-grad rounded-xl px-6 py-3 font-medium text-white">
              Try it now →
            </Link>
            <Link href="/insights" className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10">
              Explore dashboard
            </Link>
          </div>
        </div>

        {/* 3D scene */}
        <div className="scene relative flex justify-center py-8">
          <div className="tilt-card glass w-full max-w-sm space-y-4 p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Your rule</p>
            <p className="rounded-xl bg-white/5 p-3 text-sm text-white">
              Pay each editor 60% of net revenue after 30 days
            </p>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm">
              <span className="text-slate-300">Editor</span>
              <span className="font-bold text-white">$57.61</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-300 ring-1 ring-emerald-400/30">
              ✓ Money delivered
            </div>
          </div>
          <div className="coin3d absolute -right-2 top-2">$</div>
          <div className="coin3d absolute -left-2 bottom-2 !h-14 !w-14 !text-xl" style={{ animationDelay: "-2s" }}>$</div>
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-white">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="glass block p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
              <p className="mt-3 text-sm font-medium text-indigo-300">{f.cta} →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-white">How it works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass p-5">
              <span className="btn-grad flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold text-white">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="pb-6 text-center text-xs text-slate-500">
        Built for the PayPal AI Hackathon. Sandbox only: test money, nothing real moves.
      </footer>
    </main>
  );
}