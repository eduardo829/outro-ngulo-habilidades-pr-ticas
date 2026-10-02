import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMyProjects } from "@/lib/learning/progress";
import { OutroAngulo } from "@/components/OutroAngulo";
import { EXPLORE_QUESTIONS, MISSIONS, NOW_FIELDS, OBJECTIVES, OPTIONAL_FIELDS, SITUATIONS, STATUS_LABEL, findMission, findObjective, type Resource } from "@/lib/angulo";

const TABS = [
  { id: "agora", n: "01", l: "Agora" },
  { id: "proximo", n: "02", l: "Próximo" },
  { id: "plano", n: "03", l: "Plano" },
  { id: "evidencias", n: "04", l: "Evidências" },
] as const;

export const Route = createFileRoute("/_authenticated/meu-angulo")({
  validateSearch: z.object({ s: z.enum(["agora", "proximo", "plano", "evidencias"]).optional() }),
  head: () => ({ meta: [{ title: "Meu Ângulo — Outro Ângulo" }, { name: "description", content: "Onde você está, para onde quer ir e o que está fazendo a respeito." }] }),
  component: Page,
});

type Snap = { now: Record<string, string>; objective_key: string | null; objective_text: string | null; explore: Record<string, string> };

function useSnap() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["angulo", user?.id], enabled: !!user,
    queryFn: async (): Promise<Snap> => {
      const { data } = await supabase.from("angulo_snapshot").select("*").eq("user_id", user!.id).maybeSingle();
      return { now: (data?.now as Record<string, string>) ?? {}, objective_key: data?.objective_key ?? null, objective_text: data?.objective_text ?? null, explore: (data?.explore as Record<string, string>) ?? {} };
    },
  });
}

function usePlan() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["plan", user?.id], enabled: !!user, queryFn: async () => (await supabase.from("plan_actions").select("*").eq("user_id", user!.id).order("position")).data ?? [] });
}

function Page() {
  const { s = "agora" } = Route.useSearch();
  const nav = Route.useNavigate();
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      <p className="eyebrow">Meu Ângulo · privado</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Onde estou, para onde vou<br className="hidden md:block" /> e o que estou fazendo a respeito.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Só você vê o que escreve aqui. Nada é obrigatório, e você pode mudar tudo quando quiser.</p>
      <div role="tablist" className="mt-8 grid grid-cols-4 gap-px border bg-border">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === s} onClick={() => nav({ search: { s: t.id }, replace: true, resetScroll: false })}
            className={cn("bg-background px-3 py-3 text-left transition-colors", t.id === s ? "bg-foreground text-background" : "hover:bg-secondary")}>
            <span className={cn("block text-[11px] font-bold", t.id === s ? "text-highlight" : "text-muted-foreground")}>{t.n}</span>
            <span className="font-display text-sm font-bold md:text-base">{t.l}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="border-x border-b p-5 md:p-8">
        {s === "agora" && <Agora />}
        {s === "proximo" && <Proximo />}
        {s === "plano" && <Plano />}
        {s === "evidencias" && <Evidencias />}
      </div>
    </div>
  );
}

async function saveSnap(userId: string, patch: Partial<Snap>) {
  const { error } = await supabase.from("angulo_snapshot").upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
  if (error) throw error;
}

