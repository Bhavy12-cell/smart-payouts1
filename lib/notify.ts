export async function notifyPaid(p: {
  name: string;
  email: string;
  amountCents: number;
}) {
  const url = process.env.ZAPIER_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: p.name,
        email: p.email,
        amount: (p.amountCents / 100).toFixed(2),
        message: `Payout of $${(p.amountCents / 100).toFixed(2)} sent to ${p.name} (${p.email})`,
      }),
    });
  } catch {
    // Notification failure should never break a payout.
  }
}