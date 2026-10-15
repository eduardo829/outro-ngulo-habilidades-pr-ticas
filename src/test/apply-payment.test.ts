import { beforeEach, describe, expect, it, vi } from "vitest";

const db = { rpcError: null as unknown, rpcCalls: [] as unknown[], directWrites: 0 };
vi.mock("@/integrations/supabase/client.server", () => {
  const purchase = { id: "p1", payment_provider: "mercadopago", amount_cents: 100 };
  const from = () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: purchase, error: null }) }) }),
    update: () => {
      db.directWrites++;
      return { eq: async () => ({ error: null }) };
    },
    upsert: async () => {
      db.directWrites++;
      return { error: null };
    },
  });
  const rpc = async (name: string, args: { _status: string }) => {
    db.rpcCalls.push({ name, ...args });
    return db.rpcError ? { data: null, error: db.rpcError } : { data: args._status, error: null };
  };
  return { supabaseAdmin: { from, rpc } };
});

import { applyPayment } from "@/lib/mercadopago.server";

const approved = { id: 9, status: "approved", external_reference: "p1", transaction_amount: 1 };

describe("applyPayment is a single transactional write", () => {
  beforeEach(() => {
    db.rpcError = null;
    db.rpcCalls = [];
    db.directWrites = 0;
  });
  it("approved: one RPC call, no separate table writes", async () => {
    await expect(applyPayment(approved)).resolves.toBe("paid");
    expect(db.rpcCalls).toEqual([
      expect.objectContaining({ name: "checkout_apply_payment", _status: "paid" }),
    ]);
    expect(db.directWrites).toBe(0);
  });
  it("refund goes through the same transactional RPC", async () => {
    await applyPayment({ ...approved, status: "refunded" });
    expect(db.rpcCalls).toEqual([expect.objectContaining({ _status: "refunded" })]);
    expect(db.directWrites).toBe(0);
  });
  it("wrong amount never maps to paid", async () => {
    await applyPayment({ ...approved, transaction_amount: 127 });
    expect(db.rpcCalls).toEqual([expect.objectContaining({ _status: "pending" })]);
  });
  it("transaction failure throws, never reports paid", async () => {
    db.rpcError = { message: "x" };
    await expect(applyPayment(approved)).rejects.toThrow();
  });
});
