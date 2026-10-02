import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, Lock, Plus, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { parseVideo } from "@/lib/video";
import { CalculadoraViabilidade, type CalcValues } from "@/components/tools/Tools";
import { getGestor } from "@/lib/gestores";
import { hasValue, useSaveOutput, type Outputs } from "@/lib/learning/store";
import type { Block, Field } from "@/lib/learning/types";
import { cn } from "@/lib/utils";

type Ctx = { courseId: string; outputs: Outputs; moduleKey: string };

const inputCls = "w-full border-b-2 bg-transparent py-2 outline-none transition-colors focus:border-foreground";

/** Shared save bar: private by default, shows saved / unsaved state. */
function useDraft<T>(ctx: Ctx, key: string, empty: T) {
  const saved = (ctx.outputs[key] as T | undefined) ?? empty;
  const [v, setV] = useState<T>(saved);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } }, []);
  const m = useSaveOutput(ctx.courseId);
  const dirty = JSON.stringify(v) !== JSON.stringify(ctx.outputs[key] ?? empty);
  const bar = (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button size="sm" disabled={!dirty || !hasValue(v) || m.isPending} onClick={() => m.mutate({ key, value: v }, { onError: () => toast.error("Não foi possível salvar. Tente de novo.") })}>
        {m.isPending ? "Salvando…" : "Salvar"}
      </Button>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Privado</span>
      {!dirty && hasValue(ctx.outputs[key]) && <span className="inline-flex items-center gap-1 text-xs font-semibold"><Check className="h-3.5 w-3.5" />Salvo</span>}
      {dirty && hasValue(ctx.outputs[key]) && <span className="text-xs text-muted-foreground">Alterações não salvas</span>}
    </div>
  );
  return { v, setV, bar };
}

function Shell({ label, title, children }: { label: string; title?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t py-8">
      <p className="eyebrow">{label}</p>
      {title && <h3 className="mt-2 font-display text-xl font-extrabold md:text-2xl">{title}</h3>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: string; onChange: (s: string) => void }) {
  if (f.options) return (
    <div className="flex flex-wrap gap-2">{f.options.map((o) => <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={cn("border px-3 py-1.5 text-sm", value === o ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{o}</button>)}</div>
  );
  return f.multiline
    ? <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, 1500))} placeholder={f.ph} rows={3} className={cn(inputCls, "resize-y")} aria-label={f.l} />
    : <input value={value} onChange={(e) => onChange(e.target.value.slice(0, 300))} placeholder={f.ph} className={inputCls} aria-label={f.l} />;
}

/* ---------- individual blocks ---------- */
function LessonQuestion({ b, ctx }: { b: Extract<Block, { type: "question" }>; ctx: Ctx }) {
  const d = useDraft(ctx, b.key, "");
  return <Shell label="Pergunta" title={b.prompt}>{b.help && <p className="mb-2 text-sm text-muted-foreground">{b.help}</p>}<textarea value={d.v} onChange={(e) => d.setV(e.target.value.slice(0, 2000))} rows={3} className={cn(inputCls, "resize-y text-lg")} aria-label={b.prompt} />{d.bar}</Shell>;
}

function FrameworkBuilder({ b, ctx }: { b: Extract<Block, { type: "fields" }>; ctx: Ctx }) {
  const d = useDraft<Record<string, string>>(ctx, b.key, {});
  return (
    <Shell label="Exercício" title={b.title}>
      {b.help && <p className="mb-4 text-muted-foreground">{b.help}</p>}
      <div className="grid gap-5 md:grid-cols-2">{b.fields.map((f) => <label key={f.k} className={cn("block", f.multiline && "md:col-span-2")}><span className="text-sm">{f.l}</span><FieldInput f={f} value={d.v[f.k] ?? ""} onChange={(s) => d.setV({ ...d.v, [f.k]: s })} /></label>)}</div>
      {d.bar}
    </Shell>
  );
}

