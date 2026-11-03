import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SectionTitle, Tag } from "@/components/community/Bits";
import { fetchProfiles, timeAgo } from "@/lib/community";
import { SPECIALIST_CATEGORIES, STATUS_LABEL, type ProStatus } from "@/lib/specialists";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/ecossistema")({
  head: () => ({ meta: [{ title: "Especialistas e serviços — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pros" | "requests" | "log">("pros");
  const data = useQuery({
    queryKey: ["admin-eco"],
    queryFn: async () => {
      const [{ data: pros }, { data: reqs }, { data: matches }, { data: log }] = await Promise.all([
        supabase.from("professional_profiles").select("*").neq("status", "draft").order("updated_at", { ascending: false }),
        supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("service_request_matches").select("*"),
        supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const people = await fetchProfiles([...(pros ?? []).map((p) => p.user_id), ...(reqs ?? []).map((r) => r.requester_id), ...(log ?? []).map((l) => l.actor_id)]);
      return { pros: pros ?? [], reqs: reqs ?? [], matches: matches ?? [], log: log ?? [], name: (id: string | null) => (id && people.get(id)?.display_name) || "Membro" };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-eco"] });
  async function logAction(action: string, kind: string, id: string, note?: string) {
    await supabase.from("admin_actions").insert({ actor_id: user!.id, action, target_kind: kind, target_id: id, note: note ?? null });
  }
  async function setPro(id: string, patch: { status?: string; verified_at?: string | null; verified_by?: string | null }, action: string) {
    const { error } = await supabase.from("professional_profiles").update(patch).eq("user_id", id);
    if (error) return toast.error("Não foi possível atualizar.");
    await logAction(action, "professional", id);
    refresh();
  }
  async function forward(reqId: string, proId: string) {
    const { error } = await supabase.from("service_request_matches").insert({ request_id: reqId, professional_id: proId, sent_by: user!.id });
    if (error) return toast.error("Não foi possível encaminhar.");
    await logAction("forward", "service_request", reqId, proId);
    toast.success("Encaminhada. O profissional foi avisado.");
    refresh();
  }
  async function closeReq(id: string) {
    await supabase.from("service_requests").update({ status: "closed" }).eq("id", id);
    await logAction("close", "service_request", id);
    refresh();
  }
  const d = data.data;
  const approved = (d?.pros ?? []).filter((p) => p.status === "approved");
  return (
    <div>
      <div className="flex gap-2">
        {([["pros", "Especialistas"], ["requests", "Solicitações"], ["log", "Registro de ações"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l}</Button>)}
      </div>
      {data.isLoading ? <p className="mt-6 text-muted-foreground">Carregando…</p> : !d ? <p className="mt-6 text-destructive">Erro ao carregar.</p> : tab === "pros" ? (
        <section className="mt-6">
          <SectionTitle>Perfis enviados ({d.pros.length})</SectionTitle>
          <p className="mb-4 text-sm text-muted-foreground">"Aprovar" publica como Profissional cadastrado. "Verificar" só depois de conferir identidade e, para profissões regulamentadas, o registro no órgão (OAB, CRC…).</p>
          {d.pros.length ? <ul className="divide-y">{d.pros.map((p) => (
            <li key={p.user_id} className="py-4 text-sm">
              <div className="flex flex-wrap items-center gap-2"><Link to="/especialistas/$id" params={{ id: p.user_id }} className="font-bold hover:underline">{d.name(p.user_id)}</Link><Tag tone="primary">{STATUS_LABEL[p.status as ProStatus]}</Tag>{p.verified_at && <Tag>Verificado</Tag>}{!p.consent_public && <Tag>Sem autorização de exibição</Tag>}</div>
              <p className="text-muted-foreground">{p.headline} · {p.categories.map((c) => SPECIALIST_CATEGORIES[c]).join(", ")}</p>
              {Array.isArray(p.credentials) && p.credentials.length > 0 && <p className="text-xs">Credenciais: {(p.credentials as { type?: string; number?: string; issuer?: string }[]).map((c) => [c.type, c.number, c.issuer].filter(Boolean).join(" ")).join("; ")}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {p.status !== "approved" && <Button size="sm" onClick={() => setPro(p.user_id, { status: "approved" }, "approve")}>Aprovar</Button>}
                {p.status === "approved" && !p.verified_at && <Button size="sm" variant="outline" onClick={() => setPro(p.user_id, { verified_at: new Date().toISOString(), verified_by: user!.id }, "verify")}>Marcar como verificado</Button>}
                {p.verified_at && <Button size="sm" variant="outline" onClick={() => setPro(p.user_id, { verified_at: null, verified_by: null }, "unverify")}>Retirar verificação</Button>}
                {p.status !== "suspended" ? <Button size="sm" variant="ghost" onClick={() => setPro(p.user_id, { status: "suspended" }, "suspend")}>Suspender</Button> : <Button size="sm" variant="ghost" onClick={() => setPro(p.user_id, { status: "pending" }, "reinstate")}>Voltar para análise</Button>}
              </div>
            </li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Nenhum perfil enviado para análise.</p>}
        </section>
      ) : tab === "requests" ? (
        <section className="mt-6">
          <SectionTitle>Solicitações de serviço ({d.reqs.length})</SectionTitle>
          {d.reqs.length ? <ul className="divide-y">{d.reqs.map((r) => {
            const sentTo = d.matches.filter((m) => m.request_id === r.id);
            const options = approved.filter((p) => !sentTo.some((m) => m.professional_id === p.user_id)).sort((a, b) => Number(b.categories.includes(r.category)) - Number(a.categories.includes(r.category)));
            return (
              <li key={r.id} className="py-4 text-sm">
                <p className="font-medium">{d.name(r.requester_id)} · {SPECIALIST_CATEGORIES[r.category]} · {timeAgo(r.created_at)} <Tag>{r.status}</Tag></p>
                {r.professional_id && <p className="text-xs">Pedido direto para: {d.name(r.professional_id)}</p>}
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{r.need}</p>
                <p className="text-xs text-muted-foreground">{[r.budget_text && `Orçamento: ${r.budget_text}`, r.deadline && `Prazo: ${r.deadline}`, r.city, r.remote ? "remoto ok" : null].filter(Boolean).join(" · ")}</p>
                {sentTo.length > 0 && <p className="mt-1 text-xs">Encaminhada a: {sentTo.map((m) => `${d.name(m.professional_id)} (${m.status === "sent" ? "aguardando" : m.status === "accepted" ? "aceitou" : "recusou"})`).join(", ")}</p>}
                {r.status !== "closed" && <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select defaultValue="" onChange={(e) => { if (e.target.value) forward(r.id, e.target.value); e.target.value = ""; }} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Encaminhar para">
                    <option value="">Encaminhar para…</option>
                    {options.map((p) => <option key={p.user_id} value={p.user_id}>{d.name(p.user_id)}{p.categories.includes(r.category) ? " ✓ categoria" : ""}</option>)}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => closeReq(r.id)}>Encerrar</Button>
                </div>}
              </li>
            );
          })}</ul> : <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>}
        </section>
      ) : (
        <section className="mt-6">
          <SectionTitle>Registro de ações administrativas</SectionTitle>
          {d.log.length ? <ul className="divide-y text-sm">{d.log.map((l) => <li key={l.id} className="py-2">{new Date(l.created_at).toLocaleString("pt-BR")} · {d.name(l.actor_id)} · {l.action} · {l.target_kind}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>}
        </section>
      )}
    </div>
  );
}
