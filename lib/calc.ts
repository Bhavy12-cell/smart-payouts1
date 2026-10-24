import type { Rule } from "./schema";

export type Payment = { name: string; email?: string; cents: number };

export function calculatePayments(
  rule: Rule,
  grossCents: number,
  netCents: number
): Payment[] {
  const base = rule.basis === "net" ? netCents : grossCents;

  return rule.recipients.map((r) => ({
    name: r.name,
    email: r.email,
    cents:
      r.type === "percent"
        ? Math.round((base * r.value) / 100)
        : Math.round(r.value * 100),
  }));
}