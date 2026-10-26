"use client";

import { useEffect, useState } from "react";

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

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const badge: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Home() {
  const [sentence, setSentence] = useState(
    "Pay each editor 60% of net revenue after 30 days"
  );
  const [gross, setGross] = useState(100);
  const [net, setNet] = useState(96.02);
  const [rule, setRule] = useState<Rule | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [busyId, setBusyId] = useState("");

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
    setError("");
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
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError("");
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
      await loadPayouts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function act(id: string, action: "simulate" | "approve") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/payouts/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId("");
      await loadPayouts();
    }
  }

  const total = payments.reduce((s, p) => s + p.cents, 0);

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Smart Payouts</h1>
        <p className="text-gray-600">
          Write your payout rule in plain English. Review it. Then confirm.
        </p>
      </div>

      <textarea
        className="w-full rounded border p-3"
        rows={3}
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
      />

      <div className="flex gap-4">
        <label className="flex-1 text-sm">
          Gross revenue ($)
          <input
            type="number"
            className="mt-1 w-full rounded border p-2"
            value={gross}
            onChange={(e) => setGross(Number(e.target.value))}
          />
        </label>
        <label className="flex-1 text-sm">
          Net revenue after PayPal fee ($)
          <input
            type="number"
            className="mt-1 w-full rounded border p-2"
            value={net}
            onChange={(e) => setNet(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        onClick={handlePreview}
        disabled={loading}
        className="rounded bg-black px-5 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Reading your rule..." : "Preview payouts"}
      </button>

      {error && <p className="text-red-600 break-words">{error}</p>}

      {rule && (
        <section className="space-y-3 rounded border p-4">
          <h2 className="text-xl font-semibold">Preview</h2>
          <p className="text-sm text-gray-600">
            Calculated on <b>{rule.basis}</b> revenue. Payout after{" "}
            <b>
              {rule.delay_value} {rule.delay_unit}
            </b>
            .
          </p>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Recipient</th>
                <th>Amount</th>
                <th>PayPal email</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td>{usd(p.cents)}</td>
                  <td>
                    <input
                      type="email"
                      disabled={confirmed}
                      placeholder="sb-xxxx@personal.example.com"
                      className="my-1 w-full rounded border p-1 text-sm"
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
          <p className="font-semibold">Total: {usd(total)}</p>

          {!confirmed ? (
            <button
              onClick={handleConfirm}
              className="rounded bg-green-600 px-5 py-2 text-white"
            >
              Confirm rule
            </button>
          ) : (
            <p className="text-green-700">
              Rule confirmed and saved. Payouts are scheduled below.
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Payouts</h2>
        {payouts.length === 0 ? (
          <p className="text-gray-500">No payouts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Recipient</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const due = new Date(p.due_at);
                const isDue = due.getTime() <= Date.now();
                return (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">
                      {p.recipient_name}
                      <div className="text-xs text-gray-500">
                        {p.recipient_email ?? "no email"}
                      </div>
                    </td>
                    <td>{usd(p.amount_cents)}</td>
                    <td>{due.toLocaleString()}</td>
                    <td>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          badge[p.status] ?? "bg-gray-100"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="space-x-2 text-right">
                      {p.status === "scheduled" && !isDue && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "simulate")}
                          className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                          Simulate due date
                        </button>
                      )}
                      {p.status === "scheduled" && isDue && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "approve")}
                          className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                        >
                          {busyId === p.id ? "Sending..." : "Approve & send"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}