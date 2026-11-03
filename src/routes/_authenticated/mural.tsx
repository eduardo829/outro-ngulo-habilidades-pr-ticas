import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page, Tag } from "@/components/community/Bits";
import { ReportButton } from "@/components/community/ReportButton";
import { fetchProfiles, openConversation, timeAgo } from "@/lib/community";
import { OPP_CATEGORIES, matchesOpportunity } from "@/lib/ecosystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mural")({
  head: () => ({ meta: [{ title: "Oportunidades — Outro Ângulo" }, { name: "description", content: "Sócios, parcerias, serviços e projetos publicados por membros." }, { property: "og:title", content: "Oportunidades — Outro Ângulo" }, { property: "og:description", content: "Sócios, parcerias, serviços e projetos publicados por membros." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Board,
});

function NewOpportunity({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ title: "", description: "", category: "socio", city: "", remote: false });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 4 || f.description.trim().length < 10) return toast.error("Preencha título e uma descrição clara.");
    setBusy(true);
    const { error } = await supabase.from("opportunities").insert({ author_id: user!.id, title: f.title.trim(), description: f.description.trim(), category: f.category, city: f.city.trim() || null, remote: f.remote });
    setBusy(false);
    if (error) return toast.error(error.message.includes("rate_limited") ? "Limite de publicações por hora atingido." : "Não foi possível publicar.");
    toast.success("Oportunidade publicada.");
    onDone();
  }
  return (
    <form onSubmit={submit} className="card-live mt-6 space-y-3 p-5">
      <Input placeholder="Título (ex.: Procuro sócio para loja de bairro)" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea placeholder="O que você procura ou oferece, e para quem faz sentido." maxLength={3000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-28" />
      <div className="flex flex-wrap items-center gap-3">
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="h-10 rounded-md border bg-background px-2 text-sm" aria-label="Categoria">
          {Object.entries(OPP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Input placeholder="Cidade/UF" maxLength={80} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="w-44" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} />Remoto</label>
        <Button type="submit" className="ml-auto" disabled={busy}>{busy ? "Publicando…" : "Publicar"}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Sem pagamentos ou contratos pela plataforma. Combine os detalhes diretamente e com cuidado.</p>
    </form>
  );
}

function Board() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ category: "todas", place: "", openOnly: true });
  const [limit, setLimit] = useState(30);

  const list = useQuery({
    queryKey: ["opportunities", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").eq("removed", false).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      const ids = (data ?? []).map((o) => o.id);
      const [authors, { data: ints }] = await Promise.all([
        fetchProfiles((data ?? []).map((o) => o.author_id)),
        ids.length ? supabase.from("opportunity_interests").select("opportunity_id, user_id").in("opportunity_id", ids) : Promise.resolve({ data: [] as { opportunity_id: string; user_id: string }[] }),
      ]);
      const interested = await fetchProfiles((ints ?? []).map((i) => i.user_id));
      return (data ?? []).map((o) => {
        const mine = (ints ?? []).filter((i) => i.opportunity_id === o.id);
        return { ...o, author: authors.get(o.author_id), iAmInterested: mine.some((i) => i.user_id === user!.id), interested: o.author_id === user!.id ? mine.map((i) => ({ id: i.user_id, name: interested.get(i.user_id)?.display_name ?? "Membro" })) : [] };
      });
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["opportunities"] });

  async function interest(id: string, on: boolean) {
    const r = on ? await supabase.from("opportunity_interests").delete().eq("opportunity_id", id).eq("user_id", user!.id) : await supabase.from("opportunity_interests").insert({ opportunity_id: id, user_id: user!.id });
    if (r.error) return toast.error("Não foi possível registrar.");
    if (!on) toast.success("Interesse enviado. O autor foi avisado.");
    refresh();
  }
  async function setStatus(id: string, status: string) {
    await supabase.from("opportunities").update({ status }).eq("id", id);
    refresh();
  }
  async function talk(other: string) {
    try { const id = await openConversation(other); navigate({ to: "/mensagens/$id", params: { id } }); } catch { toast.error("Não foi possível abrir a conversa."); }
  }

  const items = (list.data ?? []).filter((o) => matchesOpportunity(o, filter));

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">02 / Oportunidades</p>
          <h1 className="mt-2 text-3xl font-extrabold">Networking com propósito</h1>
          <p className="mt-2 text-muted-foreground">Sócios, parcerias, serviços e projetos publicados por membros.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus />Publicar oportunidade</Button>
      </div>
      {showForm && <NewOpportunity onDone={() => { setShowForm(false); refresh(); }} />}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-y py-3">
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Filtrar por categoria">
          <option value="todas">Todas as categorias</option>
          {Object.entries(OPP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Input value={filter.place} onChange={(e) => setFilter({ ...filter, place: e.target.value })} placeholder="Cidade ou “remoto”" className="h-9 w-48" aria-label="Filtrar por local" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filter.openOnly} onChange={(e) => setFilter({ ...filter, openOnly: e.target.checked })} />Só abertas</label>
      </div>
      {list.isLoading ? <p className="py-8 text-muted-foreground">Carregando…</p>
        : list.isError ? <p className="py-8 text-destructive">Não foi possível carregar. <button className="underline" onClick={() => list.refetch()}>Tentar de novo</button></p>
        : items.length ? (
          <ul className="divide-y">
            {items.map((o) => (
              <li key={o.id} className="py-6">
                <div className="flex flex-wrap gap-1.5">
                  <Tag tone="primary">{OPP_CATEGORIES[o.category]}</Tag>
                  <Tag><MapPin className="mr-1 h-3 w-3" />{[o.city, o.remote ? "Remoto" : null].filter(Boolean).join(" · ") || "Local não informado"}</Tag>
                  <Tag>{o.status === "open" ? "Aberta" : "Encerrada"}</Tag>
                </div>
                <h2 className="mt-3 text-lg font-bold">{o.title}</h2>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{o.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/pessoas/$id" params={{ id: o.author_id }} className="font-medium text-foreground hover:underline">{o.author?.display_name ?? "Membro"}</Link>
                  <span>· {timeAgo(o.created_at)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {o.author_id === user!.id ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(o.id, o.status === "open" ? "closed" : "open")}>{o.status === "open" ? "Encerrar" : "Reabrir"}</Button>
                    ) : (
                      <>
                        <ReportButton kind="opportunity" id={o.id} />
                        {o.status === "open" && <Button size="sm" variant={o.iAmInterested ? "outline" : "default"} onClick={() => interest(o.id, o.iAmInterested)}>{o.iAmInterested ? "Interesse enviado" : "Tenho interesse"}</Button>}
                      </>
                    )}
                  </div>
                </div>
                {o.author_id === user!.id && (
                  <div className="mt-3 rounded-md bg-secondary p-3 text-sm">
                    {o.interested.length ? <>Interessados: {o.interested.map((i, n) => <span key={i.id}>{n ? ", " : ""}<button className="font-medium underline" onClick={() => talk(i.id)}>{i.name}</button></span>)}</> : "Ninguém demonstrou interesse ainda."}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="py-10 text-center text-muted-foreground">Nenhuma oportunidade com esses filtros. Que tal publicar a primeira?</p>}
      {(list.data?.length ?? 0) >= limit && <Button variant="outline" className="w-full" onClick={() => setLimit(limit + 30)}>Carregar mais</Button>}
    </Page>
  );
}
