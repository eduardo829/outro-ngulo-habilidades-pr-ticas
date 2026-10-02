import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles } from "@/lib/community";
import type { FeedPost } from "@/components/community/PostCard";

export async function fetchFeed(me: string, opts: { category?: string; kind?: string; saved?: boolean; limit?: number; ids?: string[] } = {}) {
  let q = supabase.from("posts").select("*").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  if (opts.category && opts.category !== "Todas") q = q.eq("category", opts.category);
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.ids) q = q.in("id", opts.ids.length ? opts.ids : ["00000000-0000-0000-0000-000000000000"]);
  if (opts.saved) {
    const { data: s } = await supabase.from("reactions").select("post_id").eq("user_id", me).eq("kind", "save");
    q = q.in("id", (s ?? []).map((r) => r.post_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  const { data: posts, error } = await q;
  if (error) throw error;
  const ids = (posts ?? []).map((p) => p.id);
  if (!ids.length) return [] as FeedPost[];
  const [{ data: rx }, { data: cm }, authors] = await Promise.all([
    supabase.from("reactions").select("post_id, user_id, kind").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids),
    fetchProfiles((posts ?? []).map((p) => p.author_id)),
  ]);
  return (posts ?? []).map((p) => {
    const r = (rx ?? []).filter((x) => x.post_id === p.id);
    return {
      ...p,
      likes: r.filter((x) => x.kind === "like").length,
      liked: r.some((x) => x.kind === "like" && x.user_id === me),
      saved: r.some((x) => x.kind === "save" && x.user_id === me),
      comments: (cm ?? []).filter((c) => c.post_id === p.id).length,
      author: authors.get(p.author_id),
    } as FeedPost;
  });
}

export async function toggleReaction(p: FeedPost, me: string, kind: "like" | "save") {
  const on = kind === "like" ? p.liked : p.saved;
  if (on) await supabase.from("reactions").delete().eq("post_id", p.id).eq("user_id", me).eq("kind", kind);
  else await supabase.from("reactions").insert({ post_id: p.id, user_id: me, kind });
}
