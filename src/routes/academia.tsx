import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { MemberLink } from "@/components/MemberLink";
import { publishedCoursesQuery } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { Angle, SectionLabel } from "@/components/Angle";

export const Route = createFileRoute("/academia")({
  head: () => ({
    meta: [
      { title: "Academia — Outro Ângulo" },
      { name: "description", content: "Cursos práticos, desafios e conteúdos para desenvolver habilidades que a escola não ensina." },
      { property: "og:title", content: "Academia — Outro Ângulo" },
      { property: "og:description", content: "Cursos práticos, desafios e conteúdos para desenvolver habilidades que a escola não ensina." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/academia" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/academia" }],
  }),
  component: AcademiaPage,
});

function AcademiaPage() {
  const courses = useQuery(publishedCoursesQuery);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-24">
        <SectionLabel>Academia</SectionLabel>
        <h1 className="display-xl mt-8 max-w-3xl">Aprenda habilidades<br /><span className="pl-[6%] text-muted-foreground">que a escola não ensina.</span></h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Cursos práticos e diretos, com aulas em vídeo, materiais e atividades para aplicar no dia a dia. Cada curso é vendido separadamente, com pagamento único.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button asChild size="lg">
            <Link to="/cursos">Ver catálogo <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SectionLabel n="01">Cursos</SectionLabel>
          {courses.isLoading ? (
            <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Angle spin /> Carregando…</p>
          ) : courses.data && courses.data.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.data.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <div className="mt-10 border-l-2 border-highlight pl-6">
              <p className="font-display text-xl font-bold">Os primeiros cursos estão em preparação.</p>
              <p className="mt-2 text-muted-foreground">Entre na lista de interesse no catálogo para saber quando forem publicados.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionLabel n="02">Como funcionam os cursos</SectionLabel>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["Aulas curtas e diretas", "Organizadas em módulos, para assistir no seu ritmo."],
            ["Atividade prática", "Cada módulo termina com uma aplicação concreta para a sua rotina."],
            ["Acesso individual", "Cada curso é liberado por matrícula, após a confirmação do pagamento."],
          ].map(([t, d], i) => (
            <li key={t}>
              <span className="font-display text-4xl font-extrabold tabular-nums text-border">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Button asChild size="lg">
            <Link to="/cursos">Explorar cursos <ArrowRight /></Link>
          </Button>
          <MemberLink to="/inicio" member="Ir para minha área" visitor="Criar conta gratuita" className="link-arrow nav-line text-sm" />
        </div>
      </section>
    </PublicLayout>
  );
}
