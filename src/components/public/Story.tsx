import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { StickyStory, ScrollReveal } from "@/components/motion/Motion";
import { SectionLabel } from "@/components/Angle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Large opening: two-line statement, second line indented and muted. */
export function Opening({ label, a, b, intro, children }: { label: string; a: ReactNode; b: ReactNode; intro?: string; children?: ReactNode }) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:pb-24 md:pt-24">
        <SectionLabel>{label}</SectionLabel>
        <h1 className="display-xl reveal mt-8">
          {a}
          <span className="mt-3 block pl-[8%] text-muted-foreground">{b}</span>
        </h1>
        {intro && <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground md:ml-[8%]">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

/** Statements that take the full screen one at a time while scrolling. */
export function Statements({ lines, label, dark }: { lines: string[]; label?: string; dark?: boolean }) {
  return (
    <section className={dark ? "bg-ink text-ink-foreground" : ""}>
      <StickyStory steps={lines.length} render={(a) => (
        <div className="mx-auto w-full max-w-6xl px-5">
          {label && <p className={cn("eyebrow", dark && "!text-ink-foreground/60")}>{label}</p>}
          <div className="relative mt-8 min-h-[14rem] md:min-h-[18rem]">
            {lines.map((t, i) => (
              <p key={t} className={cn("absolute inset-0 font-display text-4xl font-extrabold leading-[1.04] tracking-tight transition-all duration-500 ease-[var(--ease-out)] md:text-6xl", i === a ? "translate-y-0 opacity-100" : i < a ? "-translate-y-8 opacity-0" : "translate-y-8 opacity-0")} style={{ paddingLeft: `${i * 6}%` }}>
                {t}
              </p>
            ))}
          </div>
          <div className="mt-10 flex gap-2" aria-hidden>
            {lines.map((_, i) => <span key={i} className={cn("h-0.5 w-10 transition-colors duration-300", i <= a ? (dark ? "bg-ink-foreground" : "bg-foreground") : dark ? "bg-ink-foreground/20" : "bg-border")} />)}
          </div>
        </div>
      )} />
    </section>
  );
}

/** Card that reveals extra context on hover (desktop) or tap (mobile). */
export function RevealCard({ eyebrow, title, sub, details, tone, cta }: { eyebrow: string; title: string; sub?: string; details: { k: string; v: string }[]; tone?: "highlight"; cta?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn("group block w-full border-l-2 bg-card p-5 text-left transition-colors duration-300 hover:bg-background", tone === "highlight" ? "border-highlight" : "border-primary/30")}>
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-2 font-display text-xl font-bold leading-snug">{title}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out)] group-hover:grid-rows-[1fr]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <dl className="overflow-hidden">
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            {details.map((d) => (
              <div key={d.k} className="flex gap-3"><dt className="w-28 shrink-0 text-muted-foreground">{d.k}</dt><dd className="font-medium">{d.v}</dd></div>
            ))}
            {cta && <div className="pt-2 text-sm font-semibold">{cta}</div>}
          </div>
        </dl>
      </div>
    </button>
  );
}

export function Illustrative() {
  return <p className="text-xs text-muted-foreground">Exemplos ilustrativos. Não são membros nem publicações reais.</p>;
}

/** Ending screen in the home page voice. */
export function Closing({ a, b }: { a: string; b?: string }) {
  const { user } = useAuth();
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <ScrollReveal><p className="max-w-4xl font-display text-4xl font-extrabold leading-[1.04] md:text-6xl">{a}</p></ScrollReveal>
        {b && <ScrollReveal delay={250}><p className="mt-4 max-w-4xl pl-[8%] font-display text-4xl font-extrabold leading-[1.04] text-ink-foreground/55 md:text-6xl">{b}</p></ScrollReveal>}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-8 border-t border-ink-foreground/20 pt-8">
          <p className="font-display text-lg font-bold">Outro Ângulo<span className="block text-sm font-medium text-ink-foreground/60">Conhecimento. Pessoas. Oportunidades.</span></p>
          <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
            {user ? <Link to="/inicio">Ir para minha área<ArrowRight /></Link> : <Link to="/auth" search={{ modo: "cadastro" }}>Fazer parte<ArrowRight /></Link>}
          </Button>
        </div>
      </div>
    </section>
  );
}
