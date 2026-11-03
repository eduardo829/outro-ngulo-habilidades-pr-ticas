import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page, Tag } from "@/components/community/Bits";
import { RESOURCE_KINDS } from "@/lib/ecosystem";

export const Route = createFileRoute("/_authenticated/recursos")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Recursos — Outro Ângulo" }, { name: "description", content: "Templates, planilhas, checklists, prompts e guias práticos." }, { property: "og:title", content: "Recursos — Outro Ângulo" }, { property: "og:description", content: "Templates, planilhas, checklists, prompts e guias práticos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Resources,
});

function Resources() {
  const list = useQuery({
    queryKey: ["resources"],
    queryFn: async () => (await supabase.from("resources").select("*").eq("published", true).order("position").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <Page>
      <p className="eyebrow">03 / Recursos</p>
      <h1 className="mt-2 text-3xl font-extrabold">Biblioteca de recursos</h1>
      <p className="mt-2 text-muted-foreground">Materiais práticos selecionados pela equipe.</p>
      {list.isLoading ? <p className="mt-8 text-muted-foreground">Carregando…</p> : list.data?.length ? (
        <ul className="mt-8 divide-y border-y">
          {list.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div className="min-w-0 flex-1">
                <Tag>{RESOURCE_KINDS[r.kind]}</Tag>
                <h2 className="mt-2 font-bold">{r.title}</h2>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
              </div>
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Abrir <ExternalLink className="h-4 w-4" /></a>}
            </li>
          ))}
        </ul>
      ) : <p className="mt-8 text-muted-foreground">A biblioteca está sendo montada. Os primeiros materiais aparecem aqui em breve.</p>}
    </Page>
  );
}
