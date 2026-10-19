import { createFileRoute } from "@tanstack/react-router";
import { CourseCatalog } from "@/components/CourseCatalog";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo de cursos — Outro Ângulo" }, { name: "description", content: "Todos os cursos do Outro Ângulo, dentro da sua área." }] }),
  component: () => <CourseCatalog inApp />,
});
