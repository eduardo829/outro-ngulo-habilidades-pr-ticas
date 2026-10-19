// Server-side Payment Brick attempt flow with injectable dependencies (testable without network/DB).
// Order: reconcile with MP -> atomic reservation (one attempt per purchase) -> POST with server-owned key -> re-read -> apply.

export type Pix = { qr_code: string; qr_code_base64: string | null; ticket_url: string | null };
export type Reconciled = { status: string; mp: string | null; pix: Pix | null };
export type Reservation = { action: "send" | "busy" | "paid" | "missing"; attempt_id?: string };
export type CreateResult = { kind: "created"; paymentId: string } | { kind: "refused" | "unknown" };
export type FlowResult = {
  status: "paid" | "pending" | "failed" | "cancelled" | "refunded" | "unknown";
  pix: Pix | null;
};

export interface BrickDeps {
  reconcile: () => Promise<Reconciled>;
  reserve: () => Promise<Reservation>;
  mark: (attemptId: string, state: "unknown" | "rejected" | "open") => Promise<void>;
  create: (idempotencyKey: string, attemptId: string) => Promise<CreateResult>;
  readAndApply: (paymentId: string) => Promise<{ status: string; pix: Pix | null } | null>;
  key: (attemptId: string) => string;
}

const known = (s: string): FlowResult["status"] =>
  (["paid", "pending", "failed", "cancelled", "refunded"].includes(s)
    ? s
    : "unknown") as FlowResult["status"];

export async function runBrickAttempt(d: BrickDeps): Promise<FlowResult> {
  const prior = await d.reconcile();
  if (prior.status === "unknown") return { status: "unknown", pix: null };
  if (prior.status === "paid") return { status: "paid", pix: null };
  if (prior.status === "pending") return { status: "pending", pix: prior.pix };
  // "none" | "failed" | "cancelled": ask the database for the single allowed attempt.
  const r = await d.reserve();
  if (r.action === "paid") return { status: "paid", pix: null };
  if (r.action !== "send" || !r.attempt_id) return { status: "unknown", pix: null }; // another attempt in flight: never charge
  let created: CreateResult;
  try {
    created = await d.create(d.key(r.attempt_id), r.attempt_id);
  } catch {
    created = { kind: "unknown" };
  }
  if (created.kind === "refused") {
    await d.mark(r.attempt_id, "rejected");
    return { status: "failed", pix: null };
  }
  if (created.kind !== "created") {
    await d.mark(r.attempt_id, "unknown").catch(() => {});
    return { status: "unknown", pix: null };
  }
  try {
    const applied = await d.readAndApply(created.paymentId);
    if (!applied) {
      await d.mark(r.attempt_id, "unknown").catch(() => {});
      return { status: "unknown", pix: null };
    }
    return {
      status: known(applied.status),
      pix: applied.status === "pending" ? applied.pix : null,
    };
  } catch {
    await d.mark(r.attempt_id, "unknown").catch(() => {});
    return { status: "unknown", pix: null }; // re-read or DB write failed: never claim paid
  }
}

/** Purchase-state view for reloads/polls. Unresolved attempts stay "unknown" (verifying) even if MP search is empty (eventual consistency). */
export function viewForReload(
  r: Reconciled,
  attempt: { state: string | null; startedAt: string | null },
  now: number,
  staleMs = 120_000,
): "none" | "unknown" | "pending" | "paid" | "failed" {
  if (r.status === "paid") return "paid";
  if (r.status === "pending") return "pending";
  if (r.status === "unknown") return "unknown";
  if (r.status === "failed" || r.status === "cancelled") return "failed";
  // MP returned nothing. If the server recorded an attempt that may have reached MP, keep verifying until stale.
  if (attempt.state === "open") return "unknown"; // MP reported it open; never reopen the form on an empty search
  if (attempt.state === "in_flight" || attempt.state === "unknown") {
    const started = attempt.startedAt ? Date.parse(attempt.startedAt) : 0;
    return now - started < staleMs ? "unknown" : "none"; // stale: form may resend with the SAME server key
  }
  return "none";
}

/**
 * Gate from a legacy Checkout Pro purchase's reconciled status. Brick may open only when the legacy payment is
 * absent or confirmed failed/cancelled; unknown (MP unavailable) never allows a new charge.
 */
export function legacyGate(status: string | null): "open" | "wait" | "verify" | "paid" {
  if (
    status == null ||
    status === "none" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "refunded"
  )
    return "open";
  if (status === "paid") return "paid";
  if (status === "pending") return "wait";
  return "verify";
}

/**
 * Combines ALL legacy purchases of a user/course. Any paid -> paid; any unknown -> verify; any open -> wait
 * (returning that purchase id for polling). Brick opens only when every legacy purchase is resolved/absent.
 */
export function combineLegacy(items: { id: string; status: string | null }[]): {
  gate: "open" | "wait" | "verify" | "paid";
  id: string | null;
} {
  const g = items.map((i) => ({ id: i.id, gate: legacyGate(i.status) }));
  for (const want of ["paid", "verify", "wait"] as const) {
    const hit = g.find((x) => x.gate === want);
    if (hit) return { gate: want, id: hit.id };
  }
  return { gate: "open", id: null };
}
