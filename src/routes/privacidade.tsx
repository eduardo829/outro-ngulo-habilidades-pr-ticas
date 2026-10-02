import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade (rascunho) — Outro Ângulo" },
      { name: "description", content: "Rascunho da política de privacidade do Outro Ângulo." },
      { property: "og:title", content: "Privacidade — Outro Ângulo" },
      { property: "og:description", content: "Rascunho da política de privacidade." },
    ],
  }),
  component: () => (
    <LegalPage title="Política de privacidade">
      <h2>Dados que coletamos</h2>
      <p>E-mail e senha para acesso e as informações de perfil que você decidir preencher (nome de exibição, foto, bio, cidade, área, interesses e link profissional). Não pedimos endereço residencial nem data de nascimento.</p>
      <h2>Como usamos</h2>
      <p>Para dar acesso aos cursos em que você está matriculado, registrar seu progresso e permitir a participação na comunidade.</p>
      <h2>Diretório de membros</h2>
      <p>Seu perfil só aparece no diretório se você ativar essa opção. Seu e-mail nunca é exibido a outros membros.</p>
      <h2>Exclusão de conta</h2>
      <p>Você pode solicitar a exclusão da conta na página de configurações do seu perfil.</p>
    </LegalPage>
  ),
});
