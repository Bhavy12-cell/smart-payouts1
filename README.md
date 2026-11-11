# PayFlow: AI-powered payout automation with human approval

> Write a payout rule in plain English. AI reads it, code calculates it, you approve, PayPal pays.

Built for the **PayPal AI Hackathon**. Everything runs on the **PayPal sandbox** (test money only).

- **Live demo:** _add your Render/Vercel URL here_
- **Demo video:** _add your YouTube link here_

---

## The problem

Paying freelancers, editors and designers is still manual: spreadsheet maths, one-by-one transfers and no clear record. One typo sends money to the wrong place, and it is hard to get back.

## The solution

You write one sentence, for example:

> *Pay each editor 60% of net revenue after 30 days.*

PayFlow turns it into a safe, scheduled, auditable PayPal payout.

**AI reads. Code calculates. You approve. PayPal pays.**

---

## Features

- **Plain-English rules:** Groq AI converts a sentence into structured data. Every AI output is validated with Zod.
- **Exact money maths:** deterministic, unit-tested code (in cents). The AI never calculates or sends money.
- **Gross vs net:** pay a percentage of revenue before or after PayPal's fee.
- **Budget guard:** blocks any rule whose total payouts exceed the revenue (for example 60% + a flat $50 on $100).
- **Safety checks:** warns about a new recipient, an unusually large amount, or a duplicate payout. AI explains the warning in plain English.
- **Human approval:** nothing is sent until you approve. The server enforces this too.
- **PayPal Payouts API:** sends the money, then the app checks delivery and shows "Money delivered".
- **Simulate due date:** skip the 30-day wait for testing and demos.
- **Ledger:** AG Grid table with sort, filter, pagination and CSV export.
- **Insights:** cumulative "total paid out" chart and a full audit trail.
- **Help chatbot:** explains the app to new users (it cannot send money or approve payouts).
- **Multi-page UI:** Home, Create rule, Payouts, Insights.

---

## How AI and PayPal are used

### PayPal (sandbox)

| PayPal tool | What it does in PayFlow |
|---|---|
| **Payouts API** (`POST /v1/payments/payouts`) | Sends the payout to the recipient's PayPal email after approval. The payout ID is used as the batch and item ID, so PayPal rejects duplicates. |
| **Payout status API** (`GET /v1/payments/payouts/{batch_id}`) | After sending, the app checks the result: paid, unclaimed or failed. |
| **OAuth 2.0** (client credentials) | Gets an access token for each server request. |
| **Orders API** (create and capture) | Used in testing to simulate incoming revenue and observe PayPal's fee (gross vs net). |
| **Sandbox accounts** | A US Business account (sender) and Personal accounts (recipients). |

### AI

**Groq API, model `openai/gpt-oss-120b`**, used in three places:

1. **Rule parsing:** sentence to JSON (validated with Zod, rejected if invalid).
2. **Safety explanations:** explains why a payout was flagged.
3. **Help chatbot:** answers questions about how the app works.

---

## Architecture

```
English rule
   -> Groq AI (parse) -> Zod validation
   -> Calculator (cents, gross/net) -> Budget guard
   -> Preview + recipient emails -> Confirm (saved in Supabase)
   -> Due date (or Simulate due date)
   -> Safety checks (new recipient, large amount, duplicate) + AI explanation
   -> Human approval
   -> PayPal Payouts API -> status check -> "Money delivered"
   -> Ledger, chart and audit log
```

## Tech stack

Next.js, TypeScript, Tailwind CSS, Groq, PayPal REST APIs (sandbox), Supabase (PostgreSQL), AG Grid, Zod, Vitest.

---

## Run it yourself

### 1. Prerequisites

- Node.js 20 or newer
- A free [PayPal Developer](https://developer.paypal.com) account (sandbox)
- A free [Groq](https://console.groq.com) API key
- A free [Supabase](https://supabase.com) project

### 2. PayPal sandbox setup

1. In the PayPal Developer Dashboard (Sandbox mode), create:
   - one **Business** sandbox account with **Country = United States**
   - one or two **Personal** sandbox accounts (these receive the money)
2. Create an app (Apps & Credentials) linked to that US Business account. Copy the **Client ID** and **Secret**.

> **Note:** PayPal Payouts is not available for India-based accounts, so use a **US** sandbox Business account.

### 3. Install

```bash
git clone https://github.com/Bhavy12-cell/smart-payouts1.git
cd smart-payouts1
npm install
```

If `npm install` reports a peer-dependency conflict, run `npm install --legacy-peer-deps`.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
GROQ_API_KEY=
DATABASE_URL=
```

`DATABASE_URL` is your Supabase **Session pooler** connection string (port 5432). Use a database password with **letters and numbers only**, because special characters such as `@` break the URL.

### 5. Create the database tables

In the Supabase **SQL Editor**, run:

```sql
create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  sentence text not null,
  rule jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references rules(id) on delete cascade,
  recipient_name text not null,
  recipient_email text,
  amount_cents integer not null,
  due_at timestamptz not null,
  status text not null default 'scheduled',
  paypal_batch_id text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
```

### 6. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### 7. Try the full flow (about 2 minutes)

1. Go to **Create rule**. Use the example sentence and click **Preview payouts**.
2. Enter the email of a **Personal sandbox account** and click **Confirm rule**.
3. Go to **Payouts**. Click **Simulate due date** (this skips the 30-day wait).
4. Click **Review & approve**. Read the safety checks and AI note, then approve.
5. You will see **Money delivered**. Log in to <https://www.sandbox.paypal.com> with the Personal account to see the money.
6. Open **Insights** for the chart and audit trail.

Try the budget guard: use `Pay editor Rahul 60% and designer a flat $50` with gross revenue 100. It is blocked because the total is more than the revenue.

### Demo:-
![Uploading image.png…]()



---

## Tests

```bash
npm test
```

Unit tests cover the money calculator (gross/net, flat amounts), the budget guard and the anomaly checks.

## Project structure

```
app/            pages (Home, Create, Payouts, Insights) and API routes
components/     Shell, Ledger (AG Grid), PayoutChart, Activity, HelpChat, ui
lib/            schema (Zod), calc, anomaly, checks, explain, paypal, db
```

## Security notes

- Secrets live only in `.env.local` (git-ignored). Never commit real keys.
- Sandbox only: no real money moves.
- The AI only reads and explains. Amounts, checks and payments are handled by deterministic code and enforced on the server.

## What's next

PayPal webhooks with signature verification, a payout calendar, multi-currency, recurring payouts and team logins.

## License

MIT. See [LICENSE](LICENSE).
