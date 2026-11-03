import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { MemberLink } from "@/components/MemberLink";
import { supabase } from "@/integrations/supabase/client";
import { Angle, SectionLabel } from "@/components/Angle";

export const Route = createFileRoute("/especialistas")({
  head: () => ({
    meta: [
      { title: "Especialistas — Outro Ângulo" },
      { name: "description", content: "Encontre profissionais qualificados de IA, tecnologia, marketing, gestão, contabilidade e outras áreas para executar seus projetos." },
      { property: "og:title", content: "Especialistas — Outro Ângulo" },
      { property: "og:description", content: "Encontre profissionais qualificados para executar seus projetos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/especialistas" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/especialistas" }],
  }),
  component: EspecialistasPage,
});

const AREAS = ["IA e tecnologia", "Marketing", "Gestão", "Contabilidade e finanças", "Advocacia", "Design e conteúdo"] as const;

function EspecialistasPage() {
  const hasSpecialists = useQuery({
    queryKey: ["has-specialists"],
    staleTime: 300_000,
    queryFn: async () => (await supabase.rpc("has_public_specialists")).data === true,
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-24">
        <SectionLabel>Especialistas</SectionLabel>
        <h1 className="display-xl mt-8 max-w-3xl">Encontre quem<br /><span className="pl-[6%] text-muted-foreground">sabe fazer.</span></h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Profissionais qualificados para ajudar você a executar projetos — do planejamento à entrega. Cada perfil passa por revisão da equipe antes de aparecer no diretório.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button asChild size="lg">
            <MemberLink to="/app/especialistas" member="Encontrar um especialista" visitor="Encontrar um especialista" />
          </Button>
          <MemberLink to="/app/especialistas" member="Quero oferecer meus serviços" visitor="Quero oferecer meus serviços" className="link-arrow nav-line text-sm" />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SectionLabel n="01">Áreas</SectionLabel>
          <ul className="mt-10 grid border-t sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map((a) => (
              <li key={a} className="flex items-baseline gap-3 border-b py-5 sm:pr-6">
                <Angle className="translate-y-0.5" />
                <span className="font-display text-lg font-semibold leading-snug">{a}</span>
              </li>
            ))}
          </ul>
          {!hasSpecialists.data && (
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
              O diretório está em formação. Crie sua conta para ser avisado quando os primeiros especialistas forem publicados — ou candidate-se para ser um deles.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionLabel n="02">Como funciona</SectionLabel>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["Descreva o que precisa", "Conte o projeto, o orçamento e o prazo — para o diretório ou para um especialista específico."],
            ["A equipe encaminha", "Sua solicitação chega aos especialistas compatíveis, revisada pela equipe."],
            ["Vocês conversam", "Se o especialista aceitar, uma conversa é aberta dentro da plataforma."],
          ].map(([t, d], i) => (
            <li key={t}>
              <span className="font-display text-4xl font-extrabold tabular-nums text-border">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Perfis com o selo "Verificado pelo Outro Ângulo" passaram por uma checagem adicional da equipe. A negociação e a contratação acontecem diretamente entre você e o profissional.
        </p>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-16 md:flex-row md:items-end md:py-24">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.02] md:text-5xl">É profissional?<br /><span className="pl-[8%] text-ink-foreground/60">Ofereça seus serviços.</span></h2>
          <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
            <MemberLink to="/app/especialistas" member="Abrir meu painel de especialista" visitor="Quero ser especialista" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
