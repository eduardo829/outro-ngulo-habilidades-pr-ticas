import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseGate, courseProgress } from "@/components/learning/CourseFrame";
import { getGestor } from "@/lib/gestores";
import { hasValue } from "@/lib/learning/store";

export const Route = createFileRoute("/_authenticated/aprender/$slug/")({
  head: () => ({ meta: [{ title: "Curso — Outro Ângulo" }, { name: "description", content: "Aprender, aplicar e construir algo útil em cada módulo." }] }),
  component: Home,
});

function Home() {
  const { slug } = Route.useParams();
  return (
    <CourseGate slug={slug}>
      {(c, _id, o) => {
        const p = courseProgress(c, o);
        const g = getGestor(c.gestor);
        const next = c.modules.find((_, i) => !p.states[i]!.complete) ?? c.modules[0]!;
        const started = Object.keys(o).length > 0;
        return (
          <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
            <p className="eyebrow">Curso · em preparação</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">{c.title}</h1>
            <p className="mt-6 max-w-2xl text-xl leading-snug text-muted-foreground">{c.thesis}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              {g && <Link to="/gestor/$slug" params={{ slug: g.slug }} className="hover:underline"><span className="eyebrow mr-2">Gestor</span>{g.name}</Link>}
              <span><span className="eyebrow mr-2">Nível</span>{c.difficulty}</span>
              <span><span className="eyebrow mr-2">Ritmo</span>{c.commitment}</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 border-y py-6">
              <div><p className="font-display text-3xl font-extrabold">{p.modules} / {c.modules.length}</p><p className="text-sm text-muted-foreground">módulos concluídos</p></div>
              <div><p className="font-display text-3xl font-extrabold">{p.outputs} / {c.modules.length}</p><p className="text-sm text-muted-foreground">resultados no seu espaço</p></div>
              <div className="ml-auto flex gap-3">
                <Button asChild size="lg"><Link to="/aprender/$slug/$modulo" params={{ slug, modulo: next.key }}>{started ? "Continuar" : "Começar"}<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/aprender/$slug/espaco" params={{ slug }}>Meu espaço</Link></Button>
              </div>
            </div>

            <section className="mt-12 grid gap-10 md:grid-cols-[1fr_1.3fr]">
              <div><p className="eyebrow">Ao final, você terá</p><ul className="mt-4 space-y-2">{c.outcomes.map((x) => <li key={x} className="border-l-2 border-highlight pl-3 font-display font-bold">{x}</li>)}</ul>
                <p className="eyebrow mt-10">Ferramentas incluídas</p><p className="mt-2">{c.tools.join(" · ")}</p></div>
              <ol className="divide-y border-y">
                {c.modules.map((m, i) => (
                  <li key={m.key}>
                    <Link to="/aprender/$slug/$modulo" params={{ slug, modulo: m.key }} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-4">
                      <span className="font-display text-sm font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span><span className="font-display text-lg font-bold group-hover:underline">{m.title}</span><span className="block text-sm text-muted-foreground">Você produz: {m.output.title}</span></span>
                      {p.states[i]!.complete ? <Check className="h-4 w-4" aria-label="Concluído" /> : hasValue(o[m.output.key]) ? <span className="text-xs">em andamento</span> : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        );
      }}
    </CourseGate>
  );
}
