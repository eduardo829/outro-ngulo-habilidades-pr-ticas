import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, ItemGrid } from "@/components/PublicPage";

const T = "Gestores — Outro Ângulo";
const D = "Pessoas com experiência prática que participam de encontros ao vivo e respondem perguntas da comunidade.";

export const Route = createFileRoute("/gestores/")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const WHAT = [
  { title: "Experiência real", body: "Gestores são pessoas que vivem o tema no dia a dia de trabalho." },
  { title: "Encontros ao vivo", body: "Eles conduzem aulas, plantões e workshops na agenda da plataforma." },
  { title: "Perguntas da comunidade", body: "Membros enviam e votam perguntas antes de cada encontro." },
];

function Page() {
  return (
    <PublicPage label="Gestores" title={<>Aprender com quem já passou por isso.</>} intro="Os perfis completos dos gestores ficam disponíveis para membros. Novos nomes serão apresentados aqui conforme forem confirmados.">
      <ItemGrid n="02" label="O papel dos gestores" items={WHAT} />
    </PublicPage>
  );
}
