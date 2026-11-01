import type { Flag } from "./anomaly";

export async function explainFlags(
  flags: Flag[],
  p: { name: string; email: string; amountCents: number }
): Promise<string> {
  if (flags.length === 0) {
    return "No unusual activity found. This payout looks normal.";
  }

  const fallback = flags.map((f) => f.message).join(" ");

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
        messages: [
          {
            role: "system",
            content:
              "You are a payments safety assistant. In one or two short, plain-English sentences, tell the business owner why this payout was flagged and what to double-check before approving. Use only the facts given. Do not invent anything.",
          },
          {
            role: "user",
            content: JSON.stringify({
              recipient: p.name,
              email: p.email,
              amount_usd: (p.amountCents / 100).toFixed(2),
              flags: flags.map((f) => f.message),
            }),
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return fallback;
    return data.choices?.[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}