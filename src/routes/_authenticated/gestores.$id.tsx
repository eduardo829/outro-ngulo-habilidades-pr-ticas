import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { EventCard } from "@/components/community/EventCard";
import { fetchEvents, type Expert } from "@/lib/events";

export const Route = createFileRoute("/_authenticated/gestores/$id")({
  head: () => ({ meta: [{ title: "Gestor — Outro Ângulo" }, { name: "description", content: "Experiência real e encontros de um gestor." }] }),
  component: ExpertPage,
});

function ExpertPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const x = useQuery({ queryKey: ["expert", id], queryFn: async () => (await supabase.from("experts").select("*").eq("id", id).maybeSingle()).data as Expert | null });
  const ev = useQuery({ queryKey: ["events", "expert", id, user?.id], enabled: !!user, queryFn: () => fetchEvents(user!.id, { expertId: id }) });
  if (x.isLoading) return <Page><p className="text-muted-foreground">Carregando…</p></Page>;
  if (!x.data) return <Page><p>Gestor não encontrado.</p></Page>;
  const e = x.data;
  const upcoming = (ev.data ?? []).filter((v) => new Date(v.starts_at).getTime() + v.duration_min * 60000 > Date.now() && v.status === "scheduled");
  return (
    <Page>
      <Link to="/encontros" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Encontros</Link>
      <div className="mt-6 flex items-center gap-5"><Avatar name={e.name} url={e.photo_url} size="lg" /><div><h1 className="text-3xl font-extrabold">{e.name}</h1><p className="text-muted-foreground">{e.headline}{e.area ? ` · ${e.area}` : ""}</p></div></div>
      {e.experience && <p className="mt-6 max-w-2xl text-lg leading-relaxed">{e.experience}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">{e.topics.map((t) => <Tag key={t}>{t}</Tag>)}</div>
      <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Próximos encontros</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((v) => <EventCard key={v.id} e={v} />)}
        {!upcoming.length && <li className="text-muted-foreground">Nenhum encontro agendado no momento.</li>}
      </ul>
    </Page>
  );
}
