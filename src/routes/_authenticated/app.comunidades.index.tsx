import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/community/Bits";
import { VISIBILITY_LABEL } from "@/lib/ecosystem";

export const Route = createFileRoute("/_authenticated/app/comunidades/")({
  head: () => ({ meta: [{ title: "Comunidades — Outro Ângulo" }, { name: "description", content: "Encontre sua comunidade e participe das conversas." }, { property: "og:title", content: "Comunidades — Outro Ângulo" }, { property: "og:description", content: "Encontre sua comunidade e participe das conversas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Communities,
});

function Communities() {
  const list = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });
  const active = (list.data ?? []).filter((c) => c.active);
  const soon = (list.data ?? []).filter((c) => !c.active);
  return (
    <Page>
      <p className="eyebrow">01 / Comunidades</p>
      <h1 className="mt-2 text-3xl font-extrabold">Onde as conversas acontecem</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Cada comunidade tem um tema, categorias próprias e moderação. Participar é gratuito.</p>
      {list.isLoading && <p className="mt-8 text-muted-foreground">Carregando…</p>}
      {list.isError && <p className="mt-8 text-destructive">Não foi possível carregar. <button className="underline" onClick={() => list.refetch()}>Tentar de novo</button></p>}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {active.map((c) => (
          <Link key={c.id} to="/app/comunidades/$slug" params={{ slug: c.slug }} className="card-live group flex flex-col p-6">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{VISIBILITY_LABEL[c.visibility]}</span>
            <h2 className="mt-2 text-xl font-bold">{c.name}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </div>
      {!!soon.length && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Em preparação</h2>
          <ul className="mt-3 divide-y border-y">
            {soon.map((c) => <li key={c.id} className="flex justify-between gap-4 py-3 text-sm"><span className="font-medium">{c.name}</span><span className="text-muted-foreground">Em breve</span></li>)}
          </ul>
        </section>
      )}
    </Page>
  );
}
