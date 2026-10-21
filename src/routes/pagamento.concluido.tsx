import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Mail } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { getGuestStatus } from "@/lib/checkout.functions";

export const Route = createFileRoute("/pagamento/concluido")({
  validateSearch: z.object({
    curso: z.string().max(120).optional(),
    pedido: z.string().uuid().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Compra concluída — Outro Ângulo" },
      { name: "description", content: "Confirmação da compra do seu curso no Outro Ângulo." },
      { property: "og:title", content: "Compra concluída — Outro Ângulo" },
      { property: "og:description", content: "Confirmação da compra do seu curso no Outro Ângulo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestDone,
});

type St = Awaited<ReturnType<typeof getGuestStatus>>;

function GuestDone() {
  const { curso, pedido } = Route.useSearch();
  const [st, setSt] = useState<St | null>(null);

  useEffect(() => {
    if (!pedido) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await getGuestStatus({ data: { id: pedido } });
        if (stop) return;
        setSt(r);
        if (r.status === "pending") setTimeout(tick, 5000);
      } catch {
        if (!stop) setTimeout(tick, 5000);
      }
    };
    tick();
    return () => {
      stop = true;
    };
  }, [pedido]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-5 py-16" aria-live="polite">
        <p className="eyebrow">Pagamento</p>
        {!pedido || st?.status === "unknown" ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">Pedido não encontrado</h1>
            <p className="mt-3 text-muted-foreground">
              Se você pagou, o link de acesso chega no e-mail usado na compra.
            </p>
          </>
        ) : !st || st.status === "pending" ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">Confirmando seu pagamento…</h1>
            <p className="mt-3 text-muted-foreground">
              Pix e cartão confirmam em instantes; boleto, após a compensação do banco. Esta página
              atualiza sozinha. Você não precisa pagar de novo.
            </p>
          </>
        ) : st.status === "paid" ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">Compra confirmada. Seu curso está liberado.</h1>
            {st.invited ? (
              <>
                <p className="mt-4 flex gap-2 text-lg">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    Enviamos um link para <strong>{st.email}</strong>. Abra o e-mail, clique no link e
                    crie sua senha: a conta já vem com o curso.
                  </span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Não chegou em alguns minutos? Veja a caixa de spam ou peça um novo link em{" "}
                  <Link to="/recuperar-senha" className="underline">recuperar senha</Link>.
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg">
                  O e-mail <strong>{st.email}</strong> já tinha conta no Outro Ângulo. O curso foi
                  adicionado a ela: é só entrar.
                </p>
                <Button asChild size="lg" className="mt-6">
                  <Link to="/auth" search={curso ? { redirect: `/aprender/${curso}` } : {}}>
                    Entrar e começar
                  </Link>
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">O pagamento não foi concluído</h1>
            <p className="mt-3 text-muted-foreground">Nada foi cobrado. Você pode tentar de novo.</p>
            {curso && (
              <Button asChild className="mt-6">
                <a href={`/${curso}`}>Tentar novamente</a>
              </Button>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
