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
          <SectionLabel n="01" className={photo ? "!text-ink-foreground/70" : undefined}>{label}</SectionLabel>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{title}</h1>
          <p className={photo ? "mt-6 max-w-2xl text-lg leading-relaxed text-ink-foreground/80" : "mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"}>{intro}</p>
        </div>
      </section>
      {children}
      <JoinCta />
    </PublicLayout>
  );
}

export function ItemGrid({ n, label, items, cols = 3 }: { n: string; label: string; items: Item[]; cols?: 2 | 3 }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <SectionLabel n={n}>{label}</SectionLabel>
      <ol className={`mt-8 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
        {items.map((it, i) => (
          <li key={it.title} className="bg-background p-6">
            <span className="font-display text-xs font-bold tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 text-lg font-bold">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
          </li>
        ))}
      </ol>
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
