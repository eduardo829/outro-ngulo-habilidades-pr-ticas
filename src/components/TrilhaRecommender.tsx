import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2 } from "lucide-react";
import { SectionLabel } from "@/components/Angle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { recommendTrilha, type Recommendation } from "@/lib/recommend.functions";

export function TrilhaRecommender({ n }: { n: string }) {
  const run = useServerFn(recommendTrilha);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Recommendation | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (goal.trim().length < 10 || loading) return;
    setLoading(true);
    setRes(null);
    try {
      setRes(await run({ data: { goal } }));
    } catch {
      setRes({ ok: false, error: "Não foi possível gerar a recomendação agora." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <form onSubmit={submit} className="space-y-4">
          <SectionLabel n={n}>Por onde começar</SectionLabel>
          <h2 className="text-2xl font-extrabold md:text-3xl">Conte o que você quer aprender.</h2>
          <Label htmlFor="goal" className="text-muted-foreground">Descreva seu objetivo com suas palavras. Sugerimos uma trilha e uma primeira ação para hoje.</Label>
          <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={1000} rows={5}
            placeholder="Ex.: quero sair do meu emprego para trabalhar como freelancer, mas não sei como achar clientes." />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Sugestão gerada por IA. Seu texto não é salvo.</span>
            <Button type="submit" disabled={loading || goal.trim().length < 10}>
              {loading ? <><Loader2 className="animate-spin" />Pensando…</> : <>Recomendar<ArrowRight /></>}
            </Button>
          </div>
        </form>
        <div aria-live="polite" className="frame-offset rounded-md border bg-card p-6">
          {!res && !loading && <p className="text-sm text-muted-foreground">A recomendação aparece aqui.</p>}
          {loading && <p className="text-sm text-muted-foreground">Lendo seu objetivo…</p>}
          {res && !res.ok && <p role="alert" className="text-sm text-destructive">{res.error}</p>}
          {res?.ok && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow text-muted-foreground">Trilha sugerida</p>
                <h3 className="mt-2 text-xl font-bold">{res.trilha}</h3>
                {res.motivo && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{res.motivo}</p>}
              </div>
              <div className="border-t pt-5">
                <p className="eyebrow text-muted-foreground">Primeira ação</p>
                <p className="mt-2 leading-relaxed">{res.acao}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
