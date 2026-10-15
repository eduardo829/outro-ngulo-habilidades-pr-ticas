import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { refreshMyPurchase } from "@/lib/checkout.functions";

type Kind = "sucesso" | "falha" | "pendente";
const COPY: Record<Kind, { eyebrow: string; title: string; text: string }> = {
  sucesso: { eyebrow: "Pagamento", title: "Recebemos seu retorno do Mercado Pago", text: "Estamos confirmando o pagamento direto com o Mercado Pago. O curso é liberado assim que a confirmação chegar." },
  pendente: { eyebrow: "Pagamento pendente", title: "Seu pagamento está em análise", text: "Assim que o Mercado Pago confirmar, o curso aparece em Meus cursos. Você não precisa pagar de novo." },
  falha: { eyebrow: "Pagamento não concluído", title: "O pagamento não foi aprovado", text: "Nenhum valor foi confirmado. Você pode tentar de novo com outra forma de pagamento." },
};

export function PaymentReturn({ kind, slug }: { kind: Kind; slug?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("checking");
  useEffect(() => {
    if (!user || !slug || kind === "falha") { setStatus("unknown"); return; }
    let n = 0; let stop = false;
    const tick = async () => {
      try { const r = await refreshMyPurchase({ data: { slug } }); setStatus(r.status); if (r.status === "paid") { qc.invalidateQueries({ queryKey: ["my-learning"] }); return; } } catch { setStatus("unknown"); }
      if (!stop && ++n < 6) setTimeout(tick, 4000);
    };
    tick();
    return () => { stop = true; };
  }, [user, slug, kind, qc]);
  const c = COPY[kind];
  const paid = status === "paid";
  return (
    <PublicLayout>
      <section className="mx-auto max-w-2xl px-5 py-20">
        <p className="eyebrow">{paid ? "Pagamento confirmado" : c.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">{paid ? "Seu curso está liberado" : c.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{paid ? "O pagamento foi confirmado pelo Mercado Pago. Bom estudo." : c.text}</p>
        {status === "checking" && kind !== "falha" && <p className="mt-4 text-sm text-muted-foreground">Confirmando…</p>}
        <p className="mt-3 text-xs text-muted-foreground">Ambiente de testes: nenhum valor real é cobrado.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {paid && slug ? <Button asChild size="lg"><Link to="/aprender/$slug" params={{ slug }}>Começar o curso</Link></Button>
            : slug ? <Button asChild size="lg" variant={kind === "falha" ? "default" : "outline"}><Link to="/cursos/$slug" params={{ slug }}>Voltar ao curso</Link></Button> : null}
          <Button asChild variant="outline" size="lg"><Link to="/meus-cursos">Meus cursos</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
