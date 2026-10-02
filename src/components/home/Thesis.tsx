import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Angle, SectionLabel } from "@/components/Angle";
import { TRILHAS } from "@/lib/trilhas";
import { StickyStory, useInView } from "@/components/motion/Motion";
import { cn } from "@/lib/utils";

const LINES = [
  "Como encontrar oportunidades.",
  "Como construir relações.",
  "Como negociar.",
  "Como vender uma ideia.",
  "Como validar um negócio.",
  "Como tomar decisões quando ninguém tem a resposta.",
];

export function Manifesto() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <SectionLabel>Manifesto</SectionLabel>
          <p className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl font-display">A escola ensina muita coisa.</p>
        </div>
        <div className="md:pt-16">
          <p className="text-lg text-muted-foreground">Mas dificilmente ensina</p>
          <ul className="mt-4 border-t">
            {LINES.map((l, i) => (
              <li key={l} className={`reveal border-b py-4 font-display text-2xl font-bold leading-snug md:text-3xl ${i % 2 ? "md:pl-[10%]" : ""}`}>{l}</li>
            ))}
          </ul>
          <p className="mt-10 flex items-center gap-3 text-lg font-semibold">
            <Angle className="h-5 w-5" /> O Outro Ângulo nasceu para explorar essas conversas.
          </p>
        </div>
      </div>
    </section>
  );
}

type Course = { id: string; slug: string; title: string };

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo", timeZoneName: "short" });

