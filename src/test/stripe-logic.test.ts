import { describe, expect, it } from "vitest";
import { stripeSessionStatus } from "@/lib/checkout-logic";

describe("stripeSessionStatus", () => {
  const paid = { status: "complete", payment_status: "paid", amount_total: 12700, currency: "brl" };

  it("grants access only when paid with the exact amount and currency", () => {
    expect(stripeSessionStatus(paid, 12700, "BRL")).toBe("paid");
  });

  it("never grants access when the amount differs from the purchase row", () => {
    expect(stripeSessionStatus({ ...paid, amount_total: 100 }, 12700, "BRL")).toBe("pending");
    expect(stripeSessionStatus({ ...paid, amount_total: 12701 }, 12700, "BRL")).toBe("pending");
  });

  it("never grants access when the currency differs", () => {
    expect(stripeSessionStatus({ ...paid, currency: "usd" }, 12700, "BRL")).toBe("pending");
  });

  it("an expired session is cancelled, never paid", () => {
    expect(stripeSessionStatus({ ...paid, status: "expired" }, 12700, "BRL")).toBe("cancelled");
  });

  it("an open unpaid session stays pending (Pix/boleto awaiting confirmation)", () => {
    expect(
      stripeSessionStatus({ status: "open", payment_status: "unpaid", amount_total: 12700, currency: "brl" }, 12700),
    ).toBe("pending");
  });

  it("a complete but unpaid session stays pending (async methods)", () => {
    expect(
      stripeSessionStatus({ status: "complete", payment_status: "unpaid", amount_total: 12700, currency: "brl" }, 12700),
    ).toBe("pending");
  });
});
