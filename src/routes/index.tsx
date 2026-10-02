import { createFileRoute, Link } from "@tanstack/react-router";
import { heroPhoto } from "@/lib/photos";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
} from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { publishedCoursesQuery, settingsQuery } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { Angle, SectionLabel } from "@/components/Angle";
import { RotatingWord } from "@/components/motion/Motion";
import { Entrada } from "@/components/home/Entrada";
import { Manifesto, Acontecendo, Ciclo, Problema, Pilares, PreviewRede } from "@/components/home/Thesis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outro Ângulo — Habilidades para a vida que não veio com manual" },
      { name: "description", content: "Aulas práticas, experiências reais e uma comunidade para aprender sobre networking, planejamento, comunicação e tomada de decisões." },
      { property: "og:title", content: "Outro Ângulo" },
      { property: "og:description", content: "Conhecimento, pessoas e oportunidades para quem quer construir alguma coisa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const TEMAS = [
  { t: "O que vale aprender antes dos 25" },
  { t: "Networking do zero" },
  { t: "Comunicar seu valor" },
  { t: "Planejamento que funciona" },
  { t: "Negociação e conversas difíceis" },
  { t: "Avaliar oportunidades e decidir" },
  { t: "Começar a empreender" },
  { t: "Tecnologia e IA no dia a dia" },
];

const FAQ: [string, string][] = [
  ["Para quem é o Outro Ângulo?", "Para jovens adultos que querem aprender o que a escola e a faculdade não cobrem. Se você tem mais de 25, também é bem-vindo — os temas valem para qualquer fase."],
  ["Criar uma conta já libera os cursos?", "Não. A conta dá acesso à sua área pessoal. Cada curso é liberado individualmente por matrícula."],
  ["Como funcionam as aulas?", "Cada curso é dividido em módulos com aulas em vídeo, materiais e uma atividade prática para aplicar o que você aprendeu."],
  ["Existe comunidade?", "Sim. Alunos matriculados participam de canais de conversa para trocar experiências e tirar dúvidas, com moderação e diretrizes claras."],
  ["Quanto custa?", "A oferta inicial está prevista com pagamento único. O valor e as condições aparecem na página de cada curso quando ele for publicado."],
];

function Home() {
  const courses = useQuery(publishedCoursesQuery);
  const settings = useQuery(settingsQuery);

  return (
    <PublicLayout>
      {/* Abertura */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.45fr_1fr] md:pb-28 md:pt-24">
          <div className="reveal">
            <SectionLabel>Conhecimento · Pessoas · Oportunidades</SectionLabel>
            <h1 className="display-xl mt-8">
              Existem coisas<br />importantes que
              <span className="mt-3 block pl-[8%] text-muted-foreground">
                ninguém te{" "}
                <span className="relative inline-block text-foreground">
                  ensina.
                  <span aria-hidden className="absolute -right-3 top-1 h-3 w-3 rotate-12 bg-highlight md:h-4 md:w-4" />
                </span>
              </span>
            </h1>
            <p className="mt-10 max-w-md text-lg leading-relaxed text-muted-foreground md:ml-[8%]">
              Conhecimento, pessoas e oportunidades para quem quer construir alguma coisa.
            </p>
            <p className="mt-6 flex items-baseline gap-3 font-display text-2xl font-extrabold md:ml-[8%]">
              <span className="eyebrow">Aprender a</span>
              <RotatingWord words={["negociar.", "conectar.", "vender.", "decidir.", "construir.", "investir.", "aprender."]} />
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 md:ml-[8%]">
              <Button asChild size="lg">
                <Link to="/trilhas">Explorar a plataforma <ArrowRight /></Link>
              </Button>
              <Link to="/conheca-a-comunidade" className="link-arrow nav-line text-sm">Conhecer a comunidade <ArrowRight className="h-4 w-4" /></Link>
            </div>
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

      <Entrada />
      <Problema />
      <Manifesto />
      <Pilares />
      <PreviewRede />
      <Acontecendo courses={courses.data ?? []} />
      <Ciclo />

      {/* Temas */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <SectionLabel n="01">Temas</SectionLabel>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl">O que você<br />aprende aqui</h2>
          </div>
          <ol className="grid border-t sm:grid-cols-2">
            {TEMAS.map(({ t }, i) => (
              <li key={t} className="group flex items-baseline gap-4 border-b py-5 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
                <span className="font-display text-xs font-bold tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-lg font-semibold leading-snug transition-transform duration-300 group-hover:translate-x-1">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Momento editorial */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-36">
          <p className="reveal max-w-4xl font-display text-4xl font-extrabold leading-[1.04] tracking-tight md:text-6xl">
            Ninguém te ensina<br />a construir uma rede
            <span className="block pl-[12%] text-ink-foreground/55">antes de você<br className="sm:hidden" /> precisar dela.</span>
          </p>
          <Angle className="mt-12 h-6 w-6 text-ink-foreground/70" />
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionLabel n="02">Como funciona</SectionLabel>
        <ol className="mt-12 grid gap-12 md:grid-cols-3 md:gap-0">
          {[
            ["Aprender", "Aulas curtas e diretas, organizadas em módulos. Assista no seu ritmo."],
            ["Aplicar", "Cada módulo termina com uma atividade concreta para levar à sua rotina."],
            ["Trocar", "Converse com outros alunos, participe de encontros e tire dúvidas com a equipe."],
          ].map(([t, d], i) => (
            <li key={t} className={`reveal md:px-8 md:first:pl-0 ${i > 0 ? "md:border-l" : ""} ${i === 1 ? "md:mt-10" : i === 2 ? "md:mt-20" : ""}`}>
              <span className="font-display text-5xl font-extrabold tabular-nums text-border">0{i + 1}</span>
              <h3 className="mt-3 text-2xl font-bold">{t}</h3>
              <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Cursos */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionLabel n="03">Catálogo</SectionLabel>
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
        <SectionLabel n="04">Fundadores</SectionLabel>
        <h2 className="mt-5 text-4xl font-extrabold md:text-5xl">Quem está por trás</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {(settings.data?.founders ?? []).map((f, i) => (
            <article key={f.name} className={`flex gap-6 ${i === 1 ? "md:mt-16" : ""}`}>
              <div className="frame-offset shrink-0">
                {f.photo_url ? (
                  <img src={f.photo_url} alt={`Foto de ${f.name}`} className="h-28 w-24 object-cover grayscale-[35%] transition duration-500 hover:grayscale-0" />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center bg-secondary font-display text-3xl font-extrabold text-muted-foreground" aria-hidden>
                    {f.name[0]}
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="text-2xl font-bold">{f.name}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{f.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_2fr] md:py-28">
          <div>
            <SectionLabel n="05">Dúvidas</SectionLabel>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.02]">Perguntas<br />frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="border-t">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left font-display text-lg font-semibold hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-20 md:flex-row md:items-end md:py-28">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.02] md:text-5xl">Olhe para a sua vida<br /><span className="pl-[10%] text-ink-foreground/60">de outro ângulo.</span></h2>
          <div className="flex flex-wrap items-center gap-6">
            <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
              <Link to="/auth" search={{ modo: "cadastro" }}>Criar conta</Link>
            </Button>
            <Link to="/cursos" className="link-arrow nav-line text-sm">Ver cursos <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
