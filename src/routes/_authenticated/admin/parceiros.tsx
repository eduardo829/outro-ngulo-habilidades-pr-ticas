import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PROPOSAL_STATUS, type ProposalStatus } from "@/lib/partners";

export const Route = createFileRoute("/_authenticated/admin/parceiros")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Parceiros — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPartners,
});

const blank = { id: "", slug: "", name: "", kind: "external", relation: "", country: "", city: "", category: "", areas: "", partnership_types: "", description: "", website: "", logo_url: "", published: false, position: 0 };
type Form = typeof blank;

function AdminPartners() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"proposals" | "partners">("proposals");
  const [edit, setEdit] = useState<Form | null>(null);
  const q = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const [pa, pr, cl] = await Promise.all([
        supabase.from("partners").select("*").order("position"),
        supabase.from("partner_proposals").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("partner_clicks").select("partner_id, is_member").limit(5000),
      ]);
      return { partners: pa.data ?? [], proposals: pr.data ?? [], clicks: cl.data ?? [] };
    },
  });
  const log = (action: string, kind: string, id: string, note?: string) =>
    supabase.from("admin_actions").insert({ actor_id: user!.id, action, target_kind: kind, target_id: id, note: note ?? null });

  async function setStatus(id: string, status: ProposalStatus) {
    const { error } = await supabase.from("partner_proposals").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("Não foi possível atualizar.");
    await log("proposal_status", "partner_proposal", id, status);
    qc.invalidateQueries({ queryKey: ["admin-partners"] });
  }
  async function saveNote(id: string, admin_note: string) {
    const { error } = await supabase.from("partner_proposals").update({ admin_note, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Não foi possível salvar a anotação.");
    else toast.success("Anotação salva.");
  }
  async function savePartner(f: Form) {
    const arr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    if (!/^[a-z0-9-]{2,60}$/.test(f.slug) || !f.name.trim() || !f.country.trim() || !f.category.trim()) return toast.error("Preencha slug (a-z, 0-9, -), nome, país e categoria.");
    if (f.website && !/^https:\/\//.test(f.website)) return toast.error("O site precisa começar com https://");
    const row = { slug: f.slug, name: f.name.trim(), kind: f.kind, relation: f.relation || null, country: f.country.trim(), city: f.city || null, category: f.category.trim(), areas: arr(f.areas), partnership_types: arr(f.partnership_types), description: f.description, website: f.website || null, logo_url: f.logo_url || null, published: f.published, position: Number(f.position) || 0, updated_at: new Date().toISOString() };
    const res = f.id ? await supabase.from("partners").update(row).eq("id", f.id).select("id").single() : await supabase.from("partners").insert(row).select("id").single();
    if (res.error || !res.data) return toast.error("Não foi possível salvar.");
    await log(f.id ? "partner_update" : "partner_create", "partner", res.data.id, f.published ? "publicado" : "oculto");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["admin-partners"] });
    qc.invalidateQueries({ queryKey: ["partners"] });
    toast.success("Parceiro salvo.");
  }

  if (q.isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (q.isError || !q.data) return <p className="text-destructive">Não foi possível carregar. <button className="underline" onClick={() => q.refetch()}>Tentar de novo</button></p>;
  const { partners, proposals, clicks } = q.data;
  const name = (id: string | null) => partners.find((p) => p.id === id)?.name ?? "Outro Ângulo";
  const byStatus = Object.keys(PROPOSAL_STATUS).map((k) => [k, proposals.filter((p) => p.status === k).length] as const);
  const input = "w-full rounded-sm border bg-background px-2 py-1.5 text-sm";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Propostas" value={proposals.length} sub={`${proposals.filter((p) => p.is_member).length} de membros · ${proposals.filter((p) => !p.is_member).length} de visitantes`} />
        <Stat label="Cliques nos sites" value={clicks.length} sub={`${clicks.filter((c) => c.is_member).length} de membros`} />
        <Stat label="Convertidas" value={proposals.filter((p) => p.status === "convertido").length} sub={byStatus.filter(([, n]) => n).map(([k, n]) => `${PROPOSAL_STATUS[k as ProposalStatus]}: ${n}`).join(" · ") || "—"} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Visitas à página /parceiros aparecem nas estatísticas de acesso do site.</p>

      <div className="mt-8 flex gap-2 border-b">
        {(["proposals", "partners"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2 text-sm ${tab === t ? "border-primary font-semibold" : "border-transparent text-muted-foreground"}`}>
            {t === "proposals" ? "Propostas recebidas" : "Cadastro de parceiros"}
          </button>
        ))}
      </div>

      {tab === "proposals" ? (
        proposals.length ? (
          <ul className="divide-y">
            {proposals.map((p) => (
              <li key={p.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}{p.company ? ` · ${p.company}` : ""}</p>
                    <p className="text-sm text-muted-foreground"><a className="underline" href={`mailto:${p.email}`}>{p.email}</a>{p.country ? ` · ${p.country}` : ""}{p.area ? ` · ${p.area}` : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.interest} → {name(p.partner_id)} · origem: {p.origin || "—"} · {p.is_member ? "membro" : "visitante"} · {new Date(p.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value as ProposalStatus)} className="rounded-sm border bg-background px-2 py-1 text-sm" aria-label="Status">
                    {Object.entries(PROPOSAL_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{p.proposal}</p>
                {p.link && /^https:\/\//.test(p.link) && <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block text-sm underline">{p.link}</a>}
                <textarea defaultValue={p.admin_note ?? ""} onBlur={(e) => e.target.value !== (p.admin_note ?? "") && saveNote(p.id, e.target.value)} placeholder="Anotação interna (salva ao sair do campo)" className={`${input} mt-3 min-h-16`} maxLength={2000} />
              </li>
            ))}
          </ul>
        ) : <p className="py-8 text-muted-foreground">Nenhuma proposta recebida ainda.</p>
      ) : (
        <div className="py-6">
          <Button size="sm" onClick={() => setEdit({ ...blank })}>Novo parceiro</Button>
          <ul className="mt-4 divide-y">
            {partners.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">· {p.kind === "founder" ? "Parceiro fundador" : "Parceiro externo"} · {p.published ? "publicado" : "oculto"}</span></p>
                  <p className="text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(", ")} · {p.category}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEdit({ ...blank, ...p, relation: p.relation ?? "", city: p.city ?? "", website: p.website ?? "", logo_url: p.logo_url ?? "", areas: p.areas.join(", "), partnership_types: p.partnership_types.join(", ") })}>Editar</Button>
              </li>
            ))}
          </ul>
          {edit && (
            <form onSubmit={(e) => { e.preventDefault(); void savePartner(edit); }} className="mt-6 grid gap-3 border p-4">
              {([["name", "Nome"], ["slug", "Slug (endereço)"], ["relation", "Relação (ex.: Empresa vinculada ao fundador)"], ["country", "País"], ["city", "Cidade"], ["category", "Categoria"], ["areas", "Áreas (separadas por vírgula)"], ["partnership_types", "Tipos de parceria (separados por vírgula)"], ["website", "Website (https://)"], ["logo_url", "Logo (endereço da imagem oficial)"]] as const).map(([k, l]) => (
                <label key={k} className="grid gap-1 text-sm">{l}<input className={input} value={String(edit[k])} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>
              ))}
              <label className="grid gap-1 text-sm">Descrição<textarea className={`${input} min-h-20`} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={600} /></label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">Selo
                  <select className="rounded-sm border bg-background px-2 py-1" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>
                    <option value="founder">Parceiro fundador</option><option value="external">Parceiro externo</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">Ordem<input type="number" className="w-20 rounded-sm border bg-background px-2 py-1" value={edit.position} onChange={(e) => setEdit({ ...edit, position: Number(e.target.value) })} /></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />Publicado (só com autorização da empresa)</label>
              </div>
              <div className="flex gap-2"><Button type="submit" size="sm">Salvar</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button></div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
