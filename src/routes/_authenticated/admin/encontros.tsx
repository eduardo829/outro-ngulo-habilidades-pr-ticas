import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_COLS, fetchProfiles } from "@/lib/community";
import type { EventRow, Expert } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/encontros")({
  head: () => ({ meta: [{ title: "Encontros — Administração" }] }),
  component: AdminEvents,
});

type F = { id?: string; title: string; theme: string; description: string; expert_id: string; date: string; duration_min: number; capacity: number; meeting_url: string; recording_url: string; summary: string; materials: string };
const empty: F = { title: "", theme: "", description: "", expert_id: "", date: "", duration_min: 60, capacity: 12, meeting_url: "", recording_url: "", summary: "", materials: "" };
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

function Detail({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["admin-event-detail", id],
    queryFn: async () => {
      const [{ data: b }, { data: qs }] = await Promise.all([
        supabase.from("event_bookings").select("user_id").eq("event_id", id),
        supabase.from("event_questions").select("id, body, user_id").eq("event_id", id),
      ]);
      const { data: votes } = await supabase.from("event_question_votes").select("question_id").in("question_id", (qs ?? []).map((x) => x.id).concat("00000000-0000-0000-0000-000000000000"));
      const people = await fetchProfiles((b ?? []).map((x) => x.user_id));
      return { people: [...people.values()], qs: (qs ?? []).map((x) => ({ ...x, votes: (votes ?? []).filter((v) => v.question_id === x.id).length })).sort((a, z) => z.votes - a.votes) };
    },
  });
  return (
    <div className="grid gap-4 border-t bg-secondary/30 p-4 text-sm sm:grid-cols-2">
      <div><p className="font-semibold">Participantes ({q.data?.people.length ?? 0})</p><ul className="mt-1 text-muted-foreground">{q.data?.people.map((p) => <li key={p.id}>{p.display_name}</li>)}</ul></div>
      <div><p className="font-semibold">Perguntas enviadas</p><ul className="mt-1 space-y-1">{q.data?.qs.map((x) => <li key={x.id}><span className="text-primary">▲{x.votes}</span> {x.body}</li>)}</ul></div>
    </div>
  );
}

function AdminEvents() {
  const [f, setF] = useState<F | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const experts = useQuery({ queryKey: ["admin-experts"], queryFn: async () => ((await supabase.from("experts").select("*").order("position")).data ?? []) as Expert[] });
  const list = useQuery({ queryKey: ["admin-events"], queryFn: async () => ((await supabase.from("events").select(EVENT_COLS).order("starts_at", { ascending: false })).data ?? []) as EventRow[] });

  async function edit(e: EventRow) {
    const { data: url } = await supabase.rpc("event_join_url", { _event: e.id });
    setF({ id: e.id, title: e.title, theme: e.theme, description: e.description ?? "", expert_id: e.expert_id ?? "", date: toLocal(e.starts_at), duration_min: e.duration_min, capacity: e.capacity, meeting_url: (url as string) ?? "", recording_url: e.recording_url ?? "", summary: e.summary ?? "", materials: e.materials ?? "" });
    window.scrollTo({ top: 0 });
  }
  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!f || f.title.trim().length < 3 || !f.date) return toast.error("Preencha título e data.");
    for (const u of [f.meeting_url, f.recording_url]) if (u && !/^https:\/\//.test(u)) return toast.error("Links devem começar com https://");
    const row = { title: f.title.trim(), theme: f.theme || "Geral", description: f.description || null, expert_id: f.expert_id || null, starts_at: new Date(f.date).toISOString(), duration_min: Number(f.duration_min), capacity: Number(f.capacity), meeting_url: f.meeting_url || null, recording_url: f.recording_url || null, summary: f.summary || null, materials: f.materials || null };
    const { error } = f.id ? await supabase.from("events").update(row).eq("id", f.id) : await supabase.from("events").insert(row);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Encontro salvo."); setF(null); list.refetch();
  }
  async function setStatus(id: string, status: string) {
    if (status === "cancelled" && !confirm("Cancelar este encontro?")) return;
    await supabase.from("events").update({ status }).eq("id", id); list.refetch();
  }
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f!, [k]: e.target.value });

  return (
    <div>
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Encontros</h2><Button onClick={() => setF(empty)}>Novo encontro</Button></div>
      {f && (
        <form onSubmit={save} className="mt-4 space-y-3 rounded-lg border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Título</Label><Input value={f.title} onChange={set("title")} /></div>
            <div><Label>Tema</Label><Input value={f.theme} onChange={set("theme")} placeholder="Networking" /></div>
            <div><Label>Gestor</Label><select value={f.expert_id} onChange={set("expert_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">—</option>{experts.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <div><Label>Data e horário</Label><Input type="datetime-local" value={f.date} onChange={set("date")} /></div>
            <div><Label>Duração (min)</Label><Input type="number" min={15} max={480} value={f.duration_min} onChange={set("duration_min")} /></div>
            <div><Label>Limite de participantes</Label><Input type="number" min={1} max={1000} value={f.capacity} onChange={set("capacity")} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.description} onChange={set("description")} /></div>
          <div><Label>Link da sala (Google Meet, Zoom…)</Label><Input value={f.meeting_url} onChange={set("meeting_url")} placeholder="https://meet.google.com/…" /><p className="mt-1 text-xs text-muted-foreground">Só aparece para quem reservou, 15 minutos antes do início.</p></div>
          <p className="pt-2 text-sm font-semibold">Depois do encontro</p>
          <div><Label>Resumo</Label><Textarea value={f.summary} onChange={set("summary")} /></div>
          <div><Label>Materiais e links</Label><Textarea value={f.materials} onChange={set("materials")} /></div>
          <div><Label>Gravação (link https)</Label><Input value={f.recording_url} onChange={set("recording_url")} /></div>
          <div className="flex gap-2"><Button type="submit">Salvar</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancelar</Button></div>
        </form>
      )}
      <ul className="mt-4 divide-y rounded-lg border bg-card">
        {list.data?.map((e) => (
          <li key={e.id}>
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <div className="flex-1"><p className="font-medium">{e.title} {e.status === "cancelled" && <span className="text-xs text-destructive">CANCELADO</span>} {e.is_demo && <span className="text-xs text-muted-foreground">· demonstração</span>}</p><p className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {e.duration_min} min · até {e.capacity}</p></div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setOpen(open === e.id ? null : e.id)}>Participantes</Button>
                <Button size="sm" variant="outline" onClick={() => edit(e)}>Editar</Button>
                {e.status === "scheduled" ? <Button size="sm" variant="outline" onClick={() => setStatus(e.id, "cancelled")}>Cancelar</Button> : <Button size="sm" variant="outline" onClick={() => setStatus(e.id, "scheduled")}>Reativar</Button>}
              </div>
            </div>
            {open === e.id && <Detail id={e.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
