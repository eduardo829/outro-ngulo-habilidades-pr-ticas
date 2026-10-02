import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEngineCourse } from "@/lib/learning/da-ideia";
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

/** Gate (enrollment checked against the database) + data for every engine page. */
export function CourseGate({ slug, children }: { slug: string; children: (c: Course, courseId: string, outputs: Outputs) => ReactNode }) {
  const course = getEngineCourse(slug);
  const access = useEngineAccess(slug);
  const outputs = useOutputs(access.data?.allowed ? access.data.courseId : null);
  if (!course) return <p className="p-8">Curso não encontrado.</p>;
  if (access.isLoading || (access.data?.allowed && outputs.isLoading)) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!access.data?.allowed || !access.data.courseId) return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <h1 className="mt-4 font-display text-2xl font-extrabold">{course.title}</h1>
      <p className="mt-2 text-muted-foreground">Este curso está em preparação e aberto só para quem foi matriculado pela equipe.</p>
      <Button asChild className="mt-6"><Link to="/meus-cursos">Meus cursos</Link></Button>
    </div>
  );
  return <>{children(course, access.data.courseId, outputs.data ?? {})}</>;
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
      <Link to="/aprender/$slug/espaco" params={{ slug: c.slug }} className={cn("mt-4 flex items-center gap-2 border-t pt-4 text-sm font-semibold", active === "espaco" && "text-primary")}><FolderOpen className="h-4 w-4" />Meu espaço</Link>
    </nav>
  );
}
