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
export function checkBudget(
  rule: Rule,
  payments: Payment[],
  grossCents: number,
  netCents: number
): string | null {
  const base = rule.basis === "net" ? netCents : grossCents;
  const total = payments.reduce((s, p) => s + p.cents, 0);
  if (total > base) {
    const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
    return `Total payouts (${usd(total)}) are more than the ${rule.basis} revenue (${usd(base)}). Please fix the rule.`;
  }
  return null;
}