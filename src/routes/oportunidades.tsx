import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";

const T = "Oportunidades — Outro Ângulo";
const D = "Parcerias, projetos, freelas e vagas compartilhados entre membros da comunidade, de forma direta e sem intermediação.";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const TYPES = [
  { title: "Procuro parceiro ou sócio", body: "Para tirar uma ideia do papel com alguém de habilidades complementares." },
  { title: "Procuro profissional ou freelancer", body: "Para uma tarefa ou projeto específico." },
  { title: "Tenho uma oportunidade", body: "Uma vaga, um projeto ou uma indicação que pode servir a alguém." },
  { title: "Procuro emprego", body: "Conte o que você faz bem e o que está buscando." },
  { title: "Procuro fornecedor", body: "Peça indicações de quem já contratou." },
  { title: "Tenho um projeto", body: "Apresente o que está construindo e quem você procura." },
];
const RULES = [
  { title: "Contato direto", body: "Quem se interessar fala com você por mensagem privada." },
  { title: "Sem intermediação", body: "O Outro Ângulo não cobra comissão nem processa pagamentos entre membros." },
  { title: "Com bom senso", body: "Avalie com cuidado antes de fechar qualquer acordo." },
];

function Page() {
  return (
    <PublicPage label="Oportunidades" title={<>Algumas oportunidades começam com uma conversa.</>} intro="Na comunidade, membros publicam o que procuram e o que podem oferecer. As oportunidades ficam visíveis apenas para quem tem conta.">
      <ItemGrid n="02" label="Tipos de oportunidade" items={TYPES} />
      <ItemGrid n="03" label="Como funciona" items={RULES} />
    </PublicPage>
  );
}
