import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/PublicLayout";
import { CourseCover } from "@/components/CourseCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Button } from "@/components/ui/button";
import { formatBRL, settingsQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { getEngineCourse } from "@/lib/learning/courses";
import { EngineCoursePublic } from "@/components/learning/EngineCoursePublic";

export const Route = createFileRoute("/cursos/$slug")({
  head: ({ params }) => {
    const c = getEngineCourse(params.slug);
    const title = c ? `${c.title} — Curso Outro Ângulo` : "Curso — Outro Ângulo";
    const desc = c?.thesis ?? "Detalhes do curso, módulos e forma de acesso.";
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  const engine = getEngineCourse(slug);
  return engine ? <EngineCoursePublic c={engine} /> : <CourseDetail />;
}

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const settings = useQuery(settingsQuery);
  const q = useQuery({
    queryKey: ["course-public", slug, user?.id],
    queryFn: async () => {
      const { data: course, error } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!course) return null;
      const [{ data: modules }, { data: outline }] = await Promise.all([
        supabase.from("modules").select("id, title, description, position").eq("course_id", course.id).order("position"),
        supabase.rpc("course_outline", { _course: course.id }),
      ]);
      let enrolled = false;
      if (user) {
        const { data: e } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user.id).eq("status", "active").maybeSingle();
        enrolled = !!e;
      }
      return { course, modules: modules ?? [], outline: outline ?? [], enrolled };
    },
  });

  if (q.isLoading) return <PublicLayout><p className="mx-auto max-w-6xl p-10 text-muted-foreground">Carregando…</p></PublicLayout>;
  if (!q.data)
    return (
      <PublicLayout>
        <div className="mx-auto max-w-xl p-16 text-center">
          <h1 className="text-2xl font-bold">Curso não encontrado</h1>
          <p className="mt-2 text-muted-foreground">Ele pode ainda estar em preparação.</p>
          <Button asChild className="mt-6"><Link to="/cursos">Ver catálogo</Link></Button>
        </div>
      </PublicLayout>
    );

  const { course, modules, outline, enrolled } = q.data;
  const offer = settings.data?.offer;
  const price = course.price_cents ?? offer?.price_cents;
  const isDraft = course.status !== "published";

  return (
    <PublicLayout>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr]">
          <div>
            {isDraft && <p className="mb-3 inline-block rounded bg-highlight px-2 py-0.5 text-xs font-bold text-highlight-foreground">Em preparação</p>}
            <h1 className="text-4xl font-extrabold">{course.title}</h1>
            {course.subtitle && <p className="mt-3 text-lg opacity-80">{course.subtitle}</p>}
            {course.instructor && <p className="mt-4 text-sm opacity-70">Com {course.instructor}</p>}
            {(course.level || course.duration_text) && (
              <p className="mt-1 text-sm opacity-70">{[course.level, course.duration_text].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          <div className="overflow-hidden rounded-lg border border-ink-foreground/10">
            <CourseCover title={course.title} cover={course.cover_url} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {course.description && (
            <section>
              <h2 className="text-2xl font-bold">Sobre o curso</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{course.description}</p>
            </section>
          )}
          {course.objectives.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">O que você vai aprender</h2>
              <ul className="mt-4 space-y-2">
                {course.objectives.map((o) => (
                  <li key={o} className="flex gap-2"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />{o}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2 className="text-2xl font-bold">Módulos</h2>
            {modules.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Os módulos ainda não foram definidos.</p>
            ) : (
              <ol className="mt-4 divide-y rounded-lg border bg-card">
                {modules.map((m, i) => (
                  <li key={m.id} className="p-4">
                    <p className="font-semibold"><span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>{m.title}</p>
                    <ul className="mt-2 space-y-1 pl-8 text-sm text-muted-foreground">
                      {outline.filter((l) => l.module_id === m.id).map((l) => (
                        <li key={l.lesson_id} className="flex items-center gap-2">
                          {l.is_preview ? <PlayCircle className="h-4 w-4 text-primary" aria-label="Aula aberta" /> : <Lock className="h-3.5 w-3.5" aria-label="Exige matrícula" />}
                          {l.is_preview && user ? (
                            <Link to="/aula/$lessonId" params={{ lessonId: l.lesson_id }} className="hover:text-primary hover:underline">{l.title}</Link>
                          ) : l.title}
                          {l.duration_text && <span className="ml-auto text-xs">{l.duration_text}</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-lg border bg-card p-6 md:sticky md:top-24">
          {enrolled ? (
            <>
              <p className="font-semibold">Você está matriculado.</p>
              <Button asChild className="mt-4 w-full"><Link to="/curso/$slug" params={{ slug: course.slug }}>Acessar curso</Link></Button>
            </>
          ) : isDraft ? (
            <>
              <h2 className="text-lg font-bold">Este curso ainda está em preparação</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ele não está disponível para compra. Entre na lista para saber quando abrir.</p>
              <div className="mt-4"><WaitlistForm courseId={course.id} /></div>
            </>
          ) : (
            <>
              {price != null && <p className="font-display text-3xl font-extrabold">{formatBRL(price)}</p>}
              <p className="text-sm text-muted-foreground">{offer?.label ?? "Pagamento único"}</p>
              <p className="mt-4 text-sm text-muted-foreground">{course.access_policy}</p>
              {offer?.payments_enabled ? null : (
                <>
                  <p className="mt-4 rounded-md bg-secondary p-3 text-sm">
                    As inscrições on-line ainda não estão abertas. Entre na lista de interesse e avisaremos quando abrirem.
                  </p>
                  <div className="mt-4"><WaitlistForm courseId={course.id} /></div>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </PublicLayout>
  );
}
