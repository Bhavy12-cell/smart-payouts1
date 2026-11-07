import { describe, it, expect } from "vitest";
import type { Rule } from "./schema";
import { calculatePayments, checkBudget } from "./calc";

const rule = (basis: "gross" | "net"): Rule => ({
  basis,
  delay_value: 30,
  delay_unit: "days",
  recipients: [
    { name: "Editor", type: "percent", value: 60 },
    { name: "Designer", type: "flat", value: 50 },
  ],
});

describe("calculatePayments", () => {
  it("60% of gross $100 = $60", () => {
    const p = calculatePayments(rule("gross"), 10000, 9602);
    expect(p[0].cents).toBe(6000);
  });

  it("60% of net $96.02 = $57.61", () => {
    const p = calculatePayments(rule("net"), 10000, 9602);
    expect(p[0].cents).toBe(5761);
  });

  it("flat $50 = 5000 cents", () => {
    const p = calculatePayments(rule("gross"), 10000, 9602);
    expect(p[1].cents).toBe(5000);
  });
});
describe("checkBudget", () => {
  const r: Rule = {
    basis: "gross",
    delay_value: 0,
    delay_unit: "days",
    recipients: [
      { name: "A", type: "percent", value: 60 },
      { name: "B", type: "flat", value: 50 },
    ],
  };

  it("blocks when total is more than revenue", () => {
    const p = calculatePayments(r, 10000, 9602);
    expect(checkBudget(r, p, 10000, 9602)).not.toBeNull();
  });

  it("allows when total fits in revenue", () => {
    const p = calculatePayments(r, 20000, 19204);
    expect(checkBudget(r, p, 20000, 19204)).toBeNull();
  });
});