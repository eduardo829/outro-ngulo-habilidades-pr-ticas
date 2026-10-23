export type Row = { label: string; value: number };
export type AdminReport = {
  from: string; to: string; generatedAt: string;
  sales: { paidCount: number; revenueCents: number; byCourse: Row[]; byOrigin: Row[]; failedCount: number; failedReasons: Row[]; pendingCount: number };
  accounts: { total: number; newCount: number; newConfirmed: number; signedInInPeriod: number };
  learning: { activeEnrollments: number; newEnrollments: number; neverAccessed: number; inactive14d: number; interest: Row[] };
  ai: { requests: number; estCostCents: number; byFeature: Row[] };
  analysis: string[] | null;
};

export const brlCents = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const brDate = (d: string) => d.split("-").reverse().join("/");

/** Flattens the report into labeled sections shared by the page and the e-mail. */
export function reportSections(r: AdminReport): { title: string; lines: Row[]; money?: boolean; fmt?: (v: number) => string }[] {
  return [
    { title: "Vendas", lines: [
      { label: "Compras pagas", value: r.sales.paidCount },
      { label: "Pagamentos recusados ou cancelados", value: r.sales.failedCount },
      { label: "Pagamentos pendentes", value: r.sales.pendingCount },
    ] },
    { title: "Receita", lines: [{ label: "Total recebido", value: r.sales.revenueCents }], fmt: brlCents },
    { title: "Vendas por curso", lines: r.sales.byCourse },
    { title: "Vendas por origem da campanha", lines: r.sales.byOrigin },
    { title: "Motivos de recusa", lines: r.sales.failedReasons },
    { title: "Contas", lines: [
      { label: "Novos cadastros", value: r.accounts.newCount },
      { label: "Novos com e-mail confirmado", value: r.accounts.newConfirmed },
      { label: "Entraram no período", value: r.accounts.signedInInPeriod },
      { label: "Total de contas", value: r.accounts.total },
    ] },
    { title: "Alunos", lines: [
      { label: "Matrículas ativas", value: r.learning.activeEnrollments },
      { label: "Novas matrículas no período", value: r.learning.newEnrollments },
    ] },
    { title: "Interesse em cursos futuros", lines: r.learning.interest },
    { title: "Uso da IA", lines: [{ label: "Pedidos à IA", value: r.ai.requests }, ...r.ai.byFeature] },
    { title: "Custo estimado da IA", lines: [{ label: "Estimativa", value: r.ai.estCostCents }], fmt: brlCents },
  ];
}
