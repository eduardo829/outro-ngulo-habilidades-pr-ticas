import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaymentReturn } from "@/components/PaymentReturn";

export const Route = createFileRoute("/pagamento/falha")({
  validateSearch: z.object({ curso: z.string().max(120).optional(), compra: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Pagamento não concluído — Outro Ângulo" }, { name: "description", content: "Retorno do pagamento do seu curso no Outro Ângulo." }, { property: "og:title", content: "Pagamento não concluído — Outro Ângulo" }, { property: "og:description", content: "Retorno do pagamento do seu curso no Outro Ângulo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => { const { curso, compra } = Route.useSearch(); return <PaymentReturn kind="falha" slug={curso} purchaseId={compra} />; },
});
