import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SPECIALIST_CATEGORIES } from "@/lib/specialists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RequestForm({ professionalId, defaultCategory, onDone }: { professionalId?: string | undefined; defaultCategory?: string | undefined; onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ category: defaultCategory ?? "ia", need: "", budget: "", deadline: "", city: "", remote: true });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.need.trim().length < 10) return toast.error("Descreva sua necessidade com um pouco mais de detalhe.");
    setBusy(true);
    const { error } = await supabase.from("service_requests").insert({
      requester_id: user!.id, professional_id: professionalId ?? null, category: f.category, need: f.need.trim(),
      budget_text: f.budget.trim() || null, deadline: f.deadline.trim() || null, city: f.city.trim() || null, remote: f.remote,
    });
    setBusy(false);
    if (error) return toast.error(error.message.includes("rate_limited") ? "Limite de 5 solicitações por dia atingido." : "Não foi possível enviar.");
    toast.success("Solicitação enviada. Nossa equipe vai encaminhar a profissionais compatíveis.");
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="h-10 w-full rounded-md border bg-background px-2 text-sm" aria-label="Categoria">
        {Object.entries(SPECIALIST_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <Textarea value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })} maxLength={3000} className="min-h-28" placeholder="O que você precisa? Ex.: automatizar o atendimento do meu WhatsApp." aria-label="Necessidade" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} maxLength={120} placeholder="Orçamento aproximado (opcional)" aria-label="Orçamento" />
        <Input value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} maxLength={120} placeholder="Prazo (ex.: 30 dias)" aria-label="Prazo" />
        <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={80} placeholder="Cidade/UF (opcional)" aria-label="Cidade" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} />Pode ser remoto</label>
      </div>
      <p className="text-xs text-muted-foreground">O Outro Ângulo não intermedia pagamentos nem contratos e não garante resultados. Combine os detalhes diretamente com o profissional.</p>
      <Button type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar solicitação"}</Button>
    </form>
  );
}
