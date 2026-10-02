import closePhoto from "@/assets/photo-close-comunidade.jpg";
import { createFileRoute, Link } from "@tanstack/react-router";
import heroPhoto from "@/assets/photo-comunidade-publica.jpg";
import { PublicLayout } from "@/components/PublicLayout";
import { ItemGrid } from "@/components/PublicPage";
import { Opening, RevealCard, Illustrative, Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { ScrollReveal } from "@/components/motion/Motion";

const T = "Comunidade — Outro Ângulo";
const D = "Você não precisa ter a resposta. Pode começar pela pergunta. Um espaço para perguntar, trocar e conhecer pessoas.";

export const Route = createFileRoute("/conheca-a-comunidade")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const PERGUNTAS = [
  { e: "Pergunta · Tecnologia", t: "Como encontrar um sócio técnico?", d: [{ k: "Temas", v: "Tecnologia, Startups" }, { k: "Tipo de resposta", v: "Experiências de quem já procurou" }] },
  { e: "Pedido de ajuda · Vendas", t: "Alguém revisa minha primeira proposta comercial?", d: [{ k: "Temas", v: "Vendas, Freelance" }, { k: "Como ajudar", v: "Responder ou chamar no privado" }] },
  { e: "Discussão · Negócios", t: "Empreender com sócio ou sozinho?", d: [{ k: "Temas", v: "Negócios, Decisões" }, { k: "Formato", v: "Prós e contras na prática" }] },
  { e: "Experiência · Carreira", t: "O que aprendi negociando meu primeiro salário", d: [{ k: "Temas", v: "Carreira, Negociação" }, { k: "Formato", v: "Relato + perguntas" }] },
];

const PESSOAS = [
  { n: "Ana", s: "Growth · São Paulo", b: "SaaS B2B", h: "Meta Ads, growth", p: "Co-founder técnico" },
  { n: "Rafael", s: "Desenvolvimento · Recife", b: "App para pequenos comércios", h: "Front-end, automações", p: "Alguém de vendas" },
  { n: "Júlia", s: "Design · Belo Horizonte", b: "Carreira freelance", h: "Identidade visual", p: "Primeiros clientes" },
];

const WHAT = [
  { title: "Perguntas e discussões", body: "Traga uma dúvida de uma aula ou de um desafio real e ouça outros ângulos." },
  { title: "Preciso de ajuda", body: "Peça ajuda de forma direta. Quem sabe responder pode chamar você no privado." },
  { title: "Pessoas", body: "Um diretório opcional mostra o que cada um pode compartilhar e quer aprender." },
  { title: "Diretrizes claras", body: "Respeito, nada de spam e moderação ativa da equipe." },
];

function Page() {
  return (
    <PublicLayout>
      <Opening photo={heroPhoto} label="Comunidade" a="Você não precisa ter a resposta." b="Pode começar pela pergunta." intro="A comunidade é onde o que você aprende vira conversa, troca e, às vezes, parceria. Ela é aberta a membros com conta criada." />

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionLabel n="01">Como uma conversa começa</SectionLabel>
          <Illustrative />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PERGUNTAS.map((p, i) => (
            <ScrollReveal key={p.t} delay={i * 100} className={i % 2 ? "md:mt-10" : ""}>
              <RevealCard eyebrow={p.e} title={p.t} details={p.d} />
            </ScrollReveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Passe o mouse ou toque para ver mais.</p>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <SectionLabel n="02">Pessoas</SectionLabel>
          <h2 className="mt-5 text-4xl font-extrabold md:text-5xl">Quem você precisa conhecer?</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PESSOAS.map((p) => (
              <RevealCard key={p.n} eyebrow={p.s} title={p.n} details={[{ k: "Construindo", v: p.b }, { k: "Pode ajudar", v: p.h }, { k: "Procura", v: p.p }]} cta={<Link to="/auth" search={{ modo: "cadastro" }} className="link-arrow">Conhecer pessoas assim →</Link>} />
            ))}
          </div>
          <div className="mt-6"><Illustrative /></div>
        </div>
      </section>

      <ItemGrid n="03" label="O que acontece por lá" items={WHAT} cols={2} />
      <Closing photo={closePhoto} a="Todo mundo sabe alguma coisa" b="que pode ser útil para outra pessoa." />
    </PublicLayout>
  );
}
