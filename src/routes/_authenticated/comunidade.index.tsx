import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page } from "@/components/community/Bits";
import { PostCard, type FeedPost } from "@/components/community/PostCard";
import { fetchFeed, toggleReaction } from "@/lib/feed";
import { CATEGORIES, KINDS, OPP_TYPES } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidade/")({
  head: () => ({ meta: [{ title: "Comunidade — Outro Ângulo" }, { name: "description", content: "Perguntas, experiências e oportunidades entre membros." }] }),
  component: Community,
});

const VIEWS = ["Tudo", "Preciso de ajuda", "Oportunidades", "Salvos"] as const;

function Composer({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("pergunta");
  const [category, setCategory] = useState("Geral");
  const [opp, setOpp] = useState(OPP_TYPES[0]);
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (body.trim().length < 3) return toast.error("Escreva um pouco mais.");
    if (link && !/^https?:\/\/\S+$/.test(link)) return toast.error("Link inválido.");
    setBusy(true);
    let image_url: string | null = null;
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) { setBusy(false); return toast.error("Imagem JPG, PNG ou WEBP de até 3 MB."); }
      const path = `${user!.id}/post-${Date.now()}`;
      const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (up.error) { setBusy(false); return toast.error("Falha ao enviar imagem."); }
      image_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("posts").insert({
      author_id: user!.id, kind, body: body.trim(), link_url: link || null, image_url,
      category: kind === "oportunidade" ? "Oportunidades" : category,
      opportunity_type: kind === "oportunidade" ? opp : null,
    });
    setBusy(false);
    if (error) return toast.error("Não foi possível publicar.");
    setBody(""); setLink(""); setFile(null); setOpen(false); setShowLink(false);
    toast.success("Publicado.");
    onDone();
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <Textarea value={body} onFocus={() => setOpen(true)} onChange={(e) => setBody(e.target.value)} maxLength={4000}
        placeholder={kind === "ajuda" ? "Conte em que você está travado. Ex.: estou tentando conseguir meus primeiros clientes…" : "Compartilhe uma dúvida, experiência ou ideia…"}
        className={cn("resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0", open ? "min-h-28" : "min-h-10")} />
      {open && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(KINDS).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={cn("rounded-full border px-3 py-1 text-xs", kind === k ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {kind === "oportunidade" ? (
              <select value={opp} onChange={(e) => setOpp(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Tipo de oportunidade">{OPP_TYPES.map((o) => <option key={o}>{o}</option>)}</select>
            ) : (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Categoria">{CATEGORIES.filter((c) => c !== "Oportunidades").map((c) => <option key={c}>{c}</option>)}</select>
            )}
            <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary">
              <ImagePlus className="h-4 w-4" />{file ? file.name.slice(0, 18) : "Imagem"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={() => setShowLink(!showLink)} className="flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary"><Link2 className="h-4 w-4" />Link</button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={submit} disabled={busy}>{busy ? "Publicando…" : "Publicar"}</Button>
            </div>
          </div>
          {showLink && <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" type="url" />}
        </div>
      )}
    </div>
  );
}

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
      <h1 className="text-3xl font-extrabold">Comunidade</h1>
      <p className="mt-1 text-muted-foreground">Pergunte, conte o que aprendeu, peça ajuda. Gente real, sem palco.</p>
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
