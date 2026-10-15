import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_ORIGIN = /^https:\/\/((www\.)?outroangulo\.com|[a-z0-9-]+\.lovable\.app)$/;

/** Creates a Mercado Pago Checkout Pro order for one course. Price is read from the database, never from the client. */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120), origin: z.string().url().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { mpCreateOrder } = await import("./mercadopago.server");
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

    const amount = (cents / 100).toFixed(2);
    const email = (context.claims as { email?: string }).email;
    const order = await mpCreateOrder({
      type: "online",
      processing_mode: "manual",
      total_amount: amount,
      external_reference: p.id,
      ...(email ? { payer: { email } } : {}),
      transactions: { payments: [{ amount }] },
      items: [{ title: c.title.slice(0, 120), unit_price: amount, quantity: 1, external_code: c.slug }],
      checkout_pro: {
        back_urls: {
          success: `${origin}/pagamento/sucesso?curso=${c.slug}`,
          failure: `${origin}/pagamento/falha?curso=${c.slug}`,
          pending: `${origin}/pagamento/pendente?curso=${c.slug}`,
        },
        auto_return: "approved",
      },
    }, p.id);

    await supabaseAdmin.from("purchases").update({ transaction_id: order.id }).eq("id", p.id);
    if (!order.checkout_url) throw new Error("Não foi possível iniciar o pagamento.");
    return { checkout_url: order.checkout_url };
  });

/** Lets the buyer re-check their own latest order on the return pages (status always confirmed with Mercado Pago). */
export const refreshMyPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mpSyncOrder } = await import("./mercadopago.server");
    const { data: c } = await supabaseAdmin.from("courses").select("id").eq("slug", data.slug).maybeSingle();
    if (!c) return { status: "unknown" };
    const { data: p } = await supabaseAdmin.from("purchases").select("transaction_id, payment_status")
      .eq("user_id", context.userId).eq("course_id", c.id).eq("payment_provider", "mercadopago")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!p?.transaction_id) return { status: "unknown" };
    if (p.payment_status === "paid") return { status: "paid" };
    return { status: (await mpSyncOrder(p.transaction_id)) ?? p.payment_status };
  });
