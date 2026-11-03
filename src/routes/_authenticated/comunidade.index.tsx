import { createFileRoute, redirect } from "@tanstack/react-router";
import communityPhoto from "@/assets/photo-comunidade.jpg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Page } from "@/components/community/Bits";
import { Composer } from "@/components/community/Composer";
import { PostCard, type FeedPost } from "@/components/community/PostCard";
import { fetchFeed, toggleReaction } from "@/lib/feed";
import { CATEGORIES } from "@/lib/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidade/")({
  head: () => ({ meta: [{ title: "Comunidade — Outro Ângulo" }, { name: "description", content: "Perguntas, experiências e oportunidades entre membros." }, { property: "og:title", content: "Comunidade — Outro Ângulo" }, { property: "og:description", content: "Perguntas, experiências e oportunidades entre membros." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: () => { throw redirect({ to: "/comunidades/$slug", params: { slug: "empreender-do-zero" }, replace: true }); },
  component: Community,
});

const VIEWS = ["Tudo", "Preciso de ajuda", "Oportunidades", "Salvos"] as const;

function Community() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Tudo");
  const [cat, setCat] = useState("Todas");
  const key = ["feed", user?.id, view, cat];
  const feed = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: () => fetchFeed(user!.id, {
      category: view === "Tudo" ? cat : undefined,
      kind: view === "Preciso de ajuda" ? "ajuda" : view === "Oportunidades" ? "oportunidade" : undefined,
      saved: view === "Salvos",
    }),
  });

  async function toggle(p: FeedPost, kind: "like" | "save") {
    qc.setQueryData<FeedPost[]>(key, (old) => old?.map((x) => x.id !== p.id ? x : kind === "like" ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : { ...x, saved: !x.saved }));
    await toggleReaction(p, user!.id, kind);
  }

  return (
    <Page narrow>
      <header className="grid items-stretch gap-0 overflow-hidden card-live sm:grid-cols-[1fr_1.1fr]">
        <div className="paper-light flex flex-col justify-center p-6">
          <p className="eyebrow">Mesa aberta</p>
          <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Comunidade</h1>
          <p className="mt-2 text-muted-foreground">Pergunte, conte o que aprendeu, peça ajuda. Gente real, sem palco.</p>
        </div>
        <div className="relative h-40 sm:h-auto"><img src={communityPhoto} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" /><span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-highlight" /></div>
      </header>
      <div className="mt-6"><Composer onDone={() => qc.invalidateQueries({ queryKey: ["feed"] })} /></div>
      <div className="mt-6 flex gap-5 overflow-x-auto border-b text-sm">
        {VIEWS.map((v) => (
          <button key={v} onClick={() => setView(v)} className={cn("-mb-px whitespace-nowrap border-b-2 pb-2.5", view === v ? "border-foreground font-semibold" : "border-transparent text-muted-foreground")}>{v}</button>
        ))}
      </div>
      {view === "Tudo" && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {["Todas", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs", cat === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>{c}</button>
          ))}
        </div>
      )}
      <div className="mt-2">
        {feed.isLoading ? <p className="py-8 text-muted-foreground">Carregando…</p>
          : feed.data?.length ? feed.data.map((p) => <PostCard key={p.id} p={p} me={user!.id} onToggle={(k) => toggle(p, k)} />)
          : <p className="py-10 text-center text-muted-foreground">Nada por aqui ainda. Que tal começar a conversa?</p>}
      </div>
    </Page>
  );
}
