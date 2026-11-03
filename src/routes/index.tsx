import { MemberLink } from "@/components/MemberLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import { heroPhoto } from "@/lib/photos";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessagesSquare, BriefcaseBusiness, Handshake, BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { publishedCoursesQuery, settingsQuery } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { GESTORES } from "@/lib/gestores";
import { Angle, SectionLabel } from "@/components/Angle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outro Ângulo — Aprenda. Conecte-se. Construa." },
      { name: "description", content: "Aprenda com quem faz, encontre especialistas, conecte-se com empreendedores e descubra oportunidades para desenvolver suas ideias, sua carreira e seus negócios." },
      { property: "og:title", content: "Outro Ângulo — Aprenda. Conecte-se. Construa." },
      { property: "og:description", content: "Um ecossistema brasileiro de conhecimento, conexões e oportunidades." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/" }],
  }),
  component: Home,
});

const PILARES = [
  { icon: MessagesSquare, t: "Comunidades", d: "Conecte-se com pessoas que compartilham seus interesses e objetivos.", to: "/conheca-a-comunidade" },
  { icon: BriefcaseBusiness, t: "Especialistas", d: "Encontre profissionais de IA, tecnologia, marketing, gestão, contabilidade e outras áreas.", href: "#especialistas" },
  { icon: Handshake, t: "Startups e Oportunidades", d: "Descubra projetos, encontre parceiros e apresente suas ideias.", to: "/oportunidades" },
  { icon: BookOpen, t: "Academia", d: "Aprenda habilidades práticas por meio de cursos, desafios e conteúdos.", to: "/cursos" },
] as const;

const PASSOS = [
  ["Crie seu perfil", "Cadastro gratuito, em poucos minutos."],
  ["Escolha seus interesses", "Conte o que você quer aprender e construir."],
  ["Participe das comunidades", "Converse, publique e aprenda com quem está no mesmo caminho."],
  ["Encontre conhecimento, especialistas e oportunidades", "Cursos, profissionais qualificados e projetos em um só lugar."],
  ["Desenvolva projetos e conexões", "Transforme ideias em parcerias, negócios e carreira."],
] as const;

const PUBLICOS = [
  "Quem quer começar a empreender",
  "Quem já tem um pequeno negócio",
  "Profissionais que oferecem serviços especializados",
  "Quem busca sócios e parceiros de negócio",
  "Fundadores de startups",
  "Quem se interessa por IA, tecnologia e desenvolvimento profissional",
] as const;

