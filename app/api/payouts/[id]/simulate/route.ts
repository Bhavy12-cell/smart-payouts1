import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await sql`
    update payouts set due_at = now()
    where id = ${id} and status = 'scheduled'
    returning id`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Payout not found or already processed." }, { status: 400 });
  }

  await sql`
    insert into audit_log (event, detail)
    values ('due_date_simulated', ${sql.json({ payout_id: id })})`;

  return NextResponse.json({ ok: true });
}