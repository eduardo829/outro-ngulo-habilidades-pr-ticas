import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionLabel } from "@/components/Angle";
import { cn } from "@/lib/utils";

type Tool = "validador" | "viabilidade" | "plano";
/** curso: engine slug (opens course page) or planned title (opens catalog). */
type Rec = { trilha: string; curso?: { slug?: string; n: string }; tool?: { t: Tool; n: string }; pergunta: string; gestor?: { slug: string; n: string }; op: string };
type Obj = Rec & { l: string };

const R = {
  crescer: { trilha: "Avançar na carreira", curso: { n: "Construa uma carreira, não apenas um emprego" }, pergunta: "Que habilidade realmente fez diferença na sua carreira?", op: "Projetos, colaborações e mentorias" },
  mudar: { trilha: "Avançar na carreira", curso: { n: "Quero mudar de carreira. E agora?" }, pergunta: "Vale a pena aceitar menos para entrar em uma área nova?", op: "Projetos e estágios para experimentar uma área" },
  comecando: { trilha: "Avançar na carreira", curso: { n: "Chegue forte ao mercado de trabalho" }, pergunta: "Como mostrar o que eu sei fazer quando ainda tenho pouca experiência?", op: "Estágios, empregos e projetos" },
  ganhar: { trilha: "Entender melhor meu dinheiro", curso: { n: "Dinheiro sem complicação" }, pergunta: "Como pedir aumento?", op: "Freelance e projetos" },
  habilidades: { trilha: "Usar IA no dia a dia", curso: { slug: "ia-no-trabalho", n: "IA no trabalho: do prompt ao processo" }, pergunta: "Como usar IA sem depender dela para pensar?", op: "Colaborações para praticar" },
  pessoas: { trilha: "Construir meu network", curso: { slug: "networking-do-zero", n: "Networking do zero" }, pergunta: "Como começar networking quando você não conhece ninguém?", op: "Eventos e colaborações" },
  organizar: { trilha: "Organizar meus próximos passos", curso: { n: "O próximo passo" }, pergunta: "Como escolher uma prioridade quando tudo parece urgente?", op: "Colaborações e mentorias" },
  profissao: { trilha: "Avançar na carreira", curso: { slug: "corretor-do-zero", n: "Corretor do zero" }, gestor: { slug: "vinicius-silva", n: "Vinicius Silva" }, pergunta: "Como saber se uma profissão nova combina comigo antes de mudar?", op: "Mentorias e projetos na área" },
  negocio: { trilha: "Começar a empreender", curso: { slug: "da-ideia-aos-primeiros-clientes", n: "Da ideia aos primeiros clientes" }, tool: { t: "validador", n: "Validador de ideias" }, gestor: { slug: "eduardo-araujo", n: "Eduardo Araújo" }, pergunta: "Quanto dinheiro eu realmente preciso para começar?", op: "Sócios, parcerias e negócios" },
  comunicar: { trilha: "Comunicar melhor", curso: { n: "Comunicação profissional" }, pergunta: "Como discordar de alguém no trabalho sem criar conflito?", op: "Colaborações e projetos" },
} satisfies Record<string, Rec>;

const OBJ: Obj[] = [
  { l: "Quero crescer na minha carreira", ...R.crescer },
  { l: "Quero mudar de carreira", ...R.mudar },
  { l: "Estou começando minha vida profissional", ...R.comecando },
  { l: "Quero ganhar melhor", ...R.ganhar },
  { l: "Quero aprender habilidades novas", ...R.habilidades },
  { l: "Quero conhecer pessoas", ...R.pessoas },
  { l: "Quero me organizar melhor", ...R.organizar },
  { l: "Quero entrar em uma nova profissão", ...R.profissao },
  { l: "Quero começar um negócio", ...R.negocio },
];

const FEEL = ["Estou bem, mas quero evoluir", "Estou parado", "Estou perdido", "Quero ganhar mais", "Não gosto do que faço", "Quero experimentar outra área", "Estou começando"];
const FOCUS: { l: string; r: Rec }[] = [
  { l: "Dinheiro", r: R.ganhar }, { l: "Carreira", r: R.crescer }, { l: "Habilidades", r: R.habilidades }, { l: "Pessoas", r: R.pessoas },
  { l: "Direção", r: R.organizar }, { l: "Tecnologia", r: R.habilidades }, { l: "Comunicação", r: R.comunicar }, { l: "Organização", r: R.organizar },
];
/** Rule-based orientation: feeling can override the focus when it points somewhere clearer. */
function orient(feel: string, focus: Rec): Rec {
  if (feel === "Estou começando" && focus === R.crescer) return R.comecando;
  if ((feel === "Não gosto do que faço" || feel === "Quero experimentar outra área") && (focus === R.crescer || focus === R.organizar)) return R.mudar;
  return focus;
}