function Agora() {
  const { user } = useAuth();
  const q = useSnap();
  const qc = useQueryClient();
  const [now, setNow] = useState<Record<string, string>>({});
  useEffect(() => { if (q.data) setNow(q.data.now); }, [q.data]);
  const set = (k: string) => (v: string) => setNow((p) => ({ ...p, [k]: v }));
  async function save() {
    try { await saveSnap(user!.id, { now }); qc.invalidateQueries({ queryKey: ["angulo"] }); toast.success("Salvo."); } catch { toast.error("Não foi possível salvar. Tente de novo."); }
  }
  if (q.isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold">Onde você está agora?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Uma foto da sua situação hoje. Serve para você enxergar, não para te classificar.</p>
      <p className="mt-6 text-sm font-semibold">Situação atual</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SITUATIONS.map((x) => <button key={x} type="button" aria-pressed={now["situacao"] === x} onClick={() => set("situacao")(x)} className={cn("border px-3 py-1.5 text-sm", now["situacao"] === x ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{x}</button>)}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {NOW_FIELDS.map((f) => (
          <label key={f.k} className={cn("block", "ml" in f && "md:col-span-2")}>
            <span className="text-sm font-semibold">{f.l}</span>
            {"ml" in f ? <Textarea className="mt-1" rows={2} maxLength={1500} value={now[f.k] ?? ""} onChange={(e) => set(f.k)(e.target.value)} placeholder={"ph" in f ? f.ph : ""} />
              : <Input className="mt-1" maxLength={300} value={now[f.k] ?? ""} onChange={(e) => set(f.k)(e.target.value)} placeholder={"ph" in f ? f.ph : ""} />}
          </label>
        ))}
      </div>
      <details className="mt-6 border-t pt-4">
        <summary className="cursor-pointer text-sm font-semibold">Informações opcionais</summary>
        <p className="mt-1 text-xs text-muted-foreground">Preencha só se quiser. Ninguém além de você vê.</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {OPTIONAL_FIELDS.map((f) => <label key={f.k} className="block"><span className="text-sm font-semibold">{f.l}</span><Input className="mt-1" maxLength={120} value={now[f.k] ?? ""} onChange={(e) => set(f.k)(e.target.value)} placeholder={f.ph} /></label>)}
        </div>
      </details>
      <Button className="mt-6" onClick={save}>Salvar</Button>
    </div>
  );
}

function Proximo() {
  const { user } = useAuth();
  const q = useSnap();
  const plan = usePlan();
  const qc = useQueryClient();
  const nav = Route.useNavigate();
  const [key, setKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [explore, setExplore] = useState<Record<string, string>>({});
  useEffect(() => { if (q.data) { setKey(q.data.objective_key); setText(q.data.objective_text ?? ""); setExplore(q.data.explore); } }, [q.data]);
  const obj = findObjective(key);

  async function save(createPlan: boolean) {
    try {
      await saveSnap(user!.id, { objective_key: key, objective_text: text || null, explore });
      if (createPlan && obj) {
        const base = plan.data?.length ?? 0;
        const rows = obj.actions.map((a, i) => ({ user_id: user!.id, title: a.title, position: base + i, resource_type: a.res?.type ?? null, resource_ref: a.res ? `${a.res.ref}|${a.res.label}` : null }));
        const { error } = await supabase.from("plan_actions").insert(rows);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["plan"] });
        nav({ search: { s: "plano" } });
      }
      qc.invalidateQueries({ queryKey: ["angulo"] });
      toast.success(createPlan ? "Plano criado. Ajuste como quiser." : "Salvo.");
    } catch { toast.error("Não foi possível salvar. Tente de novo."); }
  }
  if (q.isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold">O que você quer mudar agora?</h2>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {OBJECTIVES.map((o) => <button key={o.key} type="button" aria-pressed={key === o.key} onClick={() => setKey(o.key)} className={cn("border px-4 py-3 text-left text-sm", key === o.key ? "border-foreground bg-foreground text-background" : "hover:border-foreground", o.key === "nao-sei" && key !== o.key && "border-dashed")}>{o.label}</button>)}
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-semibold">Com suas palavras (opcional)</span>
        <Textarea className="mt-1" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Quero sair da área administrativa e explorar tecnologia." />
      </label>
      {key === "nao-sei" && (
        <div className="mt-8 border-l-2 border-highlight pl-5">
          <p className="font-display text-xl font-extrabold">Você não precisa ter tudo decidido para começar.</p>
          <p className="mt-1 text-sm text-muted-foreground">Algumas perguntas para pensar. Responda só as que fizerem sentido.</p>
          <div className="mt-5 space-y-4">
            {EXPLORE_QUESTIONS.map((x) => <label key={x.k} className="block"><span className="text-sm font-semibold">{x.q}</span><Textarea className="mt-1" rows={2} maxLength={800} value={explore[x.k] ?? ""} onChange={(e) => setExplore((p) => ({ ...p, [x.k]: e.target.value }))} /></label>)}
          </div>
          <p className="mt-6 eyebrow">Coisas para explorar</p>
          <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <li><Link to="/missoes/$key" params={{ key: "tres-profissionais" }} className="underline">Converse com 3 profissionais de áreas que despertam curiosidade</Link></li>
            <li><Link to="/cursos/$slug" params={{ slug: "carreira-nao-emprego" }} className="underline">Curso Carreira, não emprego</Link></li>
            <li><Link to="/comunidade" className="underline">Leia o que outras pessoas estão tentando</Link></li>
            <li><Link to="/missoes" className="underline">Escolha uma missão pequena para testar</Link></li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">São pontos de partida, não uma resposta sobre o que você deve fazer.</p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => save(false)}>Salvar</Button>
        {obj && <Button onClick={() => save(true)}>Montar meu plano com {obj.actions.length} passos<ArrowRight /></Button>}
      </div>
      <div className="mt-12 border-t pt-8">
        <p className="eyebrow">Me dê outro ângulo</p>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Está diante de uma decisão? Veja caminhos diferentes antes de escolher.</p>
        <OutroAngulo />
      </div>
    </div>
  );
}

function resLink(type: string | null, ref: string | null) {
  if (!type || !ref) return null;
  const [r, label] = ref.split("|");
  const res = { type, ref: r, label } as Resource;
  const cls = "text-xs underline";
  switch (res.type) {
    case "course": return <Link to="/cursos/$slug" params={{ slug: res.ref }} className={cls}>Curso: {res.label}</Link>;
    case "mission": return <Link to="/missoes/$key" params={{ key: res.ref }} className={cls}>Missão: {res.label}</Link>;
    case "tool": return <Link to="/ferramentas" search={{ t: res.ref as "validador" }} className={cls}>Ferramenta: {res.label}</Link>;
    case "community": return <Link to="/comunidade" className={cls}>{res.label}</Link>;
    case "people": return <Link to="/pessoas" className={cls}>{res.label}</Link>;
    case "opportunity": return <Link to="/oportunidades" className={cls}>{res.label}</Link>;
  }
}

function Plano() {
  const { user } = useAuth();
  const q = usePlan();
  const snap = useSnap();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const inval = () => qc.invalidateQueries({ queryKey: ["plan"] });
  async function upd(id: string, patch: Record<string, string | null>) {
    const { error } = await supabase.from("plan_actions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Não foi possível salvar."); else inval();
  }
  async function add() {
    if (!title.trim()) return;
    const { error } = await supabase.from("plan_actions").insert({ user_id: user!.id, title: title.trim(), position: q.data?.length ?? 0 });
    if (error) toast.error("Não foi possível adicionar."); else { setTitle(""); inval(); }
  }
  async function del(id: string) {
    if (!confirm("Remover este passo do plano?")) return;
    await supabase.from("plan_actions").delete().eq("id", id); inval();
  }
  const obj = findObjective(snap.data?.objective_key);
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold">Seu próximo passo</h2>
      {(snap.data?.objective_text || obj) && <p className="mt-1 text-sm"><span className="eyebrow mr-2">Objetivo</span>{snap.data?.objective_text || obj?.label}</p>}
      <p className="mt-1 text-sm text-muted-foreground">Poucos passos, feitos de verdade, valem mais que um plano enorme. Recomendamos de 3 a 5.</p>
      {q.data?.length === 0 && (
        <div className="mt-6 border-y py-6"><p className="font-semibold">Seu plano está vazio.</p><p className="text-sm text-muted-foreground">Escolha um objetivo na aba Próximo para começar com passos sugeridos, ou escreva o seu abaixo.</p></div>
      )}
      <ol className="mt-6 divide-y border-y">
        {q.data?.map((a, i) => (
          <li key={a.id} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5">
            <span className={cn("font-display text-2xl font-extrabold", a.status === "done" ? "text-primary" : "text-muted-foreground/50")}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={cn("font-semibold", a.status === "done" && "line-through decoration-1 opacity-70")}>{a.title}</p>
                <button onClick={() => del(a.id)} aria-label="Remover passo" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-1">{resLink(a.resource_type, a.resource_ref)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(["todo", "doing", "done"] as const).map((st) => <button key={st} onClick={() => upd(a.id, { status: st })} aria-pressed={a.status === st} className={cn("border px-2.5 py-1 text-xs", a.status === st ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{STATUS_LABEL[st]}</button>)}
                <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">Prazo<Input type="date" className="h-8 w-auto" defaultValue={a.deadline ?? ""} onBlur={(e) => e.target.value !== (a.deadline ?? "") && upd(a.id, { deadline: e.target.value || null })} /></label>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Notas e evidência{(a.notes || a.evidence) ? " ·  preenchido" : ""}</summary>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <Textarea rows={2} maxLength={4000} placeholder="Notas" defaultValue={a.notes ?? ""} onBlur={(e) => e.target.value !== (a.notes ?? "") && upd(a.id, { notes: e.target.value || null })} />
                  <Textarea rows={2} maxLength={4000} placeholder="O que você fez ou construiu (evidência)" defaultValue={a.evidence ?? ""} onBlur={(e) => e.target.value !== (a.evidence ?? "") && upd(a.id, { evidence: e.target.value || null })} />
                </div>
              </details>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex gap-2">
        <Input value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Adicionar um passo" aria-label="Novo passo" />
        <Button onClick={add} variant="outline">Adicionar</Button>
      </div>
    </div>
  );
}

function Evidencias() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const projects = useMyProjects();
  const plan = usePlan();
  const missions = useQuery({ queryKey: ["missions", user?.id], enabled: !!user, queryFn: async () => (await supabase.from("mission_progress").select("mission_key, completed_at").eq("user_id", user!.id).not("completed_at", "is", null)).data ?? [] });
  const manual = useQuery({ queryKey: ["evidences", user?.id], enabled: !!user, queryFn: async () => (await supabase.from("evidences").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [] });
  const [t, setT] = useState(""); const [note, setNote] = useState(""); const [link, setLink] = useState("");
  async function add() {
    if (!t.trim()) return;
    if (link && !/^https?:\/\//.test(link)) { toast.error("O link precisa começar com http:// ou https://"); return; }
    const { error } = await supabase.from("evidences").insert({ user_id: user!.id, title: t.trim(), note: note || null, link_url: link || null });
    if (error) toast.error("Não foi possível salvar."); else { setT(""); setNote(""); setLink(""); qc.invalidateQueries({ queryKey: ["evidences"] }); }
  }
  async function del(id: string) { if (!confirm("Remover esta evidência?")) return; await supabase.from("evidences").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["evidences"] }); }

  const items: { title: string; from: string; to?: React.ReactNode }[] = [
    ...(projects.data ?? []).filter((p) => p.outputs > 0).map((p) => ({ title: `${p.course.project} (${p.outputs} de ${p.total} partes)`, from: "Curso", to: <Link to="/aprender/$slug/espaco" params={{ slug: p.course.slug }} className="underline">abrir</Link> })),
    ...(missions.data ?? []).map((m) => ({ title: findMission(m.mission_key)?.title ?? m.mission_key, from: "Missão", to: <Link to="/missoes/$key" params={{ key: m.mission_key }} className="underline">ver</Link> })),
    ...(plan.data ?? []).filter((a) => a.status === "done").map((a) => ({ title: a.title, from: "Plano" })),
  ];
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold">Você já construiu</h2>
      <p className="mt-1 text-sm text-muted-foreground">Não é pontuação. É o registro do que você fez de verdade: projetos dos cursos, missões, passos do plano e o que mais quiser anotar.</p>
      {items.length + (manual.data?.length ?? 0) === 0 && <div className="mt-6 border-y py-6"><p className="font-semibold">Ainda não há nada aqui.</p><p className="text-sm text-muted-foreground">Comece um curso, complete uma <Link to="/missoes" className="underline">missão</Link> ou registre algo que você fez fora da plataforma.</p></div>}
      <ul className="mt-6 divide-y border-y">
        {items.map((x, i) => <li key={i} className="flex items-baseline gap-3 py-3 text-sm"><Check className="h-4 w-4 shrink-0 self-center text-primary" aria-hidden /><span className="flex-1 font-semibold">{x.title}</span><span className="eyebrow">{x.from}</span>{x.to && <span className="text-xs">{x.to}</span>}</li>)}
        {manual.data?.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3 py-3 text-sm">
            <Check className="h-4 w-4 shrink-0 self-center text-primary" aria-hidden />
            <span className="flex-1"><span className="font-semibold">{e.title}</span>{e.note && <span className="block text-muted-foreground">{e.note}</span>}{e.link_url && <a href={e.link_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs underline">link</a>}</span>
            <span className="eyebrow">Registro</span>
            <button onClick={() => del(e.id)} aria-label="Remover evidência" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <p className="text-sm font-semibold">Registrar algo que você fez</p>
        <p className="text-xs text-muted-foreground">Ex.: CV atualizado, conversa com um profissional, feedback recebido, projeto entregue.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Input value={t} maxLength={200} onChange={(e) => setT(e.target.value)} placeholder="O que você fez" aria-label="O que você fez" />
          <Input value={link} maxLength={500} onChange={(e) => setLink(e.target.value)} placeholder="Link (opcional)" aria-label="Link" />
          <Textarea className="md:col-span-2" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalhes (opcional)" aria-label="Detalhes" />
        </div>
        <Button className="mt-3" variant="outline" onClick={add}>Registrar</Button>
      </div>
      <p className="mt-10 text-xs text-muted-foreground">{MISSIONS.length} missões disponíveis em <Link to="/missoes" className="underline">Missões</Link>.</p>
    </div>
  );
}
