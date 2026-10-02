import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page } from "@/components/community/Bits";
import { fetchProfiles, timeAgo } from "@/lib/community";

export const Route = createFileRoute("/_authenticated/mensagens/")({
  head: () => ({ meta: [{ title: "Mensagens — Outro Ângulo" }, { name: "description", content: "Suas conversas privadas." }] }),
  component: Inbox,
});

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
      const list = convs ?? [];
      const others = list.map((c) => (c.user_a === user!.id ? c.user_b : c.user_a));
      const ids = list.map((c) => c.id);
      const [people, { data: msgs }] = await Promise.all([
        fetchProfiles(others),
        ids.length ? supabase.from("messages").select("conversation_id, body, sender_id, read_at, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] as never[] }),
      ]);
      return list.map((c, i) => {
        const mine = (msgs ?? []).filter((m) => m.conversation_id === c.id);
        return { ...c, other: people.get(others[i] ?? ""), last: mine[0], unread: mine.some((m) => m.sender_id !== user!.id && !m.read_at) };
      });
    },
  });
}

function Inbox() {
  const { data, isLoading } = useConversations();
  return (
    <Page narrow>
      <h1 className="text-3xl font-extrabold">Mensagens</h1>
      {isLoading ? <p className="mt-6 text-muted-foreground">Carregando…</p> : !data?.length ? (
        <p className="mt-6 text-muted-foreground">Nenhuma conversa ainda. Abra o perfil de alguém em <Link to="/pessoas" className="text-primary underline">Pessoas</Link> e envie uma mensagem.</p>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {data.map((c) => (
            <li key={c.id}>
              <Link to="/mensagens/$id" params={{ id: c.id }} className="flex items-center gap-3 p-4 hover:bg-secondary/50">
                <Avatar name={c.other?.display_name ?? ""} url={c.other?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className={c.unread ? "font-bold" : "font-medium"}>{c.other?.display_name ?? "Membro"}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.last ? c.last.body : "Conversa iniciada"}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {c.last && timeAgo(c.last.created_at)}
                  {c.unread && <span className="mt-1 ml-auto block h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
