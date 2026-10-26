import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    select id, recipient_name, recipient_email, amount_cents,
           due_at, status, paypal_batch_id, created_at
    from payouts
    order by created_at desc
    limit 50`;
  return NextResponse.json({ payouts: rows });
}