import { NextResponse } from "next/server";
import { RuleSchema } from "@/lib/schema";
import { calculatePayments } from "@/lib/calc";

export async function POST(req: Request) {
  const { rule, grossCents, netCents } = await req.json();

  try {
    const parsed = RuleSchema.parse(rule);
    const payments = calculatePayments(parsed, grossCents, netCents);
    return NextResponse.json({ payments });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Invalid rule", detail: message }, { status: 400 });
  }
}