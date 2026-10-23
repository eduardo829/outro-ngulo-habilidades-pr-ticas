import { createFileRoute } from "@tanstack/react-router";
import { CourseCatalog } from "@/components/CourseCatalog";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo de cursos — Outro Ângulo" }, { name: "description", content: "Todos os cursos do Outro Ângulo, dentro da sua área." }, { property: "og:title", content: "Catálogo de cursos — Outro Ângulo" }, { property: "og:description", content: "Todos os cursos do Outro Ângulo, dentro da sua área." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <CourseCatalog inApp />,
});
