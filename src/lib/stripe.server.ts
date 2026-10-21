// Stripe Checkout (hosted page: card, Pix, boleto). Server-only: the secret key never reaches the browser.
// Plain fetch + Web Crypto so it runs in the edge runtime without Node-only SDKs.
const BASE = "https://api.stripe.com";

function key() {
  const k = process.env["STRIPE_SECRET_KEY"];
  if (!k) throw new Error("Pagamento indisponível no momento.");
  return k;
}

async function call(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, string>,
  idempotencyKey?: string,
) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key()}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error("[stripe]", method, path, res.status, JSON.stringify(json).slice(0, 300));
    if (res.status === 404) return null;
    throw new Error("stripe request failed");
  }
  return json;
}

export type StripeSession = {
  id: string;
  object: "checkout.session";
  url?: string | null;
  status?: string; // open | complete | expired
  payment_status?: string; // paid | unpaid | no_payment_required
  amount_total?: number;
  currency?: string;
  client_reference_id?: string | null;
  payment_intent?: string | null;
};

/** Creates a hosted Checkout Session (card, Pix, boleto). Amount always comes from the database, never the client. */
export async function stripeCreateSession(
  o: {
    purchaseId: string;
    title: string;
    amountCents: number;
    successUrl: string;
    cancelUrl: string;
    email?: string | null;
  },
  idempotencyKey: string,
): Promise<StripeSession> {
  const body: Record<string, string> = {
    mode: "payment",
    locale: "pt-BR",
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
    client_reference_id: o.purchaseId,
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(o.amountCents),
    "line_items[0][price_data][product_data][name]": o.title.slice(0, 120),
    "line_items[0][quantity]": "1",
    "payment_method_types[0]": "card",
    "payment_method_types[1]": "pix",
    "payment_method_types[2]": "boleto",
    "metadata[purchase_id]": o.purchaseId,
    "payment_intent_data[metadata][purchase_id]": o.purchaseId,
  };
  if (o.email) body["customer_email"] = o.email;
  const s = (await call("/v1/checkout/sessions", "POST", body, idempotencyKey)) as StripeSession | null;
  if (!s?.id) throw new Error("Não foi possível iniciar o pagamento.");
  return s;
}

/** Re-reads one Checkout Session. null = not found; throws on transport/server errors. */
export async function stripeGetSession(id: string): Promise<StripeSession | null> {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) return null;
  return (await call(`/v1/checkout/sessions/${encodeURIComponent(id)}`, "GET")) as StripeSession | null;
}

/**
 * Verifies the Stripe-Signature header: HMAC-SHA256 over "<timestamp>.<rawBody>" with the webhook secret,
 * timing-safe compare, 5-minute timestamp tolerance.
 */
export async function stripeVerifyWebhook(rawBody: string, header: string | null): Promise<boolean> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${rawBody}`)),
  );
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((v1) => {
    if (v1.length !== hex.length) return false;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
    return diff === 0;
  });
}

/**
 * Applies a re-read Checkout Session to its purchase. Access is granted only when Stripe confirms
 * payment_status "paid" with the exact amount and currency stored in the purchase row.
 * Purchase + enrollment are written in ONE database transaction (checkout_apply_verified_payment RPC).
 */
export async function applyStripeSession(s: StripeSession): Promise<string | null> {
  const purchaseId = s.client_reference_id;
  if (!purchaseId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { stripeSessionStatus } = await import("./checkout-logic");
  const { data: p, error: re } = await supabaseAdmin
    .from("purchases")
    .select("id, payment_provider, amount_cents, currency")
    .eq("id", purchaseId)
    .maybeSingle();
  if (re) throw new Error("purchase read failed");
  if (!p || p.payment_provider !== "stripe") return null;
  const status = stripeSessionStatus(s, p.amount_cents ?? -1, p.currency ?? "BRL");
  if (status === "pending") return "pending"; // open session: nothing to write yet
  const { data, error } = await supabaseAdmin.rpc("checkout_apply_verified_payment", {
    _purchase: p.id,
    _status: status,
    _transaction_id: (typeof s.payment_intent === "string" && s.payment_intent) || s.id,
    _provider_status: `session/${s.id}:${s.status ?? ""}/${s.payment_status ?? ""}`,
    _attempt: null as unknown as string,
  });
  if (error) {
    console.error("[stripe] apply session failed", p.id);
    throw new Error("apply payment failed");
  }
  return (data as string | null) ?? null;
}
