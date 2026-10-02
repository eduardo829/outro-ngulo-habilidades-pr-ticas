import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyProjects } from "@/lib/learning/progress";

export const Route = createFileRoute("/_authenticated/meu-espaco")({
  head: () => ({ meta: [{ title: "Meu espaço — Outro Ângulo" }, { name: "description", content: "Seus projetos construídos nos cursos, num só lugar." }] }),
  component: MyProjects,
});

function MyProjects() {
  const q = useMyProjects();
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      <p className="eyebrow">Meu espaço · privado</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Meus projetos</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Cada curso cria um projeto. Tudo o que você salva nos exercícios aparece aqui, e só você vê.</p>
      {q.isLoading && <p className="mt-10 text-muted-foreground">Carregando…</p>}
      {q.data && q.data.length === 0 && (
        <div className="mt-10 border-y py-10">
          <p className="font-display text-xl font-bold">Você ainda não começou nenhum projeto.</p>
          <Button asChild className="mt-4"><Link to="/cursos">Ver cursos<ArrowRight /></Link></Button>
        </div>
      )}
      {!!q.data?.length && (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {q.data.map((p) => (
            <li key={p.course.slug} className="border bg-background p-6">
              <p className="eyebrow">{p.course.title}</p>
              <p className="mt-2 font-display text-2xl font-extrabold">{p.course.project}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.outputs} de {p.total} resultados salvos · {p.done} módulos concluídos</p>
              <div className="mt-3 h-1 bg-border"><div className="h-1 bg-primary" style={{ width: `${(p.outputs / p.total) * 100}%` }} /></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm"><Link to="/aprender/$slug/espaco" params={{ slug: p.course.slug }}>Abrir projeto</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/aprender/$slug/$modulo" params={{ slug: p.course.slug, modulo: p.nextKey }}>Continuar</Link></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
