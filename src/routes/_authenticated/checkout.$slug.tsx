import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/coursePrices";
import { getCheckout, getPurchaseStatus, payWithBrick } from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/checkout/$slug")({
  head: () => ({ meta: [
    { title: "Pagamento do curso — Outro Ângulo" },
    { name: "description", content: "Finalize a compra do seu curso com cartão ou Pix." },
    { property: "og:title", content: "Pagamento do curso — Outro Ângulo" },
    { property: "og:description", content: "Finalize a compra do seu curso com cartão ou Pix." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CheckoutPage,
});

type Info = Awaited<ReturnType<typeof getCheckout>>;
type Pix = { qr_code: string; qr_code_base64: string | null; ticket_url: string | null };
type Phase = { k: "form" } | { k: "processing" } | { k: "paid" } | { k: "pix"; pix: Pix } | { k: "pending" } | { k: "rejected" };

declare global { interface Window { MercadoPago?: new (key: string, o: { locale: string }) => { bricks: () => { create: (t: string, id: string, s: unknown) => Promise<{ unmount: () => void }> } } } }

function loadSdk() {
  return new Promise<void>((res, rej) => {
    if (window.MercadoPago) return res();
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2"; s.onload = () => res(); s.onerror = () => rej(new Error("sdk"));
    document.head.appendChild(s);
  });
}

function CheckoutPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ k: "form" });
  const [brickKey, setBrickKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const attempt = useRef<string>(crypto.randomUUID());

  useEffect(() => { getCheckout({ data: { slug } }).then(setInfo).catch(() => setErr("Não foi possível carregar o pagamento.")); }, [slug]);

  const ready = info?.state === "ready" && info.publicKey ? info : null;

  useEffect(() => {
    if (!ready || phase.k !== "form") return;
    let ctrl: { unmount: () => void } | null = null; let dead = false;
    loadSdk().then(async () => {
      if (dead || !window.MercadoPago) return;
      const mp = new window.MercadoPago(ready.publicKey!, { locale: "pt-BR" });
      ctrl = await mp.bricks().create("payment", "payment-brick", {
        initialization: { amount: ready.amount_cents / 100, ...(ready.email ? { payer: { email: ready.email } } : {}) },
        customization: { paymentMethods: { creditCard: "all", debitCard: "all", bankTransfer: ["pix"], maxInstallments: 12 } },
        callbacks: {
          onReady: () => {},
          onError: () => {},
          onSubmit: async ({ formData }: { formData: unknown }) => {
            setPhase({ k: "processing" });
            try {
              const r = await payWithBrick({ data: { purchaseId: ready.purchaseId, attemptId: attempt.current, formData } });
              if (r.status === "paid") { qc.invalidateQueries({ queryKey: ["my-learning"] }); setPhase({ k: "paid" }); }
              else if ("pix" in r && r.pix) setPhase({ k: "pix", pix: r.pix });
              else if (r.status === "pending") setPhase({ k: "pending" });
              else setPhase({ k: "rejected" });
            } catch { setPhase({ k: "rejected" }); }
          },
        },
      });
      if (dead) ctrl.unmount();
    }).catch(() => setErr("Não foi possível carregar o formulário de pagamento. Recarregue a página."));
    return () => { dead = true; ctrl?.unmount(); };
  }, [ready, phase.k, brickKey, qc]);

  // Pix / pending: poll this specific purchase; only the server confirms approval.
  useEffect(() => {
    if (!ready || (phase.k !== "pix" && phase.k !== "pending")) return;
    const t = setInterval(async () => {
      try { const r = await getPurchaseStatus({ data: { purchaseId: ready.purchaseId } }); if (r.status === "paid") { qc.invalidateQueries({ queryKey: ["my-learning"] }); setPhase({ k: "paid" }); } } catch { /* keep waiting */ }
    }, 5000);
    return () => clearInterval(t);
  }, [ready, phase.k, qc]);

  const retry = () => { attempt.current = crypto.randomUUID(); setBrickKey((k) => k + 1); setPhase({ k: "form" }); };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/cursos/$slug" params={{ slug }} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao curso</Link>
      <p className="eyebrow mt-6">Pagamento</p>
      {!info && !err && <p className="mt-4 text-muted-foreground">Carregando…</p>}
      {err && <p role="alert" className="mt-4 text-destructive">{err}</p>}
      {info?.state === "unavailable" && <p className="mt-4">Este curso não está à venda no momento.</p>}
      {info?.state === "owned" && <div className="mt-4"><h1 className="font-display text-3xl font-extrabold">Você já tem acesso a {info.title}</h1><Button asChild className="mt-6"><Link to="/aprender/$slug" params={{ slug }}>Ir para o curso</Link></Button></div>}
      {info?.state === "ready" && (
        <>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{info.title}</h1>
          <div className="mt-6 flex items-baseline justify-between border-y py-4">
            <span className="text-muted-foreground">Pagamento único · acesso a este curso</span>
            <span className="font-display text-2xl font-bold">{brl(info.amount_cents)}</span>
          </div>
          {!info.publicKey && <p role="alert" className="mt-6 text-muted-foreground">O pagamento dentro do site ainda não está disponível. Tente novamente mais tarde.</p>}
          {info.publicKey && phase.k === "form" && <div key={brickKey} id="payment-brick" className="mt-6" />}
          {phase.k === "processing" && <p className="mt-6" aria-live="polite">Processando pagamento…</p>}
          {phase.k === "paid" && <div className="mt-6" aria-live="polite"><h2 className="font-display text-2xl font-bold">Pagamento confirmado. Seu curso está liberado.</h2><Button asChild className="mt-4"><Link to="/aprender/$slug" params={{ slug }}>Começar o curso</Link></Button></div>}
          {phase.k === "rejected" && <div role="alert" className="mt-6"><h2 className="font-display text-xl font-bold">O pagamento não foi aprovado</h2><p className="mt-2 text-muted-foreground">Nenhum valor foi cobrado. Confira os dados, use outro cartão ou pague com Pix.</p><Button className="mt-4" onClick={retry}>Tentar novamente</Button></div>}
          {phase.k === "pending" && <div className="mt-6" aria-live="polite"><h2 className="font-display text-xl font-bold">Pagamento em análise</h2><p className="mt-2 text-muted-foreground">Estamos aguardando a confirmação do Mercado Pago. O curso é liberado assim que ela chegar; você não precisa pagar de novo.</p></div>}
          {phase.k === "pix" && (
            <div className="mt-6" aria-live="polite">
              <h2 className="font-display text-xl font-bold">Pague com Pix para liberar o curso</h2>
              <p className="mt-2 text-muted-foreground">Aguardando pagamento. Esta página atualiza sozinha quando o Mercado Pago confirmar.</p>
              {phase.pix.qr_code_base64 && <img src={`data:image/png;base64,${phase.pix.qr_code_base64}`} alt="QR Code Pix" className="mt-4 h-56 w-56 border" />}
              <label className="mt-4 block text-sm font-semibold" htmlFor="pix-code">Pix copia e cola</label>
              <textarea id="pix-code" readOnly value={phase.pix.qr_code} className="mt-1 h-24 w-full rounded border bg-background p-2 text-xs" />
              <Button variant="outline" className="mt-2" onClick={async () => { await navigator.clipboard.writeText(phase.pix.qr_code); setCopied(true); }}>{copied ? "Código copiado" : "Copiar código"}</Button>
            </div>
          )}
          <p className="mt-8 inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Processado pelo Mercado Pago. Não guardamos dados do seu cartão.</p>
        </>
      )}
    </div>
  );
}
