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
        checkout_kind: "pro",
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

type AttemptRow = { attempt_state: string | null; attempt_started_at: string | null };
async function viewOf(p: { id: string; transaction_id: string | null } & AttemptRow) {
  const { viewForReload } = await import("./brick-flow");
  const r = await reconcile(p.id, p.transaction_id);
  return {
    view: viewForReload(r, { state: p.attempt_state, startedAt: p.attempt_started_at }, Date.now()),
    pix: r.pix,
  };
}

/** Reconciles a Stripe purchase: re-reads the Checkout Session (id kept in provider_status) and applies it. */
async function reconcileStripe(p: { id: string; provider_status: string | null; amount_cents: number | null; currency?: string | null }) {
  const { stripeGetSession, applyStripeSession } = await import("./stripe.server");
  const { canResumeStripeSession } = await import("./checkout-logic");
  const sid = p.provider_status?.startsWith("session/")
    ? p.provider_status.slice(8).split(":")[0]
    : null;
  if (!sid) return "none" as const;
  try {
    const s = await stripeGetSession(sid);
    if (!s || s.client_reference_id !== p.id) return "unknown" as const;
    const status = (await applyStripeSession(s)) ?? "unknown";
    if (status === "pending" && canResumeStripeSession(s, p.amount_cents ?? -1, p.currency ?? "BRL"))
      return "resumable" as const;
    return status;
  } catch (e) {
    console.error("[stripe] reconcile failed", p.id, e instanceof Error ? e.message : "");
    return "unknown" as const;
  }
}

/** ALL pending legacy Checkout Pro purchases of this user/course (paginated), each reconciled with MP, combined into one gate. */
async function legacyState(userId: string, courseId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { combineLegacy } = await import("./brick-flow");
  const PAGE = 50;
  const rows: { id: string; transaction_id: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("id, transaction_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("payment_provider", "mercadopago")
      .eq("checkout_kind", "pro")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return { gate: "verify" as const, id: null };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  const items: { id: string; status: string | null }[] = [];
  for (const r of rows) {
    const rec = await reconcile(r.id, r.transaction_id);
    items.push({ id: r.id, status: rec.status });
    if (rec.status === "paid") break; // access already exists; enrollment checked by caller
  }
  return combineLegacy(items);
}

/** Checkout summary for the in-site Payment Brick: course, server price, the Brick purchase for this user, any unresolved attempt, and the public key. */
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

    // Legacy Mercado Pago purchase still open/unknown: the page polls THAT purchase and no new charge is allowed.
    const lg = await legacyState(context.userId, c.id);
    if (lg.gate === "paid" && (await owned()))
      return { state: "owned" as const, slug: c.slug, title: c.title };
    if (lg.gate !== "open") {
      return {
        state: "legacy" as const,
        slug: c.slug,
        title: c.title,
        amount_cents: c.cents,
        legacyPurchaseId: lg.id,
        phase: lg.gate === "wait" ? ("pending" as const) : ("verifying" as const),
      };
    }

    // An open Stripe purchase at the same price is resumed, never duplicated.
    const { data: open } = await supabaseAdmin
      .from("purchases")
      .select("id, amount_cents, provider_status")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .eq("payment_provider", "stripe")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (open && open.amount_cents === c.cents) {
      const st = await reconcileStripe(open);
      if (st === "paid" && (await owned()))
        return { state: "owned" as const, slug: c.slug, title: c.title };
      if (st === "pending" || st === "unknown")
        return {
          state: "stripe-pending" as const,
          slug: c.slug,
          title: c.title,
          amount_cents: c.cents,
          purchaseId: open.id,
        };
    }

    return {
      state: "ready" as const,
      slug: c.slug,
      title: c.title,
      amount_cents: c.cents,
    };
  });

/**
 * Starts a hosted Stripe Checkout (card, Pix, boleto) for one course. Price is read from the database,
 * never from the client. One pending purchase per user/course/price is reused; the Stripe session is
 * created with a deterministic idempotency key, so reloads and double-clicks never duplicate charges.
 */
