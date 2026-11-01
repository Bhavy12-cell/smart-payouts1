import { describe, it, expect } from "vitest";
import { detectAnomalies } from "./anomaly";

describe("detectAnomalies", () => {
  it("flags a brand new recipient", () => {
    const f = detectAnomalies({
      amountCents: 5000,
      previousToRecipient: [],
      allPreviousSent: [],
      recentDuplicates: 0,
    });
    expect(f.map((x) => x.code)).toEqual(["new_recipient"]);
  });

  it("flags an amount far above the recipient's average", () => {
    const f = detectAnomalies({
      amountCents: 60000,
      previousToRecipient: [5000, 6000],
      allPreviousSent: [5000, 6000],
      recentDuplicates: 0,
    });
    expect(f.map((x) => x.code)).toEqual(["large_amount"]);
  });

  it("flags a duplicate payout", () => {
    const f = detectAnomalies({
      amountCents: 5761,
      previousToRecipient: [5761],
      allPreviousSent: [5761],
      recentDuplicates: 1,
    });
    expect(f.map((x) => x.code)).toEqual(["duplicate"]);
  });

  it("returns no flags for a normal payout", () => {
    const f = detectAnomalies({
      amountCents: 5800,
      previousToRecipient: [5700, 5900],
      allPreviousSent: [5700, 5900],
      recentDuplicates: 0,
    });
    expect(f).toEqual([]);
  });
});