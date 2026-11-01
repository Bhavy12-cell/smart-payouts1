export type Flag = {
  code: "new_recipient" | "large_amount" | "duplicate";
  message: string;
};

export type CheckContext = {
  amountCents: number;
  previousToRecipient: number[]; // earlier sent amounts to this email
  allPreviousSent: number[]; // earlier sent amounts to everyone
  recentDuplicates: number; // same email + same amount in last 24h
};

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

const DEFAULT_LIMIT_CENTS = 50_000; // $500 when there is no history

export function detectAnomalies(ctx: CheckContext): Flag[] {
  const flags: Flag[] = [];

  if (ctx.previousToRecipient.length === 0) {
    flags.push({
      code: "new_recipient",
      message: "This email has never received a payout before.",
    });
  }

  const base =
    ctx.previousToRecipient.length > 0
      ? ctx.previousToRecipient
      : ctx.allPreviousSent;
  const limit = base.length > 0 ? avg(base) * 3 : DEFAULT_LIMIT_CENTS;

  if (ctx.amountCents > limit) {
    flags.push({
      code: "large_amount",
      message: `${usd(ctx.amountCents)} is much higher than usual (limit used: ${usd(Math.round(limit))}).`,
    });
  }

  if (ctx.recentDuplicates > 0) {
    flags.push({
      code: "duplicate",
      message: `The same amount was already sent to this email in the last 24 hours.`,
    });
  }

  return flags;
}