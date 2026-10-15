import { describe, expect, it } from "vitest";
import { runBrickAttempt, viewForReload, type BrickDeps } from "@/lib/brick-flow";

/** In-memory model of checkout_reserve_attempt: one row, serialized like SELECT ... FOR UPDATE. */
function fakeDb() {
  const row = { attempt_id: null as string | null, state: null as string | null, paid: false };
  let n = 0;
  let lock = Promise.resolve();
  const reserve = () => {
    const run = lock.then(async () => {
      await new Promise((r) => setTimeout(r, 1));
      if (row.paid) return { action: "paid" as const };
      if (row.state === "in_flight" || row.state === "unknown" || row.state === "open")
        return { action: "busy" as const, attempt_id: row.attempt_id! };
      row.attempt_id = `att-${++n}`;
      row.state = "in_flight";
      return { action: "send" as const, attempt_id: row.attempt_id };
    });
    lock = run.then(() => undefined);
    return run;
  };
  return { row, reserve };
}

function deps(db: ReturnType<typeof fakeDb>, over: Partial<BrickDeps> = {}) {
  const keys: string[] = [];
  const d: BrickDeps = {
    reconcile: async () => ({ status: "none", mp: null, pix: null }),
    reserve: db.reserve,
    mark: async (_a, s) => {
      db.row.state = s;
    },
    key: (a) => `k-${a}`,
    create: async (k) => {
      keys.push(k);
      await new Promise((r) => setTimeout(r, 5));
      return { kind: "created", paymentId: "1" };
    },
    readAndApply: async () => {
      db.row.state = "open";
      return { status: "pending", pix: { qr_code: "q", qr_code_base64: null, ticket_url: null } };
    },
    ...over,
  };
  return { d, keys };
}

describe("Payment Brick attempt lock", () => {
  it("two simultaneous submits create exactly one charge", async () => {
    const db = fakeDb();
    const { d, keys } = deps(db);
    const [a, b] = await Promise.all([runBrickAttempt(d), runBrickAttempt(d)]);
    expect(keys).toHaveLength(1);
    expect([a.status, b.status].sort()).toEqual(["pending", "unknown"]);
  });

  it("network error after POST: result unknown and no new attempt allowed", async () => {
    const db = fakeDb();
    const { d, keys } = deps(db, {
      create: async (k) => {
        keys.push(k);
        throw new Error("net");
      },
    });
    expect((await runBrickAttempt(d)).status).toBe("unknown");
    expect(db.row.state).toBe("unknown");
    expect((await runBrickAttempt(d)).status).toBe("unknown");
    expect(keys).toHaveLength(1);
  });

  it("re-read/DB failure after POST never reports paid", async () => {
    const db = fakeDb();
    const { d } = deps(db, {
      readAndApply: async () => {
        throw new Error("db");
      },
    });
    expect((await runBrickAttempt(d)).status).toBe("unknown");
  });

  it("only a confirmed rejection allows a new attempt, with a new key", async () => {
    const db = fakeDb();
    const { d, keys } = deps(db, {
      create: async (k) => {
        keys.push(k);
        return { kind: "refused" };
      },
    });
    expect((await runBrickAttempt(d)).status).toBe("failed");
    expect(db.row.state).toBe("rejected");
    await runBrickAttempt(d);
    expect(keys).toEqual(["k-att-1", "k-att-2"]);
  });

  it("open MP payment found on reconcile blocks any POST", async () => {
    const db = fakeDb();
    const { d, keys } = deps(db, {
      reconcile: async () => ({ status: "pending", mp: "pending", pix: null }),
    });
    expect((await runBrickAttempt(d)).status).toBe("pending");
    expect(keys).toHaveLength(0);
  });

  it("MP unreachable on reconcile blocks any POST", async () => {
    const db = fakeDb();
    const { d, keys } = deps(db, {
      reconcile: async () => ({ status: "unknown", mp: null, pix: null }),
    });
    expect((await runBrickAttempt(d)).status).toBe("unknown");
    expect(keys).toHaveLength(0);
  });
});

describe("reload while MP search is still empty (eventual consistency)", () => {
  const none = { status: "none", mp: null, pix: null };
  const now = Date.parse("2026-10-15T12:00:00Z");
  it("recent in-flight/unknown attempt keeps verifying", () => {
    expect(
      viewForReload(none, { state: "in_flight", startedAt: "2026-10-15T11:59:30Z" }, now),
    ).toBe("unknown");
    expect(viewForReload(none, { state: "unknown", startedAt: "2026-10-15T11:59:00Z" }, now)).toBe(
      "unknown",
    );
  });
  it("open attempt never reopens the form on an empty search", () => {
    expect(viewForReload(none, { state: "open", startedAt: "2026-10-15T10:00:00Z" }, now)).toBe(
      "unknown",
    );
  });
  it("stale unresolved attempt allows a resend (server reuses the same key)", () => {
    expect(viewForReload(none, { state: "unknown", startedAt: "2026-10-15T11:50:00Z" }, now)).toBe(
      "none",
    );
  });
  it("no attempt: form", () => {
    expect(viewForReload(none, { state: null, startedAt: null }, now)).toBe("none");
  });
});

import { legacyGate } from "@/lib/brick-flow";
describe("legacy Checkout Pro purchase gate", () => {
  it("open legacy payment: wait, never open Brick", () =>
    expect(legacyGate("pending")).toBe("wait"));
  it("MP unavailable for legacy: verify, never open Brick", () => {
    expect(legacyGate("unknown")).toBe("verify");
  });
  it("legacy approved: course released", () => expect(legacyGate("paid")).toBe("paid"));
  it("legacy failed/cancelled or no payment: Brick opens", () => {
    for (const s of ["failed", "cancelled", "none", null]) expect(legacyGate(s)).toBe("open");
  });
});

import { combineLegacy } from "@/lib/brick-flow";
describe("all legacy purchases are examined", () => {
  it("newest none, older pending: Brick blocked, polls the older one", () => {
    expect(
      combineLegacy([
        { id: "new", status: "none" },
        { id: "old", status: "pending" },
      ]),
    ).toEqual({ gate: "wait", id: "old" });
  });
  it("newest failed, older pending: Brick blocked, polls the older one", () => {
    expect(
      combineLegacy([
        { id: "new", status: "failed" },
        { id: "old", status: "pending" },
      ]),
    ).toEqual({ gate: "wait", id: "old" });
  });
  it("any MP-unavailable purchase blocks", () => {
    expect(
      combineLegacy([
        { id: "a", status: "none" },
        { id: "b", status: "unknown" },
        { id: "c", status: "pending" },
      ]),
    ).toEqual({ gate: "verify", id: "b" });
  });
  it("any paid purchase means existing access", () => {
    expect(
      combineLegacy([
        { id: "a", status: "pending" },
        { id: "b", status: "paid" },
      ]),
    ).toEqual({ gate: "paid", id: "b" });
  });
  it("all resolved or absent: Brick opens", () => {
    expect(
      combineLegacy([
        { id: "a", status: "none" },
        { id: "b", status: "cancelled" },
        { id: "c", status: "failed" },
      ]).gate,
    ).toBe("open");
    expect(combineLegacy([]).gate).toBe("open");
  });
});
