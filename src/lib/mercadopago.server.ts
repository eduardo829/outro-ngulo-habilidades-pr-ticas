// Mercado Pago Checkout Pro (Preferences API — Orders-based Checkout Pro is not enabled for Brazilian accounts).
// Server-only: the access token never reaches the browser.
const BASE = "https://api.mercadopago.com";

function token() {
  const t = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!t) throw new Error("Pagamento indisponível no momento.");
  return t;
}

export async function mpCreatePreference(body: unknown, idempotencyKey: string) {
  const res = await fetch(`${BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error("[mp] create preference failed", res.status, JSON.stringify(json).slice(0, 500));
    throw new Error("Não foi possível iniciar o pagamento.");
  }
  return json as { id: string; init_point?: string; sandbox_init_point?: string };
}

type PixData = { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
export type MpPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
  point_of_interaction?: { transaction_data?: PixData };
};

/** Re-reads one payment. Throws on transport/server errors so callers never mistake "unknown" for "not found". */
export async function mpGetPayment(id: string) {
  const res = await fetch(`${BASE}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`mp get payment ${res.status}`);
  return (await res.json()) as MpPayment;
}

/** Latest payment for a purchase (external_reference). null = none exists; throws if Mercado Pago could not be asked. */
export async function mpLatestPaymentFor(externalRef: string) {
  const res = await fetch(
    `${BASE}/v1/payments/search?sort=date_created&criteria=desc&limit=1&external_reference=${encodeURIComponent(externalRef)}`,
    { headers: { Authorization: `Bearer ${token()}` } },
  );
  if (!res.ok) throw new Error(`mp search ${res.status}`);
  const j = (await res.json()) as { results?: MpPayment[] };
  return j.results?.[0] ?? null;
}

/** Validates x-signature: HMAC-SHA256 over "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". */
export async function mpVerifySignature(req: Request, dataId: string) {
  const secret = process.env["MERCADO_PAGO_WEBHOOK_SECRET"];
  const sig = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!secret || !sig || !dataId) return false;
  const parts = Object.fromEntries(
    sig.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)),
  );
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

/** Creates a payment via Payments API (Payment Brick). Body built by buildPaymentBody; never logged. */
export async function mpCreatePayment(
  body: unknown,
  idempotencyKey: string,
): Promise<{ kind: "created"; payment: MpPayment } | { kind: "refused" | "unknown" }> {
  const res = await fetch(`${BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // 4xx (except 409/429) = request refused, no payment created. 5xx/409/429 = outcome unknown: caller must reconcile.
  if (!res.ok) {
    console.error(
      "[mp] create payment failed",
      res.status,
      String(json["message"] ?? "").slice(0, 200),
    );
    return {
      kind:
        res.status >= 500 || res.status === 409 || res.status === 429
          ? ("unknown" as const)
          : ("refused" as const),
    };
  }
  return { kind: "created" as const, payment: json as unknown as MpPayment };
}

/** Applies a payment (re-read from Mercado Pago) to its purchase; grants access only when approved with the exact amount. */
export async function applyPayment(pay: MpPayment) {
  if (!pay.external_reference) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { mapPaymentStatus } = await import("./checkout-logic");
  const { data: p } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .eq("id", pay.external_reference)
    .maybeSingle();
  if (!p || p.payment_provider !== "mercadopago") return null;
  const payment_status = mapPaymentStatus(pay, p.amount_cents ?? -1);
  // A paid purchase is never downgraded by a later rejected/pending attempt.
  if (p.payment_status === "paid" && payment_status !== "refunded") return "paid";
  // Enrollment first, then purchase: "paid" is only ever recorded/returned after access was actually written.
  if (payment_status === "paid" && p.course_id) {
    const { error: e1 } = await supabaseAdmin.from("enrollments").upsert(
      {
        user_id: p.user_id,
        course_id: p.course_id,
        status: "active",
        source: "purchase",
        purchase_id: p.id,
      },
      { onConflict: "user_id,course_id" },
    );
    if (e1) {
      console.error("[mp] enrollment write failed", p.id);
      throw new Error("enrollment write failed");
    }
  } else if (payment_status === "refunded") {
    const { error: e2 } = await supabaseAdmin
      .from("enrollments")
      .update({ status: "revoked" })
      .eq("purchase_id", p.id);
    if (e2) {
      console.error("[mp] revoke failed", p.id);
      throw new Error("revoke failed");
    }
  }
  const { error: e3 } = await supabaseAdmin
    .from("purchases")
    .update({
      payment_status,
      transaction_id: String(pay.id),
      provider_status: `${pay.status}/${pay.status_detail ?? ""}`,
    })
    .eq("id", p.id);
  if (e3) {
    console.error("[mp] purchase update failed", p.id);
    throw new Error("purchase update failed");
  }
  return payment_status;
}

export async function mpSyncPayment(paymentId: string) {
  const pay = await mpGetPayment(paymentId);
  return pay ? applyPayment(pay) : null;
}

export async function mpSyncPurchase(purchaseId: string) {
  const pay = await mpLatestPaymentFor(purchaseId);
  return pay ? applyPayment(pay) : null;
}
