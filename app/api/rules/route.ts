import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { RuleSchema } from "@/lib/schema";
import { calculatePayments, checkBudget } from "@/lib/calc";

export async function POST(req: Request) {
  const { sentence, rule, grossCents, netCents, emails } = await req.json();

  try {
    const parsed = RuleSchema.parse(rule);
    const payments = calculatePayments(parsed, grossCents, netCents);
        const problem = checkBudget(parsed, payments, grossCents, netCents);
    if (problem) throw new Error(problem);

    if (
      !Array.isArray(emails) ||
      emails.length !== payments.length ||
      emails.some((e: unknown) => typeof e !== "string" || !e.includes("@"))
    ) {
      throw new Error("Please enter a valid email for every recipient.");
    }

    const delayMs =
      parsed.delay_value * (parsed.delay_unit === "days" ? 86_400_000 : 60_000);
    const dueAt = new Date(Date.now() + delayMs);

    const [saved] = await sql`
      insert into rules (sentence, rule)
      values (${sentence}, ${sql.json(parsed)})
      returning id`;

    for (let i = 0; i < payments.length; i++) {
      await sql`
        insert into payouts
          (rule_id, recipient_name, recipient_email, amount_cents, due_at)
        values
          (${saved.id}, ${payments[i].name}, ${emails[i].trim()}, ${payments[i].cents}, ${dueAt})`;
    }

    await sql`
      insert into audit_log (event, detail)
      values ('rule_confirmed',
        ${sql.json({ rule_id: saved.id, count: payments.length })})`;

    return NextResponse.json({ ruleId: saved.id, payments });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Could not save", detail: message }, { status: 400 });
  }
}