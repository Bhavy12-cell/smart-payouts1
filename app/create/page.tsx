"use client";

import Link from "next/link";
import { useState } from "react";
import { StepTitle, ToastView, useToast, usd, primaryBtn, inputCls } from "@/components/ui";

type Recipient = { name: string; type: string; value: number };
type Rule = { basis: string; delay_value: number; delay_unit: string; recipients: Recipient[] };
type Payment = { name: string; cents: number };

const EXAMPLES = [
  "Pay each editor 60% of net revenue after 30 days",
  "Pay editor Rahul 60% and designer a flat $30, after 2 minutes",
  "Pay each editor 40% of gross revenue after 7 days",
];

export default function CreatePage() {
  const { toast, notify, clear } = useToast();
  const [sentence, setSentence] = useState(EXAMPLES[0]);
  const [gross, setGross] = useState(100);
  const [net, setNet] = useState(96.02);
  const [rule, setRule] = useState<Rule | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Save failed");
    }
  }

  const total = payments.reduce((s, p) => s + p.cents, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      <ToastView toast={toast} onClose={clear} />

      <div>
        <h1 className="text-4xl font-bold text-white">
          Create a <span className="gradient-text">payout rule</span>
        </h1>
        <p className="mt-2 text-slate-300">Write it in plain English, review the preview, then confirm.</p>
      </div>

      <section className="glass p-6">
        <StepTitle
          n={1}
          title="Write your payout rule"
          hint="The AI only reads your sentence. It never calculates or sends money."
        />
        <textarea className={inputCls} rows={3} value={sentence} onChange={(e) => setSentence(e.target.value)} />

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
            <input type="number" className={inputCls} value={gross} onChange={(e) => setGross(Number(e.target.value))} />
          </label>
          <label className="text-sm font-medium text-slate-300">
            Net revenue after PayPal fee ($)
            <input type="number" className={inputCls} value={net} onChange={(e) => setNet(Number(e.target.value))} />
          </label>
        </div>

        <button onClick={handlePreview} disabled={loading} className={`${primaryBtn} mt-5`}>
          {loading ? "Reading your rule..." : "Preview payouts →"}
        </button>
      </section>

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
                        onChange={(e) => setEmails(emails.map((m, j) => (j === i ? e.target.value : m)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-white">Total: {usd(total)}</p>
            {!confirmed ? (
              <button onClick={handleConfirm} className={primaryBtn}>
                Confirm rule
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-emerald-300">✓ Rule confirmed and saved</span>
                <Link href="/payouts" className={primaryBtn}>
                  Go to Payouts →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}