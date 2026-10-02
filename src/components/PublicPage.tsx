import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { SectionLabel } from "@/components/Angle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export type Item = { title: string; body: string };

export function PublicPage({ label, title, intro, children }: { label: string; title: ReactNode; intro: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SectionLabel n="01">{label}</SectionLabel>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
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
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
        <p className="max-w-xl font-display text-2xl font-bold leading-snug">Algumas oportunidades começam com uma conversa.</p>
        <Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
          {user ? <Link to="/inicio">Ir para minha área<ArrowRight /></Link> : <Link to="/auth" search={{ modo: "cadastro" }}>Fazer parte<ArrowRight /></Link>}
        </Button>
      </div>
    </section>
  );
}
