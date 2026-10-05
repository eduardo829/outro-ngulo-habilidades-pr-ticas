import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { StickyStory, ScrollReveal } from "@/components/motion/Motion";
import { SectionLabel } from "@/components/Angle";
import { settingsQuery } from "@/lib/queries";
import { DOIS_ANGULOS, getGestor, isPending, type GestorProfile } from "@/lib/gestores";
import { TRILHAS } from "@/lib/trilhas";
import { cn } from "@/lib/utils";

/** Text that may be a placeholder awaiting verified info. */
export function Txt({ v, className }: { v: string; className?: string }) {
  if (!isPending(v)) return <span className={className}>{v}</span>;
  return <span className={cn("inline-block border border-dashed border-muted-foreground/40 px-1.5 text-muted-foreground", className)} title="Informação a confirmar">Em breve</span>;
}

/** Photo: profile photo, else founder photo from site settings, else initials. */
export function GestorPhoto({ g, className }: { g: GestorProfile; className?: string }) {
  const s = useQuery(settingsQuery);
  const first = (g.name.split(" ")[0] ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const founder = s.data?.founders.find((f) => f.name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().startsWith(first));
  const url = founder?.photo_url || g.photo;
  return (
    <div className={cn("frame-offset relative overflow-hidden bg-ink", className)}>
      {url ? <img src={url} alt={g.photoAlt ?? g.name} className="h-full w-full object-cover grayscale-[35%] transition-all duration-700 hover:scale-[1.03] hover:grayscale-0" loading="lazy" />
        : <div className="flex h-full items-end p-6 font-display text-6xl font-extrabold text-ink-foreground/30">{g.name.split(" ").map((p) => p[0]).join("")}</div>}
    </div>
  );
}

/** Interactive ventures: pick a node to see its details. */
export function Ventures({ g }: { g: GestorProfile }) {
  const [a, setA] = useState(0);
  const v = g.ventures[a] ?? g.ventures[0]!;
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
      <ol className="relative border-l">
        {g.ventures.map((x, i) => (
          <li key={x.name}>
            <button type="button" onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)} aria-pressed={i === a}
              className={cn("relative block w-full py-4 pl-6 text-left transition-all duration-300", i === a ? "translate-x-1" : "opacity-50 hover:opacity-80")}>
              <span className={cn("absolute -left-[5px] top-6 h-2.5 w-2.5 transition-colors", i === a ? "bg-highlight" : "bg-border")} />
              <span className="font-display text-2xl font-extrabold md:text-3xl"><Txt v={x.name} /></span>
            </button>
          </li>
        ))}
      </ol>
      <div key={a} className="reveal is-visible border-t-2 border-foreground pt-6">
        <p className="eyebrow">{String(a + 1).padStart(2, "0")} / {String(g.ventures.length).padStart(2, "0")}</p>
        <p className="mt-3 font-display text-3xl font-extrabold"><Txt v={v.name} /></p>
        <p className="mt-2 text-lg text-muted-foreground"><Txt v={v.area} /></p>
        {v.role && <p className="mt-4 text-sm">Papel: {v.role}</p>}
        {v.years && <p className="text-sm">Período: {v.years}</p>}
        {v.url && <a href={v.url} target="_blank" rel="noopener noreferrer" className="link-arrow mt-6 inline-flex items-center gap-1 text-sm font-semibold">Visitar site<ArrowUpRight className="h-4 w-4" /></a>}
      </div>
    </div>
  );
}

