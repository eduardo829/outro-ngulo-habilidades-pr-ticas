import { describe, expect, it } from "vitest";
import { canResumeStripeSession, stripeSessionStatus } from "@/lib/checkout-logic";

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

  it("an open unpaid session stays pending in purchase storage (no access granted)", () => {
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

describe("resuming abandoned Stripe checkout", () => {
  const open = { status: "open", payment_status: "unpaid", amount_total: 12700, currency: "brl", url: "https://checkout.stripe.com/c/pay/session" };

  it("allows returning to the same open unpaid session for R$127", () => {
    expect(canResumeStripeSession(open, 12700)).toBe(true);
  });
  it("blocks completed but unpaid Pix/boleto sessions", () => {
    expect(canResumeStripeSession({ ...open, status: "complete" }, 12700)).toBe(false);
  });
  it("blocks an expired session", () => {
    expect(canResumeStripeSession({ ...open, status: "expired" }, 12700)).toBe(false);
  });
  it("blocks already paid sessions", () => {
    expect(canResumeStripeSession({ ...open, payment_status: "paid" }, 12700)).toBe(false);
  });
  it("blocks an unknown session state", () => {
    const { status, ...unknown } = open;
    expect(canResumeStripeSession(unknown, 12700)).toBe(false);
  });
  it("blocks unknown payment state", () => {
    const { payment_status, ...unknown } = open;
    expect(canResumeStripeSession(unknown, 12700)).toBe(false);
  });
  it("requires a resume URL", () => {
    expect(canResumeStripeSession({ ...open, url: null }, 12700)).toBe(false);
  });
  it("blocks mismatched amounts", () => {
    expect(canResumeStripeSession({ ...open, amount_total: 100 }, 12700)).toBe(false);
  });
  it("blocks mismatched currency", () => {
    expect(canResumeStripeSession({ ...open, currency: "usd" }, 12700)).toBe(false);
  });
});
