import { useState } from "react";
import catalogPhoto from "@/assets/photo-fazer.jpg";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CATEGORIES, COURSES_ENGINE, getEngineCourse } from "@/lib/learning/courses";
import { useMyProjects } from "@/lib/learning/progress";
import { getGestor } from "@/lib/gestores";
import type { Course } from "@/lib/learning/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { coursePhoto } from "@/lib/photos";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — Outro Ângulo" },
      { name: "description", content: "Menos conteúdo para assistir, mais conhecimento para usar. Cursos práticos de negócios, vendas, networking e IA." },
      { property: "og:title", content: "Cursos — Outro Ângulo" },
      { property: "og:description", content: "Aprenda um conceito, coloque em prática e construa algo que continua útil depois da última aula." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalog,
});

const gestorName = (c: Course) => (c.gestor ? getGestor(c.gestor)?.name : undefined) ?? "Gestor a confirmar";

function CourseCard({ c, i }: { c: Course; i: number }) {
  return (
    <Link to="/cursos/$slug" params={{ slug: c.slug }} className="group relative flex h-full flex-col bg-background p-6 transition-colors duration-300 hover:bg-card focus-visible:bg-card">
      <div className="photo-zoom relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden bg-ink">
        <img src={coursePhoto(c.slug)} alt="" loading="lazy" width={1200} height={800} className="h-full w-full object-cover opacity-90" />
        <div aria-hidden className="photo-scrim-b absolute inset-0 opacity-60" />
      </div>
      <span aria-hidden className="absolute right-0 top-0 z-10 h-6 w-6 border-r-2 border-t-2 border-transparent transition-colors duration-300 group-hover:border-highlight" />
      <div className="flex items-baseline justify-between gap-3"><p className="eyebrow">{String(i + 1).padStart(2, "0")} / {c.category}</p><p className="text-xs text-muted-foreground">{c.difficulty}</p></div>
      <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight">{c.title}</h3>
      <p className="mt-3 text-muted-foreground">{c.thesis}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
        <div><dt className="eyebrow">Gestor</dt><dd className="mt-1">{gestorName(c)}</dd></div>
        <div><dt className="eyebrow">Compromisso</dt><dd className="mt-1">{c.modules.length} módulos</dd></div>
        <div className="col-span-2"><dt className="eyebrow">Você constrói</dt><dd className="mt-1 font-display font-bold">{c.finalPlan.title}</dd></div>
      </dl>
      <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold">Explorar curso<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

function Catalog() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const { user } = useAuth();
  const mine = useMyProjects();
  const featured = getEngineCourse("da-ideia-aos-primeiros-clientes")!;
  const list = COURSES_ENGINE.filter((c) => cat === "Todos" || c.category === cat);
  return (
    <PublicLayout>
      <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 md:pt-24">
        <div aria-hidden className="photo-zoom absolute right-[-1.25rem] top-10 hidden h-[420px] w-[38%] overflow-hidden lg:block xl:right-[calc((100vw-72rem)/-2)]">
          <img src={catalogPhoto} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-0 left-0 h-1 w-24 bg-highlight" />
        </div>
        <p className="eyebrow">Cursos</p>
        <h1 className="relative mt-4 max-w-4xl lg:max-w-[58%] font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">Menos conteúdo para assistir.<br /><span className="text-muted-foreground">Mais conhecimento para usar.</span></h1>
        <p className="mt-6 max-w-2xl lg:max-w-[55%] text-lg text-muted-foreground">Aprenda um conceito, coloque em prática e construa algo que continua útil depois da última aula.</p>
      </section>

      {user && !!mine.data?.length && (
        <section className="mx-auto max-w-6xl px-5 pb-12">
          <p className="eyebrow">Continue de onde parou</p>
          <ul className="mt-4 grid gap-px border bg-border md:grid-cols-2">
            {mine.data.map((p) => (
              <li key={p.course.slug} className="bg-background p-5">
                <p className="font-display text-lg font-extrabold">{p.course.title}</p>
                <div className="mt-3 flex items-center gap-3"><div className="h-1 flex-1 bg-border"><div className="h-1 bg-primary" style={{ width: `${(p.done / p.total) * 100}%` }} /></div><span className="text-xs">{p.done}/{p.total}</span></div>
                <Button asChild size="sm" className="mt-4"><Link to="/aprender/$slug/$modulo" params={{ slug: p.course.slug, modulo: p.nextKey }}>Continuar<ArrowRight /></Link></Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <img src={coursePhoto(featured.slug)} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" />
        <div aria-hidden className="photo-scrim-l absolute inset-0 -z-10" />
        <Link to="/cursos/$slug" params={{ slug: featured.slug }} className="group mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div>
            <p className="eyebrow !text-highlight">Comece por aqui</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-5xl">{featured.title}</h2>
            <p className="mt-4 max-w-xl text-lg text-ink-foreground/75">{featured.thesis}</p>
            <p className="mt-6 text-sm text-ink-foreground/70">Com {gestorName(featured)} · {featured.modules.length} módulos · {featured.difficulty}</p>
            <span className="mt-8 inline-flex items-center gap-2 border border-ink-foreground/40 px-4 py-2 text-sm font-semibold transition-colors group-hover:bg-ink-foreground group-hover:text-ink">Explorar curso<ArrowRight className="h-4 w-4" /></span>
          </div>
          <ol className="space-y-2 border-l border-ink-foreground/20 pl-6 text-sm">
            <li className="eyebrow !text-ink-foreground/60">Você termina com</li>
            {featured.outcomes.map((o, i) => <li key={o} className="flex gap-3"><span className="w-6 font-display font-bold text-highlight">{String(i + 1).padStart(2, "0")}</span>{o}</li>)}
          </ol>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold">Explore os cursos</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
            {CATEGORIES.map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn("border px-3 py-1.5 text-sm transition-colors", cat === c ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{c}</button>)}
          </div>
        </div>
        {list.length ? (
          <div className="mt-8 grid gap-px border bg-border sm:grid-cols-2">{list.map((c) => <CourseCard key={c.slug} c={c} i={COURSES_ENGINE.indexOf(c)} />)}</div>
        ) : (
          <p className="mt-8 border-y py-10 text-muted-foreground">Ainda não há curso de <b>{cat}</b>. Está nos planos, sem data definida.</p>
        )}
      </section>
    </PublicLayout>
  );
}
