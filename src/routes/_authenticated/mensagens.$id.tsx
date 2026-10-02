import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/community/Bits";
import { fetchProfiles } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mensagens/$id")({
  head: () => ({ meta: [{ title: "Conversa — Outro Ângulo" }, { name: "description", content: "Conversa privada entre membros." }] }),
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const conv = useQuery({
    queryKey: ["conv", id],
    queryFn: async () => {
      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!c) return null;
      const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
      const people = await fetchProfiles([otherId]);
      let context: string | null = null;
      if (c.context_post_id) context = (await supabase.from("posts").select("body").eq("id", c.context_post_id).maybeSingle()).data?.body ?? null;
      return { ...c, other: people.get(otherId), otherId, context };
    },
    enabled: !!user,
  });
  const msgs = useQuery({
    queryKey: ["msgs", id],
    queryFn: async () => (await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at").limit(500)).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["msgs", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
    if (!user || !msgs.data) return;
    if (msgs.data.some((m) => m.sender_id !== user.id && !m.read_at)) {
      supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", user.id).is("read_at", null).then(() => {});
    }
    supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("link", `/mensagens/${id}`).is("read_at", null).then(() => qc.invalidateQueries({ queryKey: ["unread"] }));
  }, [msgs.data, id, user, qc]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user!.id, body });
    if (error) { setText(body); return toast.error("Mensagem não enviada."); }
    qc.invalidateQueries({ queryKey: ["msgs", id] });
  }

  if (conv.isLoading) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!conv.data) return <p className="p-8">Conversa não encontrada.</p>;
  const o = conv.data;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-2xl flex-col md:h-dvh">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link to="/mensagens" aria-label="Voltar" className="rounded-md p-1 hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/pessoas/$id" params={{ id: o.otherId }} className="flex items-center gap-3">
          <Avatar name={o.other?.display_name ?? ""} url={o.other?.avatar_url} size="sm" />
          <div><p className="font-semibold leading-tight">{o.other?.display_name}</p><p className="text-xs text-muted-foreground">{o.other?.persona}</p></div>
        </Link>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {o.context && <p className="mx-auto mb-4 max-w-sm rounded-lg border bg-card p-3 text-center text-xs text-muted-foreground">Conversa iniciada a partir da publicação: “{o.context.slice(0, 140)}{o.context.length > 140 ? "…" : ""}”</p>}
        {msgs.data?.map((m) => (
          <div key={m.id} className={cn("flex", m.sender_id === user!.id ? "justify-end" : "justify-start")}>
            <p className={cn("max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm", m.sender_id === user!.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>{m.body}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t p-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }} placeholder="Escreva uma mensagem…" maxLength={2000} className="min-h-11 resize-none" rows={1} />
        <Button type="submit" size="icon" aria-label="Enviar" disabled={!text.trim()}><Send /></Button>
      </form>
    </div>
  );
}
