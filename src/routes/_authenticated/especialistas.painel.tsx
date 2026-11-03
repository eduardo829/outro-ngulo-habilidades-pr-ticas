import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page, SectionTitle, Tag } from "@/components/community/Bits";
import { fetchProfiles, openConversation, timeAgo } from "@/lib/community";
import { SPECIALIST_CATEGORIES, REGULATED, STATUS_LABEL, missingForReview, splitList, type ProStatus } from "@/lib/specialists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/especialistas/painel")({
  head: () => ({ meta: [{ title: "Meu perfil profissional — Outro Ângulo" }, { name: "description", content: "Cadastre seu perfil profissional e acompanhe solicitações de serviço." }, { property: "og:title", content: "Meu perfil profissional — Outro Ângulo" }, { property: "og:description", content: "Cadastre seu perfil profissional e acompanhe solicitações de serviço." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Painel,
});

const empty = { headline: "", about: "", experience: "", categories: [] as string[], specialties: "", city: "", remote: false, availability: "", budget_text: "", portfolio: "", credentials: "", consent_public: false };

function Painel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mine = useQuery({
    queryKey: ["my-pro", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("professional_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const inbox = useQuery({
    queryKey: ["pro-inbox", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: m } = await supabase.from("service_request_matches").select("*").eq("professional_id", user!.id).order("created_at", { ascending: false });
      const ids = (m ?? []).map((x) => x.request_id);
      const { data: r } = ids.length ? await supabase.from("service_requests").select("*").in("id", ids) : { data: [] };
      const people = await fetchProfiles((r ?? []).map((x) => x.requester_id));
      return (m ?? []).map((x) => { const req = (r ?? []).find((y) => y.id === x.request_id); return { ...x, req, who: req ? people.get(req.requester_id)?.display_name : undefined }; });
    },
  });
  const sent = useQuery({
    queryKey: ["my-requests", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("service_requests").select("*").eq("requester_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const p = mine.data; if (!p) return;
    const pf = (Array.isArray(p.portfolio) ? p.portfolio : []) as { url?: string }[];
    const cr = (Array.isArray(p.credentials) ? p.credentials : []) as { type?: string; number?: string; issuer?: string }[];
    setF({ headline: p.headline, about: p.about, experience: p.experience, categories: p.categories, specialties: p.specialties.join(", "), city: p.city ?? "", remote: p.remote, availability: p.availability ?? "", budget_text: p.budget_text ?? "", portfolio: pf.map((l) => l.url).filter(Boolean).join("\n"), credentials: cr.map((c) => [c.type, c.number, c.issuer].filter(Boolean).join(" · ")).join("\n"), consent_public: p.consent_public });
  }, [mine.data]);

  async function save(submit: boolean) {
    const missing = missingForReview(f);
    if (submit && missing.length) return toast.error(`Falta: ${missing.join(", ")}.`);
    const portfolio = f.portfolio.split("\n").map((s) => s.trim()).filter((s) => s.startsWith("https://")).slice(0, 10).map((url) => ({ url }));
    const credentials = f.credentials.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 5).map((s) => { const [type, number, issuer] = s.split("·").map((x) => x.trim()); return { type, number, issuer }; });
    const cur = (mine.data?.status ?? "draft") as ProStatus;
    const row = { user_id: user!.id, headline: f.headline.trim(), about: f.about.trim(), experience: f.experience.trim(), categories: f.categories, specialties: splitList(f.specialties), city: f.city.trim() || null, remote: f.remote, availability: f.availability.trim() || null, budget_text: f.budget_text.trim() || null, portfolio, credentials, consent_public: f.consent_public, ...(submit && cur === "draft" ? { status: "pending" } : {}) };
    setBusy(true);
    const { error } = await supabase.from("professional_profiles").upsert(row);
    setBusy(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success(submit ? "Enviado para análise. Avisaremos quando for aprovado." : "Salvo.");
    qc.invalidateQueries({ queryKey: ["my-pro"] });
  }
  async function answer(requestId: string, status: "accepted" | "declined", requester?: string) {
    await supabase.from("service_request_matches").update({ status }).eq("request_id", requestId).eq("professional_id", user!.id);
    qc.invalidateQueries({ queryKey: ["pro-inbox"] });
    if (status === "accepted" && requester) {
      try { const c = await openConversation(requester); navigate({ to: "/mensagens/$id", params: { id: c } }); } catch { toast.error("Não foi possível abrir a conversa."); }
    }
  }
  const toggle = (c: string) => setF({ ...f, categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c].slice(0, 3) });
  const status = (mine.data?.status ?? "draft") as ProStatus;

  return (
    <Page narrow>
      <Link to="/especialistas" className="text-sm text-muted-foreground hover:underline">← Especialistas</Link>
      <h1 className="mt-4 text-3xl font-extrabold">Meu perfil profissional</h1>
      <p className="mt-2 text-muted-foreground">Seu perfil só aparece no diretório depois de aprovado pela equipe e com sua autorização. Editar dados principais de um perfil aprovado o envia de novo para análise.</p>
      <p className="mt-3 text-sm">Situação: <Tag tone="primary">{mine.data ? STATUS_LABEL[status] : "Ainda não criado"}</Tag>{mine.data?.verified_at && <span className="ml-2 text-primary">· Verificado</span>}</p>

      <div className="mt-6 space-y-4">
        <Input value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} maxLength={140} placeholder="Título profissional (ex.: Contadora para pequenas empresas)" aria-label="Título profissional" />
        <div><p className="mb-2 text-sm font-medium">Categorias (até 3)</p><div className="flex flex-wrap gap-2">{Object.entries(SPECIALIST_CATEGORIES).map(([k, l]) => <button type="button" key={k} onClick={() => toggle(k)} aria-pressed={f.categories.includes(k)} className={`rounded-full border px-3 py-1 text-xs ${f.categories.includes(k) ? "border-primary bg-primary text-primary-foreground" : ""}`}>{l}</button>)}</div></div>
        <Input value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} placeholder="Especialidades, separadas por vírgula" aria-label="Especialidades" />
        <Textarea value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} maxLength={3000} className="min-h-28" placeholder="Descrição profissional: o que você faz e para quem." aria-label="Descrição" />
        <Textarea value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} maxLength={3000} placeholder="Experiência e projetos anteriores" aria-label="Experiência" />
        <Textarea value={f.portfolio} onChange={(e) => setF({ ...f, portfolio: e.target.value })} placeholder="Links de portfólio (um por linha, começando com https://)" aria-label="Portfólio" />
        <Textarea value={f.credentials} onChange={(e) => setF({ ...f, credentials: e.target.value })} placeholder={"Credenciais (uma por linha): tipo · número · órgão\nEx.: OAB · 123456 · OAB/SP"} aria-label="Credenciais" />
        {f.categories.some((c) => REGULATED.has(c)) && <p className="text-xs text-muted-foreground">Para advocacia e contabilidade, informe o registro profissional. A verificação confere apenas o registro, não a qualidade do serviço.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={80} placeholder="Cidade/UF" aria-label="Cidade" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} />Atendo remoto</label>
          <Input value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} maxLength={120} placeholder="Disponibilidade (ex.: 2 projetos/mês)" aria-label="Disponibilidade" />
          {!f.categories.includes("juridico") && <Input value={f.budget_text} onChange={(e) => setF({ ...f, budget_text: e.target.value })} maxLength={120} placeholder="Faixa de orçamento (opcional)" aria-label="Faixa de orçamento" />}
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.consent_public} onChange={(e) => setF({ ...f, consent_public: e.target.checked })} />Autorizo exibir este perfil profissional para membros logados do Outro Ângulo.</label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || status === "suspended"} onClick={() => save(false)}>Salvar rascunho</Button>
          {status === "draft" && <Button disabled={busy} onClick={() => save(true)}>Enviar para análise</Button>}
          {status !== "draft" && status !== "suspended" && <Button disabled={busy} onClick={() => save(false)}>Salvar alterações</Button>}
          {mine.data && <Button variant="ghost" asChild><Link to="/especialistas/$id" params={{ id: user!.id }}>Ver como fica</Link></Button>}
        </div>
      </div>

      <section className="mt-12">
        <SectionTitle>Solicitações recebidas</SectionTitle>
        {inbox.data?.length ? <ul className="divide-y">{inbox.data.map((m) => (
          <li key={m.request_id} className="py-4 text-sm">
            <p className="font-medium">{m.who ?? "Membro"} · {SPECIALIST_CATEGORIES[m.req?.category ?? ""] ?? ""} · {timeAgo(m.created_at)}</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{m.req?.need}</p>
            <p className="mt-1 text-xs text-muted-foreground">{[m.req?.budget_text && `Orçamento: ${m.req.budget_text}`, m.req?.deadline && `Prazo: ${m.req.deadline}`].filter(Boolean).join(" · ")}</p>
            {m.status === "sent" ? <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => answer(m.request_id, "accepted", m.req?.requester_id)}>Aceitar e conversar</Button><Button size="sm" variant="outline" onClick={() => answer(m.request_id, "declined")}>Recusar</Button></div> : <Tag>{m.status === "accepted" ? "Aceita" : "Recusada"}</Tag>}
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nenhuma solicitação encaminhada a você ainda.</p>}
      </section>

      <section className="mt-10">
        <SectionTitle>Minhas solicitações de serviço</SectionTitle>
        {sent.data?.length ? <ul className="divide-y">{sent.data.map((r) => (
          <li key={r.id} className="py-3 text-sm"><Tag>{r.status === "new" ? "Aguardando equipe" : r.status === "forwarded" ? "Encaminhada" : "Encerrada"}</Tag> <span className="ml-2">{r.need.slice(0, 120)}</span></li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Você ainda não pediu nenhum serviço.</p>}
      </section>
    </Page>
  );
}