export const createStripeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1).max(120),
        origin: z.string().url().max(200),
        origem: z.string().max(40).regex(/^[a-z0-9_-]+$/).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripeCreateSession, stripeGetSession, applyStripeSession } = await import(
      "./stripe.server"
    );
    const { canResumeStripeSession, checkoutReturnPath } = await import("./checkout-logic");
    const origin = ALLOWED_ORIGIN.test(data.origin) ? data.origin : "https://outroangulo.com";
    const c = await loadSellable(data.slug);
    if (!c) throw new Error("Este curso não está à venda.");
    const { data: en } = await supabaseAdmin
      .from("enrollments")
      .select("status")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .maybeSingle();
    if (en?.status === "active") throw new Error("Você já tem acesso a este curso.");

    // Never open a Stripe charge while a legacy Mercado Pago payment is open or its state is unknown.
    const lg = await legacyState(context.userId, c.id);
    if (lg.gate === "paid") throw new Error("Você já tem acesso a este curso.");
    if (lg.gate !== "open")
      throw new Error("Você já tem um pagamento em análise. Aguarde a confirmação antes de tentar de novo.");

    const { data: open } = await supabaseAdmin
      .from("purchases")
      .select("id, amount_cents, provider_status")
      .eq("user_id", context.userId)
      .eq("course_id", c.id)
      .eq("payment_provider", "stripe")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let purchaseId: string;
    let priorSessionId: string | null = null;
    if (open && open.amount_cents === c.cents) {
      purchaseId = open.id;
      priorSessionId = open.provider_status?.startsWith("session/")
        ? (open.provider_status.slice(8).split(":")[0] ?? null)
        : null;
      if (priorSessionId) {
        const s = await stripeGetSession(priorSessionId);
        if (!s || s.client_reference_id !== purchaseId)
          throw new Error("Não foi possível verificar seu pagamento. Tente novamente em instantes.");
        const st = await applyStripeSession(s);
        if (st === "paid") throw new Error("Você já tem acesso a este curso.");
        if (st === "pending" && canResumeStripeSession(s, c.cents) && s.url)
          return { checkout_url: s.url };
        if (st !== "cancelled" && st !== "failed")
          throw new Error("Você já tem um pagamento em análise. Aguarde a confirmação antes de tentar de novo.");
      }
    } else {
      const { data: p, error } = await supabaseAdmin
        .from("purchases")
        .insert({
          user_id: context.userId,
          course_id: c.id,
          amount_cents: c.cents,
          currency: "BRL",
          payment_provider: "stripe",
          payment_status: "pending",
          checkout_kind: "stripe",
          origin: data.origem ?? null,
        })
        .select("id")
        .single();
      if (error || !p) throw new Error("Não foi possível iniciar o pagamento.");
      purchaseId = p.id;
    }

    const email = typeof context.claims?.email === "string" ? context.claims.email : null;
    const session = await stripeCreateSession(
      {
        purchaseId,
        title: c.title,
        amountCents: c.cents,
        successUrl: `${origin}/pagamento/sucesso?curso=${c.slug}&compra=${purchaseId}`,
        cancelUrl: `${origin}${checkoutReturnPath(c.slug, data.origem)}`,
        email,
      },
      // Deterministic per new session: same key on retry returns the same session, never a second one.
      priorSessionId ? `${purchaseId}:${priorSessionId}` : purchaseId,
    );
    if (!session.url) throw new Error("Não foi possível iniciar o pagamento.");
    await supabaseAdmin
      .from("purchases")
      .update({ provider_status: `session/${session.id}` })
      .eq("id", purchaseId);
    return { checkout_url: session.url };
  });

/**
 * Processes the Payment Brick token/Pix request server-side. Amount comes from the purchase row.
 * One attempt per purchase is reserved atomically in the database (checkout_reserve_attempt); the attempt id —
 * and so the X-Idempotency-Key — is server-owned. Concurrent submits get "unknown" (verifying), never a second charge.
 */
