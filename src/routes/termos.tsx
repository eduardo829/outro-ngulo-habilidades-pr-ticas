import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso (rascunho) — Outro Ângulo" },
      { name: "description", content: "Rascunho dos termos de uso do Outro Ângulo." },
      { property: "og:title", content: "Termos de uso — Outro Ângulo" },
      { property: "og:description", content: "Rascunho dos termos de uso." },
    ],
  }),
  component: () => (
    <LegalPage title="Termos de uso">
      <h2>Conta e acesso</h2>
      <p>Criar uma conta não libera automaticamente os cursos. O acesso a cada curso depende de matrícula ativa.</p>
      <h2>Uso do conteúdo</h2>
      <p>O conteúdo dos cursos é para uso pessoal do aluno matriculado.</p>
      <h2>Comunidade</h2>
      <p>A participação na comunidade segue as diretrizes publicadas. A equipe pode remover conteúdos e suspender a participação em caso de violação.</p>
    </LegalPage>
  ),
});
