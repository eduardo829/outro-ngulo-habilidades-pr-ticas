import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEngineCourse } from "@/lib/learning/courses";
import { hasValue, useEngineAccess, useOutputs, type Outputs } from "@/lib/learning/store";
import { requiredKeys, type Course, type Module } from "@/lib/learning/types";
import { cn } from "@/lib/utils";

export function moduleState(m: Module, o: Outputs) {
  const req = requiredKeys(m);
  const done = req.filter((k) => hasValue(o[k])).length;
  return { done, total: req.length, complete: req.length > 0 && done === req.length };
}

export function courseProgress(c: Course, o: Outputs) {
  const states = c.modules.map((m) => moduleState(m, o));
  return { modules: states.filter((s) => s.complete).length, outputs: c.modules.filter((m) => hasValue(o[m.output.key])).length, states };
}

/** Gate (enrollment checked against the database) + data for every engine page.
 * Without access: the configured preview module opens; other modules show a locked overview (titles stay browsable). */
export function CourseGate({ slug, moduleKey, children }: { slug: string; moduleKey?: string; children: (c: Course, courseId: string, outputs: Outputs, preview?: boolean) => ReactNode }) {
  const course = getEngineCourse(slug);
  const access = useEngineAccess(slug);
  const preview = !access.data?.allowed && !!moduleKey && access.data?.previewKey === moduleKey;
  const outputs = useOutputs(access.data?.allowed || preview ? access.data?.courseId : null);
  if (!course) return <p className="p-8">Curso não encontrado.</p>;
  if (access.isLoading || ((access.data?.allowed || preview) && outputs.isLoading)) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!access.data?.courseId) return <p className="p-8">Curso não encontrado.</p>;
  if (!access.data.allowed && !preview) return <LockedCourse c={course} moduleKey={moduleKey} previewKey={access.data.previewKey} />;
  return <>
    {preview && <div className="border-b bg-highlight/30 px-5 py-3 text-center text-sm"><b>Aula aberta.</b> Você está experimentando este curso. O que salvar aqui fica guardado se você adquirir o curso depois. <Link to="/cursos/$slug" params={{ slug }} className="font-semibold underline">Conhecer o curso</Link></div>}
    {children(course, access.data.courseId, outputs.data ?? {}, preview)}
  </>;
}

function LockedCourse({ c, moduleKey, previewKey }: { c: Course; moduleKey?: string | undefined; previewKey: string | null }) {
  const i = Math.max(0, c.modules.findIndex((m) => m.key === moduleKey));
  const m = moduleKey ? c.modules[i] : undefined;
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      {m ? <>
        <p className="eyebrow">Módulo {String(i + 1).padStart(2, "0")}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">{m.title}</h1>
        <p className="mt-4 border-l-2 border-highlight pl-4 font-display text-lg font-bold">“{m.question}”</p>
        <p className="mt-3 text-muted-foreground">Neste módulo você produz: <b className="text-foreground">{m.output.title}</b>.</p>
      </> : <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>}
      <p className="mt-6 flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Conteúdo disponível neste curso.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link to="/cursos/$slug" params={{ slug: c.slug }}>Conhecer o curso</Link></Button>
        {previewKey && <Button asChild variant="outline"><Link to="/aprender/$slug/$modulo" params={{ slug: c.slug, modulo: previewKey }}>Experimentar a aula aberta</Link></Button>}
      </div>
      <ol className="mt-12 border-t">
        {c.modules.map((x, j) => (
          <li key={x.key} className="flex items-center gap-3 border-b py-3 text-sm">
            <span className="w-6 font-display font-bold">{String(j + 1).padStart(2, "0")}</span>
            {x.key === previewKey
              ? <Link to="/aprender/$slug/$modulo" params={{ slug: c.slug, modulo: x.key }} className="flex-1 font-semibold underline">{x.title}</Link>
              : <span className={cn("flex-1", x.key === moduleKey && "font-semibold")}>{x.title}</span>}
            {x.key === previewKey ? <span className="text-xs">Aula aberta</span> : <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Bloqueado" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CourseSidebar({ c, o, active }: { c: Course; o: Outputs; active?: string }) {
  return (
    <nav aria-label="Módulos do curso" className="space-y-1">
      <Link to="/aprender/$slug" params={{ slug: c.slug }} className="mb-3 block font-display text-sm font-extrabold leading-tight hover:underline">{c.title}</Link>
      {c.modules.map((m, i) => {
        const s = moduleState(m, o);
        return (
          <Link key={m.key} to="/aprender/$slug/$modulo" params={{ slug: c.slug, modulo: m.key }}
            className={cn("flex items-start gap-2 border-l-2 py-1.5 pl-3 text-sm transition-colors", active === m.key ? "border-highlight font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <span className="w-5 shrink-0 font-display text-xs font-bold">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 leading-snug">{m.title}</span>
            {s.complete ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Concluído" /> : s.done > 0 ? <span className="text-xs">{s.done}/{s.total}</span> : null}
          </Link>
        );
      })}
      <Link to="/aprender/$slug/espaco" params={{ slug: c.slug }} className={cn("mt-4 flex items-center gap-2 border-t pt-4 text-sm font-semibold", active === "espaco" && "text-primary")}><FolderOpen className="h-4 w-4" />{c.project}</Link>
    </nav>
  );
}
