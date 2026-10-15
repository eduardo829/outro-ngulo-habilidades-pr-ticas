import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaymentReturn } from "@/components/PaymentReturn";

export const Route = createFileRoute("/pagamento/pendente")({
  validateSearch: z.object({ curso: z.string().max(120).optional(), compra: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Pagamento pendente — Outro Ângulo" }, { name: "description", content: "Retorno do pagamento do seu curso no Outro Ângulo." }, { property: "og:title", content: "Pagamento pendente — Outro Ângulo" }, { property: "og:description", content: "Retorno do pagamento do seu curso no Outro Ângulo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => { const { curso, compra } = Route.useSearch(); return <PaymentReturn kind="pendente" slug={curso} purchaseId={compra} />; },
});
