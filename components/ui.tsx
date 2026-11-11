"use client";

import { useEffect, useState } from "react";

export type Payout = {
  id: string;
  recipient_name: string;
  recipient_email: string | null;
  amount_cents: number;
  due_at: string;
  status: string;
  paypal_batch_id: string | null;
  created_at?: string;
};

export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const primaryBtn =
  "btn-grad rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50";
export const ghostBtn =
  "rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50";
export const inputCls =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20";

const badge: Record<string, { cls: string; dot: string }> = {
  scheduled: { cls: "bg-amber-400/10 text-amber-300 ring-amber-400/30", dot: "bg-amber-400" },
  processing: { cls: "bg-sky-400/10 text-sky-300 ring-sky-400/30", dot: "bg-sky-400" },
  sent: { cls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30", dot: "bg-emerald-400" },
  failed: { cls: "bg-red-400/10 text-red-300 ring-red-400/30", dot: "bg-red-400" },
  paid: { cls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30", dot: "bg-emerald-400" },
  unclaimed: { cls: "bg-orange-400/10 text-orange-300 ring-orange-400/30", dot: "bg-orange-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const b = badge[status] ?? { cls: "bg-slate-400/10 text-slate-300 ring-slate-400/30", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${b.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
      {status}
    </span>
  );
}

export function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
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

export type ToastState = { kind: "success" | "error"; text: string } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = (kind: "success" | "error", text: string) => setToast({ kind, text });
  return { toast, notify, clear: () => setToast(null) };
}

export function ToastView({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-20 z-[60] max-w-sm">
      <div
        className={`toast-in glass flex items-start gap-3 p-4 ${
          toast.kind === "success" ? "!border-emerald-400/40" : "!border-red-400/40"
        }`}
      >
        <span className="text-lg">{toast.kind === "success" ? "✅" : "⚠️"}</span>
        <p className="flex-1 break-words text-sm text-white">{toast.text}</p>
        <button onClick={onClose} className="text-sm text-slate-300 hover:text-white" aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}