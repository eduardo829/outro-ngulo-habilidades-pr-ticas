import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { EventCard } from "@/components/community/EventCard";
import { fetchEvents, type Expert } from "@/lib/events";
import { eventWhen } from "@/lib/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/encontros/")({
  head: () => ({ meta: [{ title: "Encontros — Outro Ângulo" }, { name: "description", content: "Conversas em grupo com pessoas que já viveram o problema." }] }),
  component: Events,
});

const TABS = ["Próximos", "Minha agenda", "Gestores", "Anteriores"] as const;

function Events() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Próximos");
  const events = useQuery({ queryKey: ["events", user?.id], enabled: !!user, queryFn: () => fetchEvents(user!.id) });
  const experts = useQuery({ queryKey: ["experts"], queryFn: async () => ((await supabase.from("experts").select("*").eq("active", true).order("position")).data ?? []) as Expert[] });
  const now = Date.now();
  const all = events.data ?? [];
  const isPast = (e: (typeof all)[number]) => new Date(e.starts_at).getTime() + e.duration_min * 60000 < now;
  const upcoming = all.filter((e) => !isPast(e) && e.status === "scheduled");
  const mine = all.filter((e) => e.mine && !isPast(e));
  const past = all.filter(isPast).reverse();

  return (
    <Page>
      <h1 className="text-3xl font-extrabold">Encontros</h1>
      <p className="mt-1 max-w-xl text-muted-foreground">Conversas em grupo com pessoas que já viveram o problema.</p>
      <div className="mt-6 flex gap-5 overflow-x-auto border-b text-sm">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("-mb-px whitespace-nowrap border-b-2 pb-2.5", tab === t ? "border-foreground font-semibold" : "border-transparent text-muted-foreground")}>{t}{t === "Minha agenda" && mine.length ? ` (${mine.length})` : ""}</button>)}
      </div>
      {events.isLoading ? <p className="mt-8 text-muted-foreground">Carregando…</p> : tab === "Gestores" ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(experts.data ?? []).map((x) => (
            <li key={x.id} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3"><Avatar name={x.name} url={x.photo_url} /><div><p className="font-semibold">{x.name}</p><p className="text-xs text-muted-foreground">{x.headline}</p></div></div>
              {x.experience && <p className="mt-3 text-sm text-muted-foreground">{x.experience}</p>}
              <div className="mt-3 flex flex-wrap gap-1">{x.topics.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              <Link to="/gestores/$id" params={{ id: x.id }} className="mt-auto pt-4 text-sm font-medium text-primary hover:underline">Ver encontros →</Link>
            </li>
          ))}
        </ul>
      ) : tab === "Minha agenda" ? (
        mine.length ? (
          <ul className="mt-8 divide-y rounded-xl border bg-card">
            {mine.map((e) => { const w = eventWhen(e.starts_at); return (
              <li key={e.id}><Link to="/encontros/$id" params={{ id: e.id }} className="flex items-center gap-4 p-4 hover:bg-secondary/50">
                <div className="w-20 shrink-0 text-sm"><p className="font-semibold">{w.time}</p><p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p></div>
                <div className="min-w-0"><p className="truncate font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.expert ? `Com ${e.expert.name}` : ""} · {e.duration_min} min</p></div>
              </Link></li>); })}
          </ul>
        ) : <p className="mt-8 text-muted-foreground">Você ainda não reservou nenhum encontro.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tab === "Próximos" ? upcoming : past).map((e) => <EventCard key={e.id} e={e} />)}
          {!(tab === "Próximos" ? upcoming : past).length && <li className="text-muted-foreground">Nenhum encontro aqui ainda.</li>}
        </ul>
      )}
    </Page>
  );
}
