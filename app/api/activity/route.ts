import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    select id, event, created_at
    from audit_log
    order by created_at desc
    limit 8`;
  return NextResponse.json({ events: rows });
}