import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { NextCourses } from "@/components/learning/NextCourses";
import { getGestor } from "@/lib/gestores";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { coursePhoto } from "@/lib/photos";
import { useCoursePrices, useCourseCommerce, useMyLearning, brl } from "@/lib/coursePrices";
import { courseState, ctaLabel } from "@/lib/learning/ownership";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/** Public page for an interactive (engine) course: thesis, what you build, module path. */
export function EngineCoursePublic({ c }: { c: Course }) {
  const { user } = useAuth();
  const { data: prices } = useCoursePrices();
  const g = c.gestor ? getGestor(c.gestor) : undefined;
  const [scroll, setScroll] = useState(0);
  const [open, setOpen] = useState<string | null>(c.modules[0]?.key ?? null);
  useEffect(() => {
    const on = () => { const h = document.documentElement; setScroll(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))); };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const commerce = useCourseCommerce();
  const my = useMyLearning(user?.id);
  const qc = useQueryClient();
  const info = commerce.data?.[c.slug];
  const state = info && my.data ? courseState(c, my.data.owned.has(info.id), my.data.keys[info.id]) : "locked";
  const interested = !!(info && my.data?.interest.has(info.id));
  const toggleInterest = async () => {
    if (!user || !info) return;
    if (interested) await supabase.from("course_interest").delete().eq("user_id", user.id).eq("course_id", info.id);
    else await supabase.from("course_interest").insert({ user_id: user.id, course_id: info.id });
    qc.invalidateQueries({ queryKey: ["my-learning"] });
  };
  const previewKey = info?.preview_enabled ? info.preview_module_key : null;
  const cta = state !== "locked"
    ? <Button asChild size="lg"><Link to="/aprender/$slug" params={{ slug: c.slug }}>{ctaLabel[state]}<ArrowRight /></Link></Button>
    : <>
        {previewKey && (user
          ? <Button asChild size="lg"><Link to="/aprender/$slug/$modulo" params={{ slug: c.slug, modulo: previewKey }}>Começar aula aberta<ArrowRight /></Link></Button>
          : <Button asChild size="lg"><Link to="/auth">Criar conta e experimentar<ArrowRight /></Link></Button>)}
        {info?.is_purchasable
          ? <Button size="lg" variant="outline" disabled title="Pagamento on-line em preparação">Adquirir curso</Button>
          : user && <Button size="lg" variant="outline" onClick={toggleInterest} aria-pressed={interested}>{interested ? "Na minha lista de interesse" : "Tenho interesse"}</Button>}
      </>;
  return (
    <PublicLayout>
      <div aria-hidden className="fixed left-0 top-0 z-50 h-0.5 bg-highlight transition-[width] duration-150" style={{ width: `${scroll * 100}%` }} />
      <div className="relative h-56 overflow-hidden bg-ink md:h-80">
        <img src={coursePhoto(c.slug)} alt="" className="h-full w-full object-cover opacity-85" />
        <div aria-hidden className="photo-scrim-b absolute inset-0 opacity-70" />
        <span aria-hidden className="absolute bottom-0 left-1/2 block h-1 w-24 -translate-x-1/2 bg-highlight md:left-[max(1.25rem,calc(50%-36rem+1.25rem))] md:translate-x-0" />
      </div>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pt-14">
        <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground">← Cursos</Link>
        <p className="eyebrow mt-8">{c.category} · {c.difficulty}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">{c.title}</h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug text-muted-foreground">{c.thesis}</p>
        <dl className="mt-10 grid gap-px border bg-border text-sm sm:grid-cols-5">
          <div className="bg-background p-4"><dt className="eyebrow">Gestor</dt><dd className="mt-1">{g ? <Link to="/gestor/$slug" params={{ slug: g.slug }} className="underline">{g.name}</Link> : "A confirmar"}</dd></div>
          <div className="bg-background p-4"><dt className="eyebrow">Módulos</dt><dd className="mt-1">{c.modules.length}</dd></div>
          <div className="bg-background p-4"><dt className="eyebrow">Compromisso</dt><dd className="mt-1">{c.commitment}</dd></div>
          <div className="bg-background p-4"><dt className="eyebrow">Você constrói</dt><dd className="mt-1 font-semibold">{c.project}</dd></div>
          <div className="bg-background p-4"><dt className="eyebrow">Investimento</dt><dd className="mt-1 font-display text-lg font-bold">{brl(prices?.[c.slug]) ?? "A definir"}</dd><dd className="text-xs text-muted-foreground">pagamento único</dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap items-center gap-4">{cta}<span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Lock className="h-3.5 w-3.5" />{state === "locked" ? (previewKey ? "Experimente o primeiro módulo de graça. O acesso ao curso completo é avulso, sem assinatura." : "Acesso por curso, sem assinatura.") : "Você tem acesso. Seu trabalho é privado."}</span></div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow !text-highlight">Como funciona</p>
            <p className="mt-4 font-display text-2xl font-extrabold leading-snug md:text-3xl">O vídeo complementa a experiência. Não é o curso inteiro.</p>
            <p className="mt-4 text-ink-foreground/70">Cada módulo segue esta sequência: pergunta → conceito → exemplo → o ângulo do gestor em vídeo → exercício → resultado salvo no seu projeto → conversa com a comunidade. Os vídeos ainda estão sendo gravados; o texto e os exercícios já funcionam.</p>
          </div>
          <div>
            <p className="eyebrow !text-ink-foreground/60">Ao final você terá</p>
            <ul className="mt-4 space-y-2">{c.outcomes.map((o) => <li key={o} className="border-l-2 border-highlight pl-3">{o}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">O percurso</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">{c.modules.length} módulos, um projeto: {c.finalPlan.title}</h2>
        <ol className="mt-8 divide-y border-y">
          {c.modules.map((m, i) => (
            <li key={m.key}>
              <button type="button" onClick={() => setOpen(open === m.key ? null : m.key)} aria-expanded={open === m.key} className="group grid w-full grid-cols-[2.5rem_1fr] items-baseline gap-3 py-5 text-left">
                <span className="font-display text-sm font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-lg font-bold group-hover:underline md:text-xl">{m.title}</span>
              </button>
              <div className={cn("grid grid-cols-[2.5rem_1fr] gap-3 overflow-hidden transition-all duration-300", open === m.key ? "max-h-60 pb-5 opacity-100" : "max-h-0 opacity-0")}>
                <span />
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <p className="border-l-2 border-highlight pl-3 font-display text-base font-bold">“{m.question}”</p>
                  <p><span className="eyebrow mr-2">Você produz</span>{m.output.title}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">{cta}</div>
        <NextCourses c={c} done={false} />
      </section>
    </PublicLayout>
  );
}
