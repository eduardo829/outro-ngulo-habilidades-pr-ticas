import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createGuestCheckout } from "@/lib/checkout.functions";
import { ArrowRight, ArrowUpRight, Check, Lock } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getEngineCourse } from "@/lib/learning/courses";
import { getGestor } from "@/lib/gestores";
import { brl, useCoursePrices } from "@/lib/coursePrices";
import {
  buyTarget,
  checkoutErrorMessage,
  checkoutReturnPath,
  origemFromSearch,
} from "@/lib/checkout-logic";
import { coursePhoto } from "@/lib/photos";
import { trackConversionEvent } from "@/lib/meta-pixel";

const SLUG = "corretor-na-pratica";
const course = getEngineCourse(SLUG);

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
  const { user, loading } = useAuth();
  const { data: prices } = useCoursePrices();
  const price = brl(prices?.[SLUG]);
  const gestor = course?.gestor ? getGestor(course.gestor) : undefined;
  const buy = { ...buyTarget(SLUG), ...(origem ? { search: { origem } } : {}) };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const guestBuy = async () => {
    setBusy(true);
    setErr(null);
    void trackConversionEvent("InitiateCheckout");
    try {
      const r = await createGuestCheckout({
        data: { slug: SLUG, origin: window.location.origin, origem: origem ?? undefined },
      });
      window.location.href = r.checkout_url;
    } catch (e) {
      setBusy(false);
      setErr(checkoutErrorMessage(e));
    }
  };
  const BuyButton = ({
    className,
    label = "Comprar agora",
  }: {
    className?: string;
    label?: string;
  }) => {
    const cta = cn(
      "min-h-12 bg-highlight text-highlight-foreground hover:bg-highlight/90",
      className,
    );
    return user ? (
      <Button asChild size="lg" className={cta}>
        <Link {...buy}>
          {label}
          <ArrowRight />
        </Link>
      </Button>
    ) : (
      <Button size="lg" className={cta} onClick={guestBuy} disabled={busy || loading}>
        {busy ? "Abrindo pagamento seguro…" : label}
        <ArrowRight />
      </Button>
    );
  };
  const note = !user && (
    <p className="mt-3 text-sm leading-relaxed">
      Compre sem cadastro. Use seu e-mail no pagamento: após a confirmação, enviaremos o acesso e,
      se necessário, um link para criar sua senha.{" "}
      <Link
        to="/auth"
        search={{ redirect: checkoutReturnPath(SLUG, origem) }}
        className="underline underline-offset-4"
      >
        Já tenho conta
      </Link>
    </p>
  );

  if (!course)
    return (
      <PublicLayout>
        <p className="mx-auto max-w-6xl px-5 py-16">Curso não encontrado.</p>
      </PublicLayout>
    );

  const questions = [
    {
      q: "“O que o TTI não te ensina” é este curso?",
      a: `Sim. É a chamada da campanha para o curso ${course.title}, da Outro Ângulo${gestor ? `, com ${gestor.name}` : ""}.`,
    },
    {
      q: "O que está incluído?",
      a: `${course.commitment}. Ao longo do curso, você constrói o ${course.project}, incluindo seu plano de ação de 30 dias.`,
    },
    {
      q: "Preciso criar uma conta antes de comprar?",
      a: "Não. Você pode comprar usando seu e-mail na página de pagamento. Após a confirmação, o curso fica vinculado a esse e-mail. Se ainda não tiver conta, receberá um link para criar sua senha. Use um e-mail ao qual você tem acesso.",
    },
    {
      q: "É uma assinatura?",
      a: `Não. ${price ? `O valor é ${price}, em pagamento único por este curso.` : "É um pagamento único por este curso; confira o valor na página de pagamento."} Não há mensalidade ou assinatura.`,
    },
    {
      q: "Quando posso começar?",
      a: "O acesso é liberado após a confirmação do pagamento. Boleto depende da compensação bancária. Você encontra o curso na sua área, usando o mesmo e-mail informado na compra.",
    },
    {
      q: "Como funciona o pagamento?",
      a: "O pagamento é processado pelo Stripe. Confira os métodos e as condições disponíveis na página segura antes de concluir. Não guardamos dados do seu cartão.",
    },
    {
      q: "O curso garante vendas?",
      a: "Não. A entrega é educacional: conteúdo, exercícios e um plano de ação. Resultados comerciais dependem da sua execução, do atendimento e das condições do mercado. O curso não substitui a formação ou a habilitação profissional exigida para atuar.",
    },
  ];

  return (
    <PublicLayout>
      <div className="campaign-sales bg-background pb-20 md:pb-0">
        <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
          <img
            src={coursePhoto(SLUG)}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div aria-hidden className="photo-scrim-l absolute inset-0 -z-10" />
          <div className="mx-auto max-w-6xl px-5 py-10 md:py-16">
            <p className="eyebrow !text-highlight">O que o TTI não te ensina · Outro Ângulo</p>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.06] md:text-6xl">
              {course.title}
              <span className="text-highlight">.</span>
            </h1>
            <p className="mt-5 max-w-xl font-display text-2xl font-semibold leading-snug md:text-3xl">
              A formação abriu uma porta.
              <br />
              Agora, entre na prática.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-foreground/85">
              Entenda o cliente, conduza a negociação e organize seus próximos passos.{" "}
              {course.modules.length} episódios com exercícios para construir seu plano de corretor.
            </p>
            {gestor && (
              <Link
                to="/gestor/$slug"
                params={{ slug: gestor.slug }}
                className="mt-5 inline-flex items-center gap-3 text-sm font-medium underline-offset-4 hover:underline"
              >
                {gestor.photo && (
                  <img src={gestor.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                )}
                Com {gestor.name}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <BuyButton label="Quero sair da teoria" />
              <div>
                <p className="font-display text-2xl font-extrabold">
                  {price ?? "Consultando valor…"}
                </p>
                <p className="mt-1 text-xs text-ink-foreground/75">
                  Pagamento único · sem assinatura
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-lg text-sm text-ink-foreground/80">
              Compra sem cadastro · acesso após pagamento confirmado
            </p>
            {err && (
              <p role="alert" className="mt-3 max-w-lg text-sm">
                {err}
              </p>
            )}
            <nav
              aria-label="Nesta página"
              className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink-foreground/25 pt-5 text-sm"
            >
              <a href="#percurso" className="underline-offset-4 hover:underline">
                O que você aprende ↓
              </a>
              <a href="#seu-plano" className="underline-offset-4 hover:underline">
                Seu plano de corretor ↓
              </a>
              <a href="#duvidas" className="underline-offset-4 hover:underline">
                Dúvidas ↓
              </a>
            </nav>
          </div>
        </section>

        <div className="border-b bg-background">
          <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-5 py-6 md:py-8">
            {[
              [String(course.modules.length).padStart(2, "0"), "Episódios + exercícios"],
              ["01", "Projeto construído por você"],
              ["30", "Dias no seu plano de ação"],
            ].map(([n, text]) => (
              <div key={n} className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <dd className="font-display text-3xl font-extrabold text-primary md:text-4xl">
                  {n}
                </dd>
                <dt className="max-w-36 text-xs leading-relaxed text-muted-foreground md:text-sm">
                  {text}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <p className="eyebrow">Entre a formação e o primeiro atendimento</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            O cliente chegou. E agora?
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            É na conversa real que as dúvidas aparecem. Organize sua atuação antes de oferecer um
            imóvel, negociar ou decidir o próximo passo.
          </p>
          <div className="mt-8 grid gap-7 md:grid-cols-3">
            {[
              [
                "Por onde eu começo?",
                "Defina seu foco e um nicho inicial, em vez de tentar atender todo o mercado ao mesmo tempo.",
              ],
              [
                "O que eu pergunto?",
                "Entenda o momento e as necessidades do cliente antes de selecionar imóveis.",
              ],
              [
                "Qual é o próximo passo?",
                "Organize o atendimento, a negociação e o acompanhamento em um funil comercial.",
              ],
            ].map(([title, text], i) => (
              <article key={title} className="border-t pt-4">
                <p className="eyebrow">0{i + 1} /</p>
                <h3 className="mt-3 font-display text-xl font-bold">“{title}”</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="percurso" className="scroll-mt-20 bg-secondary">
          <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow">O caminho, episódio por episódio</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
                  Menos improviso. Mais direção.
                </h2>
              </div>
              <a href="#inscricao" className="link-arrow text-sm">
                Quero começar meu plano <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {course.commitment}. Cada etapa termina com uma entrega para o seu{" "}
              <strong className="text-foreground">{course.project}</strong>.
            </p>
            <ol className="mt-8 grid gap-x-10 md:grid-cols-2">
              {course.modules.map((m, i) => (
                <li key={m.key} className="grid grid-cols-[2rem_1fr] gap-3 border-t py-6">
                  <span className="font-display text-sm font-bold text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {m.question}
                    </p>
                    <p className="mt-3 flex items-start gap-2 text-sm font-medium">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {m.output.title}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="seu-plano"
          className="mx-auto grid max-w-6xl scroll-mt-20 gap-8 px-5 py-12 md:grid-cols-2 md:gap-16 md:py-16"
        >
          <div>
            <p className="eyebrow">Você termina com algo seu</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
              Assistir é o começo.
              <br />
              Aplicar faz a diferença.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Cada episódio termina com um exercício salvo no seu{" "}
              <strong className="text-foreground">{course.project}</strong>. Material para consultar
              e usar na sua rotina, não só uma aula assistida.
            </p>
            <a href="#inscricao" className="link-arrow mt-6 text-sm">
              Quero construir meu plano <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <ul>
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-3 border-b py-3 first:pt-0 last:border-b-0">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed">{o}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-ink text-ink-foreground">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 md:gap-16 md:py-16">
            <div>
              <p className="eyebrow !text-highlight">É para o seu momento?</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">
                Comece com mais clareza.
              </h2>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-bold">Está entrando no mercado</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-foreground/75">
                    Organize o que fazer depois da formação e antes de conduzir seus próximos
                    atendimentos.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Já atende, mas ainda improvisa</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-foreground/75">
                    Construa uma sequência para entender o cliente, conferir o produto e acompanhar
                    a negociação.
                  </p>
                </div>
              </div>
            </div>
            {gestor && (
              <div className="border-t border-ink-foreground/20 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                <p className="eyebrow !text-highlight">Quem conduz o curso</p>
                <div className="mt-5 flex items-center gap-4">
                  {gestor.photo && (
                    <img
                      src={gestor.photo}
                      alt={gestor.photoAlt ?? gestor.name}
                      loading="lazy"
                      className="h-20 w-20 rounded-sm object-cover"
                    />
                  )}
                  <div>
                    <h2 className="font-display text-2xl font-extrabold">{gestor.name}</h2>
                    <p className="mt-1 text-sm text-ink-foreground/70">{gestor.positioning}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-ink-foreground/80">
                  {gestor.biography[0]}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-foreground/80">
                  {gestor.tagline}
                </p>
                <Link
                  to="/gestor/$slug"
                  params={{ slug: gestor.slug }}
                  className="link-arrow mt-5 text-sm"
                >
                  Conheça o gestor <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section id="inscricao" className="scroll-mt-20 bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_1fr] md:gap-16 md:py-16">
            <div>
              <p className="eyebrow">Seu próximo passo começa aqui</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
                Da teoria ao seu
                <br />
                plano de ação.
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                Construa uma base para atender com mais clareza e organizar seus próximos 30 dias.
              </p>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Conteúdo e aplicação prática, sem promessa de vendas ou comissões. Seu resultado
                depende da sua execução e do contexto do mercado.
              </p>
            </div>
            <div className="border-t-2 border-primary pt-6">
              <p className="eyebrow">Curso completo · pagamento único</p>
              <h3 className="mt-3 font-display text-2xl font-extrabold">{course.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">O que o TTI não te ensina.</p>
              <p className="mt-5 font-display text-4xl font-extrabold">
                {price ?? "Consultando valor…"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Sem mensalidade. Sem assinatura.</p>
              <ul className="my-6 space-y-3 text-sm">
                {[
                  `${course.modules.length} episódios com exercícios práticos`,
                  `Construção do ${course.project}`,
                  "Plano de ação de 30 dias",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
              <BuyButton
                className="w-full"
                label={price ? `Quero acessar por ${price}` : "Ir para o pagamento"}
              />
              {note}
              {err && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {err}
                </p>
              )}
              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Pagamento seguro pelo Stripe. Acesso após confirmação. Boleto depende de
                  compensação bancária. Confira os métodos disponíveis no pagamento.
                </span>
              </p>
            </div>
          </div>
        </section>

        <section id="duvidas" className="scroll-mt-20 border-t bg-secondary">
          <div className="mx-auto grid max-w-6xl gap-7 px-5 py-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-16">
            <div>
              <p className="eyebrow">Antes do próximo passo</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">Ficou alguma dúvida?</h2>
            </div>
            <Accordion type="single" collapsible>
              {questions.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="gap-4 text-base font-semibold">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background px-5 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="shrink-0">
              <p className="font-display text-lg font-extrabold">{price ?? "Curso completo"}</p>
              <p className="text-xs text-muted-foreground">Pagamento único</p>
            </div>
            <BuyButton className="min-w-0" label="Quero começar" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
