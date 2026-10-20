const BASE = process.env.PAYPAL_BASE_URL;
const auth = Buffer.from(
  `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
).toString("base64");

const tokenRes = await fetch(`${BASE}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});
const { access_token } = await tokenRes.json();

const res = await fetch(`${BASE}/v2/checkout/orders`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    intent: "CAPTURE",
    purchase_units: [{ amount: { currency_code: "USD", value: "100.00" } }],
  }),
});
const order = await res.json();
console.log("Order ID:", order.id);
console.log(
  "Approve link:",
  order.links?.find((l) => l.rel === "approve")?.href
);