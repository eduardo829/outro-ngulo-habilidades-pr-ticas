import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMyCourses } from "@/lib/student";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Meu início — Outro Ângulo" }, { name: "description", content: "Sua área no Outro Ângulo." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("display_name").eq("id", user!.id).single()).data,
  });
  const courses = useQuery({ queryKey: ["my-courses", user?.id], enabled: !!user, queryFn: () => fetchMyCourses(user!.id) });
  const news = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  const first = (profile.data?.display_name ?? "").split(" ")[0];
  const cont = courses.data?.find((c) => c.lastLesson) ?? courses.data?.[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 md:px-8">
      <div>
        <h1 className="text-3xl font-extrabold">Olá{first ? `, ${first}` : ""}.</h1>
        <p className="mt-1 text-muted-foreground">Bom te ver por aqui.</p>
      </div>

      {courses.isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : cont ? (
        <section className="relative overflow-hidden rounded-xl bg-ink p-6 text-ink-foreground md:p-8">
          <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rotate-12 rounded-2xl border-2 border-primary" />
          <p className="text-sm opacity-70">Continuar aprendendo</p>
          <h2 className="mt-1 text-2xl font-bold">{cont.title}</h2>
          {cont.lastLesson && <p className="mt-1 opacity-80">Última aula: {cont.lastLesson.title}</p>}
          <div className="mt-4 max-w-sm"><Progress value={cont.pct} className="bg-ink-foreground/20" aria-label={`Progresso ${cont.pct}%`} /></div>
          <p className="mt-1 text-xs opacity-70">{cont.completed} de {cont.total} aulas concluídas</p>
          <Button asChild className="mt-5 bg-highlight text-highlight-foreground hover:bg-highlight/90">
            {cont.lastLesson ? (
              <Link to="/aula/$lessonId" params={{ lessonId: cont.lastLesson.id }}><PlayCircle /> Continuar aprendendo</Link>
            ) : (
              <Link to="/curso/$slug" params={{ slug: cont.slug }}><PlayCircle /> Começar o curso</Link>
            )}
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed bg-card p-8">
          <h2 className="text-xl font-bold">Você ainda não tem cursos liberados</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Sua conta está criada. Os cursos são liberados por matrícula — confira o catálogo e entre na lista de interesse dos que chamarem sua atenção.
          </p>
          <Button asChild className="mt-4"><Link to="/cursos">Ver catálogo</Link></Button>
        </section>
      )}

      {courses.data && courses.data.length > 0 && (
        <section>
          <h2 className="text-xl font-bold">Seus cursos</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.data.map((c) => (
              <li key={c.id}>
                <Link to="/curso/$slug" params={{ slug: c.slug }} className="block rounded-lg border bg-card p-5 hover:border-primary">
                  <p className="font-semibold">{c.title}</p>
                  <Progress value={c.pct} className="mt-3" aria-label={`Progresso ${c.pct}%`} />
                  <p className="mt-1 text-xs text-muted-foreground">{c.pct}% · {c.completed}/{c.total} aulas</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold"><Megaphone className="h-5 w-5 text-primary" aria-hidden />Avisos da equipe</h2>
        {news.data && news.data.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {news.data.map((a) => (
              <li key={a.id} className="rounded-lg border bg-card p-4">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum aviso por enquanto.</p>
        )}
      </section>
    </div>
  );
}
