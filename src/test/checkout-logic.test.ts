import { describe, expect, it } from "vitest";
import { brickSchema, buildPaymentBody, idempotencyKey, mapPaymentStatus, returnView } from "@/lib/checkout-logic";

const purchase = { id: "11111111-1111-4111-8111-111111111111", amount_cents: 12700 };

describe("checkout rules", () => {
  it("uses the database amount, never the client amount", () => {
    const fd = brickSchema.parse({ payment_method_id: "visa", token: "tok", installments: 1, transaction_amount: 1, payer: { email: "a@b.co" } });
    const body = buildPaymentBody(purchase, fd, { title: "Curso", notificationUrl: "https://x/y" });
    expect(body.transaction_amount).toBe(127);
    expect(body.external_reference).toBe(purchase.id);
  });

  it("rejects raw card data fields", () => {
    expect(() => brickSchema.parse({ payment_method_id: "visa", token: "t", card_number: "4111111111111111", payer: { email: "a@b.co" } })).toThrow();
  });

  it("builds a Pix payment without token", () => {
    const fd = brickSchema.parse({ payment_method_id: "pix", payer: { email: "a@b.co" } });
    const body = buildPaymentBody(purchase, fd, { title: "Curso", notificationUrl: "https://x/y" });
    expect(body.payment_method_id).toBe("pix");
    expect(body).not.toHaveProperty("token");
  });

  it("same attempt gives the same idempotency key, new attempt a different one", () => {
    expect(idempotencyKey(purchase.id, "a1")).toBe(idempotencyKey(purchase.id, "a1"));
    expect(idempotencyKey(purchase.id, "a1")).not.toBe(idempotencyKey(purchase.id, "a2"));
  });

  it("grants paid only when approved with the exact amount", () => {
    expect(mapPaymentStatus({ status: "approved", transaction_amount: 127 }, 12700)).toBe("paid");
    expect(mapPaymentStatus({ status: "approved", transaction_amount: 1 }, 12700)).toBe("pending");
    expect(mapPaymentStatus({ status: "rejected" }, 12700)).toBe("failed");
    expect(mapPaymentStatus({ status: "in_process" }, 12700)).toBe("pending");
    expect(mapPaymentStatus({ status: "refunded" }, 12700)).toBe("refunded");
  });

  it("never shows failure before verification", () => {
    expect(returnView("checking")).toBe("checking");
    expect(returnView("unknown")).toBe("checking");
    expect(returnView("failed")).toBe("failed");
    expect(returnView("paid")).toBe("paid");
  });
});
