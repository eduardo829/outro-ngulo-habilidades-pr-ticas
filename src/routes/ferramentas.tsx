import closePhoto from "@/assets/photo-close-ferramentas.jpg";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PublicLayout } from "@/components/PublicLayout";
import { Opening, Closing } from "@/components/public/Story";
import { CalculadoraViabilidade, PlanoValidacao, ValidadorIdeias } from "@/components/tools/Tools";
import { cn } from "@/lib/utils";

const T = "Ferramentas — Outro Ângulo";
const D = "Conhecimento que você pode usar: validador de ideias, calculadora de viabilidade e plano de validação em 7 dias.";
const TOOLS = [
  { id: "validador", n: "01", t: "Validador de ideias", d: "10 perguntas sobre sua ideia. No fim, uma análise inicial com riscos, premissas e próximo passo.", C: ValidadorIdeias },
  { id: "viabilidade", n: "02", t: "Calculadora de viabilidade", d: "Mexa nos números e veja quantas vendas precisa para empatar e para chegar na sua meta.", C: CalculadoraViabilidade },
  { id: "plano", n: "03", t: "Plano de validação", d: "Um teste de 7 dias para decidir se vale validar, ajustar ou abandonar.", C: PlanoValidacao },
] as const;

export const Route = createFileRoute("/ferramentas")({
  validateSearch: z.object({ t: z.enum(["validador", "viabilidade", "plano"]).optional() }),
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const { t = "validador" } = Route.useSearch();
  const nav = Route.useNavigate();
  const tool = TOOLS.find((x) => x.id === t)!;
  return (
    <PublicLayout>
      <Opening label="Ferramentas" a="Conhecimento" b="que você pode usar." intro="Ferramentas simples para pensar antes de gastar tempo e dinheiro. Funcionam aqui, sem cadastro." />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div role="tablist" className="grid gap-px border bg-border md:grid-cols-3">
          {TOOLS.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === t} onClick={() => nav({ search: { t: x.id }, replace: true, resetScroll: false })}
              className={cn("bg-background p-5 text-left transition-colors", x.id === t ? "bg-ink text-ink-foreground" : "hover:bg-card")}>
              <p className={cn("eyebrow", x.id === t && "!text-highlight")}>{x.n} / Ferramenta</p>
              <p className="mt-2 font-display text-xl font-extrabold">{x.t}</p>
              <p className={cn("mt-1 text-sm", x.id === t ? "text-ink-foreground/70" : "text-muted-foreground")}>{x.d}</p>
            </button>
          ))}
        </div>
        <div key={t} role="tabpanel" className="reveal is-visible border-x border-b p-6 md:p-10"><tool.C /></div>
      </section>
      <Closing photo={closePhoto} a="Use, discuta," b="ajuste com outras pessoas." />
    </PublicLayout>
  );
}
