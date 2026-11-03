import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page, SectionTitle } from "@/components/community/Bits";
import { Composer } from "@/components/community/Composer";
import { PostCard, type FeedPost } from "@/components/community/PostCard";
import { fetchFeed, toggleReaction } from "@/lib/feed";
import { fetchProfiles } from "@/lib/community";
import { VISIBILITY_LABEL } from "@/lib/ecosystem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/comunidades/$slug")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Comunidade — Outro Ângulo" }, { name: "description", content: "Feed, membros e eventos da comunidade." }, { property: "og:title", content: "Comunidade — Outro Ângulo" }, { property: "og:description", content: "Feed, membros e eventos da comunidade." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: CommunityPage,
});

const TABS = ["Feed", "Membros", "Eventos"] as const;
const PAGE = 20;

function CommunityPage() {
  const { slug } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Feed");
  const [cat, setCat] = useState("Todas");
  const [limit, setLimit] = useState(PAGE);

  const c = useQuery({
    queryKey: ["community", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*").eq("slug", slug).maybeSingle();
      if (!data) return null;
      const { data: m } = await supabase.from("community_members").select("role").eq("community_id", data.id).eq("user_id", user!.id).maybeSingle();
      return { ...data, myRole: m?.role ?? null };
    },
  });
  const cid = c.data?.id;
  const key = ["feed", "community", cid, cat, limit];
  const feed = useQuery({ queryKey: key, enabled: !!cid && tab === "Feed", queryFn: () => fetchFeed(user!.id, { communityId: cid, category: cat, limit }) });
  const members = useQuery({
    queryKey: ["community-members", cid],
    enabled: !!cid && tab === "Membros",
    queryFn: async () => {
      const { data } = await supabase.from("community_members").select("user_id, role").eq("community_id", cid!).limit(200);
      const map = await fetchProfiles((data ?? []).map((r) => r.user_id));
      return (data ?? []).map((r) => ({ ...r, p: map.get(r.user_id) })).filter((r) => r.p);
    },
  });
  const events = useQuery({
    queryKey: ["community-events", cid],
    enabled: !!cid && tab === "Eventos",
    queryFn: async () => (await supabase.from("events").select("id, title, starts_at, status").eq("community_id", cid!).order("starts_at", { ascending: false }).limit(30)).data ?? [],
  });

  if (c.isLoading) return <Page><p className="text-muted-foreground">Carregando…</p></Page>;
  if (!c.data) return <Page><p>Comunidade não encontrada ou indisponível. <Link to="/app/comunidades" className="text-primary underline">Ver comunidades</Link></p></Page>;
  const com = c.data;
  const isMod = isAdmin || com.myRole === "moderator" || com.myRole === "admin";

  async function join() {
    const { error } = await supabase.from("community_members").insert({ community_id: com.id, user_id: user!.id });
    if (error) return toast.error("Não foi possível participar.");
    toast.success("Você agora participa desta comunidade.");
    qc.invalidateQueries({ queryKey: ["community", slug] });
  }
  async function leave() {
    await supabase.from("community_members").delete().eq("community_id", com.id).eq("user_id", user!.id);
    qc.invalidateQueries({ queryKey: ["community", slug] });
  }
  async function toggle(p: FeedPost, kind: "like" | "save") {
    qc.setQueryData<FeedPost[]>(key, (old) => old?.map((x) => x.id !== p.id ? x : kind === "like" ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : { ...x, saved: !x.saved }));
    await toggleReaction(p, user!.id, kind);
  }
  async function pin(p: FeedPost) {
    const { error } = await supabase.from("posts").update({ pinned: !p.pinned }).eq("id", p.id);
    if (error) return toast.error("Sem permissão para fixar.");
    qc.invalidateQueries({ queryKey: ["feed", "community", cid] });
  }

  return (
    <Page narrow>
      <header className="border-b pb-6">
        <p className="eyebrow">{VISIBILITY_LABEL[com.visibility]} · Comunidade</p>
        <h1 className="mt-2 text-3xl font-extrabold">{com.name}</h1>
        {com.description && <p className="mt-2 text-muted-foreground">{com.description}</p>}
        <div className="mt-4">{com.myRole ? <Button variant="outline" size="sm" onClick={leave}>Participando · sair</Button> : <Button size="sm" onClick={join}>Participar</Button>}</div>
      </header>
      <div className="mt-4 flex gap-5 border-b text-sm">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 pb-2.5", tab === t ? "border-foreground font-semibold" : "border-transparent text-muted-foreground")}>{t}</button>)}
      </div>

      {tab === "Feed" && (
        <>
          <div className="mt-5"><Composer communityId={com.id} categories={com.categories} onDone={() => qc.invalidateQueries({ queryKey: ["feed"] })} /></div>
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {["Todas", ...com.categories].map((x) => <button key={x} onClick={() => { setCat(x); setLimit(PAGE); }} className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs", cat === x ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>{x}</button>)}
          </div>
          {feed.isLoading ? <p className="py-8 text-muted-foreground">Carregando…</p>
            : feed.isError ? <p className="py-8 text-destructive">Não foi possível carregar o feed.</p>
            : feed.data?.length ? (
              <div className="mt-2">
                {feed.data.map((p) => (
                  <div key={p.id}>
                    <PostCard p={p} me={user!.id} onToggle={(k) => toggle(p, k)} />
                    {isMod && <button onClick={() => pin(p)} className="-mt-4 mb-4 text-xs text-muted-foreground underline">{p.pinned ? "Desafixar" : "Fixar no topo"}</button>}
                  </div>
                ))}
                {feed.data.length >= limit && <Button variant="outline" className="mt-4 w-full" onClick={() => setLimit(limit + PAGE)}>Carregar mais</Button>}
              </div>
            ) : <p className="py-10 text-center text-muted-foreground">Nenhuma publicação ainda. Comece a conversa.</p>}
        </>
      )}

      {tab === "Membros" && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Aparecem aqui só os membros que escolheram mostrar o perfil.</p>
          {members.isLoading ? <p className="py-6 text-muted-foreground">Carregando…</p> : members.data?.length ? (
            <ul className="mt-3 divide-y">
              {members.data.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-3 text-sm">
                  <Link to="/pessoas/$id" params={{ id: m.user_id }} className="font-medium hover:underline">{m.p!.display_name}</Link>
                  <span className="text-muted-foreground">{m.role === "member" ? (m.p!.area ?? "") : m.role === "moderator" ? "Moderação" : "Administração"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-muted-foreground">Nenhum membro visível ainda.</p>}
        </div>
      )}

      {tab === "Eventos" && (
        <div className="mt-4">
          <SectionTitle>Eventos desta comunidade</SectionTitle>
          {events.data?.length ? (
            <ul className="divide-y">
              {events.data.map((e) => (
                <li key={e.id} className="py-3"><Link to="/encontros/$id" params={{ id: e.id }} className="font-medium hover:underline">{e.title}</Link>
                  <p className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}</p></li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground">Nenhum evento ligado a esta comunidade ainda. <Link to="/encontros" className="text-primary underline">Ver todos os encontros</Link></p>}
        </div>
      )}
    </Page>
  );
}
