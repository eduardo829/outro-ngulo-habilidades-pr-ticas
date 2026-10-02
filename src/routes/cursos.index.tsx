import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";
import { CourseCard } from "@/components/CourseCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { publishedCoursesQuery } from "@/lib/queries";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — Outro Ângulo" },
      { name: "description", content: "Catálogo de cursos práticos do Outro Ângulo: networking, planejamento, comunicação, negociação e IA." },
      { property: "og:title", content: "Cursos — Outro Ângulo" },
      { property: "og:description", content: "Catálogo de cursos práticos para a vida adulta." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { data, isLoading, error } = useQuery(publishedCoursesQuery);
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-extrabold">Cursos</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Cada curso combina aulas em vídeo, materiais e atividades práticas.</p>
        {isLoading && <p className="mt-10 text-muted-foreground">Carregando cursos…</p>}
        {error && <p className="mt-10 text-destructive">Não foi possível carregar os cursos agora.</p>}
        {data && data.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
        {data && data.length === 0 && (
          <div className="mt-10 grid gap-8 rounded-lg border bg-card p-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Ainda não há cursos publicados.</h2>
              <p className="mt-2 text-muted-foreground">
                Estamos preparando os primeiros cursos. Deixe seu e-mail para receber um aviso quando abrirem.
              </p>
            </div>
            <WaitlistForm />
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
