import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  ["session_minutes", "Tempo de IA por dia (minutos, membros)"],
  ["member_daily_messages", "Mensagens por dia (membros, todas as ferramentas)"],
  ["visitor_daily_messages", "Mensagens por dia (visitantes, só assistente)"],
  ["ip_daily_messages", "Mensagens por dia por rede (IP), somando contas"],
  ["per_minute_limit", "Máximo de mensagens por minuto"],
  ["daily_spend_limit_cents", "Limite diário de gasto estimado (centavos)"],
  ["est_cost_cents_per_message", "Custo estimado por mensagem (centavos)"],
] as const;
type Key = (typeof FIELDS)[number][0];

export function AiSettingsPanel() {
  const q = useQuery({ queryKey: ["ai-settings"], queryFn: async () => (await supabase.from("ai_settings").select("*").eq("id", 1).maybeSingle()).data });
  const spend = useQuery({
    queryKey: ["ai-spend-today"],
    queryFn: async () => (await supabase.from("ai_spend").select("feature, requests, est_cost_cents").eq("day", new Date().toISOString().slice(0, 10))).data ?? [],
  });
  const [v, setV] = useState<Record<Key, string>>({} as Record<Key, string>);
  useEffect(() => { if (q.data) setV(Object.fromEntries(FIELDS.map(([k]) => [k, String(q.data![k])])) as Record<Key, string>); }, [q.data]);

  const save = async () => {
    const patch = Object.fromEntries(FIELDS.map(([k]) => [k, Number(v[k])]));
    if (Object.values(patch).some((n) => !Number.isFinite(n) || n < 0)) return toast.error("Use apenas números positivos.");
    const { error } = await supabase.from("ai_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
    error ? toast.error("Falha ao salvar (verifique os valores).") : toast.success("Limites de IA salvos.");
  };

  if (!q.data) return null;
  const total = (spend.data ?? []).reduce((a, r) => a + Number(r.est_cost_cents), 0);
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-lg font-bold">Limites de IA</h2>
      <p className="mt-1 text-sm text-muted-foreground">Aplicados no servidor ao assistente, às Trilhas e ao "Me dê outro ângulo". Ao atingir o gasto diário, todas as chamadas pagas param até o dia seguinte (UTC).</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} type="number" min={0} step="any" value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={save}>Salvar limites</Button>
      <div className="mt-6 text-sm">
        <p className="font-semibold">Uso de hoje (estimado): {(total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <ul className="mt-1 text-muted-foreground">
          {(spend.data ?? []).map((r) => <li key={r.feature}>{r.feature}: {r.requests} pedidos</li>)}
          {spend.data?.length === 0 && <li>Nenhum uso hoje.</li>}
        </ul>
      </div>
    </section>
  );
}
