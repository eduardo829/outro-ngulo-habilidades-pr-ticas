import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Opening, Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { StickyStory } from "@/components/motion/Motion";
import { cn } from "@/lib/utils";

const T = "Gestores — Outro Ângulo";
const D = "Algumas coisas você aprende estudando. Outras, fazendo. Gestores são pessoas que fizeram os dois.";

export const Route = createFileRoute("/gestores/")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const CAMADAS = [
  { k: "Quem é", t: "Pessoas que vivem o tema no dia a dia de trabalho, não só falam sobre ele." },
  { k: "Experiência", t: "O caminho que percorreram — inclusive o que não funcionou." },
  { k: "Algo que aprenderam", t: "Uma lição que só veio fazendo, e que dá para passar adiante." },
  { k: "O que ensinam", t: "Aulas, plantões e workshops na agenda da plataforma." },
  { k: "Conversas", t: "Perguntas da comunidade, enviadas e votadas antes de cada encontro." },
];

function Page() {
  return (
    <PublicLayout>
      <Opening label="Gestores" a="Algumas coisas você aprende estudando." b="Outras, fazendo.">
        <p className="mt-10 font-display text-2xl font-bold md:ml-[8%]">Preferimos aprender com quem fez os dois.</p>
      </Opening>

      <StickyStory steps={CAMADAS.length} render={(a) => (
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="frame-offset flex aspect-[4/5] max-w-xs items-end bg-ink p-6 text-ink-foreground">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-ink-foreground/60">Retrato de um gestor<br /><span className="text-ink-foreground">em breve</span></p>
          </div>
          <ol className="space-y-6">
            {CAMADAS.map((c, i) => (
              <li key={c.k} className={cn("border-l-2 pl-5 transition-all duration-500 ease-[var(--ease-out)]", i === a ? "border-highlight opacity-100" : i < a ? "border-border opacity-50" : "translate-y-2 border-border opacity-15")}>
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} / {c.k}</p>
                <p className={cn("mt-1 font-display font-bold leading-snug transition-all duration-500", i === a ? "text-2xl md:text-3xl" : "text-lg")}>{c.t}</p>
              </li>
            ))}
          </ol>
        </div>
      )} />

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionLabel n="02">Os gestores</SectionLabel>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Os nomes serão apresentados aqui conforme forem confirmados. Os perfis completos ficam disponíveis para membros.</p>
        </div>
      </section>
      <Closing a="Aprender com quem" b="já passou por isso." />
    </PublicLayout>
  );
}