const btn = (on: boolean) => cn("border px-4 py-2.5 text-sm font-medium transition-all duration-200", on ? "border-foreground bg-foreground text-background" : "bg-background/70 hover:-translate-y-0.5 hover:border-foreground");

function Result({ o, note }: { o: Rec; note?: string }) {
  const row = "grid gap-1 border-t py-4 sm:grid-cols-[9rem_1fr] sm:items-baseline";
  const lk = "link-arrow inline-flex items-center gap-1 font-display text-xl font-bold";
  return (
    <div className="reveal is-visible mt-10 max-w-3xl" aria-live="polite">
      <p className="eyebrow">Um começo possível</p>
      <div className="mt-3 border-b">
        {o.curso && <div className={row}><span className="eyebrow">Curso</span>{o.curso.slug
          ? <Link to="/cursos/$slug" params={{ slug: o.curso.slug }} className={lk}>{o.curso.n}<ArrowRight className="h-4 w-4" /></Link>
          : <Link to="/cursos" className={lk}>{o.curso.n} <span className="text-sm font-normal text-muted-foreground">(em preparação)</span><ArrowRight className="h-4 w-4" /></Link>}</div>}
        <div className={row}><span className="eyebrow">Trilha</span><Link to="/trilhas" className={lk}>{o.trilha}<ArrowRight className="h-4 w-4" /></Link></div>
        {o.tool && <div className={row}><span className="eyebrow">Ferramenta</span><Link to="/ferramentas" search={{ t: o.tool.t }} className={lk}>{o.tool.n}<ArrowRight className="h-4 w-4" /></Link></div>}
        <div className={row}><span className="eyebrow">Pergunta</span><Link to="/conheca-a-comunidade" className={lk}>“{o.pergunta}”<ArrowRight className="h-4 w-4 shrink-0" /></Link></div>
        {o.gestor && <div className={row}><span className="eyebrow">Gestor</span><Link to="/gestor/$slug" params={{ slug: o.gestor.slug }} className={lk}>{o.gestor.n}<ArrowRight className="h-4 w-4" /></Link></div>}
        <div className={row}><span className="eyebrow">Oportunidades</span><Link to="/oportunidades" className={lk}>{o.op}<ArrowRight className="h-4 w-4" /></Link></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{note ?? "A pergunta é uma sugestão para levar à comunidade, não uma conversa existente."}</p>
    </div>
  );
}

export function Entrada() {
  const [a, setA] = useState<number | "nao-sei" | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel n="00">Comece aqui</SectionLabel>
        <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">O que você quer mudar agora?</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {OBJ.map((x, i) => <button key={x.l} type="button" aria-pressed={a === i} onClick={() => setA(i)} className={btn(a === i)}>{x.l}</button>)}
          <button type="button" aria-pressed={a === "nao-sei"} onClick={() => { setA("nao-sei"); setFeel(null); setFocus(null); }} className={cn(btn(a === "nao-sei"), a !== "nao-sei" && "border-dashed")}>Ainda não sei. Quero descobrir.</button>
        </div>

        {typeof a === "number" && <Result key={a} o={OBJ[a]!} />}

        {a === "nao-sei" && (
          <div className="reveal is-visible mt-10 max-w-3xl card-live p-6 md:p-8">
            <p className="font-display text-2xl font-extrabold">Você não precisa ter tudo decidido para começar.</p>
            <p className="mt-2 text-sm text-muted-foreground">Duas perguntas rápidas. É uma orientação para dar o primeiro passo, não um teste de perfil.</p>
            <p className="eyebrow mt-6">1. Como você se sente profissionalmente hoje?</p>
            <div className="mt-3 flex flex-wrap gap-2">{FEEL.map((f) => <button key={f} type="button" aria-pressed={feel === f} onClick={() => setFeel(f)} className={btn(feel === f)}>{f}</button>)}</div>
            {feel && <>
              <p className="eyebrow mt-6">2. O que parece mais importante agora?</p>
              <div className="mt-3 flex flex-wrap gap-2">{FOCUS.map((f, i) => <button key={f.l} type="button" aria-pressed={focus === i} onClick={() => setFocus(i)} className={btn(focus === i)}>{f.l}</button>)}</div>
            </>}
            {feel && focus !== null && <>
              <Result key={`${feel}-${focus}`} o={orient(feel, FOCUS[focus]!.r)} note="Sugestão baseada nas suas duas respostas. Nada do que você escolheu é salvo." />
              <button type="button" onClick={() => { setFeel(null); setFocus(null); }} className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"><RotateCcw className="h-3.5 w-3.5" />Responder de novo</button>
            </>}
          </div>
        )}
      </div>
    </section>
  );
}
