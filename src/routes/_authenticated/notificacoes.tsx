import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page } from "@/components/community/Bits";
import { timeAgo } from "@/lib/community";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Outro Ângulo" }, { name: "description", content: "Respostas, mensagens e encontros." }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(60)).data ?? [],
  });
  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    refetch(); qc.invalidateQueries({ queryKey: ["unread"] });
  }
  async function open(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["unread"] });
  }
  return (
    <Page narrow>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Notificações</h1>
        {!!data?.some((n) => !n.read_at) && <Button variant="ghost" size="sm" onClick={markAll}>Marcar todas como lidas</Button>}
      </div>
      {isLoading ? <p className="mt-6 text-muted-foreground">Carregando…</p> : !data?.length ? <p className="mt-6 text-muted-foreground">Nada novo por enquanto.</p> : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {data.map((n) => (
            <li key={n.id}>
              <Link to={(n.link ?? "/inicio") as "/inicio"} onClick={() => open(n.id)} className="flex items-start gap-3 p-4 hover:bg-secondary/50">
                <span className={n.read_at ? "mt-2 h-2 w-2 shrink-0" : "mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"} aria-hidden />
                <div className="flex-1"><p className={n.read_at ? "text-muted-foreground" : "font-medium"}>{n.title}</p><p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
