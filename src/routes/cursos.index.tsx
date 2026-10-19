import { createFileRoute } from "@tanstack/react-router";
import { CourseCatalog } from "@/components/CourseCatalog";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — Outro Ângulo" },
      { name: "description", content: "Menos conteúdo para assistir, mais conhecimento para usar. Cursos práticos de carreira, comunicação, dinheiro, relacionamentos, tecnologia, profissões e negócios." },
      { property: "og:title", content: "Cursos — Outro Ângulo" },
      { property: "og:description", content: "Aprenda um conceito, coloque em prática e construa algo que continua útil depois da última aula." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CourseCatalog />,
});
