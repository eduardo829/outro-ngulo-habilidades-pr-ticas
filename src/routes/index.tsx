import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Compass, Users, Mic, CalendarCheck, Handshake, Scale, Lightbulb, Cpu, ArrowRight,
} from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { publishedCoursesQuery, settingsQuery } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outro Ângulo — Habilidades para a vida que não veio com manual" },
      { name: "description", content: "Aulas práticas, experiências reais e uma comunidade para aprender networking, planejamento, comunicação e decisões." },
      { property: "og:title", content: "Outro Ângulo" },
      { property: "og:description", content: "Habilidades para a vida que não veio com manual." },
    ],
  }),
  component: Home,
});

const TEMAS = [
  { icon: Compass, t: "O que vale aprender antes dos 25" },
  { icon: Users, t: "Networking do zero" },
  { icon: Mic, t: "Comunicar seu valor" },
  { icon: CalendarCheck, t: "Planejamento que funciona" },
  { icon: Handshake, t: "Negociação e conversas difíceis" },
  { icon: Scale, t: "Avaliar oportunidades e decidir" },
  { icon: Lightbulb, t: "Começar a empreender" },
  { icon: Cpu, t: "Tecnologia e IA no dia a dia" },
];

const FAQ: [string, string][] = [
  ["Para quem é o Outro Ângulo?", "Para jovens adultos que querem aprender o que a escola e a faculdade não cobrem. Se você tem mais de 25, também é bem-vindo — os temas valem para qualquer fase."],
  ["Criar uma conta já libera os cursos?", "Não. A conta dá acesso à sua área pessoal. Cada curso é liberado individualmente por matrícula."],
  ["Como funcionam as aulas?", "Cada curso é dividido em módulos com aulas em vídeo, materiais e uma atividade prática para aplicar o que você aprendeu."],
  ["Existe comunidade?", "Sim. Alunos matriculados participam de canais de conversa para trocar experiências e tirar dúvidas, com moderação e diretrizes claras."],
  ["Quanto custa?", "A oferta inicial está prevista como pagamento único. O valor e as condições aparecem na página de cada curso quando ele for publicado."],
];

function Home() {
  const courses = useQuery(publishedCoursesQuery);
  const settings = useQuery(settingsQuery);

  return (
    <PublicLayout>
      {/* Abertura */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.3fr_1fr] md:pt-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="h-2 w-2 rotate-45 bg-highlight ring-1 ring-ink/20" /> Habilidades para a vida que não veio com manual
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              Tem coisa que muda sua vida.{" "}
              <span className="relative inline-block">
                E nunca entrou na grade.
                <span aria-hidden className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-highlight/80 -z-10" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Aprenda a construir relações, fazer planos que saem do papel e reconhecer oportunidades — com aulas práticas, experiências reais e uma comunidade para trocar e aplicar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/cursos">Conhecer os cursos <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ modo: "cadastro" }}>Criar conta</Link>
              </Button>
            </div>
          </div>
          <div aria-hidden className="relative hidden md:block">
            <div className="absolute inset-6 rotate-6 rounded-xl border-2 border-primary" />
            <div className="absolute inset-6 -rotate-3 rounded-xl bg-ink p-8 text-ink-foreground">
              <p className="font-display text-sm uppercase tracking-widest opacity-60">Aprender · Aplicar · Trocar</p>
              <p className="mt-8 font-display text-3xl font-bold leading-tight">
                Mudar o ângulo é mudar o que você enxerga.
              </p>
              <span className="absolute bottom-8 right-8 h-10 w-10 rotate-12 rounded-md bg-highlight" />
            </div>
          </div>
        </div>
      </section>

      {/* Temas */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold">O que você aprende aqui</h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TEMAS.map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-start gap-3 bg-card p-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold">Como funciona</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["Aprender", "Aulas curtas e diretas, organizadas em módulos. Assista no seu ritmo."],
            ["Aplicar", "Cada módulo termina com uma atividade concreta para levar à sua rotina."],
            ["Trocar", "Converse com outros alunos, participe de encontros e tire dúvidas com a equipe."],
          ].map(([t, d], i) => (
            <li key={t} className="frame-offset rounded-lg border bg-card p-6">
              <span className="font-display text-sm font-bold text-primary">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Cursos */}
      <section className="bg-card border-y">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold">Cursos</h2>
            <Link to="/cursos" className="text-sm font-semibold text-primary hover:underline">Ver catálogo</Link>
          </div>
          {courses.isLoading ? (
            <p className="mt-8 text-muted-foreground">Carregando…</p>
          ) : courses.data && courses.data.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.data.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
              <p className="font-display text-lg font-bold">Os primeiros cursos estão em preparação.</p>
              <p className="mt-2 text-muted-foreground">Entre na lista de interesse no catálogo para saber quando forem publicados.</p>
              <Button asChild variant="outline" className="mt-4"><Link to="/cursos">Ir para o catálogo</Link></Button>
            </div>
          )}
        </div>
      </section>

      {/* Fundadores */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold">Quem está por trás</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(settings.data?.founders ?? []).map((f) => (
            <article key={f.name} className="flex gap-5 rounded-lg border bg-card p-6">
              {f.photo_url ? (
                <img src={f.photo_url} alt={`Foto de ${f.name}`} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-2xl font-bold text-muted-foreground" aria-hidden>
                  {f.name[0]}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{f.name}</h3>
                <p className="mt-1 text-muted-foreground">{f.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
          <h2 className="text-2xl font-bold md:text-3xl">Olhe para a sua vida de outro ângulo.</h2>
          <div className="flex gap-3">
            <Button asChild size="lg" variant="secondary"><Link to="/cursos">Ver cursos</Link></Button>
            <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
              <Link to="/auth" search={{ modo: "cadastro" }}>Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
