import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { fetchProfiles } from "@/lib/community";
import { SPECIALIST_CATEGORIES, badgeFor, canShowBudget, matchesSpecialist } from "@/lib/specialists";
import { RequestForm } from "@/components/specialists/RequestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const T = "Especialistas — Outro Ângulo";
const D = "Profissionais de IA, sistemas, marketing, finanças, jurídico, gestão e design para o seu negócio.";
export const Route = createFileRoute("/_authenticated/app/especialistas/")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Directory,
});

function Directory() {
  const [f, setF] = useState({ category: "todas", place: "", verifiedOnly: false, q: "" });
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["specialists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("professional_profiles").select("*").eq("status", "approved").eq("consent_public", true).order("verified_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const people = await fetchProfiles((data ?? []).map((p) => p.user_id));
      return (data ?? []).map((p) => ({ ...p, display_name: people.get(p.user_id)?.display_name ?? "Profissional", avatar_url: people.get(p.user_id)?.avatar_url }));
    },
  });
  const items = (list.data ?? []).filter((p) => matchesSpecialist(p, f));
  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">03 / Especialistas</p>
          <h1 className="mt-2 text-3xl font-extrabold">Encontre um especialista</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Profissionais cadastrados na comunidade. O selo "Verificado" só aparece depois de uma análise real da nossa equipe.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/app/especialistas/painel">Quero ser especialista</Link></Button>
          <Button onClick={() => setOpen(true)}>Descrever minha necessidade</Button>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-y py-3">
        <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Buscar" className="h-9 w-44" aria-label="Buscar" />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Categoria">
          <option value="todas">Todas as categorias</option>
          {Object.entries(SPECIALIST_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Input value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="Cidade ou “remoto”" className="h-9 w-40" aria-label="Local" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.verifiedOnly} onChange={(e) => setF({ ...f, verifiedOnly: e.target.checked })} />Só verificados</label>
      </div>
      {list.isLoading ? <p className="py-8 text-muted-foreground">Carregando…</p>
        : list.isError ? <p className="py-8 text-destructive">Não foi possível carregar. <button className="underline" onClick={() => list.refetch()}>Tentar de novo</button></p>
        : items.length ? (
          <ul className="divide-y">
            {items.map((p) => (
              <li key={p.user_id} className="flex gap-4 py-5">
                <Avatar name={p.display_name} url={p.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to="/app/especialistas/$id" params={{ id: p.user_id }} className="font-bold hover:underline">{p.display_name}</Link>
                    {badgeFor(p) === "verified" && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><BadgeCheck className="h-4 w-4" />Verificado pelo Outro Ângulo</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{p.headline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.categories.map((c) => <Tag key={c} tone="primary">{SPECIALIST_CATEGORIES[c] ?? c}</Tag>)}
                    <Tag><MapPin className="mr-1 h-3 w-3" />{[p.city, p.remote ? "Remoto" : null].filter(Boolean).join(" · ") || "Local não informado"}</Tag>
                    {p.availability && <Tag>{p.availability}</Tag>}
                    {p.budget_text && canShowBudget(p.categories) && <Tag>{p.budget_text}</Tag>}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild className="self-center"><Link to="/app/especialistas/$id" params={{ id: p.user_id }}>Ver perfil</Link></Button>
              </li>
            ))}
          </ul>
        ) : <p className="py-10 text-center text-muted-foreground">{list.data?.length ? "Nenhum especialista com esses filtros." : "Ainda não há especialistas aprovados. Você pode descrever sua necessidade e nossa equipe procura alguém compatível."}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Descreva sua necessidade</DialogTitle></DialogHeader>
          <RequestForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Page>
  );
}
