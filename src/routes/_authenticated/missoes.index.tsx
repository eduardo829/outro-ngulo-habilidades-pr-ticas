import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MISSIONS } from "@/lib/angulo";

export const Route = createFileRoute("/_authenticated/missoes/")({
  head: () => ({ meta: [{ title: "Missões — Outro Ângulo" }, { name: "description", content: "Pequenas tarefas fora da tela que geram aprendizado real." }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["missions", user?.id, "all"], enabled: !!user, queryFn: async () => (await supabase.from("mission_progress").select("mission_key, completed_at").eq("user_id", user!.id)).data ?? [] });
  const st = (k: string) => q.data?.find((r) => r.mission_key === k);
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      <p className="eyebrow">Missões</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Aprender também acontece fora da tela.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Cada missão pede uma ação real: uma conversa, uma pesquisa, um teste. No fim, você registra o que descobriu. Fica tudo privado.</p>
      <ol className="mt-10 divide-y border-y">
        {MISSIONS.map((m, i) => {
          const s = st(m.key);
          return (
            <li key={m.key}>
              <Link to="/missoes/$key" params={{ key: m.key }} className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-3 py-5">
                <span className="font-display text-3xl font-extrabold text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="eyebrow">{m.area} · {m.effort}</span><span className="mt-1 block font-display text-lg font-bold group-hover:underline">{m.title}</span></span>
                <span className="text-xs text-muted-foreground">{s?.completed_at ? <span className="flex items-center gap-1 text-primary"><Check className="h-4 w-4" />Concluída</span> : s ? "Em andamento" : <ArrowRight className="h-4 w-4" />}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
