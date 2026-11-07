const BASE = process.env.PAYPAL_BASE_URL!;

async function getToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error("PayPal token error: " + JSON.stringify(data));
  return data.access_token as string;
}

export async function sendPayout(p: { id: string; email: string; cents: number }) {
  const token = await getToken();

  const res = await fetch(`${BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: p.id,
        email_subject: "You have a payout from Smart Payouts",
      },
      items: [
        {
          recipient_type: "EMAIL",
          receiver: p.email,
          amount: { value: (p.cents / 100).toFixed(2), currency: "USD" },
          note: "Payout from Smart Payouts",
          sender_item_id: p.id,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return { batchId: data.batch_header.payout_batch_id as string };
}

export async function getPayoutStatus(batchId: string) {
  const token = await getToken();
  const res = await fetch(`${BASE}/v1/payments/payouts/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  const item = data.items?.[0]?.transaction_status as string | undefined;
  const batch = data.batch_header?.batch_status as string | undefined;

  let status: "paid" | "unclaimed" | "failed" | "pending" = "pending";
  if (item === "SUCCESS") status = "paid";
  else if (item === "UNCLAIMED") status = "unclaimed";
  else if (["FAILED", "RETURNED", "BLOCKED", "REFUNDED", "REVERSED"].includes(item ?? ""))
    status = "failed";
  else if (batch === "DENIED") status = "failed";

  return { status, item, batch };
}