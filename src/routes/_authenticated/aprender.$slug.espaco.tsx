import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseGate, CourseSidebar, courseProgress } from "@/components/learning/CourseFrame";
import { showOutput } from "@/components/learning/Blocks";
import { hasValue } from "@/lib/learning/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/aprender/$slug/espaco")({
  head: () => ({ meta: [{ title: "Meu espaço — Outro Ângulo" }, { name: "description", content: "Tudo o que você construiu no curso, num só lugar." }] }),
  component: Workspace,
});

function Value({ v }: { v: unknown }) {
  if (Array.isArray(v) && v.length && typeof v[0] === "object") return <ul className="space-y-1">{v.map((r, i) => <li key={i} className="text-sm">{showOutput(r)}</li>)}</ul>;
  if (v && typeof v === "object" && !Array.isArray(v)) return <dl className="space-y-1">{Object.entries(v as Record<string, unknown>).filter(([, x]) => hasValue(x)).map(([k, x]) => <div key={k} className="text-sm"><dt className="inline text-muted-foreground">{k}: </dt><dd className="inline">{showOutput(x)}</dd></div>)}</dl>;
  return <p className="whitespace-pre-line">{showOutput(v)}</p>;
}

function Workspace() {
  const { slug } = Route.useParams();
  return (
    <CourseGate slug={slug}>
      {(c, _id, o) => {
        const p = courseProgress(c, o);
        return (
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[15rem_1fr] md:px-8">
            <aside className="hidden md:block print:hidden"><div className="sticky top-6"><CourseSidebar c={c} o={o} active="espaco" /></div></aside>
            <div className="min-w-0 pb-16">
              <p className="eyebrow">Meu espaço · privado</p>
              <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">O que você está construindo</h1>
              <div className="mt-6 grid grid-cols-5 gap-1 md:grid-cols-10" aria-label={`${p.outputs} de ${c.modules.length} resultados`}>
                {c.modules.map((m, i) => <Link key={m.key} to="/aprender/$slug/$modulo" params={{ slug, modulo: m.key }} title={m.output.title} className={cn("h-10 border p-1 text-[10px] font-bold leading-tight", hasValue(o[m.output.key]) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-foreground")}>{String(i + 1).padStart(2, "0")}</Link>)}
              </div>

              <ul className="mt-10 grid gap-px border bg-border md:grid-cols-2">
                {c.modules.map((m) => (
                  <li key={m.key} className="bg-background p-5">
                    <div className="flex items-baseline justify-between gap-3"><p className="eyebrow">{m.output.title}</p><Link to="/aprender/$slug/$modulo" params={{ slug, modulo: m.key }} className="text-xs underline">{hasValue(o[m.output.key]) ? "Editar" : "Fazer"}</Link></div>
                    <div className="mt-2">{hasValue(o[m.output.key]) ? <Value v={o[m.output.key]} /> : <p className="text-sm text-muted-foreground">Ainda não construído.</p>}</div>
                  </li>
                ))}
              </ul>

              <section className="mt-16 border-t-2 border-foreground pt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h2 className="font-display text-2xl font-extrabold md:text-3xl">{c.finalPlan.title}</h2>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer />Imprimir / salvar PDF</Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Montado a partir do que você salvou. Não é um plano de 40 páginas: é o que você já sabe, em uma folha.</p>
                <dl className="mt-8 divide-y border-y">
                  {c.finalPlan.sections.map((s) => {
                    const vals = s.keys.filter((k) => hasValue(o[k]));
                    return (
                      <div key={s.t} className="grid gap-2 py-4 md:grid-cols-[10rem_1fr]">
                        <dt className="eyebrow pt-1">{s.t}</dt>
                        <dd>{vals.length ? vals.map((k) => <div key={k} className="mb-2"><Value v={o[k]} /></div>) : <span className="text-sm text-muted-foreground">A completar.</span>}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            </div>
          </div>
        );
      }}
    </CourseGate>
  );
}
