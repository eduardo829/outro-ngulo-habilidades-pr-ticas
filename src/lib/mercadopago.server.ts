// Mercado Pago (Checkout Pro via Orders API). Server-only: the access token never reaches the browser.
const API = "https://api.mercadopago.com/v1/orders";

function token() {
  const t = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!t) throw new Error("Pagamento indisponível no momento.");
  return t;
}

export async function mpCreateOrder(body: unknown, idempotencyKey: string) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) { console.error("[mp] create order failed", res.status, JSON.stringify(json).slice(0, 500)); throw new Error("Não foi possível iniciar o pagamento."); }
  return json as { id: string; checkout_url?: string; status?: string };
}

export async function mpGetOrder(id: string) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) return null;
  return (await res.json()) as { id: string; status: string; status_detail?: string; external_reference?: string; total_amount?: string };
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

/** Re-reads the order from Mercado Pago and applies it to the purchase; grants access only when processed/accredited. */
export async function mpSyncOrder(orderId: string) {
  const order = await mpGetOrder(orderId);
  if (!order) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: p } = await supabaseAdmin.from("purchases").select("*").eq("transaction_id", order.id).maybeSingle();
  if (!p || p.id !== order.external_reference) return null;
  const paid = order.status === "processed" && (!order.status_detail || order.status_detail === "accredited");
  const amountOk = order.total_amount != null && Math.round(Number(order.total_amount) * 100) === p.amount_cents;
  const refunded = order.status === "refunded" || order.status_detail === "refunded";
  const failed = ["failed", "canceled", "expired"].includes(order.status);
  const payment_status = paid && amountOk ? "paid" : refunded ? "refunded" : failed ? "failed" : "pending";
  await supabaseAdmin.from("purchases").update({ payment_status, provider_status: `${order.status}/${order.status_detail ?? ""}` }).eq("id", p.id);
  if (payment_status === "paid" && p.course_id) {
    await supabaseAdmin.from("enrollments").upsert(
      { user_id: p.user_id, course_id: p.course_id, status: "active", source: "purchase", purchase_id: p.id },
      { onConflict: "user_id,course_id" },
    );
  } else if (payment_status === "refunded" && p.course_id) {
    await supabaseAdmin.from("enrollments").update({ status: "revoked" }).eq("purchase_id", p.id);
  }
  return payment_status;
}
