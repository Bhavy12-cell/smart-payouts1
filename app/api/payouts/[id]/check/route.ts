import { NextResponse } from "next/server";
import { runChecks } from "@/lib/checks";
import { explainFlags } from "@/lib/explain";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await runChecks(id);

  if (!result) {
    return NextResponse.json({ error: "Payout not found." }, { status: 404 });
  }

  const { payout, flags } = result;
  const explanation = await explainFlags(flags, {
    name: payout.recipient_name,
    email: payout.recipient_email ?? "",
    amountCents: payout.amount_cents,
  });

  return NextResponse.json({
    payout: {
      name: payout.recipient_name,
      email: payout.recipient_email,
      amountCents: payout.amount_cents,
    },
    flags,
    explanation,
  });
}