import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { MemberLink } from "@/components/MemberLink";
import { supabase } from "@/integrations/supabase/client";
import { Angle, SectionLabel } from "@/components/Angle";

export const Route = createFileRoute("/comunidades")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Comunidades — Outro Ângulo" },
      { name: "description", content: "Conecte-se com pessoas que compartilham seus interesses e objetivos. Comunidades moderadas, com diretrizes claras." },
      { property: "og:title", content: "Comunidades — Outro Ângulo" },
      { property: "og:description", content: "Conecte-se com pessoas que compartilham seus interesses e objetivos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/comunidades" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/comunidades" }],
  }),
  component: ComunidadesPage,
});

function ComunidadesPage() {
  const communities = useQuery({
    queryKey: ["home-communities"],
    staleTime: 300_000,
    queryFn: async () => (await supabase.from("communities").select("slug, name, description, categories").eq("active", true).order("position")).data ?? [],
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-24">
        <SectionLabel>Comunidades</SectionLabel>
        <h1 className="display-xl mt-8 max-w-3xl">Conecte-se com quem está<br /><span className="pl-[6%] text-muted-foreground">no mesmo caminho.</span></h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Comunidades moderadas para trocar experiências, tirar dúvidas e encontrar pessoas com interesses e objetivos parecidos com os seus.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button asChild size="lg">
            <MemberLink to="/app/comunidades" member="Entrar nas comunidades" visitor="Criar conta gratuita" />
          </Button>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SectionLabel n="01">Comunidades ativas</SectionLabel>
          {communities.isLoading ? (
            <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Angle spin /> Carregando…</p>
          ) : communities.data && communities.data.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {communities.data.map((c) => (
                <article key={c.slug} className="flex flex-col border-t-2 border-highlight pt-5">
                  <h2 className="font-display text-2xl font-bold">{c.name}</h2>
                  <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{c.description}</p>
                  {c.categories?.length > 0 && <p className="eyebrow mt-4">{c.categories.slice(0, 4).join(" · ")}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-muted-foreground">Novas comunidades estão em preparação.</p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">Novas comunidades são abertas aos poucos, conforme a equipe consegue moderar cada uma com qualidade.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionLabel n="02">Como participar</SectionLabel>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["Crie sua conta", "O cadastro é gratuito e leva poucos minutos."],
            ["Escolha uma comunidade", "Entre na que combina com o seu momento."],
            ["Participe", "Publique, comente e converse — com diretrizes claras e moderação ativa."],
          ].map(([t, d], i) => (
            <li key={t}>
              <span className="font-display text-4xl font-extrabold tabular-nums text-border">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Button asChild size="lg">
            <MemberLink to="/app/comunidades" member="Entrar nas comunidades" visitor="Fazer parte" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
