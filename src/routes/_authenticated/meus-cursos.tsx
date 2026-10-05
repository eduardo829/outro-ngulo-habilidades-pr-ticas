import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchMyCourses } from "@/lib/student";
import { PageHeader } from "@/components/AppShell";
import { CourseCover } from "@/components/CourseCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { COURSES_ENGINE } from "@/lib/learning/courses";
import { courseState, ctaLabel, type CourseState } from "@/lib/learning/ownership";
import { useCourseCommerce, useMyLearning } from "@/lib/coursePrices";
import { requiredKeys, type Course } from "@/lib/learning/types";
import { coursePhoto } from "@/lib/photos";

export const Route = createFileRoute("/_authenticated/meus-cursos")({
  head: () => ({ meta: [{ title: "Meus cursos — Outro Ângulo" }, { name: "description", content: "Seus cursos: continuar, adquiridos, concluídos e lista de interesse." }] }),
  component: MyCourses,
});

type Row = { c: Course; state: CourseState; done: number; nextKey: string; last?: string | undefined };

function MyCourses() {
  const { user } = useAuth();
  const commerce = useCourseCommerce();
  const my = useMyLearning(user?.id);
  const legacy = useQuery({ queryKey: ["my-courses", user?.id], enabled: !!user, queryFn: () => fetchMyCourses(user!.id) });
  const engineSlugs = new Set(COURSES_ENGINE.map((c) => c.slug));

  const rows: Row[] = [];
  const interest: Course[] = [];
  if (commerce.data && my.data) {
    for (const c of COURSES_ENGINE) {
      const id = commerce.data[c.slug]?.id; if (!id) continue;
      const keys = new Set(my.data.keys[id] ?? []);
      const state = courseState(c, my.data.owned.has(id), [...keys]);
      if (state === "locked") { if (my.data.interest.has(id)) interest.push(c); continue; }
      const states = c.modules.map((m) => { const r = requiredKeys(m); return r.length > 0 && r.every((k) => keys.has(k)); });
      const nextIdx = states.findIndex((x) => !x);
      rows.push({ c, state, done: states.filter(Boolean).length, nextKey: c.modules[nextIdx < 0 ? 0 : nextIdx]!.key, last: my.data.last[id] });
    }
  }
  const continuing = rows.filter((r) => r.state === "in_progress").sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
  const acquired = rows.filter((r) => r.state === "owned");
  const completed = rows.filter((r) => r.state === "completed");
  const legacyRows = (legacy.data ?? []).filter((c) => !engineSlugs.has(c.slug));
  const loading = commerce.isLoading || my.isLoading;

  return (
    <>
      <PageHeader title="Meus cursos" />
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <Link to="/meu-espaco" className="mb-8 flex items-center justify-between border-l-2 border-highlight bg-card p-4 text-sm hover:underline"><span><b>Meu espaço → Meus projetos</b> · tudo o que você construiu nos cursos</span><span aria-hidden>→</span></Link>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : (
          <>
            {!rows.length && !legacyRows.length && (
              <div className="border border-dashed bg-card p-8 text-center">
                <p className="font-semibold">Você ainda não tem cursos.</p>
                <p className="mt-1 text-sm text-muted-foreground">Cada curso é liberado separadamente. Dá para experimentar a aula aberta de qualquer curso antes.</p>
                <Button asChild className="mt-4"><Link to="/cursos">Conhecer cursos</Link></Button>
              </div>
            )}
            <Section title="Continuar" rows={continuing} />
            <Section title="Adquiridos" rows={acquired} />
            <Section title="Concluídos" rows={completed} />
            {legacyRows.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow">Outros cursos em que você está matriculado</p>
                <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                  {legacyRows.map((c) => (
                    <li key={c.id}><Link to="/curso/$slug" params={{ slug: c.slug }} className="block overflow-hidden border bg-card hover:border-primary">
                      <CourseCover title={c.title} cover={c.cover_url} slug={c.slug} />
                      <div className="p-5"><p className="font-display text-lg font-bold">{c.title}</p><Progress value={c.pct} className="mt-3" aria-label={`Progresso ${c.pct}%`} /><p className="mt-1 text-xs text-muted-foreground">{c.pct}% concluído</p></div>
                    </Link></li>
                  ))}
                </ul>
              </section>
            )}
            {interest.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow">Tenho interesse</p>
                <ul className="mt-4 divide-y border-y">
                  {interest.map((c) => (
                    <li key={c.slug} className="flex items-center justify-between gap-4 py-4">
                      <div><p className="font-display font-bold">{c.title}</p><p className="text-sm text-muted-foreground">{c.thesis}</p></div>
                      <Button asChild size="sm" variant="outline"><Link to="/cursos/$slug" params={{ slug: c.slug }}>Conhecer curso</Link></Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <section className="mb-10">
      <p className="eyebrow">{title}</p>
      <ul className="mt-4 grid gap-px border bg-border sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.c.slug} className="flex flex-col bg-background">
            <img src={coursePhoto(r.c.slug)} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <p className="font-display text-lg font-extrabold leading-tight">{r.c.title}</p>
              <div className="mt-3 flex items-center gap-3"><div className="h-1 flex-1 bg-border"><div className="h-1 bg-primary" style={{ width: `${(r.done / r.c.modules.length) * 100}%` }} /></div><span className="text-xs">{r.done}/{r.c.modules.length} módulos</span></div>
              <p className="mt-2 text-xs text-muted-foreground">Projeto: {r.c.project}{r.last ? ` · último salvamento: ${new Date(r.last).toLocaleDateString("pt-BR")}` : ""}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button asChild size="sm"><Link to={r.state === "completed" ? "/aprender/$slug" : "/aprender/$slug/$modulo"} params={{ slug: r.c.slug, modulo: r.nextKey }}>{ctaLabel[r.state]}<ArrowRight /></Link></Button>
                <Button asChild size="sm" variant="ghost"><Link to="/aprender/$slug/espaco" params={{ slug: r.c.slug }}>Meu projeto</Link></Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
