import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/diretrizes")({
  head: () => ({
    meta: [
      { title: "Diretrizes da comunidade — Outro Ângulo" },
      { name: "description", content: "Como convivemos na comunidade do Outro Ângulo." },
      { property: "og:title", content: "Diretrizes da comunidade — Outro Ângulo" },
      { property: "og:description", content: "Como convivemos na comunidade." },
    ],
  }),
  component: () => (
    <LegalPage title="Diretrizes da comunidade">
      <h2>Respeito acima de tudo</h2>
      <p>Discorde de ideias, não de pessoas. Sem ofensas, assédio ou discriminação.</p>
      <h2>Contribua antes de pedir</h2>
      <p>Compartilhe o que você sabe. Pedidos de ajuda são bem-vindos; venda insistente e spam não.</p>
      <h2>Privacidade</h2>
      <p>Não publique dados pessoais seus ou de outras pessoas, e não compartilhe conversas fora da comunidade sem autorização.</p>
      <h2>Denúncias</h2>
      <p>Use a opção de denunciar em qualquer mensagem que viole estas regras. A moderação analisa cada caso.</p>
    </LegalPage>
  ),
});
