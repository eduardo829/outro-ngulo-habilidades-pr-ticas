import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o projeto — Outro Ângulo" },
      { name: "description", content: "Por que o Outro Ângulo existe e como pensamos o aprendizado prático para a vida adulta." },
      { property: "og:title", content: "Sobre o projeto — Outro Ângulo" },
      { property: "og:description", content: "Por que o Outro Ângulo existe." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-extrabold">Sobre o projeto</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>
            Muita coisa que faz diferença na vida adulta não aparece no currículo: como conhecer pessoas, como se apresentar, como planejar algo e de fato executar, como negociar, como decidir entre caminhos diferentes.
          </p>
          <p>
            O Outro Ângulo existe para tratar esses temas com seriedade e de forma prática. Cada módulo termina com uma atividade concreta, porque aprender de verdade envolve testar.
          </p>
          <p>
            Não prometemos transformação garantida nem atalhos. Oferecemos conteúdo bem pensado, um espaço para aplicar e uma comunidade para trocar experiências.
          </p>
        </div>
        <div className="mt-10 flex gap-3">
          <Button asChild><Link to="/cursos">Ver cursos</Link></Button>
          <Button asChild variant="outline"><Link to="/diretrizes">Diretrizes da comunidade</Link></Button>
        </div>
      </article>
    </PublicLayout>
  );
}
