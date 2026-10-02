import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronUp, Video, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, SectionTitle } from "@/components/community/Bits";
import { fetchEvents } from "@/lib/events";
import { eventPhase, eventWhen, fetchProfiles } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/encontros/$id")({
  head: () => ({ meta: [{ title: "Encontro — Outro Ângulo" }, { name: "description", content: "Detalhes, perguntas e acesso ao encontro." }] }),
  component: EventPage,
});

function EventPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [question, setQuestion] = useState("");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);

  const ev = useQuery({ queryKey: ["event", id, user?.id], enabled: !!user, queryFn: async () => (await fetchEvents(user!.id, { ids: [id] }))[0] ?? null });
  const people = useQuery({
    queryKey: ["event-people", id],
    queryFn: async () => {
      const { data } = await supabase.from("event_bookings").select("user_id").eq("event_id", id);
      return [...(await fetchProfiles((data ?? []).map((b) => b.user_id))).values()];
    },
  });
  const qs = useQuery({
    queryKey: ["event-qs", id],
    queryFn: async () => {
      const { data } = await supabase.from("event_questions").select("*").eq("event_id", id);
      const qids = (data ?? []).map((q) => q.id);
      const { data: votes } = qids.length ? await supabase.from("event_question_votes").select("question_id, user_id").in("question_id", qids) : { data: [] as { question_id: string; user_id: string }[] };
      return (data ?? []).map((q) => {
        const v = (votes ?? []).filter((x) => x.question_id === q.id);
        return { ...q, votes: v.length, voted: v.some((x) => x.user_id === user?.id) };
      }).sort((a, b) => b.votes - a.votes || a.created_at.localeCompare(b.created_at));
    },
  });
  const phase = ev.data ? eventPhase(ev.data) : "upcoming";
  const join = useQuery({
    queryKey: ["join", id],
    enabled: !!ev.data?.mine && phase === "live",
    refetchInterval: 60000,
    queryFn: async () => (await supabase.rpc("event_join_url", { _event: id })).data as string | null,
  });
  const myActions = useQuery({ queryKey: ["actions-event", id], enabled: !!user, queryFn: async () => (await supabase.from("next_actions").select("*").eq("event_id", id).eq("user_id", user!.id)).data ?? [] });

  if (ev.isLoading) return <Page narrow><p className="text-muted-foreground">Carregando…</p></Page>;
  if (!ev.data) return <Page narrow><p>Encontro não encontrado.</p></Page>;
  const e = ev.data;
  const { day, time } = eventWhen(e.starts_at);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["event", id] }); qc.invalidateQueries({ queryKey: ["events"] }); people.refetch(); };

  async function book() {
    setBusy(true);
    const { error } = await supabase.rpc("book_event", { _event: id });
    setBusy(false); setConfirm(false);
    if (error) return toast.error(error.message.includes("vagas") ? "Não há mais vagas." : "Não foi possível reservar.");
    toast.success("Vaga reservada. Está na sua agenda.");
    refresh();
  }
  async function cancel() {
    if (!window.confirm("Cancelar sua reserva?")) return;
    await supabase.from("event_bookings").delete().eq("event_id", id).eq("user_id", user!.id);
    refresh();
  }
  async function ask(ev2: React.FormEvent) {
    ev2.preventDefault();
    if (question.trim().length < 3) return;
    const { error } = await supabase.from("event_questions").insert({ event_id: id, user_id: user!.id, body: question.trim() });
    if (error) return toast.error("Não foi possível enviar.");
    setQuestion(""); qs.refetch();
  }
  async function vote(qid: string, voted: boolean) {
    if (voted) await supabase.from("event_question_votes").delete().eq("question_id", qid).eq("user_id", user!.id);
    else await supabase.from("event_question_votes").insert({ question_id: qid, user_id: user!.id });
    qs.refetch();
  }
  async function saveAction(ev2: React.FormEvent) {
    ev2.preventDefault();
    if (action.trim().length < 3) return;
    const { error } = await supabase.from("next_actions").insert({ user_id: user!.id, body: action.trim(), event_id: id });
    if (error) return toast.error("Não foi possível salvar.");
    setAction(""); myActions.refetch(); qc.invalidateQueries({ queryKey: ["actions"] });
    toast.success("Salvo no seu início, em “Meu próximo passo”.");
  }

  return (
    <Page narrow>
      <Link to="/encontros" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Encontros</Link>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{phase === "done" ? "Encontro concluído" : phase === "cancelled" ? "Encontro cancelado" : e.theme}</p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight">{e.title}</h1>
      {e.description && <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{e.description}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border text-sm sm:grid-cols-4">
        {[["Data", day], ["Horário", time], ["Duração", `${e.duration_min} min`], ["Vagas", phase === "done" ? `${e.booked} participaram` : `${e.left} de ${e.capacity}`]].map(([k, v]) => (
          <div key={k} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
        ))}
      </dl>

      {e.expert && (
        <Link to="/gestores/$id" params={{ id: e.expert.id }} className="mt-4 flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary">
          <Avatar name={e.expert.name} url={e.expert.photo_url} />
          <div><p className="font-semibold">Com {e.expert.name}</p><p className="text-sm text-muted-foreground">{e.expert.experience ?? e.expert.headline}</p></div>
        </Link>
      )}

      <div className="mt-6">
        {phase === "cancelled" ? <p className="text-muted-foreground">Este encontro foi cancelado.</p>
        : phase === "done" ? null
        : e.mine ? (
          <div className="rounded-xl border border-primary/40 bg-accent p-4">
            <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-primary" />Vaga reservada.</p>
            {phase === "live" ? (
              join.data ? <Button asChild className="mt-3"><a href={join.data} target="_blank" rel="noopener noreferrer"><Video />Entrar no encontro</a></Button>
                : <p className="mt-2 text-sm text-muted-foreground">O link da sala ainda não foi adicionado pela equipe. Atualize em instantes.</p>
            ) : <p className="mt-1 text-sm text-muted-foreground">O botão “Entrar no encontro” aparece aqui 15 minutos antes do início.</p>}
            {phase === "upcoming" && <button onClick={cancel} className="mt-3 text-xs text-muted-foreground underline">Cancelar reserva</button>}
          </div>
        ) : e.left > 0 ? <Button size="lg" className="w-full sm:w-auto" onClick={() => setConfirm(true)}>Reservar vaga</Button>
        : <p className="font-medium">Vagas esgotadas.</p>}
      </div>

      {phase === "done" && (
        <section className="mt-8 space-y-6">
          {e.summary && <div><SectionTitle>Resumo</SectionTitle><p className="whitespace-pre-line leading-relaxed">{e.summary}</p></div>}
          {e.materials && <div><SectionTitle>Materiais e links</SectionTitle><p className="whitespace-pre-line text-sm leading-relaxed">{e.materials}</p></div>}
          {e.recording_url && <Button asChild variant="outline"><a href={e.recording_url} target="_blank" rel="noopener noreferrer"><Video />Ver gravação</a></Button>}
          {!e.summary && !e.materials && !e.recording_url && <p className="text-muted-foreground">O resumo e os materiais serão publicados em breve.</p>}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-bold">Qual ação você vai colocar em prática?</h2>
            {myActions.data?.map((a) => <p key={a.id} className="mt-2 text-sm">→ {a.body}{a.done_at ? " (concluída)" : ""}</p>)}
            <form onSubmit={saveAction} className="mt-3 flex gap-2">
              <input value={action} onChange={(x) => setAction(x.target.value)} maxLength={300} placeholder="Minha próxima ação…" className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" />
              <Button type="submit">Salvar</Button>
            </form>
          </div>
        </section>
      )}

      {phase !== "done" && phase !== "cancelled" && (
        <section className="mt-10">
          <SectionTitle>O que você gostaria de perguntar?</SectionTitle>
          <form onSubmit={ask} className="flex flex-col gap-2 sm:flex-row">
            <Textarea value={question} onChange={(x) => setQuestion(x.target.value)} maxLength={500} placeholder="Sua pergunta para o gestor…" className="min-h-11 flex-1" rows={1} />
            <Button type="submit" disabled={question.trim().length < 3}>Enviar</Button>
          </form>
        </section>
      )}

      {!!qs.data?.length && (
        <section className="mt-8">
          <SectionTitle>Perguntas mais pedidas</SectionTitle>
          <ul className="space-y-2">
            {qs.data.map((q) => (
              <li key={q.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <button onClick={() => vote(q.id, q.voted)} disabled={phase === "done"} aria-pressed={q.voted} aria-label="Apoiar pergunta" className={cn("flex w-10 shrink-0 flex-col items-center rounded-md border py-1 text-xs", q.voted && "border-primary text-primary")}>
                  <ChevronUp className="h-4 w-4" />{q.votes}
                </button>
                <p className="pt-1 text-sm">{q.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <SectionTitle>Participantes ({people.data?.length ?? 0})</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {people.data?.map((p) => <Link key={p.id} to="/pessoas/$id" params={{ id: p.id }} title={p.display_name}><Avatar name={p.display_name} url={p.avatar_url} size="sm" /></Link>)}
        </div>
      </section>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{e.title}</DialogTitle></DialogHeader>
          <dl className="space-y-1.5 text-sm">
            {e.expert && <div className="flex justify-between"><dt className="text-muted-foreground">Gestor</dt><dd>{e.expert.name}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Data</dt><dd>{day}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Horário</dt><dd>{time}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Duração</dt><dd>{e.duration_min} min</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Participantes</dt><dd>{e.booked} de {e.capacity}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Vagas disponíveis</dt><dd>{e.left}</dd></div>
          </dl>
          <DialogFooter><Button onClick={book} disabled={busy} className="w-full">{busy ? "Reservando…" : "Confirmar participação"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
