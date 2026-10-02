import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { ItemGrid } from "@/components/PublicPage";
import { TrilhaRecommender } from "@/components/TrilhaRecommender";
import { Opening, Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { TRILHAS } from "@/lib/trilhas";
import { cn } from "@/lib/utils";
import { PhotoBand } from "@/components/PhotoBand";
import bandPhoto from "@/assets/photo-mirante.jpg";
import heroPhoto from "@/assets/photo-ideia.jpg";

const T = "Trilhas — Outro Ângulo";
const D = "Não comece pelo curso. Comece pela pergunta: trilhas que unem aulas, conversas, pessoas e encontros.";

export const Route = createFileRoute("/trilhas")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Trilhas,
});

// Each question points to trails in TRILHAS (by title).
const PERGUNTAS: { q: string; t: string[] }[] = [
  { q: "Como conseguir meus primeiros clientes?", t: ["Conseguir meus primeiros clientes", "Aprender a vender"] },
  { q: "Como construir networking do zero?", t: ["Construir meu network", "Comunicar melhor"] },
  { q: "Como validar uma ideia?", t: ["Começar a empreender", "Organizar meus próximos passos"] },
  { q: "Como aprender a vender?", t: ["Aprender a vender", "Conseguir meus primeiros clientes"] },
  { q: "Como negociar melhor?", t: ["Comunicar melhor", "Avançar na carreira"] },
  { q: "Como usar IA no meu trabalho?", t: ["Usar IA no dia a dia", "Organizar meus próximos passos"] },
];

const PARTS = [
  { title: "Aulas e exercícios", body: "Conteúdo curto, com uma atividade concreta em cada etapa." },
  { title: "Conversas na comunidade", body: "Perguntas e experiências de quem está no mesmo caminho." },
  { title: "Pessoas e encontros", body: "Gente com habilidades complementares e encontros ao vivo sobre o tema." },
  { title: "Próximas ações", body: "Cada trilha termina em algo que você faz, não só no que você assiste." },
];

function Trilhas() {
  const [sel, setSel] = useState(0);
  const found = TRILHAS.filter((t) => PERGUNTAS[sel]!.t.includes(t.title));
  return (
    <PublicLayout>
      <Opening photo={heroPhoto} label="Trilhas" a="Não comece pelo curso." b="Comece pela pergunta." intro="Trilhas organizam o aprendizado em torno de algo que você quer resolver. Elas estão em preparação e serão abertas aos poucos." />

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionLabel n="01">Escolha uma pergunta</SectionLabel>
        <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <ul className="border-t" role="listbox" aria-label="Perguntas">
            {PERGUNTAS.map((p, i) => (
              <li key={p.q} className="border-b">
                <button type="button" role="option" aria-selected={sel === i} onMouseEnter={() => setSel(i)} onFocus={() => setSel(i)} onClick={() => setSel(i)}
                  className={cn("flex w-full items-baseline gap-4 py-4 text-left font-display text-xl font-bold transition-all duration-300 md:text-2xl", sel === i ? "translate-x-2 text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <span className="text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>{p.q}
                </button>
              </li>
            ))}
          </ul>
          <div className="md:sticky md:top-24 md:self-start">
            <p className="eyebrow">Trilhas relacionadas</p>
            <ol key={sel} className="mt-4 space-y-3">
              {found.map((t, i) => (
                <li key={t.title} className="frame-offset animate-fade-in border bg-card p-5" style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
                  <p className="font-display text-lg font-bold">{t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Em preparação</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <TrilhaRecommender n="02" />
      <PhotoBand src={bandPhoto} title=<>Mais perspectiva<span className="block text-ink-foreground/60">para as suas decisões.</span></> />
      <ItemGrid n="03" label="Todas as trilhas em preparação" items={TRILHAS} />
      <ItemGrid n="04" label="O que cada trilha reúne" items={PARTS} cols={2} />
      <Closing a="Toda trilha começa com uma pergunta." b="E termina em algo que você faz." />
    </PublicLayout>
  );
}
