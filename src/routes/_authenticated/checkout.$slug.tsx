import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/coursePrices";
import { createStripeCheckout, getCheckout, getPurchaseStatus } from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/checkout/$slug")({
  head: () => ({
    meta: [
      { title: "Pagamento do curso — Outro Ângulo" },
      { name: "description", content: "Finalize a compra do seu curso com cartão, Pix ou boleto." },
      { property: "og:title", content: "Pagamento do curso — Outro Ângulo" },
      { property: "og:description", content: "Finalize a compra do seu curso com cartão, Pix ou boleto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Info = Awaited<ReturnType<typeof getCheckout>>;

function CheckoutPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    getCheckout({ data: { slug } })
      .then(setInfo)
      .catch(() => setErr("Não foi possível carregar o pagamento."));
  }, [slug, reload]);

  // Legacy Mercado Pago payment still open/unknown: poll THAT purchase; reload the checkout once it resolves.
  const legacy = info?.state === "legacy" ? info : null;
  useEffect(() => {
    if (!legacy) return;
    const t = setInterval(async () => {
      try {
        if (!legacy.legacyPurchaseId) return setReload((n) => n + 1);
        const r = await getPurchaseStatus({ data: { purchaseId: legacy.legacyPurchaseId } });
        if (r.status === "paid") {
          qc.invalidateQueries({ queryKey: ["my-learning"] });
          setInfo({ state: "owned", slug: legacy.slug, title: legacy.title });
        } else if (r.status !== "pending" && r.status !== "unknown") setReload((n) => n + 1);
      } catch {
        /* keep waiting */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [legacy, qc]);

  // Stripe payment in progress (Pix/boleto awaiting confirmation): poll until the server confirms.
  const stripePending = info?.state === "stripe-pending" ? info : null;
  useEffect(() => {
    if (!stripePending) return;
    const t = setInterval(async () => {
      try {
        const r = await getPurchaseStatus({ data: { purchaseId: stripePending.purchaseId } });
        if (r.status === "paid") {
          qc.invalidateQueries({ queryKey: ["my-learning"] });
          setInfo({ state: "owned", slug: stripePending.slug, title: stripePending.title });
        } else if (r.status !== "pending" && r.status !== "unknown") setReload((n) => n + 1);
      } catch {
        /* keep waiting */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [stripePending, qc]);

  const pay = async () => {
    setRedirecting(true);
    setErr(null);
    try {
      const r = await createStripeCheckout({
        data: { slug, origin: window.location.origin },
      });
      window.location.href = r.checkout_url;
    } catch (e) {
      setRedirecting(false);
      setErr(e instanceof Error ? e.message : "Não foi possível iniciar o pagamento.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link
        to="/cursos/$slug"
        params={{ slug }}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar ao curso
      </Link>
      <p className="eyebrow mt-6">Pagamento</p>
      {!info && !err && <p className="mt-4 text-muted-foreground">Carregando…</p>}
      {err && !info && (
        <p role="alert" className="mt-4 text-destructive">
          {err}
        </p>
      )}
      {info?.state === "unavailable" && (
        <p className="mt-4">Este curso não está à venda no momento.</p>
      )}
      {legacy && (
        <div className="mt-4" aria-live="polite">
          <h1 className="font-display text-3xl font-extrabold">{legacy.title}</h1>
          <h2 className="mt-6 font-display text-xl font-bold">
            {legacy.phase === "pending"
              ? "Você já tem um pagamento em análise"
              : "Verificando seu pagamento…"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Encontramos um pagamento anterior deste curso ainda sem resposta final. Não pague de
            novo: esta página atualiza sozinha e libera o curso assim que ele for confirmado.
          </p>
        </div>
      )}
      {info?.state === "owned" && (
        <div className="mt-4">
          <h1 className="font-display text-3xl font-extrabold">
            Você já tem acesso a {info.title}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/aprender/$slug" params={{ slug }}>
              Ir para o curso
            </Link>
          </Button>
        </div>
      )}
      {stripePending && (
        <div className="mt-4" aria-live="polite">
          <h1 className="font-display text-3xl font-extrabold">{stripePending.title}</h1>
          <h2 className="mt-6 font-display text-xl font-bold">Pagamento em confirmação</h2>
          <p className="mt-2 text-muted-foreground">
            Estamos aguardando a confirmação do pagamento. O curso é liberado assim que ela chegar;
            você não precisa pagar de novo. Esta página atualiza sozinha.
          </p>
        </div>
      )}
      {info?.state === "ready" && (
        <>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{info.title}</h1>
          <div className="mt-6 flex items-baseline justify-between border-y py-4">
            <span className="text-muted-foreground">Pagamento único · acesso a este curso</span>
            <span className="font-display text-2xl font-bold">{brl(info.amount_cents)}</span>
          </div>
          <p className="mt-6 text-muted-foreground">
            Você será levado a uma página segura de pagamento com as opções cartão, Pix e boleto.
            Pix libera o curso na hora; boleto libera após a compensação do banco.
          </p>
          <Button size="lg" className="mt-6" onClick={pay} disabled={redirecting}>
            {redirecting ? "Abrindo pagamento seguro…" : "Ir para o pagamento"}
          </Button>
          {err && (
            <p role="alert" className="mt-4 text-destructive">
              {err}
            </p>
          )}
          <p className="mt-8 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Processado pelo Stripe. Não guardamos dados do seu cartão.
          </p>
        </>
      )}
    </div>
  );
}
