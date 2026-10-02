import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";

const T = "Comunidade — Outro Ângulo";
const D = "Um espaço para perguntar, compartilhar o que você sabe, pedir ajuda e conhecer pessoas com objetivos parecidos ou complementares.";

export const Route = createFileRoute("/conheca-a-comunidade")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const WHAT = [
  { title: "Perguntas e discussões", body: "Traga uma dúvida de uma aula ou de um desafio real e ouça outros ângulos." },
  { title: "Preciso de ajuda", body: "Peça ajuda de forma direta. Quem sabe responder pode chamar você no privado." },
  { title: "Experiências e aprendizados", body: "Conte o que funcionou, o que não funcionou e o que você faria diferente." },
  { title: "Pessoas", body: "Um diretório opcional mostra o que cada um pode compartilhar e quer aprender." },
  { title: "Mensagens privadas", body: "Conversas um a um para continuar o que começou em uma publicação." },
  { title: "Diretrizes claras", body: "Respeito, nada de spam e moderação ativa da equipe." },
];

function Page() {
  return (
    <PublicPage label="Comunidade" title={<>Todo mundo sabe alguma coisa que pode ser útil para outra pessoa.</>} intro="A comunidade é onde o que você aprende vira conversa, troca e, às vezes, parceria. Ela é aberta a membros com conta criada.">
      <ItemGrid n="02" label="O que acontece por lá" items={WHAT} />
    </PublicPage>
  );
}