export function Acontecendo({ courses }: { courses: Course[] }) {
  const events = useQuery({
    queryKey: ["public-upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_upcoming_events");
      if (error) throw error;
      return data ?? [];
    },
  });
  const items = [
    ...(events.data ?? []).map((e) => ({ k: "Próximo encontro", t: e.title, m: fmt.format(new Date(e.starts_at)), to: "/conheca-os-encontros" as const })),
    ...courses.slice(0, 3).map((c) => ({ k: "Curso aberto", t: c.title, m: "Catálogo", to: "/cursos" as const })),
  ];
  return (
    <section className="border-y bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_2fr]">
        <div>
          <SectionLabel>Acontecendo agora</SectionLabel>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Apenas atividade real da plataforma: encontros agendados e cursos publicados.</p>
        </div>
        {events.isLoading ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Angle spin /> Carregando…</p>
        ) : items.length > 0 ? (
          <ul className="border-t">
            {items.map((it) => (
              <li key={it.k + it.t} className="border-b">
                <Link to={it.to} className="group grid gap-1 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline sm:gap-6">
                  <span className="eyebrow">{it.k}</span>
                  <span className="font-display text-lg font-semibold transition-transform duration-300 group-hover:translate-x-1">{it.t}</span>
                  <span className="text-sm text-muted-foreground">{it.m}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-l-2 border-highlight pl-6">
            <p className="font-display text-xl font-bold">Estamos nos primeiros dias.</p>
            <p className="mt-2 max-w-lg text-muted-foreground">Ainda não há encontros agendados nem cursos publicados. Enquanto isso, estas trilhas estão em preparação:</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TRILHAS.slice(0, 4).map((t) => <li key={t.title} className="rounded-sm border px-3 py-1 text-sm">{t.title}</li>)}
            </ul>
            <Link to="/trilhas" className="link-arrow mt-5 text-sm">Ver trilhas <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}


const PROBLEMA = ["Informação nunca foi tão acessível.", "Experiência continua sendo.", "E as pessoas certas continuam difíceis de encontrar."];

export function Problema() {
  return (
    <StickyStory steps={3} render={(a) => (
      <div className="mx-auto w-full max-w-6xl px-5">
        <p className="eyebrow">O problema</p>
        <div className="relative mt-8 min-h-[14rem] md:min-h-[18rem]">
          {PROBLEMA.map((t, i) => (
            <p key={t} className={cn("absolute inset-0 font-display text-4xl font-extrabold leading-[1.04] tracking-tight transition-all duration-500 ease-[var(--ease-out)] md:text-7xl", i === a ? "translate-y-0 opacity-100" : i < a ? "-translate-y-8 opacity-0" : "translate-y-8 opacity-0", i === 1 && "md:pl-[8%]", i === 2 && "md:pl-[16%]")}>
              {t}
            </p>
          ))}
        </div>
        <div className="mt-10 flex gap-2" aria-hidden>
          {PROBLEMA.map((_, i) => <span key={i} className={cn("h-0.5 w-10 transition-colors duration-300", i <= a ? "bg-foreground" : "bg-border")} />)}
        </div>
      </div>
    )} />
  );
}

const PILARES = [
  { t: "Conhecimento", d: "Aulas, trilhas e conversas sobre o que a escola não cobre." },
  { t: "Pessoas", d: "Gente com ambições parecidas e habilidades complementares." },
  { t: "Oportunidades", d: "Projetos, parcerias e trabalhos que nascem dessas relações." },
];

export function Pilares() {
  return (
    <section className="border-y bg-card">
      <StickyStory steps={4} render={(a) => (
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <SectionLabel>Três pilares</SectionLabel>
            <p className={cn("mt-6 max-w-sm font-display text-3xl font-extrabold leading-[1.08] transition-opacity duration-500 md:text-4xl", a === 3 ? "opacity-100" : "opacity-0")}>
              O Outro Ângulo existe na interseção dos três.
            </p>
          </div>
          <ol className="relative">
            <span aria-hidden className="absolute left-[5px] top-3 w-px bg-foreground transition-[height] duration-700 ease-[var(--ease-out)]" style={{ height: `${Math.min(a, 2) * 50}%` }} />
            <span aria-hidden className="absolute left-[5px] top-3 bottom-3 -z-10 w-px bg-border" />
            {PILARES.map((p, i) => (
              <li key={p.t} className={cn("relative pb-10 pl-10 transition-all duration-500 ease-[var(--ease-out)] last:pb-0", i <= a ? "opacity-100" : "translate-y-3 opacity-20")}>
                <span aria-hidden className={cn("absolute left-0 top-3 h-[11px] w-[11px] transition-colors duration-300", i <= a ? "bg-highlight" : "bg-border")} />
                <span className="font-display text-xs font-bold tabular-nums text-muted-foreground">0{i + 1}</span>
                <p className={cn("font-display text-4xl font-extrabold transition-[letter-spacing] duration-500 md:text-6xl", a === 3 && "tracking-tight")}>{p.t}</p>
                <p className={cn("mt-2 max-w-sm text-muted-foreground transition-opacity duration-500", i <= a ? "opacity-100" : "opacity-0")}>{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      )} />
    </section>
  );
}

const CENA = [
  { who: "Membro", t: "Como eu consigo meus primeiros clientes?", kind: "Pergunta" },
  { who: "Outro membro", t: "Comecei avisando 10 ex-colegas do que eu fazia. Dois viraram clientes.", kind: "Resposta" },
  { who: "Trilha sugerida", t: "Conseguir meus primeiros clientes", kind: "Conhecimento" },
  { who: "Mais alguém", t: "Estou no mesmo ponto. Topa trocar ideias?", kind: "Conexão" },
  { who: "Oportunidade", t: "Procuro designer para um projeto pequeno.", kind: "Oportunidade" },
];

export function PreviewRede() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.3fr] md:py-28">
      <div>
        <SectionLabel>Como a rede funciona</SectionLabel>
        <p className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl font-display">Uma rede,<br />não uma videoteca.</p>
        <p className="mt-6 max-w-sm text-muted-foreground">Uma pergunta puxa uma resposta, uma trilha, uma conexão — e às vezes uma oportunidade.</p>
        <p className="mt-6 text-xs text-muted-foreground">Simulação ilustrativa. Não são conversas reais de membros.</p>
      </div>
      <div ref={ref} className="frame-offset border bg-card p-5 md:p-8">
        <ol className="space-y-3">
          {CENA.map((c, i) => (
            <li key={c.t} className={cn("border-l-2 bg-background px-4 py-3 transition-all duration-500 ease-[var(--ease-out)]", c.kind === "Oportunidade" ? "border-highlight" : "border-primary/30", inView ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0", i % 2 && "md:ml-8")} style={{ transitionDelay: `${i * 450}ms` }}>
              <p className="eyebrow">{c.kind} · {c.who}</p>
              <p className="mt-1 font-medium">{c.t}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const STEPS = ["Aprender", "Conversar", "Conectar", "Construir", "Compartilhar"];
const FRASES = ["O conhecimento não termina quando o vídeo acaba.", "Uma ideia pode gerar uma conversa.", "Uma conversa pode gerar uma conexão.", "Uma conexão pode gerar um projeto.", "E um projeto gera novas experiências para compartilhar."];

export function Ciclo() {
  return (
    <section className="bg-ink text-ink-foreground">
      <StickyStory steps={6} render={(a, p) => {
        const r = 130, c = 2 * Math.PI * r;
        return (
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
            <div>
              <p className="eyebrow !text-ink-foreground/60">O ciclo</p>
              <p key={a} className="mt-6 min-h-[7rem] animate-fade-in font-display text-3xl font-extrabold leading-[1.08] md:text-4xl">{FRASES[Math.min(a, 4)]}</p>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
              <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx="150" cy="150" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" />
                <circle cx="150" cy="150" r={r} fill="none" stroke="var(--color-highlight)" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
              </svg>
              {STEPS.map((s, i) => {
                const ang = (i / STEPS.length) * 2 * Math.PI - Math.PI / 2;
                const on = i <= a || a === 5;
                return (
                  <span key={s} className={cn("absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-ink px-2 font-display text-sm font-bold transition-all duration-500 md:text-lg", on ? "opacity-100" : "opacity-30", i === Math.min(a, 4) && a < 5 && "text-highlight")} style={{ left: `${50 + 43 * Math.cos(ang)}%`, top: `${50 + 43 * Math.sin(ang)}%` }}>
                    {s}
                  </span>
                );
              })}
              <span className={cn("absolute inset-0 flex items-center justify-center text-center text-sm text-ink-foreground/60 transition-opacity duration-500", a === 5 ? "opacity-100" : "opacity-0")}>
                e volta a<br />aprender
              </span>
            </div>
          </div>
        );
      }} />
    </section>
  );
}
