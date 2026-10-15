import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_ORIGIN = /^https:\/\/((www\.)?outroangulo\.com|[a-z0-9-]+\.lovable\.app)$/;

/** Creates a Mercado Pago Checkout Pro order for one course. Price is read from the database, never from the client. */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120), origin: z.string().url().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { mpCreatePreference } = await import("./mercadopago.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = ALLOWED_ORIGIN.test(data.origin) ? data.origin : "https://outroangulo.com";

    const { data: c } = await supabaseAdmin.from("courses")
      .select("id, slug, title, status, price_cents, sale_price_cents, sale_start, sale_end, is_free, is_purchasable")
      .eq("slug", data.slug).maybeSingle();
    if (!c || c.status !== "published" || !c.is_purchasable || c.is_free) throw new Error("Este curso não está à venda.");
    const now = Date.now();
    const onSale = c.sale_price_cents != null && (!c.sale_start || Date.parse(c.sale_start) <= now) && (!c.sale_end || Date.parse(c.sale_end) >= now);
    const cents = onSale ? c.sale_price_cents! : c.price_cents;
    if (!cents || cents < 100) throw new Error("Preço ainda não definido.");

    const { data: en } = await supabaseAdmin.from("enrollments").select("status").eq("user_id", context.userId).eq("course_id", c.id).maybeSingle();
    if (en?.status === "active") throw new Error("Você já tem acesso a este curso.");

    const { data: p, error } = await supabaseAdmin.from("purchases")
      .insert({ user_id: context.userId, course_id: c.id, amount_cents: cents, currency: "BRL", payment_provider: "mercadopago", payment_status: "pending" })
      .select("id").single();
    if (error || !p) throw new Error("Não foi possível iniciar o pagamento.");

    const pref = await mpCreatePreference({
      items: [{ id: c.slug, title: c.title.slice(0, 120), quantity: 1, unit_price: cents / 100, currency_id: "BRL" }],
      external_reference: p.id,
      notification_url: "https://outroangulo.com/api/public/mercadopago-webhook",
      back_urls: {
        success: `${origin}/pagamento/sucesso?curso=${c.slug}`,
        failure: `${origin}/pagamento/falha?curso=${c.slug}`,
        pending: `${origin}/pagamento/pendente?curso=${c.slug}`,
      },
      auto_return: "approved",
      statement_descriptor: "OUTRO ANGULO",
    }, p.id);

    await supabaseAdmin.from("purchases").update({ provider_status: `preference/${pref.id}` }).eq("id", p.id);
    if (!pref.init_point) throw new Error("Não foi possível iniciar o pagamento.");
    return { checkout_url: pref.init_point };
  });

/** Lets the buyer re-check their own latest purchase on the return pages (status always confirmed with Mercado Pago). */
export const refreshMyPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpSyncPurchase } = await import("./mercadopago.server");
    const { data: c } = await supabaseAdmin.from("courses").select("id").eq("slug", data.slug).maybeSingle();
    if (!c) return { status: "unknown" };
    const { data: p } = await supabaseAdmin.from("purchases").select("id, payment_status")
      .eq("user_id", context.userId).eq("course_id", c.id).eq("payment_provider", "mercadopago")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!p) return { status: "unknown" };
    if (p.payment_status === "paid") return { status: "paid" };
    return { status: (await mpSyncPurchase(p.id)) ?? p.payment_status };
  });

const NOTIFY_URL = "https://outroangulo.com/api/public/mercadopago-webhook";

async function loadSellable(slug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: c } = await supabaseAdmin.from("courses")
    .select("id, slug, title, status, price_cents, sale_price_cents, sale_start, sale_end, is_free, is_purchasable")
    .eq("slug", slug).maybeSingle();
  if (!c || c.status !== "published" || !c.is_purchasable || c.is_free) return null;
  const now = Date.now();
  const onSale = c.sale_price_cents != null && (!c.sale_start || Date.parse(c.sale_start) <= now) && (!c.sale_end || Date.parse(c.sale_end) >= now);
  const cents = onSale ? c.sale_price_cents! : c.price_cents;
  if (!cents || cents < 100) return null;
  return { ...c, cents };
}

