import { sql } from "./db";
import { detectAnomalies } from "./anomaly";

export async function runChecks(id: string) {
  const rows = await sql`
    select id, recipient_name, recipient_email, amount_cents, status
    from payouts where id = ${id}`;
  if (rows.length === 0) return null;

  const p = rows[0];
  const email = (p.recipient_email ?? "").toLowerCase();

  const toRecipient = await sql`
    select amount_cents from payouts
    where id <> ${id} and status = 'sent' and lower(recipient_email) = ${email}`;

  const allSent = await sql`
    select amount_cents from payouts
    where id <> ${id} and status = 'sent'`;

  const dups = await sql`
    select id from payouts
    where id <> ${id}
      and lower(recipient_email) = ${email}
      and amount_cents = ${p.amount_cents}
      and status in ('sent', 'processing')
      and created_at > now() - interval '24 hours'`;

  const flags = detectAnomalies({
    amountCents: p.amount_cents,
    previousToRecipient: toRecipient.map((r) => r.amount_cents),
    allPreviousSent: allSent.map((r) => r.amount_cents),
    recentDuplicates: dups.length,
  });

  return { payout: p, flags };
}