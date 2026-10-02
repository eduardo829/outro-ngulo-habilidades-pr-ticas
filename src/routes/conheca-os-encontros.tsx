import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";

const T = "Encontros ao vivo — Outro Ângulo";
const D = "Aulas ao vivo, plantões de dúvidas, workshops e encontros de networking com vagas limitadas e perguntas enviadas antes.";

export const Route = createFileRoute("/conheca-os-encontros")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const FORMATS = [
  { title: "Aula ao vivo", body: "Um tema prático, explicado e discutido em tempo real." },
  { title: "Plantão de dúvidas", body: "Espaço para trazer perguntas sobre as aulas e situações reais." },
  { title: "Workshop", body: "Mão na massa: você sai com algo pronto ou começado." },
  { title: "Networking", body: "Encontros pensados para conhecer pessoas novas com calma." },
];
const HOW = [
  { title: "Reserve sua vaga", body: "Os encontros têm vagas definidas. A reserva é feita na sua área." },
  { title: "Envie perguntas antes", body: "Membros podem enviar e votar nas perguntas que querem ver respondidas." },
  { title: "Entre pelo link", body: "O link da sala externa aparece para quem reservou, perto do horário." },
  { title: "Defina uma ação", body: "Depois do encontro, você registra um próximo passo concreto." },
];

function Page() {
  return (
    <PublicPage label="Encontros" title={<>Aprender junto, ao vivo.</>} intro="Os encontros acontecem em salas externas de videochamada. A agenda fica disponível para membros dentro da plataforma.">
      <ItemGrid n="02" label="Formatos" items={FORMATS} cols={2} />
      <ItemGrid n="03" label="Como funciona" items={HOW} cols={2} />
    </PublicPage>
  );
}
