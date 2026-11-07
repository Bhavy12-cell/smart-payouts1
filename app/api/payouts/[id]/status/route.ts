import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getPayoutStatus } from "@/lib/paypal";
import { notifyPaid } from "@/lib/notify";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await sql`
    select paypal_batch_id, status from payouts where id = ${id}`;
  if (rows.length === 0 || !rows[0].paypal_batch_id) {
    return NextResponse.json({ error: "No PayPal batch for this payout." }, { status: 404 });
  }

  try {
    const result = await getPayoutStatus(rows[0].paypal_batch_id);

    if (result.status !== "pending" && rows[0].status === "sent") {
      await sql`update payouts set status = ${result.status} where id = ${id}`;
      await sql`
        insert into audit_log (event, detail)
        values (${"delivery_" + result.status},
          ${sql.json({ payout_id: id, paypal_item_status: result.item ?? null })})`;

      if (result.status === "paid") {
        const info = await sql`
          select recipient_name, recipient_email, amount_cents
          from payouts where id = ${id}`;
        await notifyPaid({
          name: info[0].recipient_name,
          email: info[0].recipient_email,
          amountCents: info[0].amount_cents,
        });
      }
    }

    return NextResponse.json({ status: result.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Could not check status", detail: message }, { status: 400 });
  }
}