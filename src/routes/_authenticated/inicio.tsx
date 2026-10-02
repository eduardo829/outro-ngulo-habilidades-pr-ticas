import { createFileRoute, Link } from "@tanstack/react-router";
import dashPhoto from "@/assets/photo-mirante.jpg";
import heroPhoto from "@/assets/photo-inicio-card.jpg";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PlayCircle, Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMyCourses } from "@/lib/student";
import { fetchEvents } from "@/lib/events";
import { fetchFeed } from "@/lib/feed";
import { useMyProfile } from "@/components/AppShell";
import { Page, SectionTitle } from "@/components/community/Bits";
import { EventCard } from "@/components/community/EventCard";
import { PostCard } from "@/components/community/PostCard";
import { PersonCard, PEOPLE_COLS } from "@/components/community/PersonCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Meu início — Outro Ângulo" }, { name: "description", content: "Seu painel: cursos, encontros, comunidade e próximo passo." }] }),
  component: Dashboard,
});

const more = (to: "/encontros" | "/comunidade" | "/pessoas") => <Link to={to} className="text-sm text-primary hover:underline">Ver tudo</Link>;

function NextStep() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const actions = useQuery({
    queryKey: ["actions", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("next_actions").select("*").eq("user_id", user!.id).is("done_at", null).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) return;
    const { error } = await supabase.from("next_actions").insert({ user_id: user!.id, body: text.trim() });
    if (error) return toast.error("Não foi possível salvar.");
    setText(""); setAdding(false); actions.refetch();
  }
  async function done(id: string) {
    await supabase.from("next_actions").update({ done_at: new Date().toISOString() }).eq("id", id);
    toast.success("Feito. Próximo passo.");
    actions.refetch();
  }
  return (
    <section className="rounded-xl border bg-card p-5 md:p-6">
      <SectionTitle action={!adding && <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm text-primary"><Plus className="h-4 w-4" />Adicionar</button>}>Meu próximo passo</SectionTitle>
      {actions.data?.length ? (
        <ul className="space-y-3">
          {actions.data.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4">
              <p className="font-medium">{a.body}</p>
              <Button size="sm" variant="outline" onClick={() => done(a.id)}><Check />Concluir</Button>
            </li>
          ))}
        </ul>
      ) : !adding && <p className="text-muted-foreground">Defina uma ação concreta para esta semana. Ex.: “Entrar em contato com três pessoas novas”.</p>}
      {adding && (
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Minha próxima ação…" className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" />
          <Button type="submit">Salvar</Button>
        </form>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const me = useMyProfile();
  const courses = useQuery({ queryKey: ["my-courses", user?.id], enabled: !!user, queryFn: () => fetchMyCourses(user!.id) });
  const events = useQuery({ queryKey: ["events", "upcoming", user?.id], enabled: !!user, queryFn: async () => (await fetchEvents(user!.id, { upcoming: true })).slice(0, 3) });
  const feed = useQuery({ queryKey: ["feed", "home", user?.id], enabled: !!user, queryFn: () => fetchFeed(user!.id, { limit: 3 }) });
  const people = useQuery({
    queryKey: ["people", "suggested", user?.id, me.data?.learn_tags],
    enabled: !!me.data,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select(PEOPLE_COLS).eq("in_directory", true).eq("suspended", false).neq("id", user!.id).limit(60);
      const want = new Set([...(me.data?.learn_tags ?? []), ...(me.data?.interests ?? [])].map((s) => s.toLowerCase()));
      const offer = new Set((me.data?.skills ?? []).map((s) => s.toLowerCase()));
      const score = (p: NonNullable<typeof data>[number]) =>
        p.skills.filter((s) => want.has(s.toLowerCase())).length * 2 + p.learn_tags.filter((s) => offer.has(s.toLowerCase())).length + p.interests.filter((s) => want.has(s.toLowerCase())).length;
      return (data ?? []).map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p);
    },
  });

  const first = (me.data?.display_name ?? "").split(" ")[0];
  const cont = courses.data?.find((c) => c.lastLesson) ?? courses.data?.[0];

  return (
    <Page>
      <header className="relative isolate -mx-1 overflow-hidden rounded-md bg-ink text-ink-foreground">
        <img src={dashPhoto} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_60%] opacity-75" />
        <div aria-hidden className="photo-scrim-r absolute inset-0 -z-10" />
        <div className="flex min-h-[200px] flex-col justify-end p-6 md:min-h-[240px] md:items-end md:p-10 md:text-right">
          <p className="eyebrow !text-ink-foreground/70">Seu ponto de vista de hoje</p>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Olá{first ? `, ${first}` : ""}.</h1>
          <p className="mt-2 text-lg text-ink-foreground/80">O que você quer desenvolver agora?</p>
          <span aria-hidden className="mt-5 block h-px w-16 bg-highlight" />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {courses.isLoading ? <div className="h-48 animate-pulse rounded-xl bg-secondary" /> : cont ? (
          <section className="relative isolate overflow-hidden rounded-xl bg-ink p-6 text-ink-foreground md:p-8">
            <img src={heroPhoto} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
            <div aria-hidden className="photo-scrim-l absolute inset-0 -z-10" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">Continuar aprendendo</p>
            <h2 className="mt-2 text-2xl font-bold">{cont.title}</h2>
            {cont.lastLesson && <p className="mt-1 opacity-80">Última aula: {cont.lastLesson.title}</p>}
            <div className="mt-4 max-w-sm"><Progress value={cont.pct} className="bg-ink-foreground/20" aria-label={`Progresso ${cont.pct}%`} /></div>
            <p className="mt-1 text-xs opacity-70">{cont.completed} de {cont.total} aulas concluídas</p>
            <Button asChild className="mt-5 bg-highlight text-highlight-foreground hover:bg-highlight/90">
              {cont.lastLesson ? <Link to="/aula/$lessonId" params={{ lessonId: cont.lastLesson.id }}><PlayCircle />Continuar</Link>
                : <Link to="/curso/$slug" params={{ slug: cont.slug }}><PlayCircle />Começar o curso</Link>}
            </Button>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed bg-card p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Continuar aprendendo</p>
            <h2 className="mt-2 text-xl font-bold">Você ainda não tem cursos liberados</h2>
            <p className="mt-2 max-w-lg text-muted-foreground">Os cursos são liberados por matrícula. Enquanto isso, a comunidade e os encontros já estão abertos para você.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/cursos">Ver catálogo</Link></Button>
          </section>
        )}
        <NextStep />
      </div>

      <section className="mt-12">
        <SectionTitle action={more("/encontros")}>Próximos encontros</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.data?.map((e) => <EventCard key={e.id} e={e} />)}
          {events.data && !events.data.length && <li className="text-muted-foreground">Nenhum encontro agendado agora.</li>}
        </ul>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle action={more("/comunidade")}>Acontecendo na comunidade</SectionTitle>
          <div className="rounded-xl border bg-card px-5">
            {feed.data?.length ? feed.data.map((p) => <PostCard key={p.id} p={p} me={user!.id} compact />) : <p className="py-6 text-muted-foreground">Ainda sem publicações. <Link to="/comunidade" className="text-primary underline">Comece uma conversa</Link>.</p>}
          </div>
        </section>
        <section>
          <SectionTitle action={more("/pessoas")}>Pessoas para conhecer</SectionTitle>
          <ul className="grid gap-4">
            {people.data?.map((p) => <PersonCard key={p.id} p={p} />)}
            {people.data && !people.data.length && <li className="text-muted-foreground">Assim que mais membros entrarem, sugeriremos pessoas com interesses complementares aos seus.</li>}
          </ul>
        </section>
      </div>
    </Page>
  );
}