export const payWithBrick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ purchaseId: z.string().uuid(), formData: z.unknown(), deviceId: z.unknown().optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { brickSchema, buildPaymentBody, idempotencyKey, deviceIdSchema } = await import("./checkout-logic");
    const { runBrickAttempt } = await import("./brick-flow");
    const fd = brickSchema.safeParse(data.formData);
    if (!fd.success) throw new Error("Dados de pagamento inválidos.");
    const dev = deviceIdSchema.safeParse(data.deviceId);
    const deviceId = dev.success ? (dev.data ?? null) : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpCreatePayment, applyPayment, mpGetPayment } = await import("./mercadopago.server");
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id, user_id, course_id, amount_cents, payment_status, transaction_id, checkout_kind")
      .eq("id", data.purchaseId)
      .maybeSingle();
    if (
      !p ||
      p.user_id !== context.userId ||
      !p.course_id ||
      !p.amount_cents ||
      p.checkout_kind !== "brick"
    )
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
    const amount = p.amount_cents;
    // Never charge via Brick while a legacy Checkout Pro payment is open or its state is unknown.
    const lg = await legacyState(context.userId, p.course_id);
    if (lg.gate === "wait") return { status: "pending" as const, pix: null };
    if (lg.gate !== "open") return { status: "unknown" as const, pix: null };

    // Same card recently refused by issuer/antifraud: wait, or use another card / Pix.
    const { cardFingerprint, cooldownApplies, CARD_COOLDOWN_MS } = await import("./checkout-logic");
    let fp: string | null = null;
    if (fd.data.payment_method_id !== "pix" && fd.data.token) {
      const { mpCardTokenDigits } = await import("./mercadopago.server");
      const dg = await mpCardTokenDigits(fd.data.token);
      if (dg) fp = await cardFingerprint(fd.data.payment_method_id, dg.first6, dg.last4);
      if (fp) {
        const { data: cd } = await supabaseAdmin
          .from("card_cooldowns")
          .select("blocked_until")
          .eq("fingerprint", fp)
          .maybeSingle();
        if (cd && Date.parse(cd.blocked_until) > Date.now())
          return { status: "cooldown" as const, pix: null, retryAt: cd.blocked_until };
      }
    }

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("display_name, created_at")
      .eq("id", context.userId)
      .maybeSingle();

    return runBrickAttempt({
      reconcile: () => reconcile(p.id, p.transaction_id),
      reserve: async () => {
        const { data: r, error } = await supabaseAdmin.rpc("checkout_reserve_attempt", {
          _purchase: p.id,
        });
        if (error) throw new Error("reserve failed");
        return r as { action: "send" | "busy" | "paid" | "missing"; attempt_id?: string };
      },
      mark: async (attemptId, state) => {
        const { error } = await supabaseAdmin.rpc("checkout_mark_attempt", {
          _purchase: p.id,
          _attempt: attemptId,
          _state: state,
        });
        if (error) throw new Error("mark failed");
      },
      key: (attemptId) => idempotencyKey(p.id, attemptId),
      create: async (key, attemptId) => {
        const r = await mpCreatePayment(
          buildPaymentBody({ id: p.id, amount_cents: amount }, fd.data, {
            title: sellable.title,
            notificationUrl: NOTIFY_URL,
            attemptId,
            slug: sellable.slug,
            payerName: prof?.display_name ?? null,
            registeredAt: prof?.created_at ?? null,
          }),
          key,
          deviceId,
        );
        return r.kind === "created" ? { kind: "created", paymentId: String(r.payment.id) } : r;
      },
      readAndApply: async (paymentId) => {
        const fresh = await mpGetPayment(paymentId); // re-read before applying
        if (!fresh) return null;
        const status = (await applyPayment(fresh)) ?? "unknown";
        if (status === "failed" && cooldownApplies(fresh.status_detail)) {
          const c6 = fresh.card?.first_six_digits, c4 = fresh.card?.last_four_digits;
          const key = c6 && c4 ? await cardFingerprint(fresh.payment_method_id ?? fd.data.payment_method_id, c6, c4) : fp;
          if (key)
            await supabaseAdmin.from("card_cooldowns").upsert({
              fingerprint: key,
              blocked_until: new Date(Date.now() + CARD_COOLDOWN_MS).toISOString(),
              reason: fresh.status_detail ?? null,
              updated_at: new Date().toISOString(),
            });
        }
        return { status, pix: pixOf(fresh) };
      },
    });
  });

