import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createGuestCheckout } from "@/lib/checkout.functions";
import { ArrowRight, Check, Lock } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getEngineCourse } from "@/lib/learning/courses";
import { getGestor } from "@/lib/gestores";
import { brl, useCoursePrices } from "@/lib/coursePrices";
import { buyTarget, origemFromSearch } from "@/lib/checkout-logic";
import { coursePhoto } from "@/lib/photos";

const SLUG = "corretor-na-pratica";
const course = getEngineCourse(SLUG)!;

export const Route = createFileRoute("/corretor-na-pratica")({
  validateSearch: (s: Record<string, unknown>): { origem?: string } => {
    const origem = origemFromSearch(s);
    return origem ? { origem } : {};
  },
  head: () => ({
    meta: [
      { title: "Corretor na prática — curso Outro Ângulo" },
      {
        name: "description",
        content:
          "Curso em 6 episódios para começar como corretor e conduzir vendas de imóveis com método. Acesso por curso, pagamento único, com cartão, Pix ou boleto.",
      },
      { property: "og:title", content: "Corretor na prática — curso Outro Ângulo" },
      {
        property: "og:description",
        content:
          "6 episódios com exercício prático em cada um. Ao final, seu plano de corretor: nicho, ficha do cliente, checagem de produto e financiamento, funil e plano de 30 dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignPage,
});

function CampaignPage() {
  const { origem } = Route.useSearch();
  const { user } = useAuth();
  const { data: prices } = useCoursePrices();
  const price = brl(prices?.[SLUG]);
  const gestor = course.gestor ? getGestor(course.gestor) : undefined;
  const buy = { ...buyTarget(SLUG), ...(origem ? { search: { origem } } : {}) };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const guestBuy = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await createGuestCheckout({
        data: { slug: SLUG, origin: window.location.origin, origem: origem ?? undefined },
      });
      window.location.href = r.checkout_url;
    } catch (e) {
      setBusy(false);
      setErr(e instanceof Error ? e.message : "Não foi possível iniciar o pagamento.");
    }
  };
  const BuyButton = ({ className }: { className?: string }) => {
    const cta = cn(
      "bg-highlight text-highlight-foreground hover:bg-highlight/90",
      className,
    );
    return user ? (
      <Button asChild size="lg" className={cta}>
        <Link {...buy}>
          Comprar agora
          <ArrowRight />
        </Link>
      </Button>
    ) : (
      <Button size="lg" className={cta} onClick={guestBuy} disabled={busy}>
        {busy ? "Abrindo pagamento seguro…" : "Comprar agora"}
        <ArrowRight />
      </Button>
    );
  };
  const note = !user && (
    <p className="mt-3 text-sm opacity-80">
      Não precisa criar conta antes. Depois do pagamento, enviamos ao seu e-mail um link para criar
      a senha, com o curso já liberado.{" "}
      <Link to="/auth" search={{ redirect: "/checkout/corretor-na-pratica" }} className="underline">
        Já tenho conta
      </Link>
    </p>
  );

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={coursePhoto(SLUG)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div aria-hidden className="photo-scrim-b absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="eyebrow !text-highlight">Corretores · curso individual</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
            {course.title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-snug text-ink-foreground/85">
            {course.thesis}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            {price && (
              <span className="font-display text-3xl font-extrabold md:text-4xl">{price}</span>
            )}
            <BuyButton />
          </div>
          {note}
          {err && <p role="alert" className="mt-3 text-sm">{err}</p>}
          <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink-foreground/70">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Pagamento único por curso, sem assinatura. Cartão, Pix ou boleto — o Pix libera o curso
            na hora.
          </p>
          <dl className="mt-10 grid gap-px border border-ink-foreground/15 text-sm sm:grid-cols-4">
            <div className="bg-ink/95 p-4">
              <dt className="eyebrow !text-ink-foreground/60">Episódios</dt>
              <dd className="mt-1 font-display text-lg font-bold">{course.modules.length}</dd>
            </div>
            <div className="bg-ink/95 p-4">
              <dt className="eyebrow !text-ink-foreground/60">Compromisso</dt>
              <dd className="mt-1">{course.commitment}</dd>
            </div>
            <div className="bg-ink/95 p-4">
              <dt className="eyebrow !text-ink-foreground/60">Você constrói</dt>
              <dd className="mt-1 font-semibold">{course.project}</dd>
            </div>
            <div className="bg-ink/95 p-4">
              <dt className="eyebrow !text-ink-foreground/60">Gestor</dt>
              <dd className="mt-1">
                {gestor ? (
                  <Link to="/gestor/$slug" params={{ slug: gestor.slug }} className="underline">
                    {gestor.name}
                  </Link>
                ) : (
                  "A confirmar"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">Ao final você terá</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold">
              Saindo do curso, cada entrega já está na sua mão
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada episódio termina num exercício prático salvo no seu{" "}
              <span className="font-semibold text-foreground">{course.project}</span>. O
              aprendizado vira material seu, não só aula assistida.
            </p>
          </div>
          <ul className="space-y-2">
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-2 border-b py-2 last:border-b-0">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="eyebrow !text-highlight">O percurso</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">
            {course.modules.length} episódios, um projeto: {course.finalPlan.title}
          </h2>
          <ol className="mt-8 divide-y divide-ink-foreground/15 border-y border-ink-foreground/15">
            {course.modules.map((m, i) => (
              <li key={m.key} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 py-4">
                <span className="font-display text-sm font-bold text-ink-foreground/60">
                  {String(i + 1).padStart(2, "0")} / {String(course.modules.length).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-lg font-bold md:text-xl">{m.title}</p>
                  <p className="mt-1 text-sm text-ink-foreground/70">“{m.question}”</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 text-center md:py-20">
        <p className="eyebrow">Comece agora</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
          {price ? `Acesso completo por ${price}` : "Acesso completo ao curso"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Pagamento único, acesso a este curso sem prazo de validade. Você começa pelo episódio 01
          assim que o pagamento é confirmado.
        </p>
        <BuyButton className="mt-8" />
        <div className="mx-auto max-w-xl text-muted-foreground">{note}</div>
        {err && <p role="alert" className="mt-3 text-sm text-destructive">{err}</p>}
        <p className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" aria-hidden />
          Processado pelo Stripe. Não guardamos dados do seu cartão.
        </p>
      </section>
    </PublicLayout>
  );
}
