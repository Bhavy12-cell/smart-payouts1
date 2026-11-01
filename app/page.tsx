"use client";

import { useEffect, useState } from "react";
import Ledger from "@/components/Ledger";
import HelpChat from "@/components/HelpChat";

type Recipient = { name: string; type: string; value: number };
type Rule = {
  basis: string;
  delay_value: number;
  delay_unit: string;
  recipients: Recipient[];
};
type Payment = { name: string; cents: number };
type Payout = {
  id: string;
  recipient_name: string;
  recipient_email: string | null;
  amount_cents: number;
  due_at: string;
  status: string;
  paypal_batch_id: string | null;
};
type Flag = { code: string; message: string };
type Review = {
  id: string;
  name: string;
  email: string;
  amountCents: number;
  flags: Flag[];
  explanation: string;
};
type Toast = { kind: "success" | "error"; text: string } | null;

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const EXAMPLES = [
  "Pay each editor 60% of net revenue after 30 days",
  "Pay editor Rahul 60% and designer a flat $50, after 2 minutes",
  "Pay each editor 40% of gross revenue after 7 days",
];

const badge: Record<string, { cls: string; dot: string }> = {
  scheduled: { cls: "bg-amber-400/10 text-amber-300 ring-amber-400/30", dot: "bg-amber-400" },
  processing: { cls: "bg-sky-400/10 text-sky-300 ring-sky-400/30", dot: "bg-sky-400" },
  sent: { cls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30", dot: "bg-emerald-400" },
  failed: { cls: "bg-red-400/10 text-red-300 ring-red-400/30", dot: "bg-red-400" },
};

function StatusBadge({ status }: { status: string }) {
  const b = badge[status] ?? { cls: "bg-slate-400/10 text-slate-300 ring-slate-400/30", dot: "bg-slate-400" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${b.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
      {status}
    </span>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="btn-grad flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
        {n}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {hint && <p className="text-sm text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

const primaryBtn =
  "btn-grad rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50";
const ghostBtn =
  "rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50";
const inputCls =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20";

export default function Home() {
  const [sentence, setSentence] = useState(EXAMPLES[0]);
  const [gross, setGross] = useState(100);
  const [net, setNet] = useState(96.02);
  const [rule, setRule] = useState<Rule | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [busyId, setBusyId] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  function notify(kind: "success" | "error", text: string) {
    setToast({ kind, text });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadPayouts() {
    const res = await fetch("/api/payouts");
    const data = await res.json();
    setPayouts(data.payouts ?? []);
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function handlePreview() {
    setLoading(true);
    setRule(null);
    setPayments([]);
    setConfirmed(false);

    try {
      const res1 = await fetch("/api/parse-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Parse failed");

      const res2 = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule: data1.rule,
          grossCents: Math.round(gross * 100),
          netCents: Math.round(net * 100),
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || "Preview failed");

      setRule(data1.rule);
      setPayments(data2.payments);
      setEmails(data2.payments.map(() => ""));
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence,
          rule,
          emails,
          grossCents: Math.round(gross * 100),
          netCents: Math.round(net * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setConfirmed(true);
      notify("success", "Rule saved. Payouts are scheduled.");
      await loadPayouts();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function simulate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/payouts/${id}/simulate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      notify("success", "Due date simulated. This payout is ready for review.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId("");
      await loadPayouts();
    }
  }

  async function openReview(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/payouts/${id}/check`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setReview({
        id,
        name: data.payout.name,
        email: data.payout.email ?? "",
        amountCents: data.payout.amountCents,
        flags: data.flags,
        explanation: data.explanation,
      });
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Check failed");
    } finally {
      setBusyId("");
    }
  }

  async function approve() {
    if (!review) return;
    const r = review;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/payouts/${r.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setReview(null);
      notify(
        "success",
        `Payout sent to PayPal: ${usd(r.amountCents)} to ${r.name} (${r.email})`
      );
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId("");
      await loadPayouts();
    }
  }

  function openHelp() {
    window.dispatchEvent(new Event("open-help"));
  }

  const total = payments.reduce((s, p) => s + p.cents, 0);
  const pending = payouts.filter((p) => p.status !== "sent");
  const sentCount = payouts.filter((p) => p.status === "sent").length;
  const sentTotal = payouts
    .filter((p) => p.status === "sent")
    .reduce((s, p) => s + p.amount_cents, 0);

  const navLink =
    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="app-bg relative text-slate-100">
      {/* Floating coins */}
      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block">
        <div className="coin h-14 w-14 text-xl" style={{ top: "12%", right: "8%" }}>$</div>
        <div className="coin h-9 w-9 text-sm" style={{ top: "38%", right: "3%", animationDelay: "1.5s" }}>$</div>
        <div className="coin h-11 w-11 text-base" style={{ bottom: "14%", right: "12%", animationDelay: "3s" }}>$</div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-[60] max-w-sm">
          <div
            className={`toast-in glass flex items-start gap-3 p-4 ${
              toast.kind === "success" ? "!border-emerald-400/40" : "!border-red-400/40"
            }`}
          >
            <span className="text-lg">{toast.kind === "success" ? "✅" : "⚠️"}</span>
            <p className="flex-1 break-words text-sm text-white">{toast.text}</p>
            <button
              onClick={() => setToast(null)}
              className="text-sm text-slate-300 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-[#050b24]/70 p-5 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="btn-grad flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white">
            $
          </div>
          <span className="text-lg font-bold text-white">Smart Payouts</span>
        </div>

        <nav className="space-y-1">
          <a href="#dashboard" className={`${navLink} bg-white/10 text-white`}>
            <span>🏠</span> Dashboard
          </a>
          <a href="#ledger" className={navLink}>
            <span>📒</span> Ledger
          </a>
          <button onClick={openHelp} className={`${navLink} w-full text-left`}>
            <span>💬</span> Help
          </button>
        </nav>

        <div className="mt-auto rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          <p className="font-semibold">PayPal Sandbox</p>
          <p className="mt-0.5 opacity-80">Test money only. Nothing real moves.</p>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="btn-grad flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
              $
            </div>
            <span className="font-bold text-white">Smart Payouts</span>
          </div>
          <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200 ring-1 ring-amber-400/30">
            Sandbox
          </span>
        </div>

        <main className="relative mx-auto max-w-5xl space-y-6 px-5 py-8 md:px-8">
          {/* Hero */}
          <section id="dashboard" className="scroll-mt-6">
            <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-200 ring-1 ring-indigo-400/30">
              PayPal AI Hackathon
            </span>
            <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
              Smart <span className="gradient-text">Payouts</span>
            </h1>
            <p className="mt-2 text-slate-300">
              Pay your team by writing one sentence. AI reads it. Code does the math. You approve.
            </p>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Payouts sent", value: String(sentCount), icon: "↗" },
              { label: "Total sent", value: usd(sentTotal), icon: "$" },
              { label: "Waiting for you", value: String(pending.length), icon: "⏱" },
            ].map((s) => (
              <div key={s.label} className="glass flex items-center gap-4 p-5">
                <div className="btn-grad flex h-11 w-11 items-center justify-center rounded-xl text-lg text-white">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm text-slate-400">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step 1 */}
          <section className="glass p-6">
            <StepTitle
              n={1}
              title="Write your payout rule"
              hint="Plain English. The AI only reads your sentence. It never calculates or sends money."
            />

            <textarea
              className={inputCls}
              rows={3}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSentence(ex)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  ✨ {ex}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-300">
                Gross revenue ($)
                <input
                  type="number"
                  className={inputCls}
                  value={gross}
                  onChange={(e) => setGross(Number(e.target.value))}
                />
              </label>
              <label className="text-sm font-medium text-slate-300">
                Net revenue after PayPal fee ($)
                <input
                  type="number"
                  className={inputCls}
                  value={net}
                  onChange={(e) => setNet(Number(e.target.value))}
                />
              </label>
            </div>

            <button onClick={handlePreview} disabled={loading} className={`${primaryBtn} mt-5`}>
              {loading ? "Reading your rule..." : "Preview payouts →"}
            </button>
          </section>

          {/* Step 2 */}
          {rule && (
            <section className="glass p-6">
              <StepTitle
                n={2}
                title="Review the preview"
                hint={`Calculated on ${rule.basis} revenue. Payout after ${rule.delay_value} ${rule.delay_unit}.`}
              />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 font-medium">Recipient</th>
                      <th className="font-medium">Amount</th>
                      <th className="font-medium">PayPal email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 font-medium text-white">{p.name}</td>
                        <td className="text-white">{usd(p.cents)}</td>
                        <td className="min-w-[240px] py-2">
                          <input
                            type="email"
                            disabled={confirmed}
                            placeholder="sb-xxxx@personal.example.com"
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-indigo-400 disabled:opacity-60"
                            value={emails[i] ?? ""}
                            onChange={(e) =>
                              setEmails(emails.map((m, j) => (j === i ? e.target.value : m)))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="font-semibold text-white">Total: {usd(total)}</p>
                {!confirmed ? (
                  <button onClick={handleConfirm} className={primaryBtn}>
                    Confirm rule
                  </button>
                ) : (
                  <span className="text-sm font-medium text-emerald-300">
                    ✓ Rule confirmed and saved
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Review & approve */}
          {review && (
            <section
              className={`glass p-6 ${
                review.flags.length > 0
                  ? "!border-amber-400/60 !bg-amber-400/10"
                  : "!border-emerald-400/60 !bg-emerald-400/10"
              }`}
            >
              <h2 className="text-lg font-semibold text-white">
                {review.flags.length > 0 ? "⚠️ Review needed before sending" : "✅ Ready to send"}
              </h2>
              <p className="mt-1 text-slate-200">
                Send <b>{usd(review.amountCents)}</b> to <b>{review.name}</b> ({review.email})
              </p>

              {review.flags.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-200">
                  {review.flags.map((f) => (
                    <li key={f.code}>{f.message}</li>
                  ))}
                </ul>
              )}

              <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm text-slate-200">
                <b>🤖 AI safety note:</b> {review.explanation}
              </p>

              <div className="mt-4 flex gap-2">
                <button onClick={approve} disabled={busyId === review.id} className={primaryBtn}>
                  {busyId === review.id
                    ? "Sending..."
                    : review.flags.length > 0
                    ? "Approve anyway"
                    : "Approve & send"}
                </button>
                <button onClick={() => setReview(null)} className={ghostBtn}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {/* Upcoming */}
          <section className="glass p-6">
            <StepTitle
              n={3}
              title="Upcoming payouts"
              hint="Simulate the due date to skip the wait, then review and approve."
            />
            {pending.length === 0 ? (
              <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
                Nothing waiting. Create a rule above to schedule a payout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 font-medium">Recipient</th>
                      <th className="font-medium">Amount</th>
                      <th className="font-medium">Due</th>
                      <th className="font-medium">Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => {
                      const due = new Date(p.due_at);
                      const isDue = due.getTime() <= Date.now();
                      return (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="py-3">
                            <div className="font-medium text-white">{p.recipient_name}</div>
                            <div className="text-xs text-slate-400">
                              {p.recipient_email ?? "no email"}
                            </div>
                          </td>
                          <td className="text-white">{usd(p.amount_cents)}</td>
                          <td className="text-slate-300">{due.toLocaleString()}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="space-x-2 text-right">
                            {p.status === "scheduled" && !isDue && (
                              <button
                                disabled={busyId === p.id}
                                onClick={() => simulate(p.id)}
                                className={ghostBtn}
                              >
                                Simulate due date
                              </button>
                            )}
                            {p.status === "scheduled" && isDue && (
                              <button
                                disabled={busyId === p.id}
                                onClick={() => openReview(p.id)}
                                className={primaryBtn}
                              >
                                {busyId === p.id ? "Checking..." : "Review & approve"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Ledger */}
          <section id="ledger" className="glass scroll-mt-6 p-6">
            <StepTitle n={4} title="Ledger" hint="Full history. Sort and filter any column." />
            <Ledger payouts={payouts} />
          </section>

          <footer className="pb-8 text-center text-xs text-slate-500">
            Built for the PayPal AI Hackathon. AI reads your rule. Code does the math. You approve the money.
          </footer>
        </main>
      </div>

      <HelpChat />
    </div>
  );
}