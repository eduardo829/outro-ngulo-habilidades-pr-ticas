import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateReport, emailMyReport } from "@/lib/reports.functions";
import { brDate, reportSections, type AdminReport } from "@/lib/report-types";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Administração Outro Ângulo" }, { name: "robots", content: "noindex" }] }),
  component: Reports,
});

const iso = (d: Date) => new Date(d.getTime() - 3 * 3600000).toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));

function Reports() {
  const gen = useServerFn(generateReport);
  const send = useServerFn(emailMyReport);
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [withAnalysis, setWithAnalysis] = useState(true);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [busy, setBusy] = useState<"gen" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preset = (n: number) => { setFrom(daysAgo(n - 1)); setTo(daysAgo(0)); };
  const run = async () => {
    setBusy("gen"); setError(null);
    try { setReport(await gen({ data: { from, to, withAnalysis } })); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível gerar o relatório."); }
    finally { setBusy(null); }
  };
  const mail = async () => {
    setBusy("send");
    try {
      const r = await send({ data: { from, to, withAnalysis } });
      if (r.sent) toast.success(`Relatório enviado para ${r.email}.`);
      else toast.error("Seu e-mail está bloqueado para envios automáticos (descadastro ou devolução anterior).");
    } catch { toast.error("Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos."); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">01 / RELATÓRIOS</p>
        <h2 className="mt-1 text-xl font-bold">Relatório da plataforma</h2>
        <p className="mt-1 text-sm text-muted-foreground">Vendas, cadastros, alunos e uso da IA no período escolhido. O envio vai só para o seu e-mail.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-y py-4">
        <div className="flex gap-1">
          {[1, 7, 30].map((n) => <Button key={n} variant="outline" size="sm" onClick={() => preset(n)}>{n === 1 ? "Hoje" : `${n} dias`}</Button>)}
        </div>
        <label className="text-sm">De<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded-sm border bg-background px-2 py-1" /></label>
        <label className="text-sm">Até<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded-sm border bg-background px-2 py-1" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withAnalysis} onChange={(e) => setWithAnalysis(e.target.checked)} />Incluir leitura escrita pela IA</label>
        <div className="flex gap-2 sm:ml-auto">
          <Button onClick={run} disabled={!!busy}>{busy === "gen" ? "Gerando…" : "Gerar relatório"}</Button>
          <Button variant="outline" onClick={mail} disabled={!!busy}>{busy === "send" ? "Enviando…" : "Enviar para meu e-mail"}</Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!report && !error && <p className="text-sm text-muted-foreground">Escolha o período e clique em "Gerar relatório".</p>}

      {report && (
        <div className="space-y-6">
          <h3 className="font-bold">{brDate(report.from)} – {brDate(report.to)}</h3>
          {report.analysis && (
            <div className="border-l-2 border-accent pl-4">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground">LEITURA DO PERÍODO</p>
              <ul className="mt-2 space-y-1 text-sm">{report.analysis.map((p, i) => <li key={i}>{p}</li>)}</ul>
              <p className="mt-2 text-xs text-muted-foreground">Texto gerado por IA a partir dos números abaixo. Confira antes de decidir.</p>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {reportSections(report).map((s) => (
              <section key={s.title}>
                <p className="border-b pb-1 text-xs font-semibold tracking-widest text-muted-foreground">{s.title.toUpperCase()}</p>
                {s.lines.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nada no período.</p> : (
                  <dl className="mt-2 space-y-1 text-sm">
                    {s.lines.map((l) => <div key={l.label} className="flex justify-between gap-4"><dt>{l.label}</dt><dd className="font-semibold tabular-nums">{s.fmt ? s.fmt(l.value) : l.value}</dd></div>)}
                  </dl>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
