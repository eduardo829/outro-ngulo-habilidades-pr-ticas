import { describe, expect, it } from "vitest";
import {
  brickSchema,
  buildPaymentBody,
  idempotencyKey,
  mapPaymentStatus,
  returnView,
  buyTarget,
  phaseAfterPay,
  canStartNewAttempt,
  attemptPolicy,
} from "@/lib/checkout-logic";

const purchase = { id: "11111111-1111-4111-8111-111111111111", amount_cents: 12700 };

describe("checkout rules", () => {
  it("uses the database amount, never the client amount", () => {
    const fd = brickSchema.parse({
      payment_method_id: "visa",
      token: "tok",
      installments: 1,
      transaction_amount: 1,
      payer: { email: "a@b.co" },
    });
    const body = buildPaymentBody(purchase, fd, { title: "Curso", notificationUrl: "https://x/y" });
    expect(body.transaction_amount).toBe(127);
    expect(body.external_reference).toBe(purchase.id);
  });

  it("accepts extra Brick fields but never forwards them (incl. raw card data)", () => {
    const fd = brickSchema.parse({
      payment_method_id: "visa",
      token: "tok",
      installments: 1,
      amount: 999, // benign extra from the Brick
      transaction_amount: 999,
      card_number: "4111111111111111",
      security_code: "123",
      payer: {
        email: "a@b.co",
        identification: { type: "CPF", number: "123", extra: "x" },
        phone: "1",
      },
    });
    const body = buildPaymentBody(purchase, fd, { title: "Curso", notificationUrl: "https://x/y" });
    const json = JSON.stringify(body);
    for (const bad of [
      "card_number",
      "4111111111111111",
      "security_code",
      'amount":999',
      "phone",
      "extra",
    ])
      expect(json).not.toContain(bad);
    expect(body.transaction_amount).toBe(127);
    expect(Object.keys(body).sort()).toEqual([
      "description",
      "external_reference",
      "installments",
      "notification_url",
      "payer",
      "payment_method_id",
      "statement_descriptor",
      "token",
      "transaction_amount",
    ]);
    expect(Object.keys(body.payer).sort()).toEqual(["email", "identification"]);
    expect(Object.keys(body.payer.identification!).sort()).toEqual(["number", "type"]);
  });

  it("card requires token; Pix does not", () => {
    expect(
      brickSchema.safeParse({ payment_method_id: "visa", payer: { email: "a@b.co" } }).success,
    ).toBe(false);
    expect(
      brickSchema.safeParse({ payment_method_id: "pix", payer: { email: "a@b.co" } }).success,
    ).toBe(true);
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
    expect(mapPaymentStatus({ status: "approved", transaction_amount: 127, currency_id: "BRL" }, 12700)).toBe("paid");
    expect(mapPaymentStatus({ status: "approved", transaction_amount: 1, currency_id: "BRL" }, 12700)).toBe("pending");
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

describe("checkout review regressions", () => {
  const uuidA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const uuidB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("(1) X-Idempotency-Key fits Mercado Pago's 64-char limit", () => {
    const k = idempotencyKey(uuidA, uuidB);
    expect(k.length).toBeLessThanOrEqual(64);
    expect(k).toBe(idempotencyKey(uuidA, uuidB));
    expect(k).not.toBe(idempotencyKey(uuidA, uuidA));
  });

  it("(2) buy CTA always targets the checkout route directly", () => {
    expect(buyTarget("corretor-na-pratica")).toEqual({
      to: "/checkout/$slug",
      params: { slug: "corretor-na-pratica" },
    });
  });

  it("(3) network/unknown result after POST never shows rejection", () => {
    expect(phaseAfterPay(null)).toBe("verifying");
    expect(phaseAfterPay({ status: "unknown" })).toBe("verifying");
    expect(phaseAfterPay({ status: "failed" })).toBe("rejected");
    expect(phaseAfterPay({ status: "pending" })).toBe("pending");
    expect(phaseAfterPay({ status: "pending", pix: { qr_code: "x" } })).toBe("pix");
    expect(phaseAfterPay({ status: "paid" })).toBe("paid");
    expect(canStartNewAttempt("unknown")).toBe(false);
    expect(canStartNewAttempt("pending")).toBe(false);
    expect(canStartNewAttempt("failed")).toBe(true);
  });

  it("(4) existing non-terminal payment blocks a new charge", () => {
    expect(attemptPolicy(null)).toBe("same_key");
    for (const s of ["pending", "in_process", "authorized", "in_mediation", "approved"])
      expect(attemptPolicy(s)).toBe("block");
    expect(attemptPolicy("rejected")).toBe("new_attempt");
    expect(attemptPolicy("cancelled")).toBe("new_attempt");
  });
});

import { cooldownApplies, CARD_COOLDOWN_MS, cardFingerprint, phaseAfterPay as pap } from "@/lib/checkout-logic";
describe("card cooldown", () => {
  it("lasts 5 minutes", () => expect(CARD_COOLDOWN_MS).toBe(300000));
  it("applies to antifraud/bank refusals", () => {
    expect(cooldownApplies("cc_rejected_high_risk")).toBe(true);
    expect(cooldownApplies("cc_rejected_call_for_authorize")).toBe(true);
  });
  it("skips typing errors", () => {
    expect(cooldownApplies("cc_rejected_bad_filled_security_code")).toBe(false);
    expect(cooldownApplies("cc_rejected_bad_filled_date")).toBe(false);
  });
  it("same card same fingerprint, other card differs", async () => {
    const a = await cardFingerprint("visa", "411111", "1234");
    expect(await cardFingerprint("visa", "411111", "1234")).toBe(a);
    expect(await cardFingerprint("visa", "411111", "9999")).not.toBe(a);
  });
  it("cooldown result shows cooldown phase", () => expect(pap({ status: "cooldown" })).toBe("cooldown"));
});
