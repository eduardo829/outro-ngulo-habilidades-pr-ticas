import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCE_KINDS, VISIBILITY_LABEL } from "@/lib/ecosystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/moderacao")({
  head: () => ({ meta: [{ title: "Moderação e engajamento — Admin" }, { name: "description", content: "Denúncias, comunidades, recursos e métricas reais." }, { property: "og:title", content: "Moderação — Admin" }, { property: "og:description", content: "Denúncias, comunidades, recursos e métricas reais." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Moderation,
});

const since = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
async function count(table: "profiles" | "posts" | "comments" | "event_bookings" | "opportunities" | "community_members", f?: (q: any) => any) {
  let q: any = supabase.from(table).select("*", { count: "exact", head: true });
  if (f) q = f(q);
  const { count: n } = await q;
  return n ?? 0;
}

function Metrics() {
  const m = useQuery({
    queryKey: ["admin-engagement"],
    queryFn: async () => {
      const [members, a7, a30, posts, posts30, comments, comments30, bookings, opps, joins] = await Promise.all([
        count("profiles"), count("profiles", (q) => q.gte("last_active_at", since(7))), count("profiles", (q) => q.gte("last_active_at", since(30))),
        count("posts"), count("posts", (q) => q.gte("created_at", since(30))), count("comments"), count("comments", (q) => q.gte("created_at", since(30))),
        count("event_bookings"), count("opportunities"), count("community_members"),
      ]);
      return [["Membros cadastrados", members], ["Ativos 7 dias", a7], ["Ativos 30 dias", a30], ["Publicações (30 dias)", `${posts30} de ${posts}`], ["Comentários (30 dias)", `${comments30} de ${comments}`], ["Inscrições em eventos", bookings], ["Oportunidades", opps], ["Participações em comunidades", joins]] as const;
    },
  });
  return (
    <section>
      <h2 className="text-lg font-bold">Engajamento</h2>
      <p className="text-sm text-muted-foreground">Dados reais. "Ativos" passou a ser medido a partir desta versão.</p>
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
        {(m.data ?? []).map(([l, v]) => <div key={l} className="bg-card p-4"><dt className="text-xs text-muted-foreground">{l}</dt><dd className="mt-1 text-xl font-bold">{v}</dd></div>)}
      </dl>
    </section>
  );
}

function Reports() {
  const qc = useQueryClient();
  const r = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100);
      const rows = data ?? [];
      const ids = (k: string) => rows.filter((x) => x.target_kind === k).map((x) => x.target_id);
      const [p, c, o] = await Promise.all([
        ids("post").length ? supabase.from("posts").select("id, body, removed").in("id", ids("post")) : { data: [] },
        ids("comment").length ? supabase.from("comments").select("id, body").in("id", ids("comment")) : { data: [] },
        ids("opportunity").length ? supabase.from("opportunities").select("id, title, removed").in("id", ids("opportunity")) : { data: [] },
      ]);
      const text = new Map<string, string>([...(p.data ?? []).map((x: any) => [x.id, x.body]), ...(c.data ?? []).map((x: any) => [x.id, x.body]), ...(o.data ?? []).map((x: any) => [x.id, x.title])] as [string, string][]);
      return rows.map((x) => ({ ...x, text: text.get(x.target_id) ?? "(conteúdo já apagado)" }));
    },
  });
  async function act(rep: { id: string; target_kind: string; target_id: string }, remove: boolean) {
    if (remove) {
      const res = rep.target_kind === "post" ? await supabase.from("posts").update({ removed: true }).eq("id", rep.target_id)
        : rep.target_kind === "opportunity" ? await supabase.from("opportunities").update({ removed: true }).eq("id", rep.target_id)
        : await supabase.from("comments").delete().eq("id", rep.target_id);
      if (res.error) return toast.error("Não foi possível remover.");
    }
    await supabase.from("reports").update({ status: remove ? "resolved" : "dismissed" }).eq("target_id", rep.target_id).eq("status", "open");
    toast.success(remove ? "Conteúdo removido." : "Denúncia arquivada.");
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
  }
  const labels: Record<string, string> = { post: "Publicação", comment: "Comentário", opportunity: "Oportunidade" };
  return (
    <section>
      <h2 className="text-lg font-bold">Denúncias abertas</h2>
      {r.data?.length ? (
        <ul className="mt-3 divide-y border-y">
          {r.data.map((x) => (
            <li key={x.id} className="py-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels[x.target_kind]} · {new Date(x.created_at).toLocaleString("pt-BR")}</p>
              <p className="mt-1 line-clamp-3">{x.text}</p>
              <p className="mt-1 text-sm text-muted-foreground">Motivo: {x.reason}</p>
              <div className="mt-2 flex gap-2"><Button size="sm" variant="destructive" onClick={() => act(x, true)}>Remover conteúdo</Button><Button size="sm" variant="outline" onClick={() => act(x, false)}>Arquivar</Button></div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-muted-foreground">Nenhuma denúncia aberta.</p>}
    </section>
  );
}

function Communities() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-communities"], queryFn: async () => (await supabase.from("communities").select("*").order("position")).data ?? [] });
  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("communities").update(patch).eq("id", id);
    if (error) return toast.error("Não foi possível salvar.");
    qc.invalidateQueries({ queryKey: ["admin-communities"] }); qc.invalidateQueries({ queryKey: ["communities"] });
  }
  return (
    <section>
      <h2 className="text-lg font-bold">Comunidades</h2>
      <ul className="mt-3 divide-y border-y">
        {(list.data ?? []).map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="flex-1 font-medium">{c.name}</span>
            <select value={c.visibility} onChange={(e) => update(c.id, { visibility: e.target.value })} className="h-9 rounded-md border bg-background px-2" aria-label="Visibilidade">
              {Object.entries(VISIBILITY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <Input defaultValue={c.categories.join(", ")} onBlur={(e) => { const v = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); if (v.join() !== c.categories.join()) update(c.id, { categories: v }); }} className="h-9 w-64" aria-label="Categorias (separadas por vírgula)" />
            <Button size="sm" variant={c.active ? "outline" : "default"} onClick={() => update(c.id, { active: !c.active })}>{c.active ? "Desativar" : "Ativar"}</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Resources() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", kind: "guia", description: "", url: "" });
  const list = useQuery({ queryKey: ["admin-resources"], queryFn: async () => (await supabase.from("resources").select("*").order("created_at", { ascending: false })).data ?? [] });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-resources"] });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3) return toast.error("Informe um título.");
    if (f.url && !/^https:\/\/\S+$/.test(f.url)) return toast.error("Use um link https://");
    const { error } = await supabase.from("resources").insert({ title: f.title.trim(), kind: f.kind, description: f.description.trim() || null, url: f.url || null });
    if (error) return toast.error("Não foi possível salvar.");
    setF({ title: "", kind: "guia", description: "", url: "" }); refresh();
  }
  return (
    <section>
      <h2 className="text-lg font-bold">Recursos</h2>
      <form onSubmit={add} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="h-10 rounded-md border bg-background px-2 text-sm">{Object.entries(RESOURCE_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <Input placeholder="Descrição curta" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Input placeholder="https://link-do-material" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <Button type="submit" className="md:col-span-2">Adicionar (fica como rascunho)</Button>
      </form>
      <ul className="mt-4 divide-y border-y">
        {(list.data ?? []).map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="flex-1"><b>{r.title}</b> · {RESOURCE_KINDS[r.kind]}</span>
            <Button size="sm" variant={r.published ? "outline" : "default"} onClick={async () => { await supabase.from("resources").update({ published: !r.published }).eq("id", r.id); refresh(); }}>{r.published ? "Despublicar" : "Publicar"}</Button>
            <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("resources").delete().eq("id", r.id); refresh(); }}>Apagar</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Moderation() {
  return <div className="space-y-10"><Metrics /><Reports /><Communities /><Resources /></div>;
}
