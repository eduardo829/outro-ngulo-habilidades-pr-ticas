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
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) { console.error("[mp] create preference failed", res.status, JSON.stringify(json).slice(0, 500)); throw new Error("Não foi possível iniciar o pagamento."); }
  return json as { id: string; init_point?: string; sandbox_init_point?: string };
}

type MpPayment = { id: number; status: string; status_detail?: string; external_reference?: string; transaction_amount?: number };

export async function mpGetPayment(id: string) {
  const res = await fetch(`${BASE}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
  return res.ok ? ((await res.json()) as MpPayment) : null;
}

async function mpLatestPaymentFor(externalRef: string) {
  const res = await fetch(`${BASE}/v1/payments/search?sort=date_created&criteria=desc&limit=1&external_reference=${encodeURIComponent(externalRef)}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) return null;
  const j = (await res.json()) as { results?: MpPayment[] };
  return j.results?.[0] ?? null;
}

/** Validates x-signature: HMAC-SHA256 over "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". */
export async function mpVerifySignature(req: Request, dataId: string) {
  const secret = process.env["MERCADO_PAGO_WEBHOOK_SECRET"];
  const sig = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!secret || !sig || !dataId) return false;
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const ts = parts["ts"]; const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

/** Applies a payment (re-read from Mercado Pago) to its purchase; grants access only when approved with the exact amount. */
async function applyPayment(pay: MpPayment) {
  if (!pay.external_reference) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: p } = await supabaseAdmin.from("purchases").select("*").eq("id", pay.external_reference).maybeSingle();
  if (!p || p.payment_provider !== "mercadopago") return null;
  const amountOk = pay.transaction_amount != null && Math.round(pay.transaction_amount * 100) === p.amount_cents;
  const payment_status =
    pay.status === "approved" && amountOk ? "paid"
    : pay.status === "refunded" || pay.status === "charged_back" ? "refunded"
    : pay.status === "rejected" ? "failed"
    : pay.status === "cancelled" ? "cancelled" : "pending";
  // A paid purchase is never downgraded by a later rejected/pending attempt.
  if (p.payment_status === "paid" && payment_status !== "refunded") return "paid";
  await supabaseAdmin.from("purchases").update({ payment_status, transaction_id: String(pay.id), provider_status: `${pay.status}/${pay.status_detail ?? ""}` }).eq("id", p.id);
  if (payment_status === "paid" && p.course_id) {
    await supabaseAdmin.from("enrollments").upsert(
      { user_id: p.user_id, course_id: p.course_id, status: "active", source: "purchase", purchase_id: p.id },
      { onConflict: "user_id,course_id" },
    );
  } else if (payment_status === "refunded") {
    await supabaseAdmin.from("enrollments").update({ status: "revoked" }).eq("purchase_id", p.id);
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