function Home() {
  const courses = useQuery(publishedCoursesQuery);
  const settings = useQuery(settingsQuery);
  const communities = useQuery({
    queryKey: ["home-communities"],
    staleTime: 300_000,
    queryFn: async () => (await supabase.from("communities").select("slug, name, description, categories").eq("active", true).order("position")).data ?? [],
  });
  const hasSpecialists = useQuery({
    queryKey: ["has-specialists"],
    staleTime: 300_000,
    queryFn: async () => (await supabase.rpc("has_public_specialists")).data === true,
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.45fr_1fr] md:pb-28 md:pt-24">
          <div className="reveal">
            <SectionLabel>Aprenda · Conecte-se · Construa</SectionLabel>
            <h1 className="display-xl mt-8">
              Um novo ângulo para transformar
              <span className="mt-3 block pl-[8%] text-muted-foreground">
                suas ideias em{" "}
                <span className="relative inline-block text-foreground">
                  realidade.
                  <span aria-hidden className="absolute -right-3 top-1 h-3 w-3 rotate-12 bg-highlight md:h-4 md:w-4" />
                </span>
              </span>
            </h1>
            <p className="mt-10 max-w-md text-lg leading-relaxed text-muted-foreground md:ml-[8%]">
              Aprenda com quem faz, encontre especialistas, conecte-se com empreendedores e descubra oportunidades para desenvolver suas ideias, sua carreira e seus negócios.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 md:ml-[8%]">
              <Button asChild size="lg">
                <MemberLink to="/inicio" member="Ir para minha área" visitor="Explorar a plataforma" />
              </Button>
              <a href="#como-funciona" className="link-arrow nav-line text-sm">Como funciona <ArrowRight className="h-4 w-4" /></a>
            </div>
            <p className="eyebrow mt-10 md:ml-[8%]">Coisas que a escola não ensina.</p>
          </div>
          <div aria-hidden className="relative hidden md:block">
            <div className="absolute inset-x-8 top-1/2 h-[380px] -mt-[170px] ml-5 border border-primary/40" />
            <div className="absolute inset-x-8 top-1/2 isolate h-[380px] -mt-[190px] -rotate-[4deg] overflow-hidden bg-ink p-9 text-ink-foreground transition-transform duration-500 hover:-rotate-[2deg]">
              <img src={heroPhoto} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80" width={1600} height={1008} />
              <div aria-hidden className="photo-scrim-b absolute inset-0 -z-10" />
              <p className="eyebrow !text-ink-foreground/60">Aprender · Aplicar · Trocar</p>
              <p className="mt-10 font-display text-[2rem] font-bold leading-[1.08] tracking-tight">
                Mudar o ângulo<br />é mudar o que<br />você enxerga.
              </p>
              <Angle className="absolute bottom-8 right-8 h-8 w-8 text-ink-foreground/80" />
            </div>
          </div>
        </div>
        <div className="angle-rule mx-auto max-w-6xl px-5" />
      </section>

      {/* Ecossistema */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionLabel n="01">Um ecossistema de possibilidades</SectionLabel>
        <h2 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] md:text-5xl">Mais do que cursos.<br />Um lugar para construir.</h2>
        <div className="mt-12 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map(({ icon: Icon, t, d, ...link }) => (
            <article key={t} className="group flex flex-col bg-background p-6 transition-colors duration-300 hover:bg-card">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-display text-xl font-bold">{t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              {"to" in link ? (
                <Link to={link.to} className="link-arrow mt-5 text-sm">Conhecer <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <a href={link.href} className="link-arrow mt-5 text-sm">Conhecer <ArrowRight className="h-4 w-4" /></a>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <SectionLabel n="02">Como funciona</SectionLabel>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {PASSOS.map(([t, d], i) => (
              <li key={t} className={`reveal lg:px-5 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "lg:border-l" : ""}`}>
                <span className="font-display text-4xl font-extrabold tabular-nums text-border">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold leading-snug">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quem é */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <SectionLabel n="03">Para quem é</SectionLabel>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl">Para quem quer<br />construir algo</h2>
          </div>
          <ul className="grid border-t sm:grid-cols-2">
            {PUBLICOS.map((p) => (
              <li key={p} className="flex items-baseline gap-3 border-b py-5 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
                <Angle className="translate-y-0.5" />
                <span className="font-display text-lg font-semibold leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comunidades em destaque */}
      {communities.data && communities.data.length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionLabel n="04">Comunidades em destaque</SectionLabel>
                <h2 className="mt-5 text-4xl font-extrabold md:text-5xl">Conversas que<br />fazem diferença</h2>
              </div>
              <Link to="/conheca-a-comunidade" className="link-arrow text-sm">Conhecer <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {communities.data.slice(0, 3).map((c) => (
                <article key={c.slug} className="flex flex-col border-t-2 border-highlight pt-5">
                  <h3 className="font-display text-2xl font-bold">{c.name}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{c.description}</p>
                  {c.categories?.length > 0 && (
                    <p className="eyebrow mt-4">{c.categories.slice(0, 3).join(" · ")}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Especialistas */}
      <section id="especialistas" className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <SectionLabel n="05">Especialistas</SectionLabel>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <h2 className="text-4xl font-extrabold leading-[1.02] md:text-5xl">Encontre quem<br />sabe fazer</h2>
            <div>
              <p className="max-w-md text-lg leading-relaxed text-ink-foreground/75">
                Profissionais qualificados de IA, tecnologia, marketing, gestão, contabilidade e outras áreas para ajudar você a tirar projetos do papel.
              </p>
              {!hasSpecialists.data && (
                <p className="mt-4 max-w-md text-sm text-ink-foreground/60">O diretório está em formação. Crie sua conta para ser avisado quando os primeiros especialistas forem publicados.</p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
                  <MemberLink to="/especialistas" member="Encontrar um especialista" visitor="Encontrar um especialista" />
                </Button>
                <MemberLink to="/especialistas" member="Quero oferecer meus serviços" visitor="Quero oferecer meus serviços" className="link-arrow nav-line text-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Startups e parcerias */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <SectionLabel n="06">Startups e parcerias</SectionLabel>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl">Boas ideias<br />precisam de gente</h2>
          </div>
          <div>
            <ul className="grid border-t sm:grid-cols-2">
              {[
                "Procurar sócios para o seu negócio",
                "Encontrar parceiros técnicos",
                "Buscar colaboradores para o projeto",
                "Apresentar suas ideias",
                "Participar de novos negócios",
              ].map((t) => (
                <li key={t} className="flex items-baseline gap-3 border-b py-5 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
                  <Angle className="translate-y-0.5" />
                  <span className="font-display text-lg font-semibold leading-snug">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              O Outro Ângulo conecta pessoas e projetos. Não intermediamos investimentos nem garantimos acesso a investidores, financiamento ou retorno financeiro.
            </p>
            <Link to="/oportunidades" className="link-arrow mt-6 text-sm">Ver oportunidades <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Academia */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionLabel n="07">Academia</SectionLabel>
              <h2 className="mt-5 text-4xl font-extrabold md:text-5xl">Cursos</h2>
            </div>
            <Link to="/cursos" className="link-arrow text-sm">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {courses.isLoading ? (
            <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Angle spin /> Carregando…</p>
          ) : courses.data && courses.data.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.data.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <div className="mt-10 border-l-2 border-highlight pl-6">
              <p className="font-display text-xl font-bold">Os primeiros cursos estão em preparação.</p>
              <p className="mt-2 text-muted-foreground">Entre na lista de interesse no catálogo para saber quando forem publicados.</p>
              <Link to="/cursos" className="link-arrow mt-4 text-sm">Ir para o catálogo <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </div>
      </section>

      {/* Fundadores */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionLabel n="08">Quem está por trás</SectionLabel>
        <h2 className="mt-5 text-4xl font-extrabold md:text-5xl">Gestores</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {GESTORES.map((g, i) => {
            const saved = (settings.data?.founders ?? []).find((f) => f.name.split(" ")[0] === g.name.split(" ")[0]);
            const photo = g.photo ?? saved?.photo_url;
            const bio = g.biography.join(" ") || saved?.bio;
            return (
            <article key={g.slug} className={`flex gap-6 ${i === 1 ? "md:mt-16" : ""}`}>
              <div className="frame-offset shrink-0">
                {photo ? (
                  <img src={photo} alt={g.photoAlt ?? `Foto de ${g.name}`} loading="lazy" className="h-36 w-28 object-cover grayscale-[35%] transition duration-500 hover:grayscale-0" />
                ) : (
                  <div className="flex h-36 w-28 items-center justify-center bg-secondary font-display text-3xl font-extrabold text-muted-foreground" aria-hidden>{g.name[0]}</div>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="text-2xl font-bold">{g.name}</h3>
                <p className="eyebrow mt-1">{g.positioning}</p>
                <p className="mt-3 leading-relaxed text-muted-foreground">{bio}</p>
                <Link to="/gestor/$slug" params={{ slug: g.slug }} className="link-arrow mt-4 text-sm">Ver perfil<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      {/* Convite final */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-20 md:flex-row md:items-end md:py-28">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.02] md:text-5xl">Seu próximo passo pode começar<br /><span className="pl-[10%] text-ink-foreground/60">com uma conexão.</span></h2>
          <div className="flex flex-wrap items-center gap-6">
            <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
              <MemberLink to="/inicio" member="Ir para minha área" visitor="Fazer parte do Outro Ângulo" />
            </Button>
            <Link to="/cursos" className="link-arrow nav-line text-sm">Ver cursos <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
