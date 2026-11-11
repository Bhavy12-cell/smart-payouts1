"use client";

import { useEffect, useState } from "react";
import PayoutChart from "@/components/PayoutChart";
import Activity, { type ActivityItem } from "@/components/Activity";
import { type Payout, usd } from "@/components/ui";

export default function InsightsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payouts", { cache: "no-store" });
        const data = await res.json();
        setPayouts(data.payouts ?? []);
      } catch (e) {
        console.error(e);
      }
      try {
        const res2 = await fetch("/api/activity", { cache: "no-store" });
        const data2 = await res2.json();
        setActivity(data2.events ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const done = ["sent", "paid"];
  const pending = payouts.filter((p) => !done.includes(p.status));
  const sent = payouts.filter((p) => done.includes(p.status));
  const sentTotal = sent.reduce((s, p) => s + p.amount_cents, 0);

  const stats = [
    { label: "Payouts sent", value: String(sent.length), icon: "↗" },
    { label: "Total sent", value: usd(sentTotal), icon: "$" },
    { label: "Waiting for you", value: String(pending.length), icon: "⏱" },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
      <div>
        <h1 className="text-4xl font-bold text-white">
          <span className="gradient-text">Insights</span>
        </h1>
        <p className="mt-2 text-slate-300">Totals, trends and a complete audit trail.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass flex items-center gap-4 p-5">
            <div className="btn-grad flex h-11 w-11 items-center justify-center rounded-xl text-lg text-white">{s.icon}</div>
            <div>
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PayoutChart payouts={payouts} />
        <Activity events={activity} />
      </div>
    </main>
  );
}