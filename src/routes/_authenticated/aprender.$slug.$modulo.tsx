import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseGate, CourseSidebar, moduleState } from "@/components/learning/CourseFrame";
import { CommunityPrompt, LearningBlock, VideoLesson } from "@/components/learning/Blocks";
import { getGestor } from "@/lib/gestores";
import { hasValue } from "@/lib/learning/store";

export const Route = createFileRoute("/_authenticated/aprender/$slug/$modulo")({
  head: () => ({ meta: [{ title: "Módulo — Outro Ângulo" }, { name: "description", content: "Pergunte, aprenda, aplique e salve o que construiu." }] }),
  component: ModulePage,
});

function ModulePage() {
  const { slug, modulo } = Route.useParams();
  return (
    <CourseGate slug={slug} moduleKey={modulo}>
      {(c, courseId, o, preview) => {
        const i = c.modules.findIndex((m) => m.key === modulo);
        const m = c.modules[i];
        if (!m) return <p className="p-8">Módulo não encontrado.</p>;
        const prev = c.modules[i - 1], next = c.modules[i + 1];
        const s = moduleState(m, o);
        const gestor = c.gestor ? getGestor(c.gestor) : undefined;
        const n = String(i + 1).padStart(2, "0");
        const ctx = { courseId, outputs: o, moduleKey: m.key, slug, ...(gestor ? { gestorName: gestor.name } : {}) };
        const video = m.blocks.find((b) => b.type === "video");
        const rest = m.blocks.filter((b) => b !== video);
        return (
          <>
          <section className="bg-ink text-ink-foreground">
            <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
              <div className="flex items-center gap-3 text-sm text-ink-foreground/70">
                <Link to={preview ? "/cursos/$slug" : "/aprender/$slug"} params={{ slug }} className="hover:text-ink-foreground">{c.title}</Link>
                <span className="ml-auto">Módulo {n} / {String(c.modules.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-3 flex gap-0.5" aria-hidden>{c.modules.map((x) => <span key={x.key} className={`h-1 flex-1 ${moduleState(x, o).complete ? "bg-ink-foreground/70" : x.key === m.key ? "bg-highlight" : "bg-ink-foreground/15"}`} />)}</div>
              <div className={`mt-8 grid gap-8 ${video ? "lg:grid-cols-[1fr_1.6fr] lg:items-center" : ""}`}>
                <div>
                  <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">{m.title}</h1>
                  <p className="mt-5 border-l-2 border-highlight pl-4 font-display text-lg font-bold text-ink-foreground/90 md:text-xl">“{m.question}”</p>
                  <p className="mt-5 text-sm text-ink-foreground/70">Você produz: <b className="text-ink-foreground">{m.output.title}</b></p>
                </div>
                {video && <VideoLesson b={video as Extract<typeof video, { type: "video" }>} ctx={ctx} n={n} stage />}
              </div>
            </div>
          </section>
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[15rem_1fr] md:px-8">
            <aside className="hidden md:block"><div className="sticky top-6">{preview ? <Link to="/cursos/$slug" params={{ slug }} className="text-sm font-semibold underline">{c.title}</Link> : <CourseSidebar c={c} o={o} active={m.key} />}</div></aside>
            <div className="min-w-0 pb-24">
              <dl className="grid gap-px border bg-border text-sm sm:grid-cols-3">
                <div className="bg-background p-3"><dt className="eyebrow">Exercícios</dt><dd className="mt-1 font-semibold">{s.done} de {s.total} salvos</dd></div>
                <div className="bg-background p-3"><dt className="eyebrow">Resultado</dt><dd className="mt-1 font-semibold">{hasValue(o[m.output.key]) ? "Salvo no projeto" : "A construir"}</dd></div>
                <div className="bg-background p-3"><dt className="eyebrow">Vídeo</dt><dd className="mt-1">{hasValue(o[`${m.key}.video`]) ? "Assistido" : "Opcional"}</dd></div>
              </dl>
              <div className="mt-6">
                {rest.map((b, j) => <LearningBlock key={`${m.key}-${j}`} b={b} n={n} ctx={ctx} />)}
              </div>
              {s.complete && <div className="reveal is-visible my-6 flex items-center gap-3 border-l-2 border-highlight bg-card p-5"><Check className="h-5 w-5" /><p><b>{m.output.title}</b> está salvo em {c.project}. {next ? `Próximo: ${next.title}.` : "Seu projeto está pronto para ser revisado."}</p></div>}
              <p className="mt-6 text-sm text-muted-foreground"><span className="eyebrow mr-2">Próximo passo</span>{m.next}</p>
              <div className="mt-8"><CommunityPrompt prompt={m.community} courseId={courseId} moduleKey={m.key} gestorSlug={c.gestor} /></div>
              <div className="sticky bottom-16 z-10 mt-10 flex items-center justify-between gap-3 border-t bg-background/95 py-3 backdrop-blur md:bottom-0">
                {prev ? <Button asChild variant="ghost"><Link to="/aprender/$slug/$modulo" params={{ slug, modulo: prev.key }}><ArrowLeft />Anterior</Link></Button> : <span />}
                {preview ? <Button asChild><Link to="/cursos/$slug" params={{ slug }}>Conhecer o curso completo<ArrowRight /></Link></Button> : next ? <Button asChild><Link to="/aprender/$slug/$modulo" params={{ slug, modulo: next.key }}>Continuar<ArrowRight /></Link></Button>
                  : <Button asChild><Link to="/aprender/$slug/espaco" params={{ slug }}>Ver meu plano<ArrowRight /></Link></Button>}
              </div>
            </div>
          </div>
          </>
        );
      }}
    </CourseGate>
  );
}
