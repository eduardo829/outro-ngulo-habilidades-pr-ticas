import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFeed } from "@/lib/feed";
import { KINDS, timeAgo } from "@/lib/community";
import { seedDemo, removeDemo } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/comunidade")({
  head: () => ({ meta: [{ title: "Moderação — Outro Ângulo" }] }),
  component: Moderation,
});

function Moderation() {
  const { user } = useAuth();
  const seed = useServerFn(seedDemo);
  const unseed = useServerFn(removeDemo);
  const [busy, setBusy] = useState(false);
  const posts = useQuery({ queryKey: ["admin-posts"], enabled: !!user, queryFn: () => fetchFeed(user!.id, { limit: 100 }) });
  const members = useQuery({ queryKey: ["admin-members"], queryFn: async () => (await supabase.from("profiles").select("id, display_name, suspended, is_demo, persona").order("display_name")).data ?? [] });

  async function upd(id: string, patch: { featured?: boolean; removed?: boolean }) {
    const { error } = await supabase.from("posts").update(patch).eq("id", id);
    error ? toast.error("Falha.") : posts.refetch();
  }
  async function suspend(id: string, v: boolean) {
    if (id === user!.id) return toast.error("Você não pode suspender a si mesmo.");
    const { error } = await supabase.from("profiles").update({ suspended: v }).eq("id", id);
    error ? toast.error("Falha.") : (toast.success(v ? "Membro suspenso." : "Suspensão removida."), members.refetch());
  }
  async function demo(add: boolean) {
    if (!add && !confirm("Remover todos os membros, publicações, gestores e encontros de demonstração?")) return;
    setBusy(true);
    try { const r = add ? await seed() : await unseed(); toast.success(add ? `${"created" in r ? r.created : 0} membros de demonstração criados.` : "Dados de demonstração removidos."); posts.refetch(); members.refetch(); }
    catch { toast.error("Não foi possível concluir."); }
    setBusy(false);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-bold">Dados de demonstração</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cria 8 membros fictícios, publicações, pedidos de ajuda, oportunidades e reservas para você avaliar a plataforma. Tudo fica marcado como demonstração e pode ser removido de uma vez antes do lançamento.</p>
        <div className="mt-3 flex gap-2"><Button onClick={() => demo(true)} disabled={busy}>Gerar demonstração</Button><Button variant="outline" onClick={() => demo(false)} disabled={busy}>Remover demonstração</Button></div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Publicações</h2>
        <ul className="mt-3 divide-y rounded-lg border bg-card">
          {posts.data?.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{p.author?.display_name} · {KINDS[p.kind]} · {timeAgo(p.created_at)} {p.removed && "· REMOVIDA"} {p.featured && "· DESTACADA"}</p>
                <p className="line-clamp-2 text-sm">{p.body}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => upd(p.id, { featured: !p.featured })}>{p.featured ? "Tirar destaque" : "Destacar"}</Button>
                <Button size="sm" variant={p.removed ? "outline" : "destructive"} onClick={() => upd(p.id, { removed: !p.removed })}>{p.removed ? "Restaurar" : "Remover"}</Button>
              </div>
            </li>
          ))}
          {!posts.data?.length && <li className="p-4 text-sm text-muted-foreground">Nenhuma publicação.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Membros</h2>
        <p className="text-sm text-muted-foreground">Membros suspensos não conseguem publicar, responder, enviar mensagens nem reservar encontros.</p>
        <ul className="mt-3 divide-y rounded-lg border bg-card">
          {members.data?.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span>{m.display_name} <span className="text-muted-foreground">{m.persona ?? ""} {m.is_demo && "· demonstração"} {m.suspended && "· SUSPENSO"}</span></span>
              <Button size="sm" variant="outline" onClick={() => suspend(m.id, !m.suspended)}>{m.suspended ? "Reativar" : "Suspender"}</Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
