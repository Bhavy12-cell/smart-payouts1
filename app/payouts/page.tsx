"use client";

import { useEffect, useState } from "react";
import Ledger from "@/components/Ledger";
import {
  type Payout,
  StatusBadge,
  StepTitle,
  ToastView,
  useToast,
  usd,
  primaryBtn,
  ghostBtn,
} from "@/components/ui";

type Flag = { code: string; message: string };
type Review = {
  id: string;
  name: string;
  email: string;
  amountCents: number;
  flags: Flag[];
  explanation: string;
};
type SuccessInfo = {
  id: string;
  name: string;
  email: string;
  amountCents: number;
  state: "checking" | "paid" | "unclaimed" | "failed" | "pending";
};

export default function PayoutsPage() {
  const { toast, notify, clear } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [busyId, setBusyId] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  async function loadPayouts() {
    try {
      const res = await fetch("/api/payouts", { cache: "no-store" });
      const data = await res.json();
      setPayouts(data.payouts ?? []);
    } catch (e) {
      console.error("payouts load failed", e);
    }
  }

  useEffect(() => {
    loadPayouts();
  }, []);

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

  async function checkDelivery(id: string) {
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const res = await fetch(`/api/payouts/${id}/status`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.status !== "pending") {
          setSuccess((s) => (s && s.id === id ? { ...s, state: data.status } : s));
          await loadPayouts();
          return;
        }
      } catch {}
    }
    setSuccess((s) => (s && s.id === id ? { ...s, state: "pending" } : s));
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
      setSuccess({ id: r.id, name: r.name, email: r.email, amountCents: r.amountCents, state: "checking" });
      await loadPayouts();
      checkDelivery(r.id);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId("");
    }
  }

  const done = ["sent", "paid"];
  const pending = payouts.filter((p) => !done.includes(p.status));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
      <ToastView toast={toast} onClose={clear} />

      {success && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass pop w-full max-w-sm p-8 text-center">
            {success.state === "checking" && (
              <>
                <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400" />
                <h2 className="text-xl font-bold text-white">Sending payment...</h2>
                <p className="mt-2 text-sm text-slate-300">Checking with PayPal</p>
              </>
            )}
            {success.state === "paid" && (
              <>
                <div className="pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">✓</div>
                <h2 className="text-xl font-bold text-white">Money delivered!</h2>
                <p className="mt-2 text-2xl font-bold text-emerald-300">{usd(success.amountCents)}</p>
                <p className="mt-1 text-sm text-slate-300">
                  reached {success.name}
                  <br />
                  <span className="text-slate-400">{success.email}</span>
                </p>
              </>
            )}
            {success.state === "pending" && (
              <>
                <div className="pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-3xl text-white">➤</div>
                <h2 className="text-xl font-bold text-white">Payment sent</h2>
                <p className="mt-2 text-sm text-slate-300">
                  PayPal accepted {usd(success.amountCents)} for {success.name}. Final confirmation is still processing.
                </p>
              </>
            )}
            {success.state === "unclaimed" && (
              <>
                <div className="pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-3xl text-white">!</div>
                <h2 className="text-xl font-bold text-white">Unclaimed</h2>
                <p className="mt-2 text-sm text-slate-300">{success.email} has no confirmed PayPal account yet.</p>
              </>
            )}
            {success.state === "failed" && (
              <>
                <div className="pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-white">✕</div>
                <h2 className="text-xl font-bold text-white">Payment failed</h2>
                <p className="mt-2 text-sm text-slate-300">PayPal could not deliver this payout.</p>
              </>
            )}
            {success.state !== "checking" && (
              <button onClick={() => setSuccess(null)} className={`${primaryBtn} mt-6`}>
                Done
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-bold text-white">
          <span className="gradient-text">Payouts</span>
        </h1>
        <p className="mt-2 text-slate-300">Simulate the due date, review safety checks, approve, and track history.</p>
      </div>

      {review && (
        <section
          className={`glass p-6 ${
            review.flags.length > 0 ? "!border-amber-400/60 !bg-amber-400/10" : "!border-emerald-400/60 !bg-emerald-400/10"
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
              {busyId === review.id ? "Sending..." : review.flags.length > 0 ? "Approve anyway" : "Approve & send"}
            </button>
            <button onClick={() => setReview(null)} className={ghostBtn}>
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="glass p-6">
        <StepTitle n={1} title="Upcoming payouts" hint="Simulate the due date to skip the wait, then review and approve." />
        {pending.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
            Nothing waiting. Create a rule to schedule a payout.
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
                        <div className="text-xs text-slate-400">{p.recipient_email ?? "no email"}</div>
                      </td>
                      <td className="text-white">{usd(p.amount_cents)}</td>
                      <td className="text-slate-300">{due.toLocaleString()}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="space-x-2 text-right">
                        {p.status === "scheduled" && !isDue && (
                          <button disabled={busyId === p.id} onClick={() => simulate(p.id)} className={ghostBtn}>
                            Simulate due date
                          </button>
                        )}
                        {p.status === "scheduled" && isDue && (
                          <button disabled={busyId === p.id} onClick={() => openReview(p.id)} className={primaryBtn}>
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

      <section className="glass p-6">
        <StepTitle n={2} title="Ledger" hint="Full history. Sort, filter and export any column." />
        <Ledger payouts={payouts} />
      </section>
    </main>
  );
}