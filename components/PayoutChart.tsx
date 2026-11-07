"use client";

import { useState } from "react";

type Payout = {
  recipient_name: string;
  recipient_email: string | null;
  amount_cents: number;
  status: string;
  due_at: string;
  created_at?: string;
};

const W = 600;
const H = 220;
const PAD = { l: 48, r: 16, t: 16, b: 28 };

export default function PayoutChart({ payouts }: { payouts: Payout[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const done = payouts
    .filter((p) => ["sent", "paid"].includes(p.status))
    .map((p) => ({
      t: new Date(p.created_at ?? p.due_at).getTime(),
      cents: p.amount_cents,
      who: p.recipient_email ?? p.recipient_name,
    }))
    .sort((a, b) => a.t - b.t);

  let running = 0;
  const points = done.map((d) => {
    running += d.cents;
    return { ...d, total: running };
  });

  const totalNow = running;
  const lastAmt = points.length ? points[points.length - 1].cents : 0;

  if (points.length === 0) {
    return (
      <section className="glass p-6">
        <h2 className="text-lg font-semibold text-white">Total paid out</h2>
        <p className="mb-4 text-sm text-slate-400">Cumulative amount sent over time.</p>
        <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
          No payouts sent yet.
        </p>
      </section>
    );
  }

  const maxY = Math.max(...points.map((p) => p.total)) * 1.1;
  const minX = points[0].t;
  const maxX = points[points.length - 1].t;
  const spanX = Math.max(1, maxX - minX);

  const x = (t: number) =>
    points.length === 1
      ? (PAD.l + (W - PAD.r)) / 2
      : PAD.l + ((t - minX) / spanX) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / maxY) * (H - PAD.t - PAD.b);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${y(p.total)}`).join(" ");
  const area = `${line} L${x(points[points.length - 1].t)},${H - PAD.b} L${x(points[0].t)},${H - PAD.b} Z`;

  const ticks = [0, 0.5, 1].map((f) => f * maxY);
  const h = hover !== null ? points[hover] : null;

  return (
    <section className="glass p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Total paid out</h2>
          <p className="text-sm text-slate-400">Cumulative amount sent over time.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">${(totalNow / 100).toFixed(2)}</p>
          <p className="text-xs text-emerald-300">▲ +${(lastAmt / 100).toFixed(2)} latest</p>
        </div>
      </div>

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(v)}
                y2={y(v)}
                stroke="rgba(255,255,255,0.08)"
              />
              <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                ${(v / 100).toFixed(0)}
              </text>
            </g>
          ))}

          {points.length > 1 && <path d={area} fill="url(#areaFill)" />}
          {points.length > 1 && (
            <path d={line} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
          )}

          {h && (
            <line
              x1={x(h.t)}
              x2={x(h.t)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 4"
            />
          )}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(p.t)}
              cy={y(p.total)}
              r={hover === i ? 6 : 4}
              fill="#34d399"
              stroke="#0c1744"
              strokeWidth="2"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>

        {h && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-white/15 bg-[#0c1744]/95 px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${Math.min(75, (x(h.t) / W) * 100)}%`,
            }}
          >
            <p className="font-semibold text-white">${(h.total / 100).toFixed(2)} total</p>
            <p className="text-emerald-300">+${(h.cents / 100).toFixed(2)}</p>
            <p className="max-w-[160px] truncate text-slate-400">{h.who}</p>
            <p className="text-slate-500">{new Date(h.t).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </section>
  );
}