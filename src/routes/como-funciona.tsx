import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { MemberLink } from "@/components/MemberLink";
import { Angle, SectionLabel } from "@/components/Angle";

export const Route = createFileRoute("/como-funciona")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Como funciona — Outro Ângulo" },
      { name: "description", content: "Entenda como o Outro Ângulo funciona: crie seu perfil, participe das comunidades, encontre especialistas e oportunidades e desenvolva seus projetos." },
      { property: "og:title", content: "Como funciona — Outro Ângulo" },
      { property: "og:description", content: "Crie seu perfil, participe das comunidades, encontre especialistas e oportunidades e desenvolva seus projetos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/como-funciona" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/como-funciona" }],
  }),
  component: ComoFuncionaPage,
});

const PASSOS = [
  ["Crie seu perfil", "O cadastro é gratuito. Conte quem você é, o que faz e o que quer construir."],
  ["Escolha seus interesses", "Seus interesses orientam as comunidades, os conteúdos e as conexões mais relevantes para você."],
  ["Participe das comunidades", "Publique, comente e troque experiências com pessoas no mesmo caminho — com moderação e diretrizes claras."],
  ["Encontre conhecimento, especialistas e oportunidades", "Cursos práticos na Academia, profissionais revisados pela equipe e oportunidades publicadas pelos próprios membros."],
  ["Desenvolva projetos e conexões", "Transforme ideias em parcerias, negócios e carreira — no seu ritmo, com apoio da rede."],
] as const;

const PECAS = [
  { t: "Comunidades", d: "Espaços moderados de conversa por interesse e objetivo.", to: "/comunidades" },
  { t: "Especialistas", d: "Profissionais qualificados para executar projetos com você.", to: "/especialistas" },
  { t: "Oportunidades", d: "Sócios, parcerias, serviços e projetos publicados pelos membros.", to: "/oportunidades" },
  { t: "Academia", d: "Cursos práticos com pagamento único, sem assinatura.", to: "/academia" },
] as const;

function ComoFuncionaPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-24">
        <SectionLabel>Como funciona</SectionLabel>
        <h1 className="display-xl mt-8 max-w-3xl">Aprenda. Conecte-se.<br /><span className="pl-[6%] text-muted-foreground">Construa.</span></h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          O Outro Ângulo é um ecossistema de conhecimento, conexões e oportunidades. A jornada é simples — e começa com uma conta gratuita.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <MemberLink to="/inicio" member="Ir para minha área" visitor="Criar conta gratuita" />
          </Button>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SectionLabel n="01">A jornada</SectionLabel>
          <ol className="mt-12 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {PASSOS.map(([t, d], i) => (
              <li key={t} className="border-t pt-6">
                <span className="font-display text-5xl font-extrabold tabular-nums text-border">0{i + 1}</span>
                <h3 className="mt-3 text-2xl font-bold">{t}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionLabel n="02">As partes do ecossistema</SectionLabel>
        <div className="mt-10 grid gap-px border bg-border sm:grid-cols-2">
          {PECAS.map(({ t, d, to }) => (
            <article key={t} className="group flex flex-col bg-background p-6 transition-colors duration-300 hover:bg-card">
              <h3 className="font-display text-xl font-bold">{t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              <Link to={to} className="link-arrow mt-5 text-sm">Conhecer <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-16 md:flex-row md:items-end md:py-24">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.02] md:text-5xl">Seu próximo passo pode começar<br /><span className="pl-[8%] text-ink-foreground/60">com uma conexão.</span></h2>
          <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
            <MemberLink to="/inicio" member="Ir para minha área" visitor="Fazer parte do Outro Ângulo" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
