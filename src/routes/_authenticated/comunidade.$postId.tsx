import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { PostCard, type FeedPost } from "@/components/community/PostCard";
import { fetchFeed, toggleReaction } from "@/lib/feed";
import { fetchProfiles, openConversation, timeAgo } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/comunidade/$postId")({
  head: () => ({ meta: [{ title: "Publicação — Outro Ângulo" }, { name: "description", content: "Conversa na comunidade." }] }),
  component: PostPage,
});

function PostPage() {
  const { postId } = Route.useParams();
  const { user, isStaff } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const post = useQuery({ queryKey: ["post", postId, user?.id], enabled: !!user, queryFn: async () => (await fetchFeed(user!.id, { ids: [postId], limit: 1 }))[0] ?? null });
  const comments = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at");
      const authors = await fetchProfiles((data ?? []).map((c) => c.author_id));
      return (data ?? []).map((c) => ({ ...c, author: authors.get(c.author_id) }));
    },
  });

  if (post.isLoading) return <Page narrow><p className="text-muted-foreground">Carregando…</p></Page>;
  if (!post.data) return <Page narrow><p>Publicação não encontrada ou removida.</p><Link to="/comunidade" className="text-primary underline">Voltar</Link></Page>;
  const p = post.data;

  async function send(offersHelp = false) {
    const body = offersHelp && !reply.trim() ? "Posso ajudar." : reply.trim();
    if (!body) return;
    setBusy(true);
    const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: user!.id, body, offers_help: offersHelp });
    setBusy(false);
    if (error) return toast.error("Não foi possível responder.");
    setReply("");
    qc.invalidateQueries({ queryKey: ["comments", postId] });
    if (offersHelp) {
      const id = await openConversation(p.author_id, p.id);
      navigate({ to: "/mensagens/$id", params: { id } });
    }
  }
  async function toggle(kind: "like" | "save") { await toggleReaction(p, user!.id, kind); post.refetch(); }
  async function del(id: string) { await supabase.from("comments").delete().eq("id", id); comments.refetch(); }
  async function delPost() {
    if (!confirm("Excluir esta publicação?")) return;
    await supabase.from("posts").delete().eq("id", p.id);
    navigate({ to: "/comunidade" });
  }

  return (
    <Page narrow>
      <Link to="/comunidade" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Comunidade</Link>
      <PostCard p={p as FeedPost} me={user!.id} onToggle={toggle} />
      {(p.author_id === user!.id || isStaff) && <button onClick={delPost} className="text-xs text-muted-foreground underline">Excluir publicação</button>}

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{comments.data?.length ?? 0} respostas</h2>
      <ul className="mt-4 space-y-5">
        {comments.data?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Link to="/pessoas/$id" params={{ id: c.author_id }}><Avatar name={c.author?.display_name ?? ""} url={c.author?.avatar_url} size="sm" /></Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm"><Link to="/pessoas/$id" params={{ id: c.author_id }} className="font-semibold hover:underline">{c.author?.display_name}</Link> <span className="text-muted-foreground">· {timeAgo(c.created_at)}</span> {c.offers_help && <Tag tone="primary">Ofereceu ajuda</Tag>}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{c.body}</p>
            </div>
            {(c.author_id === user!.id || isStaff) && <button onClick={() => del(c.id)} aria-label="Excluir resposta" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-xl border bg-card p-3">
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} placeholder="Escreva uma resposta…" className="min-h-20 border-0 p-0 shadow-none focus-visible:ring-0" />
        <div className="mt-2 flex justify-end gap-2">
          {p.kind === "ajuda" && p.author_id !== user!.id && <Button variant="outline" size="sm" onClick={() => send(true)} disabled={busy}>Posso ajudar</Button>}
          <Button size="sm" onClick={() => send(false)} disabled={busy || !reply.trim()}>Responder</Button>
        </div>
      </div>
    </Page>
  );
}
