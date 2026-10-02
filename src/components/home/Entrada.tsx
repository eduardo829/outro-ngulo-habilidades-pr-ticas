import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/Angle";
import { cn } from "@/lib/utils";

type Tool = "validador" | "viabilidade" | "plano";
type Obj = { l: string; trilha: string; tool?: { t: Tool; n: string }; pergunta: string; gestor?: string; op: string };

const OBJ: Obj[] = [
  { l: "Quero começar um negócio", trilha: "Começar a empreender", tool: { t: "validador", n: "Validador de ideias" }, pergunta: "Quanto dinheiro eu realmente preciso para começar?", gestor: "eduardo-araujo", op: "Pessoas procurando sócios e parceiros" },
  { l: "Quero crescer profissionalmente", trilha: "Avançar na carreira", pergunta: "Como mostrar o que eu sei fazer sem parecer arrogante?", op: "Trabalhos e colaborações" },
  { l: "Quero conhecer pessoas", trilha: "Construir meu network", pergunta: "Como puxar conversa com alguém que admiro?", op: "Pessoas procurando colaboração" },
  { l: "Quero aprender a vender", trilha: "Aprender a vender", tool: { t: "viabilidade", n: "Calculadora de viabilidade" }, pergunta: "Como cobrar mais sem perder o cliente?", gestor: "eduardo-araujo", op: "Projetos procurando quem venda" },
  { l: "Quero organizar melhor meu dinheiro", trilha: "Entender melhor meu dinheiro", tool: { t: "viabilidade", n: "Calculadora de viabilidade" }, pergunta: "Por onde começar a organizar as contas do mês?", op: "Parcerias e projetos" },
  { l: "Quero usar IA no meu trabalho", trilha: "Usar IA no dia a dia", pergunta: "Que tarefa do meu trabalho a IA já resolve hoje?", gestor: "eduardo-araujo", op: "Projetos de tecnologia" },
  { l: "Estou procurando oportunidades", trilha: "Conseguir meus primeiros clientes", tool: { t: "plano", n: "Plano de validação" }, pergunta: "Onde aparecem as oportunidades que não viram vaga?", op: "Projetos, parcerias e trabalhos" },
];

export function Entrada() {
  const [a, setA] = useState<number | null>(null);
  const o = a === null ? null : OBJ[a]!;
  const row = "grid gap-1 border-t py-4 sm:grid-cols-[9rem_1fr] sm:items-baseline";
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel n="00">Comece aqui</SectionLabel>
        <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">O que trouxe você até aqui?</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {OBJ.map((x, i) => (
            <button key={x.l} type="button" aria-pressed={a === i} onClick={() => setA(i)}
              className={cn("border px-4 py-2.5 text-sm font-medium transition-all duration-200", a === i ? "border-foreground bg-foreground text-background" : "hover:-translate-y-0.5 hover:border-foreground")}>{x.l}</button>
          ))}
        </div>
        {o && (
          <div key={a} className="reveal is-visible mt-10 max-w-3xl" aria-live="polite">
            <p className="eyebrow">Por onde começar</p>
            <div className="mt-3 border-b">
              <div className={row}><span className="eyebrow">Trilha</span><Link to="/trilhas" className="link-arrow inline-flex items-center gap-1 font-display text-xl font-bold">{o.trilha}<ArrowRight className="h-4 w-4" /></Link></div>
              {o.tool && <div className={row}><span className="eyebrow">Ferramenta</span><Link to="/ferramentas" search={{ t: o.tool.t }} className="link-arrow inline-flex items-center gap-1 font-display text-xl font-bold">{o.tool.n}<ArrowRight className="h-4 w-4" /></Link></div>}
              <div className={row}><span className="eyebrow">Pergunta</span><Link to="/conheca-a-comunidade" className="link-arrow inline-flex items-center gap-1 font-display text-xl font-bold">“{o.pergunta}”<ArrowRight className="h-4 w-4 shrink-0" /></Link></div>
              {o.gestor && <div className={row}><span className="eyebrow">Gestor</span><Link to="/gestor/$slug" params={{ slug: o.gestor }} className="link-arrow inline-flex items-center gap-1 font-display text-xl font-bold">Eduardo Araújo<ArrowRight className="h-4 w-4" /></Link></div>}
              <div className={row}><span className="eyebrow">Oportunidades</span><Link to="/oportunidades" className="link-arrow inline-flex items-center gap-1 font-display text-xl font-bold">{o.op}<ArrowRight className="h-4 w-4" /></Link></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">A pergunta é uma sugestão para levar à comunidade, não uma conversa existente.</p>
          </div>
        )}
      </div>
    </section>
  );
}
