import { NextResponse } from "next/server";
import { RuleSchema } from "@/lib/schema";

const SYSTEM = `You convert payout rules written in English into JSON.
Return ONLY valid JSON, no explanation, no markdown.
Format:
{
  "basis": "gross" | "net",
  "delay_value": number,
  "delay_unit": "minutes" | "days",
  "recipients": [
    { "name": string, "email": string (optional), "type": "percent" | "flat", "value": number }
  ]
}
If the sentence does not say gross or net, use "gross".
If there is no delay, use delay_value 0 and delay_unit "days".
If the sentence says "each editor" and gives no count, return one recipient named "Editor".`;

export async function POST(req: Request) {
  const { sentence } = await req.json();

  if (!sentence || typeof sentence !== "string") {
    return NextResponse.json({ error: "Please write a rule." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: sentence },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const text = data.choices?.[0]?.message?.content ?? "";
    const rule = RuleSchema.parse(JSON.parse(text));
    return NextResponse.json({ rule });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Could not understand the rule.", detail: message },
      { status: 400 }
    );
  }
}