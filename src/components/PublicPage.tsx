import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { SectionLabel } from "@/components/Angle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import ctaPhoto from "@/assets/photo-networking.jpg";

export type Item = { title: string; body: string };

export function PublicPage({ label, title, intro, children, photo }: { label: string; title: ReactNode; intro: string; children: ReactNode; photo?: string }) {
  return (
    <PublicLayout>
      <section className={photo ? "relative isolate overflow-hidden bg-ink text-ink-foreground" : "border-b"}>
        {photo && <><img src={photo} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" /><div aria-hidden className="photo-scrim-l absolute inset-0 -z-10" /></>}
        <div className={photo ? "mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-24 md:pb-24" : "mx-auto max-w-6xl px-5 py-16 md:py-24"}>
          <SectionLabel n="01" className={photo ? "!text-ink-foreground/70" : ""}>{label}</SectionLabel>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{title}</h1>
          <p className={photo ? "mt-6 max-w-2xl text-lg leading-relaxed text-ink-foreground/80" : "mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"}>{intro}</p>
        </div>
      </section>
      {children}
      <JoinCta />
    </PublicLayout>
  );
}

/** Asymmetric editorial list: first item as a large feature, the rest as compact rows with big numerals. */
export function ItemGrid({ n, label, items, tone = "plain" }: { n: string; label: string; items: Item[]; cols?: 2 | 3; tone?: "plain" | "stone" }) {
  const [first, ...rest] = items;
  return (
    <section className={tone === "stone" ? "bg-card" : ""}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.25fr] md:gap-16 md:py-28">
        <div className="md:sticky md:top-24 md:self-start">
          <SectionLabel n={n}>{label}</SectionLabel>
          {first && (
            <div className="group relative mt-10 overflow-hidden">
              <span aria-hidden className="pointer-events-none block font-display text-[7rem] font-extrabold leading-none text-foreground/[0.07] transition-colors duration-500 group-hover:text-highlight/60 md:text-[10rem]">01</span>
              <h3 className="-mt-10 font-display text-3xl font-extrabold leading-tight md:-mt-14 md:text-4xl">{first.title}</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">{first.body}</p>
            </div>
          )}
        </div>
        <ol className="border-t">
          {rest.map((it, i) => (
            <li key={it.title} className="group relative grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-4 border-b py-7 transition-colors duration-300 hover:bg-card/70 md:grid-cols-[6rem_minmax(0,1fr)]">
              <span className="font-display text-4xl font-extrabold tabular-nums text-foreground/15 transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground md:text-5xl">{String(i + 2).padStart(2, "0")}</span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold">{it.title}</h3>
                <p className="mt-2 max-w-lg leading-relaxed text-muted-foreground">{it.body}</p>
              </div>
              <span aria-hidden className="absolute bottom-[-1px] left-0 h-px w-0 bg-highlight transition-all duration-500 group-hover:w-full" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function JoinCta() {
  const { user } = useAuth();
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      <img src={ctaPhoto} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
      <div aria-hidden className="photo-scrim-l absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-20 md:flex-row md:items-center">
        <p className="max-w-xl font-display text-2xl font-bold leading-snug">Algumas oportunidades começam com uma conversa.</p>
        <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
          {user ? <Link to="/inicio">Ir para minha área<ArrowRight /></Link> : <Link to="/auth" search={{ modo: "cadastro" }}>Fazer parte<ArrowRight /></Link>}
        </Button>
      </div>
    </section>
  );
}
