import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Bookmark, MessageCircle, HandHelping, Star } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Tag } from "@/components/community/Bits";
import { KINDS, openConversation, timeAgo, type MiniProfile } from "@/lib/community";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string; author_id: string; kind: string; category: string; opportunity_type: string | null; body: string;
  link_url: string | null; image_url: string | null; featured: boolean; removed: boolean; created_at: string;
  likes: number; liked: boolean; saved: boolean; comments: number; author?: MiniProfile;
};

export function PostCard({ p, me, onToggle, compact }: { p: FeedPost; me: string; onToggle?: (kind: "like" | "save") => void; compact?: boolean }) {
  const navigate = useNavigate();
  const special = p.kind === "ajuda" || p.kind === "oportunidade";
  async function reach() {
    try {
      const id = await openConversation(p.author_id, p.id);
      navigate({ to: "/mensagens/$id", params: { id } });
    } catch { toast.error("Não foi possível abrir a conversa."); }
  }
  return (
    <article className={cn("border-b py-6 last:border-0", p.removed && "opacity-50")}>
      <header className="flex items-center gap-3">
        <Link to="/pessoas/$id" params={{ id: p.author_id }}><Avatar name={p.author?.display_name ?? ""} url={p.author?.avatar_url} size="sm" /></Link>
        <div className="min-w-0 flex-1 text-sm">
          <Link to="/pessoas/$id" params={{ id: p.author_id }} className="font-semibold hover:underline">{p.author?.display_name ?? "Membro"}</Link>
          <span className="text-muted-foreground"> · {timeAgo(p.created_at)}</span>
          {p.author?.persona && <p className="truncate text-xs text-muted-foreground">{p.author.persona}{p.author.city ? ` · ${p.author.city}` : ""}</p>}
        </div>
        {p.featured && <Star className="h-4 w-4 fill-primary text-primary" aria-label="Destacado pela equipe" />}
      </header>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag tone={special ? "primary" : "default"}>{p.opportunity_type ?? KINDS[p.kind]}</Tag>
        <Tag>{p.category}</Tag>
        {p.removed && <Tag>Removida</Tag>}
      </div>
      <Link to="/comunidade/$postId" params={{ postId: p.id }} className="block">
        <p className={cn("mt-3 whitespace-pre-line leading-relaxed", compact && "line-clamp-3")}>{p.body}</p>
      </Link>
      {!compact && p.image_url && <img src={p.image_url} alt="" className="mt-3 max-h-96 w-full rounded-lg border object-cover" />}
      {!compact && p.link_url && <a href={p.link_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 block truncate text-sm text-primary underline">{p.link_url}</a>}
      {!compact && (
        <footer className="mt-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button onClick={() => onToggle?.("like")} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary", p.liked && "text-primary")} aria-pressed={p.liked}>
            <Heart className={cn("h-4 w-4", p.liked && "fill-current")} />{p.likes || ""}<span className="sr-only">Curtir</span>
          </button>
          <Link to="/comunidade/$postId" params={{ postId: p.id }} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary">
            <MessageCircle className="h-4 w-4" />{p.comments || ""}<span className="sr-only">Responder</span>
          </Link>
          <button onClick={() => onToggle?.("save")} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary", p.saved && "text-primary")} aria-pressed={p.saved}>
            <Bookmark className={cn("h-4 w-4", p.saved && "fill-current")} /><span className="sr-only">Salvar</span>
          </button>
          {special && p.author_id !== me && (
            <button onClick={reach} className="ml-auto flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 font-medium text-primary hover:bg-accent">
              <HandHelping className="h-4 w-4" />{p.kind === "ajuda" ? "Posso ajudar" : "Tenho interesse"}
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
