import { createFileRoute } from "@tanstack/react-router";

// Stripe webhook: signature is verified over the RAW body before anything is processed.
// Pix and boleto confirm asynchronously (async_payment_succeeded); card usually completes at checkout.session.completed.
const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { stripeVerifyWebhook, stripeGetSession, applyStripeSession } = await import(
          "@/lib/stripe.server"
        );
        const ok = await stripeVerifyWebhook(raw, request.headers.get("stripe-signature"));
        if (!ok) return new Response("invalid signature", { status: 401 });
        let event: { type?: string; data?: { object?: { object?: string; id?: string } } };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("bad payload", { status: 400 });
        }
        const s = event.data?.object;
        if (s?.object === "checkout.session" && s.id && HANDLED.has(event.type ?? "")) {
          try {
            const full = await stripeGetSession(s.id); // never trust the event payload alone
            if (full) await applyStripeSession(full);
          } catch (e) {
            console.error("[stripe] webhook apply failed", s.id, e instanceof Error ? e.message : "");
            return new Response("retry", { status: 500 }); // Stripe retries until we confirm
          }
        }
        return new Response("ok");
      },
    },
  },
});
