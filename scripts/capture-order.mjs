const BASE = process.env.PAYPAL_BASE_URL;
const ORDER_ID = process.argv[2];
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

const res = await fetch(`${BASE}/v2/checkout/orders/${ORDER_ID}/capture`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  },
});
console.log(JSON.stringify(await res.json(), null, 2));