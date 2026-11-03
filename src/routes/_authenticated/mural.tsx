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
import { PARTNERSHIP_TYPES, PROJECT_STAGES, canTalk, splitList } from "@/lib/specialists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mural")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Oportunidades — Outro Ângulo" }, { name: "description", content: "Sócios, parcerias, serviços e projetos publicados por membros." }, { property: "og:title", content: "Oportunidades — Outro Ângulo" }, { property: "og:description", content: "Sócios, parcerias, serviços e projetos publicados por membros." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Board,
});

function NewOpportunity({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ title: "", description: "", category: "socio", city: "", remote: false, sector: "", stage: "ideia", skills: "", partnership_type: "socio_tecnico" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 4 || f.description.trim().length < 10) return toast.error("Preencha título e uma descrição clara.");
    setBusy(true);
    const { error } = await supabase.from("opportunities").insert({ author_id: user!.id, title: f.title.trim(), description: f.description.trim(), category: f.category, city: f.city.trim() || null, remote: f.remote, ...(f.category === "socio" ? { sector: f.sector.trim() || null, stage: f.stage, skills_wanted: splitList(f.skills), partnership_type: f.partnership_type } : {}) });
    setBusy(false);
    if (error) return toast.error(error.message.includes("rate_limited") ? "Limite de publicações por hora atingido." : "Não foi possível publicar.");
    toast.success("Oportunidade publicada.");
    onDone();
  }
  return (
    <form onSubmit={submit} className="card-live mt-6 space-y-3 p-5">
      <Input placeholder="Título (ex.: Procuro sócio para loja de bairro)" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea placeholder="O que você procura ou oferece, e para quem faz sentido." maxLength={3000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-28" />
      {f.category === "socio" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Setor (ex.: alimentação, SaaS)" maxLength={60} value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} aria-label="Setor" />
          <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })} className="h-10 rounded-md border bg-background px-2 text-sm" aria-label="Estágio">{Object.entries(PROJECT_STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <Input placeholder="Competências que procura, separadas por vírgula" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} aria-label="Competências procuradas" />
          <select value={f.partnership_type} onChange={(e) => setF({ ...f, partnership_type: e.target.value })} className="h-10 rounded-md border bg-background px-2 text-sm" aria-label="Tipo de parceria">{Object.entries(PARTNERSHIP_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <p className="text-xs text-muted-foreground sm:col-span-2">Publique só o resumo público. Detalhes confidenciais você compartilha depois, por mensagem, com quem aceitar.</p>
        </div>
      )}
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
  const [filter, setFilter] = useState({ category: "todas", place: "", openOnly: true, stage: "todos", skill: "" });
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
        ids.length ? supabase.from("opportunity_interests").select("opportunity_id, user_id, status").in("opportunity_id", ids) : Promise.resolve({ data: [] as { opportunity_id: string; user_id: string; status: string }[] }),
      ]);
      const interested = await fetchProfiles((ints ?? []).map((i) => i.user_id));
      return (data ?? []).map((o) => {
        const mine = (ints ?? []).filter((i) => i.opportunity_id === o.id);
        return { ...o, author: authors.get(o.author_id), iAmInterested: mine.some((i) => i.user_id === user!.id), myStatus: mine.find((i) => i.user_id === user!.id)?.status ?? null, interested: o.author_id === user!.id ? mine.map((i) => ({ id: i.user_id, status: i.status, name: interested.get(i.user_id)?.display_name ?? "Membro" })) : [] };
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
  async function decide(oppId: string, uid: string, status: "accepted" | "declined") {
    const { error } = await supabase.from("opportunity_interests").update({ status }).eq("opportunity_id", oppId).eq("user_id", uid);
    if (error) return toast.error("Não foi possível atualizar.");
    toast.success(status === "accepted" ? "Interesse aceito. A pessoa foi avisada." : "Interesse recusado.");
    refresh();
  }
  async function setStatus(id: string, status: string) {
    await supabase.from("opportunities").update({ status }).eq("id", id);
    refresh();
  }
  async function talk(other: string) {
    try { const id = await openConversation(other); navigate({ to: "/mensagens/$id", params: { id } }); } catch { toast.error("Não foi possível abrir a conversa."); }
  }

  const items = (list.data ?? []).filter((o) => matchesOpportunity(o, filter) && (filter.category !== "socio" || ((filter.stage === "todos" || o.stage === filter.stage) && (!filter.skill.trim() || o.skills_wanted.some((k) => k.toLowerCase().includes(filter.skill.trim().toLowerCase()))))));

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
        {filter.category === "socio" && <>
          <select value={filter.stage} onChange={(e) => setFilter({ ...filter, stage: e.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Filtrar por estágio"><option value="todos">Todos os estágios</option>{Object.entries(PROJECT_STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <Input value={filter.skill} onChange={(e) => setFilter({ ...filter, skill: e.target.value })} placeholder="Competência" className="h-9 w-36" aria-label="Filtrar por competência" />
        </>}
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
                  {o.sector && <Tag>{o.sector}</Tag>}
                  {o.stage && <Tag>{PROJECT_STAGES[o.stage] ?? o.stage}</Tag>}
                  {o.partnership_type && <Tag>{PARTNERSHIP_TYPES[o.partnership_type] ?? o.partnership_type}</Tag>}
                </div>
                <h2 className="mt-3 text-lg font-bold">{o.title}</h2>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{o.description}</p>
                {o.skills_wanted.length > 0 && <p className="mt-1 text-sm">Procura: {o.skills_wanted.join(", ")}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/pessoas/$id" params={{ id: o.author_id }} className="font-medium text-foreground hover:underline">{o.author?.display_name ?? "Membro"}</Link>
                  <span>· {timeAgo(o.created_at)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {o.author_id === user!.id ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(o.id, o.status === "open" ? "closed" : "open")}>{o.status === "open" ? "Encerrar" : "Reabrir"}</Button>
                    ) : (
                      <>
                        <ReportButton kind="opportunity" id={o.id} />
                        {o.myStatus && canTalk(o.myStatus) && <Button size="sm" onClick={() => talk(o.author_id)}>Conversar</Button>}
                        {o.myStatus === "declined" && <span className="text-xs">Não aceito desta vez</span>}
                        {o.status === "open" && o.myStatus !== "accepted" && o.myStatus !== "declined" && <Button size="sm" variant={o.iAmInterested ? "outline" : "default"} onClick={() => interest(o.id, o.iAmInterested)}>{o.iAmInterested ? "Interesse enviado" : "Tenho interesse"}</Button>}
                      </>
                    )}
                  </div>
                </div>
                {o.author_id === user!.id && (
                  <div className="mt-3 rounded-md bg-secondary p-3 text-sm">
                    {o.interested.length ? <ul className="space-y-2"><li className="font-medium">Interessados</li>{o.interested.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center gap-2">
                        <Link to="/pessoas/$id" params={{ id: i.id }} className="underline">{i.name}</Link>
                        {i.status === "pending" ? <><Button size="sm" onClick={() => decide(o.id, i.id, "accepted")}>Aceitar</Button><Button size="sm" variant="outline" onClick={() => decide(o.id, i.id, "declined")}>Recusar</Button></>
                          : canTalk(i.status) ? <Button size="sm" variant="outline" onClick={() => talk(i.id)}>Conversar</Button> : <span className="text-xs text-muted-foreground">Recusado</span>}
                      </li>))}</ul> : "Ninguém demonstrou interesse ainda."}
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
