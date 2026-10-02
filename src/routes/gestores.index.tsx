import closePhoto from "@/assets/photo-close-gestores.jpg";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Opening, Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { ScrollReveal, StickyStory } from "@/components/motion/Motion";
import { DoisAngulos, GestorPhoto, Txt } from "@/components/gestores/GestorParts";
import { GESTORES } from "@/lib/gestores";
import { cn } from "@/lib/utils";
import heroPhoto from "@/assets/photo-gestores-hero.jpg";

const T = "Gestores — Outro Ângulo";
const D = "Algumas coisas você aprende estudando. Outras, fazendo. Gestores trazem experiência real para dentro das conversas do Outro Ângulo.";

export const Route = createFileRoute("/gestores/")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const VERBOS = ["ensinar", "responder", "questionar", "compartilhar", "orientar discussões", "mostrar decisões", "mostrar erros", "analisar situações reais"];

function Page() {
  return (
    <PublicLayout>
      <Opening photo={heroPhoto} label="Gestores" a="Algumas coisas você aprende estudando." b="Outras, fazendo."
        intro="Gestores são pessoas que trazem experiência real para dentro das conversas do Outro Ângulo." />

      <section className="bg-ink text-ink-foreground">
        <StickyStory steps={VERBOS.length} render={(a) => (
          <div className="mx-auto w-full max-w-6xl px-5">
            <p className="eyebrow !text-ink-foreground/60">O que é um gestor</p>
            <p className="mt-6 font-display text-2xl font-bold md:text-3xl">Não existe só para publicar cursos. Pode</p>
            <div className="relative mt-4 h-24 md:h-32">
              {VERBOS.map((v, i) => (
                <p key={v} className={cn("absolute inset-0 font-display text-5xl font-extrabold tracking-tight transition-all duration-500 md:text-7xl", i === a ? "opacity-100 text-highlight" : i < a ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0")}>{v}.</p>
              ))}
            </div>
            <p className="mt-6 max-w-xl text-ink-foreground/70">A autoridade aparece no que a pessoa construiu, nas decisões que tomou e nos erros que cometeu. Não em títulos.</p>
          </div>
        )} />
      </section>

      {GESTORES.map((g, i) => (
        <section key={g.slug} className="border-t">
          <div className={cn("mx-auto grid max-w-6xl gap-12 px-5 py-20 md:items-center md:py-28", i % 2 ? "md:grid-cols-[1.2fr_1fr]" : "md:grid-cols-[1fr_1.2fr]")}>
            <ScrollReveal className={i % 2 ? "md:order-2" : ""}><GestorPhoto g={g} className="aspect-[4/5] w-full max-w-sm" /></ScrollReveal>
            <div>
              <SectionLabel n={String(i + 1).padStart(2, "0")}>Gestor em destaque</SectionLabel>
              <h2 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-6xl">{g.name}</h2>
              <p className="mt-3 font-display font-bold"><Txt v={g.positioning} /></p>
              <p className="text-muted-foreground"><Txt v={g.location} /></p>
              <p className="mt-6 max-w-lg text-xl leading-snug"><Txt v={g.tagline} /></p>
              <p className="eyebrow mt-8">O que construiu</p>
              <p className="mt-2 font-display text-lg font-bold">{g.ventures.map((v, j) => <span key={v.name}>{j > 0 && <span className="text-muted-foreground"> · </span>}<Txt v={v.name} /></span>)}</p>
              <Link to="/gestor/$slug" params={{ slug: g.slug }} className="link-arrow mt-8 inline-flex items-center gap-1 font-semibold">Conhecer a trajetória<ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      ))}

      <DoisAngulos n="03" />

      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <SectionLabel n="04">O que estão discutindo</SectionLabel>
            <p className="mt-6 text-lg text-muted-foreground">As discussões dos gestores com a comunidade aparecem aqui quando começarem. Nada é mostrado antes de existir.</p>
          </div>
          <div>
            <SectionLabel n="05">O que estão construindo</SectionLabel>
            <ul className="mt-6 space-y-3">{GESTORES.map((g) => <li key={g.slug} className="flex justify-between gap-4 border-t pt-3"><span className="font-semibold">{g.name}</span><span className="text-right">{g.what_i_am_building.map((t) => <Txt key={t} v={t} />)}</span></li>)}</ul>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionLabel n="06">Todos os gestores</SectionLabel>
          <ul className="mt-8 divide-y border-y">
            {GESTORES.map((g) => (
              <li key={g.slug}><Link to="/gestor/$slug" params={{ slug: g.slug }} className="group flex flex-wrap items-baseline justify-between gap-4 py-5"><span className="font-display text-2xl font-extrabold group-hover:translate-x-1 transition-transform">{g.name}</span><span className="text-muted-foreground"><Txt v={g.positioning} /></span></Link></li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">Novos gestores entram conforme forem confirmados.</p>
        </div>
      </section>
      <Closing photo={closePhoto} a="Faça parte" b="da conversa." />
    </PublicLayout>
  );
}
