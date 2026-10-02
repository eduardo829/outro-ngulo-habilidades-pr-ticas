import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";
import { TrilhaRecommender } from "@/components/TrilhaRecommender";
import { TRILHAS } from "@/lib/trilhas";

const T = "Trilhas — Outro Ângulo";
const D = "Não comece pelo curso. Comece pelo que você quer mudar: trilhas que unem aulas, exercícios, conversas e encontros.";

export const Route = createFileRoute("/trilhas")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Trilhas,
});

const PARTS = [
  { title: "Aulas e exercícios", body: "Conteúdo curto, com uma atividade concreta em cada etapa." },
  { title: "Conversas na comunidade", body: "Perguntas e experiências de quem está no mesmo caminho." },
  { title: "Pessoas e encontros", body: "Gente com habilidades complementares e encontros ao vivo sobre o tema." },
  { title: "Próximas ações", body: "Cada trilha termina em algo que você faz, não só no que você assiste." },
];

function Trilhas() {
  return (
    <PublicPage label="Trilhas" title={<>Não comece pelo curso.<br />Comece pelo que você quer mudar.</>} intro="Trilhas organizam o aprendizado em torno de um objetivo. Elas estão em preparação e serão abertas aos poucos.">
      <TrilhaRecommender n="02" />
      <ItemGrid n="03" label="Trilhas em preparação" items={TRILHAS} />
      <ItemGrid n="04" label="O que cada trilha reúne" items={PARTS} cols={2} />
    </PublicPage>
  );
}
