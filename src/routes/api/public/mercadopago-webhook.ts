import { createFileRoute } from "@tanstack/react-router";

// Mercado Pago payment notifications. Signature is verified, then the payment is re-read from the API before any access change.
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
        const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : "");
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(dataId)) return new Response("bad request", { status: 400 });
        const { mpVerifySignature, mpSyncPayment } = await import("@/lib/mercadopago.server");
        if (!(await mpVerifySignature(request, dataId))) return new Response("invalid signature", { status: 401 });
        const type = url.searchParams.get("type") ?? body.type;
        if (type !== "payment") return new Response("ignored");
        try { await mpSyncPayment(dataId); } catch (e) { console.error("[mp webhook]", e); return new Response("error", { status: 500 }); }
        return new Response("ok");
      },
    },
  },
});
