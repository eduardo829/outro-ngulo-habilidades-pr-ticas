import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Mod = { id: string; title: string };
type L = { lesson_id: string; module_id: string; title: string; is_preview: boolean; duration_text: string | null };

export function LessonList({ modules, lessons, completed, enrolled, currentId }: {
  modules: Mod[]; lessons: L[]; completed: Set<string>; enrolled: boolean; currentId?: string;
}) {
  return (
    <ol className="space-y-5">
      {modules.map((m, i) => {
        const ls = lessons.filter((l) => l.module_id === m.id);
        return (
          <li key={m.id}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Módulo {i + 1}</p>
            <p className="font-semibold">{m.title}</p>
            {ls.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Aulas em preparação.</p>
            ) : (
              <ul className="mt-2 space-y-0.5">
                {ls.map((l) => {
                  const open = enrolled || l.is_preview;
                  const done = completed.has(l.lesson_id);
                  const Icon = !open ? Lock : done ? CheckCircle2 : Circle;
                  const body = (
                    <>
                      <Icon className={cn("h-4 w-4 shrink-0", done ? "text-primary" : "text-muted-foreground")} aria-hidden />
                      <span className="flex-1">{l.title}</span>
                      <span className="sr-only">{done ? "(concluída)" : !open ? "(bloqueada)" : ""}</span>
                      {l.duration_text && <span className="text-xs text-muted-foreground">{l.duration_text}</span>}
                    </>
                  );
                  const cls = cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", l.lesson_id === currentId && "bg-accent font-semibold text-accent-foreground");
                  return (
                    <li key={l.lesson_id}>
                      {open ? (
                        <Link to="/aula/$lessonId" params={{ lessonId: l.lesson_id }} className={cn(cls, "hover:bg-secondary")}>{body}</Link>
                      ) : (
                        <span className={cn(cls, "opacity-60")}>{body}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
