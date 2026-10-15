import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_ORIGIN = /^https:\/\/((www\.)?outroangulo\.com|[a-z0-9-]+\.lovable\.app)$/;

/** Creates a Mercado Pago Checkout Pro order for one course. Price is read from the database, never from the client. */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ slug: z.string().min(1).max(120), origin: z.string().url().max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { mpCreatePreference } = await import("./mercadopago.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = ALLOWED_ORIGIN.test(data.origin) ? data.origin : "https://outroangulo.com";

    const { data: c } = await supabaseAdmin
      .from("courses")
      .select(
        "id, slug, title, status, price_cents, sale_price_cents, sale_start, sale_end, is_free, is_purchasable",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (!c || c.status !== "published" || !c.is_purchasable || c.is_free)
      throw new Error("Este curso não está à venda.");
    const now = Date.now();
    const onSale =
      c.sale_price_cents != null &&
      (!c.sale_start || Date.parse(c.sale_start) <= now) &&
      (!c.sale_end || Date.parse(c.sale_end) >= now);
    const cents = onSale ? c.sale_price_cents! : c.price_cents;
    if (!cents || cents < 100) throw new Error("Preço ainda não definido.");

    const { data: en } = await supabaseAdmin
      .from("enrollments")
      .select("status")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .maybeSingle();
    if (en?.status === "active") throw new Error("Você já tem acesso a este curso.");

    const { data: p, error } = await supabaseAdmin
      .from("purchases")
      .insert({
        user_id: context.userId,
        course_id: c.id,
        amount_cents: cents,
        currency: "BRL",
        payment_provider: "mercadopago",
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (error || !p) throw new Error("Não foi possível iniciar o pagamento.");

    const pref = await mpCreatePreference(
      {
        items: [
          {
            id: c.slug,
            title: c.title.slice(0, 120),
            quantity: 1,
            unit_price: cents / 100,
            currency_id: "BRL",
          },
        ],
        external_reference: p.id,
        notification_url: "https://outroangulo.com/api/public/mercadopago-webhook",
        back_urls: {
          success: `${origin}/pagamento/sucesso?curso=${c.slug}&compra=${p.id}`,
          failure: `${origin}/pagamento/falha?curso=${c.slug}&compra=${p.id}`,
          pending: `${origin}/pagamento/pendente?curso=${c.slug}&compra=${p.id}`,
        },
        auto_return: "approved",
        statement_descriptor: "OUTRO ANGULO",
      },
      p.id,
    );

    await supabaseAdmin
      .from("purchases")
      .update({ provider_status: `preference/${pref.id}` })
      .eq("id", p.id);
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
    const { data: c } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!c) return { status: "unknown" };
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id, payment_status")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .eq("payment_provider", "mercadopago")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!p) return { status: "unknown" };
    if (p.payment_status === "paid") return { status: "paid" };
    try {
      return { status: (await mpSyncPurchase(p.id)) ?? p.payment_status };
    } catch {
      return { status: "unknown" };
    }
  });

const NOTIFY_URL = "https://outroangulo.com/api/public/mercadopago-webhook";

async function loadSellable(slug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: c } = await supabaseAdmin
    .from("courses")
    .select(
      "id, slug, title, status, price_cents, sale_price_cents, sale_start, sale_end, is_free, is_purchasable",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!c || c.status !== "published" || !c.is_purchasable || c.is_free) return null;
  const now = Date.now();
  const onSale =
    c.sale_price_cents != null &&
    (!c.sale_start || Date.parse(c.sale_start) <= now) &&
    (!c.sale_end || Date.parse(c.sale_end) >= now);
  const cents = onSale ? c.sale_price_cents! : c.price_cents;
  if (!cents || cents < 100) return null;
  return { ...c, cents };
}

type Pix = { qr_code: string; qr_code_base64: string | null; ticket_url: string | null };
type MpP = import("./mercadopago.server").MpPayment;
const pixOf = (pay: MpP | null): Pix | null => {
  const td = pay?.point_of_interaction?.transaction_data;
  return td?.qr_code
    ? {
        qr_code: td.qr_code,
        qr_code_base64: td.qr_code_base64 ?? null,
        ticket_url: td.ticket_url ?? null,
      }
    : null;
};

/**
 * Reconciles a purchase with Mercado Pago: re-reads the latest payment for it (external_reference / transaction_id),
 * applies it (writes checked) and reports state. "unknown" = Mercado Pago could not be asked; never treated as rejection.
 */
async function reconcile(purchaseId: string, transactionId: string | null) {
  const { mpLatestPaymentFor, mpGetPayment, applyPayment } = await import("./mercadopago.server");
  try {
    let latest = await mpLatestPaymentFor(purchaseId);
    if (!latest && transactionId) latest = await mpGetPayment(transactionId);
    if (!latest) return { status: "none" as const, mp: null, pix: null };
    const full = await mpGetPayment(String(latest.id)); // full record (Pix QR lives here)
    if (!full) return { status: "unknown" as const, mp: null, pix: null };
    const status = (await applyPayment(full)) ?? "unknown";
    return { status, mp: full.status, pix: full.status === "pending" ? pixOf(full) : null };
  } catch (e) {
    console.error("[checkout] reconcile failed", purchaseId, e instanceof Error ? e.message : "");
    return { status: "unknown" as const, mp: null, pix: null };
  }
}

