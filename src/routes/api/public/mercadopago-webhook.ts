import { createFileRoute } from "@tanstack/react-router";

// Mercado Pago Order notifications. Signature is verified, then the order status is re-read from the API before any access change.
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string } };
        const dataId = url.searchParams.get("data.id") ?? body.data?.id ?? "";
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(dataId)) return new Response("bad request", { status: 400 });
        const { mpVerifySignature, mpSyncOrder } = await import("@/lib/mercadopago.server");
        if (!(await mpVerifySignature(request, dataId))) return new Response("invalid signature", { status: 401 });
        const type = url.searchParams.get("type") ?? body.type;
        if (type && type !== "order") return new Response("ignored");
        try { await mpSyncOrder(dataId); } catch (e) { console.error("[mp webhook]", e); return new Response("error", { status: 500 }); }
        return new Response("ok");
      },
    },
  },
});