/** Status of one specific purchase owned by the caller, always re-confirmed with Mercado Pago. "none" = safe to submit again (same server key). */
export const getPurchaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ purchaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select(
        "id, user_id, course_id, amount_cents, currency, payment_status, transaction_id, attempt_state, attempt_started_at, payment_provider, provider_status",
      )
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
      if (en?.status === "active")
        return { status: "paid", pix: null, amount_cents: p.amount_cents, currency: p.currency ?? "BRL" };
    }
    if (p.payment_provider === "stripe") {
      const st = await reconcileStripe(p);
      return { status: st === "cancelled" ? "failed" : st === "resumable" ? "pending" : st, pix: null };
    }
    const v = await viewOf(p);
    return { status: v.view as string, pix: v.view === "pending" ? v.pix : null };
  });

/**
 * Checkout without an account (campaign pages). Price comes from the database; Stripe collects the e-mail.
 * After Stripe confirms payment, the webhook binds the purchase to that e-mail's account (creating it by invite).
 */
export const createGuestCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1).max(120),
        origin: z.string().url().max(200),
        origem: z.string().max(40).regex(/^[a-z0-9_-]+$/).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripeCreateSession, GUEST_REF } = await import("./stripe.server");
    const origin = ALLOWED_ORIGIN.test(data.origin) ? data.origin : "https://outroangulo.com";
    const c = await loadSellable(data.slug);
    if (!c) throw new Error("Este curso não está à venda.");
    const { data: g, error } = await supabaseAdmin
      .from("guest_checkouts")
      .insert({ course_id: c.id, amount_cents: c.cents, currency: "BRL", origin: data.origem ?? null })
      .select("id")
      .single();
    if (error || !g) throw new Error("Não foi possível iniciar o pagamento.");
    const session = await stripeCreateSession(
      {
        purchaseId: g.id,
        ref: `${GUEST_REF}${g.id}`,
        title: c.title,
        amountCents: c.cents,
        successUrl: `${origin}/pagamento/concluido?curso=${c.slug}&pedido=${g.id}`,
        cancelUrl: `${origin}/${c.slug}`,
      },
      `guest:${g.id}`,
    );
    if (!session.url) throw new Error("Não foi possível iniciar o pagamento.");
    await supabaseAdmin.from("guest_checkouts").update({ session_id: session.id }).eq("id", g.id);
    return { checkout_url: session.url };
  });

/** Public status of one guest order (id is an unguessable UUID). Re-confirms with Stripe; returns only status + masked e-mail. */
export const getGuestStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { maskEmail } = await import("./checkout-logic");
    const read = () =>
      supabaseAdmin
        .from("guest_checkouts")
        .select("status, session_id, email, invited, amount_cents, currency")
        .eq("id", data.id)
        .maybeSingle();
    let { data: g } = await read();
    if (!g) return { status: "unknown" as const, email: null, invited: false };
    if (g.status === "pending" && g.session_id) {
      try {
        const { stripeGetSession, applyStripeSession } = await import("./stripe.server");
        const s = await stripeGetSession(g.session_id);
        if (s) await applyStripeSession(s);
        g = (await read()).data ?? g;
      } catch (e) {
        console.error("[stripe] guest reconcile failed", e instanceof Error ? e.message : "");
      }
    }
    return {
      status: g.status as "pending" | "paid" | "failed" | "cancelled",
      email: g.email ? maskEmail(g.email) : null,
      invited: g.invited,
    };
  });