/** Knowledge graph: gestor → experience → knowledge → content → conversations → tools → opportunities. */
export function KnowledgeGraph({ g }: { g: GestorProfile }) {
  const tracks = g.learning_tracks.filter((t) => TRILHAS.some((x) => x.title === t));
  const nodes: { k: string; items: string[] }[] = [
    { k: "Gestor", items: [g.name] },
    { k: "Experiência", items: g.ventures.map((v) => v.name) },
    { k: "Conhecimento", items: g.knowledge_topics.slice(0, 4) },
    { k: "Conteúdo", items: tracks.length ? tracks : ["[trilhas]"] },
    { k: "Conversas", items: g.discussions.map((d) => d.title) },
    { k: "Ferramentas", items: g.tools.map((t) => t.title) },
    { k: "Oportunidades", items: g.what_i_am_building },
  ];
  return (
    <section className="bg-ink text-ink-foreground">
      <StickyStory steps={nodes.length} render={(a) => (
        <div className="mx-auto w-full max-w-6xl px-5">
          <p className="eyebrow !text-ink-foreground/60">Mapa de conhecimento</p>
          <ol className="mt-8 space-y-3">
            {nodes.map((n, i) => (
              <li key={n.k} className={cn("grid grid-cols-[8rem_1fr] items-baseline gap-4 transition-all duration-500 ease-[var(--ease-out)] md:grid-cols-[12rem_1fr]", i <= a ? "opacity-100" : "translate-y-2 opacity-15")} style={{ paddingLeft: `${i * 2.5}%` }}>
                <span className={cn("font-display text-sm font-bold uppercase tracking-[0.14em]", i === a ? "text-highlight" : "text-ink-foreground/60")}>{String(i + 1).padStart(2, "0")} {n.k}</span>
                <span className={cn("font-display font-bold transition-all", i === a ? "text-xl md:text-2xl" : "text-base")}>
                  {n.items.map((t, j) => <span key={t}>{j > 0 && <span className="text-ink-foreground/40"> · </span>}{isPending(t) ? <span className="text-ink-foreground/50">Em breve</span> : t}</span>)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )} />
    </section>
  );
}

/** Where the gestor shows up across the platform. */
export function Connections({ g }: { g: GestorProfile }) {
  const tracks = g.learning_tracks.filter((t) => TRILHAS.some((x) => x.title === t));
  const rows = [
    { k: "Discutindo", items: g.discussions, to: "/conheca-a-comunidade" as const, cta: "Ver comunidade" },
    { k: "Ferramentas", items: g.tools, to: "/trilhas" as const, cta: "Ver trilhas" },
    { k: "Trilhas", items: tracks.length ? tracks.map((t) => ({ title: t })) : [{ title: "[trilhas]" }], to: "/trilhas" as const, cta: "Começar" },
    { k: "Encontros", items: g.events, to: "/conheca-os-encontros" as const, cta: "Ver encontros" },
    { k: "Oportunidades", items: g.what_i_am_building.map((t) => ({ title: t })), to: "/oportunidades" as const, cta: "Ver oportunidades" },
  ];
  return (
    <ul className="divide-y border-y">
      {rows.map((r, i) => (
        <ScrollReveal as="li" key={r.k} delay={i * 80}>
          <div className="grid gap-3 py-6 md:grid-cols-[10rem_1fr_auto] md:items-center">
            <p className="eyebrow">{r.k}</p>
            <p className="font-display text-xl font-bold">{r.items.map((x, j) => <span key={x.title}>{j > 0 && " · "}<Txt v={x.title} /></span>)}</p>
            <Link to={r.to} className="link-arrow inline-flex items-center gap-1 text-sm font-semibold">{r.cta}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </ScrollReveal>
      ))}
    </ul>
  );
}

/** Signature format: one question, two angles, no winner. */
export function DoisAngulos({ n }: { n?: string }) {
  const A = getGestor(DOIS_ANGULOS.a.slug)!;
  const B = getGestor(DOIS_ANGULOS.b.slug)!;
  const [side, setSide] = useState<"a" | "b" | null>(null);
  const col = (g: typeof A, view: string, k: "a" | "b") => (
    <button type="button" onMouseEnter={() => setSide(k)} onFocus={() => setSide(k)} onClick={() => setSide(k)}
      className={cn("block border-t-2 pt-5 text-left transition-all duration-300", side === k ? "border-highlight" : "border-foreground/20", side && side !== k && "opacity-50")}>
      <p className="eyebrow">Ângulo {k === "a" ? "A" : "B"}</p>
      <Link to="/gestor/$slug" params={{ slug: g.slug }} className="mt-2 block font-display text-2xl font-extrabold hover:underline">{g.name}</Link>
      <p className="text-sm text-muted-foreground"><Txt v={g.positioning} /></p>
      <p className="mt-5 text-lg"><Txt v={view} /></p>
    </button>
  );
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionLabel {...(n ? { n } : {})}>Dois Ângulos</SectionLabel>
        <p className="mt-3 text-sm text-muted-foreground">Formato em preparação. Uma pergunta, duas experiências, raciocínios diferentes. Não é para achar um vencedor.</p>
        <ScrollReveal><p className="mt-10 max-w-4xl font-display text-3xl font-extrabold leading-tight md:text-5xl">“{DOIS_ANGULOS.question}”</p></ScrollReveal>
        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-start">
          {col(A, DOIS_ANGULOS.a.view, "a")}
          <span className="hidden self-center font-display text-3xl font-extrabold text-highlight md:block" aria-hidden>+</span>
          {col(B, DOIS_ANGULOS.b.view, "b")}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-4 border-t pt-6">
          <p className="font-display text-2xl font-extrabold">E você?</p>
          <Link to="/conheca-a-comunidade" className="link-arrow inline-flex items-center gap-1 text-sm font-semibold">Entrar na conversa<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
