import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";

const T = "Trilhas — Outro Ângulo";
const D = "Não comece pelo curso. Comece pelo que você quer mudar: trilhas que unem aulas, exercícios, conversas e encontros.";

export const Route = createFileRoute("/trilhas")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Trilhas,
});

const TRILHAS = [
  { title: "Construir meu network", body: "Mapear relações, iniciar conversas e manter contato sem forçar." },
  { title: "Começar a empreender", body: "Sair da ideia, testar com pouco e aprender com o que der errado." },
  { title: "Conseguir meus primeiros clientes", body: "Encontrar quem precisa do que você faz e fazer a primeira proposta." },
  { title: "Avançar na carreira", body: "Entender onde você está, o que quer e como comunicar isso." },
  { title: "Comunicar melhor", body: "Apresentar ideias com clareza e lidar com conversas difíceis." },
  { title: "Aprender a vender", body: "Vender como quem resolve um problema, não como quem empurra." },
  { title: "Organizar meus próximos passos", body: "Escolher uma prioridade e transformar em ações da semana." },
  { title: "Entender melhor meu dinheiro", body: "Organizar o básico para decidir com mais tranquilidade." },
  { title: "Usar IA no dia a dia", body: "Aplicar ferramentas de IA no trabalho e na organização pessoal." },
];

const PARTS = [
  { title: "Aulas e exercícios", body: "Conteúdo curto, com uma atividade concreta em cada etapa." },
  { title: "Conversas na comunidade", body: "Perguntas e experiências de quem está no mesmo caminho." },
  { title: "Pessoas e encontros", body: "Gente com habilidades complementares e encontros ao vivo sobre o tema." },
  { title: "Próximas ações", body: "Cada trilha termina em algo que você faz, não só no que você assiste." },
];

function Trilhas() {
  return (
    <PublicPage label="Trilhas" title={<>Não comece pelo curso.<br />Comece pelo que você quer mudar.</>} intro="Trilhas organizam o aprendizado em torno de um objetivo. Elas estão em preparação e serão abertas aos poucos.">
      <ItemGrid n="02" label="Trilhas em preparação" items={TRILHAS} />
      <ItemGrid n="03" label="O que cada trilha reúne" items={PARTS} cols={2} />
    </PublicPage>
  );
}
