import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { outroAngulo, type AngleResult } from "@/lib/outro-angulo.functions";

/** "Me dê outro ângulo": mostra perspectivas e perguntas, nunca decide pela pessoa. */
export function OutroAngulo({ initial = "" }: { initial?: string }) {
  const run = useServerFn(outroAngulo);
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<AngleResult | null>(null);
  async function go() {
    setBusy(true); setR(null);
    try { setR(await run({ data: { situation: text } })); } catch { setR({ ok: false, error: "Não foi possível gerar os ângulos agora." }); }
    setBusy(false);
  }
  return (
    <div>
      <label htmlFor="oa" className="text-sm font-semibold">Que decisão você está pensando em tomar?</label>
      <Textarea id="oa" className="mt-2" rows={3} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Estou pensando em pedir demissão para mudar de carreira." />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={go} disabled={busy || text.trim().length < 10}>{busy ? "Pensando…" : "Me dê outro ângulo"}</Button>
        <p className="text-xs text-muted-foreground">Não decidimos por você. Mostramos caminhos e perguntas. O texto não fica salvo.</p>
      </div>
      {r && !r.ok && <p role="alert" className="mt-4 text-sm text-destructive">{r.error}</p>}
      {r?.ok && (
        <div className="mt-8" aria-live="polite">
          <div className="grid gap-px border bg-border md:grid-cols-3">
            {r.angles.map((a, i) => (
              <div key={i} className="bg-background p-5">
                <p className="font-display text-4xl font-extrabold text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</p>
                <p className="eyebrow mt-2">Ângulo {String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-display text-lg font-extrabold">{a.title}</p>
                <ul className="mt-3 space-y-2 text-sm">{a.questions.map((q, j) => <li key={j} className="border-l-2 border-highlight pl-3">{q}</li>)}</ul>
              </div>
            ))}
          </div>
          {!!r.discover.length && (
            <div className="mt-6 border-y py-5">
              <p className="eyebrow">O que você precisa descobrir antes de decidir?</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{r.discover.map((q, i) => <li key={i}>{q}</li>)}</ol>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Gerado por IA a partir do que você escreveu. A decisão é sua.</p>
        </div>
      )}
    </div>
  );
}
