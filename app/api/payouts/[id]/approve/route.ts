import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPayout } from "@/lib/paypal";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Claim the payout first, so a double-click cannot pay twice.
  const claimed = await sql`
    update payouts set status = 'processing'
    where id = ${id}
      and status = 'scheduled'
      and due_at <= now()
      and recipient_email is not null
    returning id, recipient_email, amount_cents`;

  if (claimed.length === 0) {
    return NextResponse.json(
      { error: "Not due yet, no email saved, or already processed." },
      { status: 400 }
    );
  }

  const p = claimed[0];

  try {
    const result = await sendPayout({
      id: p.id,
      email: p.recipient_email,
      cents: p.amount_cents,
    });

    await sql`
      update payouts set status = 'sent', paypal_batch_id = ${result.batchId}
      where id = ${id}`;
    await sql`
      insert into audit_log (event, detail)
      values ('payout_sent', ${sql.json({ payout_id: id, batch_id: result.batchId })})`;

    return NextResponse.json({ ok: true, batchId: result.batchId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await sql`update payouts set status = 'failed' where id = ${id}`;
    await sql`
      insert into audit_log (event, detail)
      values ('payout_failed', ${sql.json({ payout_id: id, error: message })})`;
    return NextResponse.json({ error: "PayPal payout failed", detail: message }, { status: 400 });
  }
}