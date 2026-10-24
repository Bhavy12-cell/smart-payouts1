"use client";

import { useState } from "react";

type Recipient = { name: string; type: string; value: number };
type Rule = {
  basis: string;
  delay_value: number;
  delay_unit: string;
  recipients: Recipient[];
};
type Payment = { name: string; cents: number };

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function Home() {
  const [sentence, setSentence] = useState(
    "Pay each editor 60% of net revenue after 30 days"
  );
  const [gross, setGross] = useState(100);
  const [net, setNet] = useState(96.02);
  const [rule, setRule] = useState<Rule | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const total = payments.reduce((s, p) => s + p.cents, 0);

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">Smart Payouts</h1>
      <p className="text-gray-600">
        Write your payout rule in plain English. Review it. Then confirm.
      </p>

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

      {error && <p className="text-red-600">{error}</p>}

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
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td>{usd(p.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-semibold">Total: {usd(total)}</p>

          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              className="rounded bg-green-600 px-5 py-2 text-white"
            >
              Confirm rule
            </button>
          ) : (
            <p className="text-green-700">
              Rule confirmed. (Saving comes in the next step.)
            </p>
          )}
        </section>
      )}
    </main>
  );
}