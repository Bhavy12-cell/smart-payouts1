"use client";

export type ActivityItem = { id: string; event: string; created_at: string };

const LABELS: Record<string, { text: string; icon: string }> = {
  rule_confirmed: { text: "Rule confirmed and payouts scheduled", icon: "📝" },
  due_date_simulated: { text: "Due date simulated", icon: "⏩" },
  anomaly_override: { text: "Safety warning reviewed and approved", icon: "⚠️" },
  payout_sent: { text: "Payout sent to PayPal", icon: "💸" },
  payout_failed: { text: "Payout failed", icon: "❌" },
  delivery_paid: { text: "Money delivered to recipient", icon: "✅" },
  delivery_unclaimed: { text: "Payout unclaimed", icon: "📭" },
  delivery_failed: { text: "Delivery failed", icon: "❌" },
};

export default function Activity({ events }: { events: ActivityItem[] }) {
  return (
    <section className="glass p-6">
      <h2 className="text-lg font-semibold text-white">Recent activity</h2>
      <p className="mb-4 text-sm text-slate-400">Audit trail of every action.</p>

      {events.length === 0 ? (
        <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
          No activity yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const l = LABELS[e.event] ?? { text: e.event, icon: "•" };
            return (
              <li key={e.id} className="flex items-start gap-3 text-sm">
                <span>{l.icon}</span>
                <div>
                  <p className="text-slate-100">{l.text}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}