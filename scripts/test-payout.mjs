const BASE = process.env.PAYPAL_BASE_URL;
const ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;


const RECEIVER_EMAIL = "sb-d43hvw53460063@personal.example.com";

async function getToken() {
  const auth = Buffer.from(`${ID}:${SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

async function sendPayout(token) {
  const body = {
    sender_batch_header: {
      sender_batch_id: "batch_" + Date.now(),
      email_subject: "Test payout from Smart Payouts",
    },
    items: [
      {
        recipient_type: "EMAIL",
        receiver: RECEIVER_EMAIL,
        amount: { value: "1.00", currency: "USD" },
        note: "Test payment",
        sender_item_id: "item_" + Date.now(),
      },
    ],
  };

  const res = await fetch(`${BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2));
}

const token = await getToken();
console.log("Received the Token ✅");
await sendPayout(token);