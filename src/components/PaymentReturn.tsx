import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getPurchaseStatus, refreshMyPurchase } from "@/lib/checkout.functions";
import { returnView } from "@/lib/checkout-logic";

type Kind = "sucesso" | "falha" | "pendente";
// The page shown depends only on the status confirmed by the server, never on the redirect address.
const COPY = {
  checking: { eyebrow: "Pagamento", title: "Confirmando seu pagamento", text: "Estamos consultando o Mercado Pago. Isso leva alguns segundos." },
  pending: { eyebrow: "Pagamento pendente", title: "Seu pagamento está em análise", text: "Assim que o Mercado Pago confirmar, o curso aparece em Meus cursos. Você não precisa pagar de novo." },
  failed: { eyebrow: "Pagamento não concluído", title: "O pagamento não foi aprovado", text: "Nenhum valor foi confirmado. Você pode tentar de novo com outro cartão ou com Pix." },
  paid: { eyebrow: "Pagamento confirmado", title: "Seu curso está liberado", text: "O pagamento foi confirmado pelo Mercado Pago. Bom estudo." },
};

export function PaymentReturn({ slug, purchaseId }: { kind: Kind; slug?: string | undefined; purchaseId?: string | undefined }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("checking");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!user || (!slug && !purchaseId)) return;
    let n = 0; let stop = false;
    const tick = async () => {
      try {
        const r = purchaseId ? await getPurchaseStatus({ data: { purchaseId } }) : await refreshMyPurchase({ data: { slug: slug! } });
        setStatus(r.status);
        if (r.status === "paid") { qc.invalidateQueries({ queryKey: ["my-learning"] }); return; }
      } catch { /* keep checking */ }
      if (!stop && ++n < 8) setTimeout(tick, 4000); else setDone(true);
    };
    tick();
    return () => { stop = true; };
  }, [user, slug, purchaseId, qc]);
  let view = returnView(status);
  if (view === "checking" && done) view = "pending";
  const c = COPY[view];
  return (
    <PublicLayout>
      <section className="mx-auto max-w-2xl px-5 py-20" aria-live="polite">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">{c.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{!user ? "Entre na sua conta para ver o status da compra." : c.text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {view === "paid" && slug ? <Button asChild size="lg"><Link to="/aprender/$slug" params={{ slug }}>Começar o curso</Link></Button>
            : view === "failed" && slug ? <Button asChild size="lg"><Link to="/checkout/$slug" params={{ slug }}>Tentar novamente</Link></Button>
            : slug ? <Button asChild size="lg" variant="outline"><Link to="/cursos/$slug" params={{ slug }}>Voltar ao curso</Link></Button> : null}
          <Button asChild variant="outline" size="lg"><Link to="/meus-cursos">Meus cursos</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