/** Checkout summary for the in-site Payment Brick: course, server price, an open purchase for this user, any open payment, and the public key. */
export const getCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const c = await loadSellable(data.slug);
    if (!c) return { state: "unavailable" as const };
    const owned = async () => {
      const { data: en } = await supabaseAdmin
        .from("enrollments")
        .select("status")
        .eq("user_id", context.userId)
        .eq("course_id", c.id)
        .maybeSingle();
      return en?.status === "active";
    };
    if (await owned()) return { state: "owned" as const, slug: c.slug, title: c.title };
    // Reuse the latest open purchase at the same price, so reloads never create duplicate orders.
    const { data: open } = await supabaseAdmin
      .from("purchases")
      .select("id, payment_status, amount_cents, transaction_id")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .eq("payment_provider", "mercadopago")
      .in("payment_status", ["pending", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let purchaseId = open && open.amount_cents === c.cents ? open.id : null;
    // Existing payment for this purchase (e.g. Pix awaiting payment) is shown again instead of a new form.
    let existing: { phase: "pix" | "pending" | "verifying" | "rejected"; pix: Pix | null } | null =
      null;
    if (purchaseId && open) {
      const r = await reconcile(purchaseId, open.transaction_id);
      if (r.status === "paid" && (await owned()))
        return { state: "owned" as const, slug: c.slug, title: c.title };
      if (r.status === "unknown" || r.status === "paid")
        existing = { phase: "verifying", pix: null };
      else if (r.status === "pending") existing = { phase: r.pix ? "pix" : "pending", pix: r.pix };
    }
    if (!purchaseId) {
      const { data: p, error } = await supabaseAdmin
        .from("purchases")
        .insert({
          user_id: context.userId,
          course_id: c.id,
          amount_cents: c.cents,
          currency: "BRL",
          payment_provider: "mercadopago",
          payment_status: "pending",
        })
        .select("id")
        .single();
      if (error || !p) throw new Error("Não foi possível iniciar o pagamento.");
      purchaseId = p.id;
    }
    const publicKey = process.env["MERCADO_PAGO_PUBLIC_KEY"] ?? null;
    const email = typeof context.claims?.email === "string" ? context.claims.email : null;
    return {
      state: "ready" as const,
      slug: c.slug,
      title: c.title,
      amount_cents: c.cents,
      purchaseId,
      existing,
      publicKey: publicKey && /^(APP_USR|TEST)-/.test(publicKey) ? publicKey : null,
      email,
    };
  });

/**
 * Processes the Payment Brick token/Pix request server-side. Amount comes from the purchase row.
 * Before charging, any existing open payment for the purchase blocks a new charge. After POST, the payment is re-read from the API before applying.
 */
export const payWithBrick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        purchaseId: z.string().uuid(),
        attemptId: z.string().uuid(),
        formData: z.unknown(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { brickSchema, buildPaymentBody, idempotencyKey, attemptPolicy } =
      await import("./checkout-logic");
    const fd = brickSchema.safeParse(data.formData);
    if (!fd.success) throw new Error("Dados de pagamento inválidos.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpCreatePayment, applyPayment, mpGetPayment } = await import("./mercadopago.server");
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id, user_id, course_id, amount_cents, payment_status, transaction_id")
      .eq("id", data.purchaseId)
      .maybeSingle();
    if (!p || p.user_id !== context.userId || !p.course_id || !p.amount_cents)
      throw new Error("Compra não encontrada.");
    if (p.payment_status === "paid") return { status: "paid" as const, pix: null };
    const { data: c } = await supabaseAdmin
      .from("courses")
      .select("slug, title")
      .eq("id", p.course_id)
      .maybeSingle();
    const sellable = c ? await loadSellable(c.slug) : null;
    if (!sellable || sellable.cents !== p.amount_cents)
      throw new Error("O preço deste curso mudou. Recarregue a página.");

    // Never create a concurrent charge: reconcile first.
    const prior = await reconcile(p.id, p.transaction_id);
    if (prior.status === "unknown") return { status: "unknown" as const, pix: null };
    if (prior.status !== "none" && attemptPolicy(prior.mp) === "block") {
      return {
        status:
          prior.status === "paid"
            ? ("paid" as const)
            : prior.status === "pending"
              ? ("pending" as const)
              : ("unknown" as const),
        pix: prior.pix,
      };
    }

    let created: Awaited<ReturnType<typeof mpCreatePayment>>;
    try {
      created = await mpCreatePayment(
        buildPaymentBody({ id: p.id, amount_cents: p.amount_cents }, fd.data, {
          title: sellable.title,
          notificationUrl: NOTIFY_URL,
        }),
        idempotencyKey(p.id, data.attemptId),
      );
    } catch {
      return { status: "unknown" as const, pix: null }; // network error after send: a charge may exist
    }
    if (created.kind === "refused") return { status: "failed" as const, pix: null };
    if (created.kind !== "created") return { status: "unknown" as const, pix: null };
    try {
      const fresh = await mpGetPayment(String(created.payment.id));
      if (!fresh) return { status: "unknown" as const, pix: null };
      const status = (await applyPayment(fresh)) ?? "unknown";
      return {
        status,
        pix: status === "pending" ? (pixOf(fresh) ?? pixOf(created.payment)) : null,
      };
    } catch {
      return { status: "unknown" as const, pix: null }; // re-read or DB write failed: do not claim paid
    }
  });

/** Status of one specific purchase owned by the caller, always re-confirmed with Mercado Pago. "none" = no payment exists yet. */
export const getPurchaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ purchaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id, user_id, course_id, payment_status, transaction_id")
      .eq("id", data.purchaseId)
      .maybeSingle();
    if (!p || p.user_id !== context.userId) return { status: "unknown", pix: null };
    if (p.payment_status === "paid") {
      const { data: en } = await supabaseAdmin
        .from("enrollments")
        .select("status")
        .eq("user_id", p.user_id)
        .eq("course_id", p.course_id!)
        .maybeSingle();
      if (en?.status === "active") return { status: "paid", pix: null };
    }
    const r = await reconcile(p.id, p.transaction_id);
    return { status: r.status as string, pix: r.pix };
  });