/** Checkout summary for the in-site Payment Brick: course, server price, an open purchase for this user and the public key. */
export const getCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const c = await loadSellable(data.slug);
    if (!c) return { state: "unavailable" as const };
    const { data: en } = await supabaseAdmin.from("enrollments").select("status").eq("user_id", context.userId).eq("course_id", c.id).maybeSingle();
    if (en?.status === "active") return { state: "owned" as const, slug: c.slug, title: c.title };
    // Reuse the latest open purchase at the same price, so reloads never create duplicate orders.
    const { data: open } = await supabaseAdmin.from("purchases").select("id, payment_status, amount_cents")
      .eq("user_id", context.userId).eq("course_id", c.id).eq("payment_provider", "mercadopago")
      .in("payment_status", ["pending", "failed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    let purchaseId = open && open.amount_cents === c.cents ? open.id : null;
    if (!purchaseId) {
      const { data: p, error } = await supabaseAdmin.from("purchases")
        .insert({ user_id: context.userId, course_id: c.id, amount_cents: c.cents, currency: "BRL", payment_provider: "mercadopago", payment_status: "pending" })
        .select("id").single();
      if (error || !p) throw new Error("Não foi possível iniciar o pagamento.");
      purchaseId = p.id;
    }
    const publicKey = process.env["MERCADO_PAGO_PUBLIC_KEY"] ?? null;
    const email = typeof context.claims?.email === "string" ? context.claims.email : null;
    return { state: "ready" as const, slug: c.slug, title: c.title, amount_cents: c.cents, purchaseId, publicKey: publicKey && /^(APP_USR|TEST)-/.test(publicKey) ? publicKey : null, email };
  });

/** Processes the Payment Brick token/Pix request server-side. Amount comes from the purchase row; retries with the same attemptId never create a second charge. */
export const payWithBrick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ purchaseId: z.string().uuid(), attemptId: z.string().uuid(), formData: z.unknown() }).parse(d))
  .handler(async ({ data, context }) => {
    const { brickSchema, buildPaymentBody, idempotencyKey } = await import("./checkout-logic");
    const fd = brickSchema.safeParse(data.formData);
    if (!fd.success) throw new Error("Dados de pagamento inválidos.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpCreatePayment, applyPayment, mpGetPayment } = await import("./mercadopago.server");
    const { data: p } = await supabaseAdmin.from("purchases").select("id, user_id, course_id, amount_cents, payment_status, transaction_id, provider_status")
      .eq("id", data.purchaseId).maybeSingle();
    if (!p || p.user_id !== context.userId || !p.course_id || !p.amount_cents) throw new Error("Compra não encontrada.");
    if (p.payment_status === "paid") return { status: "paid" as const };
    const { data: c } = await supabaseAdmin.from("courses").select("slug, title").eq("id", p.course_id).maybeSingle();
    const sellable = c ? await loadSellable(c.slug) : null;
    if (!sellable || sellable.cents !== p.amount_cents) throw new Error("O preço deste curso mudou. Recarregue a página.");
    // An open Pix for this purchase is returned instead of generating a new charge.
    if (fd.data.payment_method_id === "pix" && p.transaction_id && p.payment_status === "pending") {
      const prev = await mpGetPayment(p.transaction_id);
      const td = (prev as { point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } } } | null)?.point_of_interaction?.transaction_data;
      if (prev && prev.status === "pending" && td?.qr_code) return { status: "pending" as const, pix: { qr_code: td.qr_code, qr_code_base64: td.qr_code_base64 ?? null, ticket_url: td.ticket_url ?? null } };
    }
    const pay = await mpCreatePayment(buildPaymentBody({ id: p.id, amount_cents: p.amount_cents }, fd.data, { title: sellable.title, notificationUrl: NOTIFY_URL }), idempotencyKey(p.id, data.attemptId));
    if (!pay) return { status: "failed" as const, detail: "error" };
    const status = (await applyPayment(pay)) ?? "pending";
    const td = pay.point_of_interaction?.transaction_data;
    return {
      status: status as "paid" | "pending" | "failed" | "cancelled" | "refunded",
      detail: pay.status_detail ?? null,
      pix: td?.qr_code ? { qr_code: td.qr_code, qr_code_base64: td.qr_code_base64 ?? null, ticket_url: td.ticket_url ?? null } : null,
    };
  });

/** Status of one specific purchase owned by the caller, always re-confirmed with Mercado Pago. */
export const getPurchaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ purchaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpSyncPurchase } = await import("./mercadopago.server");
    const { data: p } = await supabaseAdmin.from("purchases").select("id, user_id, payment_status").eq("id", data.purchaseId).maybeSingle();
    if (!p || p.user_id !== context.userId) return { status: "unknown" };
    if (p.payment_status === "paid") return { status: "paid" };
    return { status: (await mpSyncPurchase(p.id)) ?? "unknown" };
  });
