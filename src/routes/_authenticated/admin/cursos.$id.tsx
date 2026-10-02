import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { VIDEO_PROVIDERS, parseVideo } from "@/lib/video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL } from "./cursos.index";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/cursos/$id")({
  head: () => ({ meta: [{ title: "Editar curso — Administração" }] }),
  component: CourseEditor,
});

function Confirm({ label, title, desc, onConfirm, destructive }: { label: React.ReactNode; title: string; desc: string; onConfirm: () => void; destructive?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant={destructive ? "destructive" : "outline"} size="sm">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{desc}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CourseEditor() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      const [{ data: course }, { data: modules }, { data: lessons }, { count }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", id).single(),
        supabase.from("modules").select("*").eq("course_id", id).order("position"),
        supabase.from("lessons").select("*").eq("course_id", id).order("position"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", id),
      ]);
      return { course: course!, modules: modules ?? [], lessons: lessons ?? [], enrollCount: count ?? 0 };
    },
  });
  const [editing, setEditing] = useState<Lesson | null>(null);

  if (q.isLoading || !q.data) return <p className="text-muted-foreground">Carregando…</p>;
  const { course, modules, lessons, enrollCount } = q.data;
  const reload = () => q.refetch();

  async function setStatus(status: Course["status"]) {
    const { error } = await supabase.from("courses").update({ status }).eq("id", id);
    error ? toast.error("Falha ao atualizar.") : toast.success(`Curso: ${STATUS_LABEL[status]}`);
    reload();
  }
  async function del() {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error("Falha ao excluir.");
    window.history.back();
  }
  async function addModule() {
    await supabase.from("modules").insert({ course_id: id, title: "Novo módulo", position: modules.length + 1 });
    reload();
  }
  async function move<T extends { id: string; position: number }>(table: "modules" | "lessons", list: T[], i: number, dir: -1 | 1) {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from(table).update({ position: b.position }).eq("id", a.id),
      supabase.from(table).update({ position: a.position === b.position ? b.position + dir : a.position }).eq("id", b.id),
    ]);
    reload();
  }
  async function addLesson(moduleId: string) {
    const n = lessons.filter((l) => l.module_id === moduleId).length;
    const { data } = await supabase.from("lessons").insert({ module_id: moduleId, course_id: id, title: "Nova aula", position: n + 1 }).select("*").single();
    reload();
    if (data) setEditing(data);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/admin/cursos" className="text-sm text-primary hover:underline">← Cursos</Link>
        <Badge className="ml-2" variant={course.status === "published" ? "default" : "secondary"}>{STATUS_LABEL[course.status]}</Badge>
        <span className="text-xs text-muted-foreground">{enrollCount} matrícula(s)</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {course.status !== "published" && <Confirm label="Publicar" title="Publicar curso?" desc="Ele ficará visível no catálogo. Apenas aulas publicadas aparecerão." onConfirm={() => setStatus("published")} />}
          {course.status === "published" && <Button variant="outline" size="sm" onClick={() => setStatus("draft")}>Voltar a rascunho</Button>}
          {course.status !== "archived" && <Confirm label="Arquivar" title="Arquivar curso?" desc="Sai do catálogo, mas alunos matriculados mantêm acesso e histórico." onConfirm={() => setStatus("archived")} />}
          {enrollCount === 0 && <Confirm destructive label={<><Trash2 /> Excluir</>} title="Excluir curso definitivamente?" desc="Módulos e aulas também serão apagados. Esta ação não pode ser desfeita." onConfirm={del} />}
        </div>
      </div>

      <CourseForm course={course} onSaved={reload} />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Módulos e aulas</h2>
          <Button size="sm" onClick={addModule}><Plus /> Módulo</Button>
        </div>
        <ol className="mt-4 space-y-4">
          {modules.map((m, i) => {
            const ls = lessons.filter((l) => l.module_id === m.id);
            return (
              <li key={m.id} className="rounded-lg border bg-card p-4">
                <ModuleRow module={m} onSaved={reload}
                  actions={<>
                    <Button variant="ghost" size="icon" aria-label="Mover para cima" onClick={() => move("modules", modules, i, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" aria-label="Mover para baixo" onClick={() => move("modules", modules, i, 1)}><ArrowDown /></Button>
                    <Confirm destructive label={<Trash2 />} title="Excluir módulo?" desc="As aulas deste módulo também serão apagadas, junto com o progresso dos alunos nelas." onConfirm={async () => { await supabase.from("modules").delete().eq("id", m.id); reload(); }} />
                  </>} />
                <ul className="mt-3 space-y-1 border-l-2 pl-4">
                  {ls.map((l, j) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{l.title}</span>
                      {l.is_preview && <Badge variant="outline">Apresentação</Badge>}
                      <Badge variant={l.status === "published" ? "default" : "secondary"}>{STATUS_LABEL[l.status]}</Badge>
                      <Button variant="ghost" size="icon" aria-label="Subir aula" onClick={() => move("lessons", ls, j, -1)}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon" aria-label="Descer aula" onClick={() => move("lessons", ls, j, 1)}><ArrowDown /></Button>
                      <Button variant="ghost" size="icon" aria-label="Editar aula" onClick={() => setEditing(l)}><Pencil /></Button>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => addLesson(m.id)}><Plus /> Aula</Button>
              </li>
            );
          })}
        </ol>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Editar aula</DialogTitle></DialogHeader>
          {editing && <LessonForm lesson={editing} onDone={() => { setEditing(null); reload(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModuleRow({ module, onSaved, actions }: { module: { id: string; title: string; activity: string | null }; onSaved: () => void; actions: React.ReactNode }) {
  const [title, setTitle] = useState(module.title);
  const [activity, setActivity] = useState(module.activity ?? "");
  const dirty = title !== module.title || activity !== (module.activity ?? "");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label htmlFor={`m-${module.id}`} className="sr-only">Título do módulo</Label>
        <Input id={`m-${module.id}`} value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold" />
        {actions}
      </div>
      <Label htmlFor={`a-${module.id}`} className="text-xs text-muted-foreground">Atividade prática do módulo</Label>
      <Textarea id={`a-${module.id}`} value={activity} onChange={(e) => setActivity(e.target.value)} className="min-h-16" />
      {dirty && <Button size="sm" onClick={async () => { await supabase.from("modules").update({ title: title.trim() || "Módulo", activity: activity || null }).eq("id", module.id); toast.success("Módulo salvo"); onSaved(); }}>Salvar módulo</Button>}
    </div>
  );
}

function CourseForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const [f, setF] = useState(course);
  const [objectives, setObjectives] = useState(course.objectives.join("\n"));
  useEffect(() => { setF(course); setObjectives(course.objectives.join("\n")); }, [course]);
  const set = (k: keyof Course) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) return toast.error("Endereço (slug): use letras minúsculas, números e hífens.");
    const priceNum = f.price_cents == null || (f.price_cents as unknown as string) === "" ? null : Number(f.price_cents);
    const { error } = await supabase.from("courses").update({
      title: f.title, slug: f.slug, subtitle: f.subtitle || null, description: f.description || null,
      cover_url: f.cover_url || null, instructor: f.instructor || null, level: f.level || null, duration_text: f.duration_text || null,
      access_policy: f.access_policy, is_public: f.is_public, price_cents: priceNum,
      sale_price_cents: f.sale_price_cents ?? null, sale_start: f.sale_start || null, sale_end: f.sale_end || null,
      is_free: f.is_free, is_purchasable: f.is_purchasable, preview_enabled: f.preview_enabled, preview_module_key: f.preview_module_key || null,
      objectives: objectives.split("\n").map((s) => s.trim()).filter(Boolean), updated_at: new Date().toISOString(),
    }).eq("id", course.id);
    error ? toast.error(error.message.includes("unique") ? "Esse endereço já existe." : "Falha ao salvar.") : toast.success("Curso salvo");
    onSaved();
  }

  return (
    <form onSubmit={save} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label htmlFor="t">Título</Label><Input id="t" value={f.title} onChange={set("title")} required /></div>
      <div><Label htmlFor="s">Endereço (slug)</Label><Input id="s" value={f.slug} onChange={set("slug")} /></div>
      <div><Label htmlFor="st">Subtítulo</Label><Input id="st" value={f.subtitle ?? ""} onChange={set("subtitle")} /></div>
      <div className="sm:col-span-2"><Label htmlFor="d">Descrição</Label><Textarea id="d" value={f.description ?? ""} onChange={set("description")} /></div>
      <div className="sm:col-span-2"><Label htmlFor="o">Objetivos de aprendizado (um por linha)</Label><Textarea id="o" value={objectives} onChange={(e) => setObjectives(e.target.value)} /></div>
      <div><Label htmlFor="i">Instrutor</Label><Input id="i" value={f.instructor ?? ""} onChange={set("instructor")} /></div>
      <div><Label htmlFor="c">URL da capa</Label><Input id="c" type="url" value={f.cover_url ?? ""} onChange={set("cover_url")} placeholder="https://" /></div>
      <div><Label htmlFor="l">Nível (opcional)</Label><Input id="l" value={f.level ?? ""} onChange={set("level")} /></div>
      <div><Label htmlFor="du">Duração (opcional)</Label><Input id="du" value={f.duration_text ?? ""} onChange={set("duration_text")} /></div>
      <div><Label htmlFor="p">Preço em centavos (vazio = valor padrão da oferta)</Label><Input id="p" type="number" min={0} value={f.price_cents ?? ""} onChange={(e) => setF({ ...f, price_cents: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      <div className="flex items-center gap-3 pt-6"><Switch id="pub" checked={f.is_public} onCheckedChange={(c) => setF({ ...f, is_public: c })} /><Label htmlFor="pub">Aparece no catálogo público</Label></div>
      <div><Label htmlFor="sp">Preço promocional em centavos (opcional)</Label><Input id="sp" type="number" min={0} value={f.sale_price_cents ?? ""} onChange={(e) => setF({ ...f, sale_price_cents: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      <div className="grid grid-cols-2 gap-2"><div><Label htmlFor="ss">Promoção de</Label><Input id="ss" type="date" value={f.sale_start?.slice(0, 10) ?? ""} onChange={(e) => setF({ ...f, sale_start: e.target.value || null })} /></div><div><Label htmlFor="se">até</Label><Input id="se" type="date" value={f.sale_end?.slice(0, 10) ?? ""} onChange={(e) => setF({ ...f, sale_end: e.target.value || null })} /></div></div>
      <div><Label htmlFor="pk">Módulo da aula aberta (ex.: n01)</Label><Input id="pk" value={f.preview_module_key ?? ""} onChange={set("preview_module_key")} /></div>
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-3"><Switch id="pv" checked={f.preview_enabled} onCheckedChange={(c) => setF({ ...f, preview_enabled: c })} /><Label htmlFor="pv">Aula aberta ativa</Label></div>
        <div className="flex items-center gap-3"><Switch id="fr" checked={f.is_free} onCheckedChange={(c) => setF({ ...f, is_free: c })} /><Label htmlFor="fr">Curso gratuito</Label></div>
        <div className="flex items-center gap-3"><Switch id="pu" checked={f.is_purchasable} onCheckedChange={(c) => setF({ ...f, is_purchasable: c })} /><Label htmlFor="pu">Disponível para compra (só ative quando o pagamento estiver conectado)</Label></div>
      </div>
      <div className="sm:col-span-2"><Label htmlFor="ap">Política de acesso</Label><Textarea id="ap" value={f.access_policy} onChange={set("access_policy")} className="min-h-16" /></div>
      <div className="sm:col-span-2"><Button type="submit">Salvar curso</Button></div>
    </form>
  );
}

function LessonForm({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const [f, setF] = useState(lesson);
  const set = (k: keyof Lesson) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const videoOk = !f.video_ref || !!parseVideo(f.video_provider, f.video_ref);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.video_ref && !videoOk) return toast.error("Link ou ID de vídeo inválido para o provedor escolhido.");
    const { error } = await supabase.from("lessons").update({
      title: f.title, summary: f.summary || null, body: f.body || null, exercise: f.exercise || null,
      duration_text: f.duration_text || null, video_provider: f.video_ref ? f.video_provider : null, video_ref: f.video_ref || null,
      status: f.status, is_preview: f.is_preview, updated_at: new Date().toISOString(),
    }).eq("id", lesson.id);
    if (error) return toast.error("Falha ao salvar a aula.");
    toast.success("Aula salva");
    onDone();
  }
  async function del() {
    await supabase.from("lessons").delete().eq("id", lesson.id);
    onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div><Label htmlFor="lt">Título</Label><Input id="lt" value={f.title} onChange={set("title")} required /></div>
      <div><Label htmlFor="ls">Resumo</Label><Textarea id="ls" value={f.summary ?? ""} onChange={set("summary")} className="min-h-16" /></div>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <Label>Provedor de vídeo</Label>
          <Select value={f.video_provider ?? "youtube"} onValueChange={(v) => setF({ ...f, video_provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VIDEO_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="vr">Link ou ID do vídeo</Label>
          <Input id="vr" value={f.video_ref ?? ""} onChange={set("video_ref")} aria-invalid={!videoOk} />
          {!videoOk && <p className="mt-1 text-xs text-destructive">Não reconhecemos este link para o provedor escolhido.</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Vídeos públicos ou não listados nesses serviços podem ser compartilhados por quem tiver o link — eles não têm proteção de acesso.</p>
      <div><Label htmlFor="ld">Duração informada (opcional)</Label><Input id="ld" value={f.duration_text ?? ""} onChange={set("duration_text")} placeholder="ex.: 12 min" /></div>
      <div><Label htmlFor="lb">Texto complementar</Label><Textarea id="lb" value={f.body ?? ""} onChange={set("body")} /></div>
      <div><Label htmlFor="le">Exercício prático</Label><Textarea id="le" value={f.exercise ?? ""} onChange={set("exercise")} /></div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2"><Switch id="lp" checked={f.status === "published"} onCheckedChange={(c) => setF({ ...f, status: c ? "published" : "draft" })} /><Label htmlFor="lp">Publicada</Label></div>
        <div className="flex items-center gap-2"><Switch id="lpr" checked={f.is_preview} onCheckedChange={(c) => setF({ ...f, is_preview: c })} /><Label htmlFor="lpr">Aula de apresentação (aberta a contas sem matrícula)</Label></div>
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <Confirm destructive label={<><Trash2 /> Excluir aula</>} title="Excluir aula?" desc="O progresso, anotações e respostas dos alunos nesta aula serão apagados." onConfirm={del} />
        <Button type="submit">Salvar aula</Button>
      </div>
    </form>
  );
}
