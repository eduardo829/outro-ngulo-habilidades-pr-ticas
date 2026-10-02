import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMyCourses } from "@/lib/student";
import { PageHeader } from "@/components/AppShell";
import { CourseCover } from "@/components/CourseCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/meus-cursos")({
  head: () => ({ meta: [{ title: "Meus cursos — Outro Ângulo" }, { name: "description", content: "Cursos em que você está matriculado." }] }),
  component: MyCourses,
});

function MyCourses() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["my-courses", user?.id], enabled: !!user, queryFn: () => fetchMyCourses(user!.id) });
  return (
    <>
      <PageHeader title="Meus cursos" />
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <Link to="/meu-espaco" className="mb-6 flex items-center justify-between border-l-2 border-highlight bg-card p-4 text-sm hover:underline"><span><b>Meu espaço → Meus projetos</b> · tudo o que você construiu nos cursos</span><span aria-hidden>→</span></Link>
        {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !data?.length ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-center">
            <p className="font-semibold">Nenhuma matrícula ativa.</p>
            <Button asChild className="mt-4"><Link to="/cursos">Ver catálogo</Link></Button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {data.map((c) => (
              <li key={c.id}>
                <Link to="/curso/$slug" params={{ slug: c.slug }} className="block overflow-hidden rounded-lg border bg-card hover:border-primary">
                  <CourseCover title={c.title} cover={c.cover_url} />
                  <div className="p-5">
                    <p className="font-display text-lg font-bold">{c.title}</p>
                    <Progress value={c.pct} className="mt-3" aria-label={`Progresso ${c.pct}%`} />
                    <p className="mt-1 text-xs text-muted-foreground">{c.pct}% concluído</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
