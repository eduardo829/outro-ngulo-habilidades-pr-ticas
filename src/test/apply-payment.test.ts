import { beforeEach, describe, expect, it, vi } from "vitest";

const db = { updateError: null as unknown, upsertError: null as unknown, upserts: 0 };
vi.mock("@/integrations/supabase/client.server", () => {
  const purchase = {
    id: "p1",
    payment_provider: "mercadopago",
    amount_cents: 100,
    payment_status: "pending",
    user_id: "u1",
    course_id: "c1",
  };
  const from = (table: string) => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: purchase, error: null }) }) }),
    update: () => ({ eq: async () => ({ error: table === "purchases" ? db.updateError : null }) }),
    upsert: async () => {
      db.upserts++;
      return { error: db.upsertError };
    },
  });
  return { supabaseAdmin: { from } };
});

import { applyPayment } from "@/lib/mercadopago.server";

const approved = { id: 9, status: "approved", external_reference: "p1", transaction_amount: 1 };

describe("(5) applyPayment checks database writes", () => {
  beforeEach(() => {
    db.updateError = null;
    db.upsertError = null;
    db.upserts = 0;
  });
  it("grants when both writes succeed", async () => {
    await expect(applyPayment(approved)).resolves.toBe("paid");
    expect(db.upserts).toBe(1);
  });
  it("throws (never reports paid) if purchase update fails", async () => {
    db.updateError = { message: "x" };
    await expect(applyPayment(approved)).rejects.toThrow();
  });
  it("throws (never reports paid) if enrollment upsert fails", async () => {
    db.upsertError = { message: "x" };
    await expect(applyPayment(approved)).rejects.toThrow();
  });
});
