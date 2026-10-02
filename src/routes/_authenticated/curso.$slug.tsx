import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { getEngineCourse } from "@/lib/learning/courses";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchCourseStructure } from "@/lib/course-structure";
import { LessonList } from "@/components/LessonList";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/curso/$slug")({
  head: () => ({ meta: [{ title: "Curso — Outro Ângulo" }, { name: "description", content: "Módulos e aulas do curso." }] }),
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  if (getEngineCourse(slug)) return <Navigate to="/aprender/$slug" params={{ slug }} replace />;
  return <LegacyCourse slug={slug} />;
}

function LegacyCourse({ slug }: { slug: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["course-app", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (!course) return null;
      return { course, ...(await fetchCourseStructure(course.id, user!.id)) };
    },
  });

  if (isLoading) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!data) return <div className="p-8"><p className="font-semibold">Curso não encontrado ou você não tem acesso a ele.</p><Button asChild className="mt-4"><Link to="/meus-cursos">Meus cursos</Link></Button></div>;

  const { course, modules, lessons, completed, enrolled } = data;
  const total = lessons.length;
  const done = lessons.filter((l) => completed.has(l.lesson_id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = lessons.find((l) => !completed.has(l.lesson_id) && (enrolled || l.is_preview));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <h1 className="text-3xl font-extrabold">{course.title}</h1>
      {course.subtitle && <p className="mt-1 text-muted-foreground">{course.subtitle}</p>}
      {enrolled ? (
        <div className="mt-6 rounded-lg border bg-card p-5">
          <Progress value={pct} aria-label={`Progresso ${pct}%`} />
          <p className="mt-2 text-sm text-muted-foreground">{done} de {total} aulas concluídas ({pct}%)</p>
          {next && <Button asChild className="mt-4"><Link to="/aula/$lessonId" params={{ lessonId: next.lesson_id }}>{done ? "Continuar" : "Começar"}</Link></Button>}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed bg-card p-5 text-sm">Você não está matriculado neste curso. Apenas aulas de apresentação estão abertas.</p>
      )}
      <div className="mt-8 rounded-lg border bg-card p-5">
        <LessonList modules={modules} lessons={lessons} completed={completed} enrolled={enrolled} />
      </div>
    </div>
  );
}
