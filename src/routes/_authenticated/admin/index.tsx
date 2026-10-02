import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Administração — Outro Ângulo" }] }),
  component: Overview,
});

const DEFS: [string, string, string][] = [
  ["enrolled_students", "Alunos matriculados", "Pessoas com ao menos uma matrícula ativa."],
  ["active_enrollments", "Matrículas ativas", "Total de pares aluno–curso com matrícula ativa."],
  ["started_students", "Alunos que iniciaram", "Alunos matriculados que concluíram ao menos uma aula."],
  ["lessons_completed", "Aulas concluídas", "Total de marcações “concluída” registradas."],
  ["courses_completed", "Cursos concluídos", "Matrículas ativas com todas as aulas publicadas concluídas."],
  ["accounts", "Contas criadas", "Todas as contas, com ou sem matrícula."],
  ["waitlist", "Lista de interesse", "Inscrições na lista de interesse."],
];

function Overview() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics");
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (error) return <p className="text-destructive">Não foi possível carregar as métricas.</p>;
  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">Todos os números vêm dos dados reais da plataforma.</p>
      <dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {DEFS.map(([k, label, def]) => (
          <div key={k} className="bg-card p-5">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{data?.[k] ?? 0}</dd>
            <p className="mt-2 text-xs text-muted-foreground">{def}</p>
          </div>
        ))}
      </dl>
    </>
  );
}