function MultipleChoiceReflection({ b, ctx }: { b: Extract<Block, { type: "choices" }>; ctx: Ctx }) {
  const d = useDraft<string[]>(ctx, b.key, []);
  const toggle = (o: string) => d.setV(b.multi ? (d.v.includes(o) ? d.v.filter((x) => x !== o) : [...d.v, o]) : [o]);
  return <Shell label="Reflexão" title={b.prompt}><div className="flex flex-wrap gap-2">{b.options.map((o) => <button key={o} type="button" aria-pressed={d.v.includes(o)} onClick={() => toggle(o)} className={cn("border px-3 py-2 text-sm transition-colors", d.v.includes(o) ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{o}</button>)}</div>{d.bar}</Shell>;
}

function VideoLesson({ b, ctx, n }: { b: Extract<Block, { type: "video" }>; ctx: Ctx; n: string }) {
  const src = parseVideo(b.provider ?? null, b.ref ?? null);
  const m = useSaveOutput(ctx.courseId);
  const key = `${ctx.moduleKey}.video`;
  return (
    <section className="border-t py-8">
      <p className="eyebrow">Assista</p>
      <div className="mt-4 overflow-hidden bg-ink text-ink-foreground">
        {src ? <div className="aspect-video"><iframe src={src} title={b.title} className="h-full w-full" allow="encrypted-media; picture-in-picture; fullscreen" /></div> : (
          <div className="relative flex aspect-video flex-col justify-between p-6 md:p-10">
            <div className="flex items-start justify-between gap-4"><p className="eyebrow !text-highlight">Aula {n}</p><span className="border border-ink-foreground/30 px-2 py-0.5 text-xs text-ink-foreground/70">Em gravação</span></div>
            <div><p className="max-w-xl font-display text-2xl font-extrabold leading-tight md:text-4xl">{b.title}</p><p className="mt-3 text-sm text-ink-foreground/60">O vídeo será adicionado em breve. Você já pode fazer os exercícios desta aula.</p></div>
            <span aria-hidden className="absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 items-center justify-center border border-ink-foreground/30 md:flex"><Play className="h-6 w-6 text-ink-foreground/50" /></span>
          </div>
        )}
      </div>
      {src && <Button size="sm" variant="outline" className="mt-3" disabled={hasValue(ctx.outputs[key])} onClick={() => m.mutate({ key, value: true })}>{hasValue(ctx.outputs[key]) ? <><Check />Assistido</> : "Marcar como assistido"}</Button>}
    </section>
  );
}

function show(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(show).join(" · ");
  if (typeof v === "object") return Object.values(v as object).filter(hasValue).map(show).join(" — ");
  return String(v);
}

function BeforeAfterExercise({ b, ctx }: { b: Extract<Block, { type: "compare" }>; ctx: Ctx }) {
  const [open, setOpen] = useState(false);
  const a = ctx.outputs[b.before], z = ctx.outputs[b.after];
  return (
    <Shell label="Comparar" title={b.title}>
      <Button variant="outline" size="sm" disabled={!hasValue(a) || !hasValue(z)} onClick={() => setOpen((o) => !o)}>{open ? "Esconder" : "Comparar minhas respostas"}</Button>
      {(!hasValue(a) || !hasValue(z)) && <p className="mt-2 text-xs text-muted-foreground">Salve as duas respostas para comparar.</p>}
      {open && <div className="reveal is-visible mt-5 grid gap-px border bg-border md:grid-cols-2"><div className="bg-background p-5"><p className="eyebrow">Antes</p><p className="mt-2 whitespace-pre-line">{show(a)}</p></div><div className="bg-card p-5"><p className="eyebrow">Depois</p><p className="mt-2 whitespace-pre-line">{show(z)}</p></div></div>}
    </Shell>
  );
}

function ScenarioExercise({ b, ctx }: { b: Extract<Block, { type: "scenarios" }>; ctx: Ctx }) {
  const d = useDraft<Record<string, string>>(ctx, b.key, {});
  const [i, setI] = useState(0);
  const item = b.items[i]!;
  return (
    <Shell label="Prática" title="Responda às objeções">
      <p className="text-muted-foreground">{b.intro}</p>
      <ol className="mt-4 space-y-1 border-l-2 border-highlight pl-4 text-sm">{b.framework.map((f, j) => <li key={f}><b>{j + 1}.</b> {f}</li>)}</ol>
      <div className="mt-6 flex flex-wrap gap-2">{b.items.map((t, j) => <button key={t} type="button" onClick={() => setI(j)} aria-pressed={i === j} className={cn("border px-3 py-1.5 text-sm", i === j ? "border-foreground bg-foreground text-background" : "hover:border-foreground", hasValue(d.v[t]) && i !== j && "border-primary")}>{hasValue(d.v[t]) && "✓ "}{t}</button>)}</div>
      <p className="mt-6 font-display text-xl font-bold">“{item}”</p>
      <textarea value={d.v[item] ?? ""} onChange={(e) => d.setV({ ...d.v, [item]: e.target.value.slice(0, 1500) })} rows={3} className={cn(inputCls, "mt-2 resize-y")} aria-label={`Sua resposta para: ${item}`} />
      {d.bar}
    </Shell>
  );
}

type Row = Record<string, string>;
function ProspectBuilder({ b, ctx }: { b: Extract<Block, { type: "list" }>; ctx: Ctx }) {
  const d = useDraft<Row[]>(ctx, b.key, []);
  const upd = (i: number, k: string, s: string) => d.setV(d.v.map((r, j) => (j === i ? { ...r, [k]: s } : r)));
  const won = d.v.filter((r) => r["status"] === "Comprou").length;
  return (
    <Shell label="Construir" title={b.title}>
      <div className="flex items-center gap-4"><p className="font-display text-3xl font-extrabold">{d.v.length} / {b.max}</p><div className="h-1 flex-1 bg-border"><div className="h-1 bg-primary transition-all" style={{ width: `${(d.v.length / b.max) * 100}%` }} /></div>{won > 0 && <span className="text-sm">{won} comprou</span>}</div>
      <ul className="mt-6 space-y-4">
        {d.v.map((r, i) => (
          <li key={i} className="grid gap-3 border bg-card p-4 md:grid-cols-[repeat(4,1fr)_auto]">
            {b.fields.map((f) => <FieldInput key={f.k} f={f} value={r[f.k] ?? ""} onChange={(s) => upd(i, f.k, s)} />)}
            <button type="button" onClick={() => d.setV(d.v.filter((_, j) => j !== i))} aria-label="Remover" className="justify-self-end p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            <select value={r["status"] ?? b.statuses[0]} onChange={(e) => upd(i, "status", e.target.value)} aria-label={b.statusLabel} className="border bg-background px-2 py-1.5 text-sm md:col-span-2">{b.statuses.map((s) => <option key={s}>{s}</option>)}</select>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-4" disabled={d.v.length >= b.max} onClick={() => d.setV([...d.v, { status: b.statuses[0]! }])}><Plus />Adicionar pessoa</Button>
      {d.bar}
    </Shell>
  );
}

function DecisionExercise({ b, ctx }: { b: Extract<Block, { type: "decision" }>; ctx: Ctx }) {
  const d = useDraft<{ escolha?: string; porque?: string }>(ctx, b.key, {});
  return (
    <Shell label="Decidir" title="Três caminhos possíveis">
      <p className="text-sm text-muted-foreground">A decisão é sua. Veja o que costuma justificar cada caminho.</p>
      <div className="mt-4 grid gap-px border bg-border md:grid-cols-3">{b.paths.map((p) => <button key={p.k} type="button" aria-pressed={d.v.escolha === p.k} onClick={() => d.setV({ ...d.v, escolha: p.k })} className={cn("bg-background p-5 text-left transition-colors", d.v.escolha === p.k && "bg-ink text-ink-foreground")}><p className="font-display text-xl font-extrabold">{p.k}</p><p className={cn("mt-2 text-sm", d.v.escolha === p.k ? "text-ink-foreground/70" : "text-muted-foreground")}>{p.when}</p></button>)}</div>
      <label className="mt-6 block"><span className="text-sm">{b.ask}</span><textarea value={d.v.porque ?? ""} onChange={(e) => d.setV({ ...d.v, porque: e.target.value.slice(0, 1500) })} rows={3} className={cn(inputCls, "resize-y")} /></label>
      {d.bar}
    </Shell>
  );
}

function RelatedTool({ b, ctx }: { b: Extract<Block, { type: "tool" }>; ctx: Ctx }) {
  if (b.tool === "viabilidade") return <CalcBlock b={b} ctx={ctx} />;
  const name = b.tool === "validador" ? "Validador de ideias" : "Plano de validação";
  const fields: Field[] = b.tool === "validador"
    ? [{ k: "pontos", l: "Pontos fortes apontados" }, { k: "riscos", l: "Riscos apontados", multiline: true }, { k: "premissas", l: "Premissas para validar", multiline: true }]
    : [{ k: "hipotese", l: "Hipótese do teste" }, { k: "meta", l: "Número que significa sucesso", ph: "Ex.: 3 de 10 pessoas pagam" }, { k: "onde", l: "Onde vou encontrar as pessoas" }];
  return (
    <Shell label="Ferramenta" title={name}>
      <p className="text-muted-foreground">{b.intro}</p>
      <a href={`/ferramentas?t=${b.tool}`} target="_blank" rel="noopener noreferrer" className="link-arrow mt-3 inline-flex items-center gap-1 text-sm font-semibold">Abrir em nova aba (seu progresso fica aqui)<ArrowUpRight className="h-4 w-4" /></a>
      <FrameworkBuilder b={{ type: "fields", key: b.key, title: "Registre o resultado", fields }} ctx={ctx} />
    </Shell>
  );
}

function CalcBlock({ b, ctx }: { b: Extract<Block, { type: "tool" }>; ctx: Ctx }) {
  const initial = ctx.outputs[b.key] as Partial<CalcValues> | undefined;
  const d = useDraft<Record<string, number | null>>(ctx, b.key, {});
  return (
    <Shell label="Ferramenta" title="Calculadora de viabilidade">
      <p className="mb-6 text-muted-foreground">{b.intro}</p>
      <CalculadoraViabilidade {...(initial ? { initial } : {})} onChange={(v) => d.setV(v)} />
      {d.bar}
    </Shell>
  );
}

export function LearningBlock({ b, ctx, n }: { b: Block; ctx: Ctx; n: string }) {
  switch (b.type) {
    case "text": return <Shell label="Contexto" {...(b.title ? { title: b.title } : {})}><p className="max-w-2xl text-lg leading-relaxed">{b.body}</p></Shell>;
    case "question": return <LessonQuestion b={b} ctx={ctx} />;
    case "fields": return <FrameworkBuilder b={b} ctx={ctx} />;
    case "choices": return <MultipleChoiceReflection b={b} ctx={ctx} />;
    case "video": return <VideoLesson b={b} ctx={ctx} n={n} />;
    case "compare": return <BeforeAfterExercise b={b} ctx={ctx} />;
    case "scenarios": return <ScenarioExercise b={b} ctx={ctx} />;
    case "list": return <ProspectBuilder b={b} ctx={ctx} />;
    case "decision": return <DecisionExercise b={b} ctx={ctx} />;
    case "tool": return <RelatedTool b={b} ctx={ctx} />;
  }
}

/* ---------- community + gestor ---------- */
const STATUS: Record<string, string> = { enviada: "Enviada", selecionada: "Selecionada", respondida: "Respondida" };

export function CommunityPrompt({ prompt, courseId, moduleKey, gestorSlug }: { prompt: string; courseId: string; moduleKey: string; gestorSlug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const g = getGestor(gestorSlug);
  const [q, setQ] = useState("");
  const mine = useQuery({
    queryKey: ["gq", moduleKey, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("gestor_questions").select("id, body, status, answer").eq("user_id", user!.id).eq("course_id", courseId).eq("module_key", moduleKey).order("created_at", { ascending: false })).data ?? [],
  });
  const send = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("gestor_questions").insert({ user_id: user!.id, course_id: courseId, module_key: moduleKey, gestor_slug: gestorSlug, body: q.trim() }); if (error) throw error; },
    onSuccess: () => { setQ(""); toast.success("Pergunta enviada."); qc.invalidateQueries({ queryKey: ["gq", moduleKey] }); },
    onError: () => toast.error("Não foi possível enviar."),
  });
  return (
    <section className="grid gap-px border bg-border md:grid-cols-2">
      <div className="bg-card p-6">
        <p className="eyebrow">Conversar sobre isso</p>
        <p className="mt-2 font-display text-xl font-bold">“{prompt}”</p>
        <p className="mt-2 text-sm text-muted-foreground">Suas respostas do curso nunca são publicadas. Se quiser, leve a pergunta para a comunidade com suas próprias palavras.</p>
        <Link to="/comunidade" className="link-arrow mt-4 inline-flex items-center gap-1 text-sm font-semibold">Ir para a comunidade<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="bg-background p-6">
        <p className="eyebrow">Pergunte ao gestor</p>
        <p className="mt-2 text-sm text-muted-foreground">Sua pergunta vai para a fila de {g?.name ?? "gestores"}. Algumas são escolhidas para encontros e conteúdos. Não há resposta automática.</p>
        <textarea value={q} onChange={(e) => setQ(e.target.value.slice(0, 1000))} rows={2} className={cn(inputCls, "mt-3 resize-y")} aria-label="Sua pergunta ao gestor" />
        <Button size="sm" className="mt-3" disabled={q.trim().length < 5 || send.isPending} onClick={() => send.mutate()}>Enviar pergunta</Button>
        {!!mine.data?.length && <ul className="mt-4 space-y-2 text-sm">{mine.data.map((x) => <li key={x.id} className="border-l-2 pl-3"><span className="eyebrow">{STATUS[x.status] ?? x.status}</span><p>{x.body}</p>{x.answer && <p className="mt-1 text-muted-foreground">{x.answer}</p>}</li>)}</ul>}
      </div>
    </section>
  );
}

export { show as showOutput };
