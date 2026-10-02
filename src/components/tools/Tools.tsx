import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const brl = (n: number) => (isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—");
const int = (n: number) => (isFinite(n) && n >= 0 ? Math.ceil(n).toLocaleString("pt-BR") : "—");

function Choice<T extends string>({ value, options, onChange }: { value: T | ""; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
          className={cn("border px-3 py-2 text-sm transition-colors", value === o.v ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{o.l}</button>
      ))}
    </div>
  );
}

function Disclaimer() {
  return <p className="text-xs text-muted-foreground">Análise inicial baseada nas informações fornecidas. Não é previsão nem garantia. Nada é salvo.</p>;
}

/* ---------------- 01 Validador de ideias ---------------- */
type Lvl = "baixa" | "media" | "alta";
const LV: Record<Lvl, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

type VQ = { k: string; q: string; type: "text" | "choice"; opts?: { v: string; l: string }[]; ph?: string };
const VQS: VQ[] = [
  { k: "ideia", q: "Qual é a ideia?", type: "text", ph: "Ex.: limpeza de estofados a domicílio" },
  { k: "tipo", q: "Produto ou serviço?", type: "choice", opts: [{ v: "servico", l: "Serviço" }, { v: "produto", l: "Produto físico" }, { v: "digital", l: "Produto digital" }] },
  { k: "quem", q: "Quem compra?", type: "text", ph: "Ex.: famílias com sofá e criança pequena" },
  { k: "problema", q: "Qual problema resolve?", type: "choice", opts: [{ v: "urgente", l: "Urgente, a pessoa já procura solução" }, { v: "incomodo", l: "Incomoda, mas dá para adiar" }, { v: "desejo", l: "É mais um desejo do que um problema" }] },
  { k: "margem", q: "Quanto sobra de cada venda depois do custo direto?", type: "choice", opts: [{ v: "alta", l: "Mais da metade" }, { v: "media", l: "Entre 20% e 50%" }, { v: "baixa", l: "Menos de 20%" }, { v: "nsei", l: "Não sei ainda" }] },
  { k: "capital", q: "Quanto precisa investir para começar?", type: "choice", opts: [{ v: "baixa", l: "Até R$ 2 mil" }, { v: "media", l: "R$ 2 mil a R$ 20 mil" }, { v: "alta", l: "Mais de R$ 20 mil" }] },
  { k: "canal", q: "Como pretende conseguir clientes?", type: "choice", opts: [{ v: "rede", l: "Minha rede e indicações" }, { v: "online", l: "Redes sociais / anúncios" }, { v: "parceria", l: "Parcerias com quem já tem clientes" }, { v: "nsei", l: "Ainda não sei" }] },
  { k: "conc", q: "Já existem concorrentes?", type: "choice", opts: [{ v: "muitos", l: "Muitos, parecidos" }, { v: "alguns", l: "Alguns, e sei no que sou diferente" }, { v: "nenhum", l: "Não encontrei nenhum" }] },
  { k: "vendeu", q: "Já tentou vender?", type: "choice", opts: [{ v: "sim", l: "Sim, alguém pagou" }, { v: "tentou", l: "Ofereci, ninguém pagou ainda" }, { v: "nao", l: "Ainda não" }] },
  { k: "tempo", q: "Quanto tempo consegue dedicar por semana?", type: "choice", opts: [{ v: "pouco", l: "Até 5 horas" }, { v: "medio", l: "5 a 20 horas" }, { v: "muito", l: "Mais de 20 horas" }] },
];

type VA = Partial<Record<"ideia" | "tipo" | "quem" | "problema" | "margem" | "capital" | "canal" | "conc" | "vendeu" | "tempo", string>>;
function analyze(a: VA) {
  const demanda: Lvl = a.vendeu === "sim" || a.problema === "urgente" ? "alta" : a.problema === "desejo" && a.vendeu !== "sim" ? "baixa" : "media";
  const margem: Lvl = a.margem === "alta" ? "alta" : a.margem === "baixa" ? "baixa" : "media";
  const complex: Lvl = a.tipo === "produto" ? "alta" : a.tipo === "digital" ? "media" : "baixa";
  const capital = (a.capital || "media") as Lvl;
  const velocidade: Lvl = a.tipo === "servico" && capital !== "alta" ? "alta" : a.tipo === "produto" || capital === "alta" ? "baixa" : "media";
  const distrib: Lvl = a.canal === "rede" || a.canal === "parceria" ? "alta" : a.canal === "nsei" ? "baixa" : "media";
  const difer: Lvl = a.conc === "alguns" ? "alta" : a.conc === "muitos" ? "baixa" : "media";
  const riscos: string[] = [];
  if (a.conc === "nenhum") riscos.push("Não ter concorrentes às vezes significa que ninguém paga por isso.");
  if (a.margem === "nsei") riscos.push("Sem saber a margem, você pode vender muito e não sobrar nada.");
  if (a.margem === "baixa") riscos.push("Margem baixa exige volume alto para valer a pena.");
  if (a.canal === "nsei") riscos.push("Sem um caminho claro até o cliente, a ideia fica parada.");
  if (capital === "alta" && a.vendeu !== "sim") riscos.push("Investir alto antes da primeira venda aumenta muito a perda possível.");
  if (a.tempo === "pouco") riscos.push("Com pouco tempo, os testes demoram. Escolha um teste bem pequeno.");
  if (a.problema === "desejo") riscos.push("Desejos são adiados com facilidade; o cliente pode dizer que gosta e não comprar.");
  const premissas = [
    `${a.quem || "Esse público"} tem esse problema com frequência suficiente para pagar por uma solução.`,
    a.margem === "nsei" || a.margem === "baixa" ? "O preço cobre o custo direto e ainda sobra margem para você." : "As pessoas aceitam pagar o preço que você imagina.",
    a.canal === "nsei" ? "Existe um canal acessível para chegar a esses clientes." : "O canal escolhido traz clientes a um custo que cabe na margem.",
  ];
  const next = a.vendeu === "sim" ? "Repita a venda com 3 clientes novos e anote de onde cada um veio." : a.vendeu === "tentou" ? "Converse com quem não comprou e pergunte o que faltou. Ajuste a oferta antes de investir." : "Ofereça para 5 pessoas do público certo antes de investir. Uma pré-venda vale mais do que dez elogios.";
  return { rows: [["Demanda", demanda], ["Margem potencial", margem], ["Complexidade", complex], ["Capital necessário", capital], ["Velocidade até receita", velocidade], ["Distribuição", distrib], ["Diferenciação", difer]] as [string, Lvl][], riscos, premissas, next };
}

export function ValidadorIdeias() {
  const [i, setI] = useState(0);
  const [a, setA] = useState<VA>({});
  const done = i >= VQS.length;
  const q = VQS[Math.min(i, VQS.length - 1)]!;
  const r = useMemo(() => (done ? analyze(a) : null), [done, a]);
  const val = a[q.k as keyof VA] ?? "";
  const set = (v: string) => setA((p) => ({ ...p, [q.k]: v }));
  if (r) return (
    <div className="space-y-8">
      <Disclaimer />
      <p className="font-display text-2xl font-extrabold">“{a.ideia || "Sua ideia"}”</p>
      <dl className="grid gap-px border bg-border sm:grid-cols-2">
        {r.rows.map(([k, l]) => (
          <div key={k} className="flex items-center justify-between bg-background px-4 py-3"><dt className="text-sm">{k}</dt>
            <dd className="flex items-center gap-2 text-sm font-semibold">{LV[l]}<span className="flex gap-0.5">{(["baixa", "media", "alta"] as Lvl[]).map((x, j) => <span key={x} className={cn("h-2 w-4", j <= ["baixa", "media", "alta"].indexOf(l) ? "bg-primary" : "bg-border")} />)}</span></dd></div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">Em complexidade e capital, "alta" pesa contra a ideia; nos outros itens, a favor.</p>
      {r.riscos.length > 0 && <div><p className="eyebrow">Riscos</p><ul className="mt-3 space-y-2">{r.riscos.map((x) => <li key={x} className="border-l-2 border-destructive/60 pl-3">{x}</li>)}</ul></div>}
      <div><p className="eyebrow">3 premissas que você precisa validar</p><ol className="mt-3 space-y-2">{r.premissas.map((x, j) => <li key={x} className="flex gap-3"><span className="font-display font-bold">{j + 1}.</span>{x}</li>)}</ol></div>
      <div className="border-l-2 border-highlight bg-card p-5"><p className="eyebrow">Próximo passo recomendado</p><p className="mt-2 text-lg font-semibold">{r.next}</p></div>
      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => { setA({}); setI(0); }}><RotateCcw />Recomeçar</Button>
        <Link to="/trilhas" className="link-arrow inline-flex items-center gap-1 text-sm font-semibold">Trilha: Começar a empreender<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
  return (
    <div>
      <div className="flex gap-1" aria-hidden>{VQS.map((_, j) => <span key={j} className={cn("h-0.5 flex-1", j <= i ? "bg-foreground" : "bg-border")} />)}</div>
      <p className="eyebrow mt-6">{String(i + 1).padStart(2, "0")} / {VQS.length}</p>
      <label htmlFor="vq" className="mt-2 block font-display text-2xl font-extrabold">{q.q}</label>
      <div className="mt-5">
        {q.type === "text" ? <input id="vq" value={val} onChange={(e) => set(e.target.value.slice(0, 160))} placeholder={q.ph} className="w-full border-b-2 bg-transparent py-2 text-lg outline-none focus:border-foreground" onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) setI(i + 1); }} />
          : <Choice value={val} options={q.opts!} onChange={(v) => { set(v); setTimeout(() => setI((n) => n + 1), 180); }} />}
      </div>
      <div className="mt-8 flex gap-3">
        {i > 0 && <Button variant="ghost" onClick={() => setI(i - 1)}>Voltar</Button>}
        {q.type === "text" && <Button disabled={!val.trim()} onClick={() => setI(i + 1)}>Continuar<ArrowRight /></Button>}
      </div>
    </div>
  );
}

/* ---------------- 02 Calculadora de viabilidade ---------------- */
function Num({ label, value, set, max, step }: { label: string; value: number; set: (n: number) => void; max: number; step: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3"><label className="text-sm">{label}</label>
        <input type="number" min={0} value={value} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))} className="w-28 border-b bg-transparent text-right font-semibold outline-none focus:border-foreground" aria-label={label} /></div>
      <input type="range" min={0} max={max} step={step} value={Math.min(value, max)} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-primary)]" aria-label={`${label} (controle deslizante)`} />
    </div>
  );
}

export type CalcValues = { inv: number; preco: number; custo: number; fixos: number; cac: number; meta: number };
export function CalculadoraViabilidade({ initial, onChange }: { initial?: Partial<CalcValues>; onChange?: (v: CalcValues & { contribuicao: number; breakEven: number | null; vendasMeta: number | null }) => void } = {}) {
  const [inv, setInv] = useState(initial?.inv ?? 5000), [preco, setPreco] = useState(initial?.preco ?? 200), [custo, setCusto] = useState(initial?.custo ?? 80), [fixos, setFixos] = useState(initial?.fixos ?? 1500), [cac, setCac] = useState(initial?.cac ?? 30), [meta, setMeta] = useState(initial?.meta ?? 3000);
  const bruta = preco - custo;
  const contrib = bruta - cac;
  const be = contrib > 0 ? fixos / contrib : Infinity;
  const vendasMeta = contrib > 0 ? (fixos + meta) / contrib : Infinity;
  const receita = vendasMeta * preco;
  const payback = contrib > 0 && meta > 0 ? inv / meta : Infinity;
  const pct = preco > 0 ? (contrib / preco) * 100 : 0;
  useEffect(() => { onChange?.({ inv, preco, custo, fixos, cac, meta, contribuicao: contrib, breakEven: isFinite(be) ? Math.ceil(be) : null, vendasMeta: isFinite(vendasMeta) ? Math.ceil(vendasMeta) : null }); }, [inv, preco, custo, fixos, cac, meta]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div className="space-y-6">
        <Num label="Investimento inicial" value={inv} set={setInv} max={100000} step={500} />
        <Num label="Preço de venda" value={preco} set={setPreco} max={5000} step={10} />
        <Num label="Custo por venda" value={custo} set={setCusto} max={5000} step={10} />
        <Num label="Custos fixos por mês" value={fixos} set={setFixos} max={30000} step={100} />
        <Num label="Custo para conseguir cada cliente (CAC)" value={cac} set={setCac} max={2000} step={5} />
        <Num label="Quanto quer tirar por mês" value={meta} set={setMeta} max={30000} step={100} />
      </div>
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Para onde vai cada venda de {brl(preco)}</p>
          <div className="mt-3 flex h-8 w-full overflow-hidden border" role="img" aria-label="Divisão do preço">
            {preco > 0 && <><span className="bg-muted-foreground/40" style={{ width: `${Math.min(100, (custo / preco) * 100)}%` }} /><span className="bg-primary/40" style={{ width: `${Math.min(100, (cac / preco) * 100)}%` }} /><span className="bg-highlight" style={{ width: `${Math.max(0, pct)}%` }} /></>}
          </div>
          <p className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>Custo</span><span>Aquisição</span><span>Sobra (contribuição)</span></p>
        </div>
        <dl className="divide-y border-y">
          {[["Margem bruta por venda", brl(bruta)], ["Margem de contribuição", `${brl(contrib)} (${pct.toFixed(0)}%)`], ["Vendas para empatar (break-even)", `${int(be)} / mês`], ["Vendas para sua meta", `${int(vendasMeta)} / mês`], ["Clientes novos necessários", `${int(vendasMeta)} / mês`], ["Receita necessária", `${brl(receita)} / mês`], ["Retorno do investimento", isFinite(payback) ? `~${payback.toFixed(1)} meses na meta` : "—"]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-sm"><dt>{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="border-l-2 border-highlight bg-card p-5 text-sm leading-relaxed">
          <p className="eyebrow">O que esses números significam?</p>
          {contrib <= 0 ? <p className="mt-2">Cada venda hoje <b>tira</b> dinheiro do seu bolso: custo e aquisição somam mais que o preço. Vender mais só aumenta o prejuízo. Antes de qualquer coisa, suba o preço ou reduza custos.</p>
            : <p className="mt-2">De cada venda sobram {brl(contrib)} para pagar os custos fixos e você. Precisa de {int(be)} vendas por mês só para não perder dinheiro, e {int(vendasMeta)} para tirar {brl(meta)}. Pergunte-se: consigo encontrar {int(vendasMeta)} clientes por mês com o canal que tenho? Considera clientes que compram uma vez por mês.</p>}
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}

/* ---------------- 03 Plano de validação ---------------- */
type PA = Partial<Record<"ideia" | "cliente" | "tipo" | "inv" | "aud" | "cli", string>>;
export function PlanoValidacao() {
  const [a, setA] = useState<PA>({});
  const s = (k: keyof PA) => (v: string) => setA((p) => ({ ...p, [k]: v }));
  const ready = a.ideia?.trim() && a.cliente?.trim() && a.tipo && a.aud && a.cli;
  const where = a.aud === "sim" ? "seu público atual (redes, lista, contatos)" : a.cli === "sim" ? "quem já é seu cliente e pode indicar alguém" : "grupos, comunidades e lugares onde esse cliente já está";
  const offer = a.tipo === "servico" ? "uma oferta simples: o que você faz, para quem, por quanto e quando" : "uma página ou mensagem descrevendo o produto, o preço e uma forma de reservar";
  const dias = [
    ["Definir hipótese", `Escreva em uma frase: "${a.cliente || "Esse cliente"} paga por ${a.ideia || "isso"} porque…". Defina o número que vai considerar sucesso (ex.: 3 de 10 pessoas aceitam).`],
    ["Criar oferta", `Monte ${offer}. Sem logo, sem site completo.`],
    ["Encontrar potenciais clientes", `Liste 15 pessoas em ${where}.`],
    ["Apresentar oferta", "Fale com pelo menos 10. Peça um compromisso real: pagamento, reserva ou agendamento. Elogio não conta."],
    ["Coletar objeções", "Anote palavra por palavra por que quem disse não, disse não."],
    ["Ajustar", "Mude uma coisa só (preço, público ou promessa) e ofereça de novo para quem ainda não ouviu."],
    ["Decidir", "Compare com o número que você definiu no dia 1."],
  ];
  if (!ready) return (
    <div className="grid gap-6 md:grid-cols-2">
      <label className="block"><span className="text-sm">Qual é a ideia?</span><input value={a.ideia ?? ""} onChange={(e) => s("ideia")(e.target.value.slice(0, 120))} className="mt-1 w-full border-b-2 bg-transparent py-2 outline-none focus:border-foreground" /></label>
      <label className="block"><span className="text-sm">Quem é o cliente?</span><input value={a.cliente ?? ""} onChange={(e) => s("cliente")(e.target.value.slice(0, 120))} className="mt-1 w-full border-b-2 bg-transparent py-2 outline-none focus:border-foreground" /></label>
      <Field l="Produto ou serviço?"><Choice value={a.tipo ?? ""} onChange={s("tipo")} options={[{ v: "servico", l: "Serviço" }, { v: "produto", l: "Produto" }]} /></Field>
      <Field l="Quanto pretende investir no teste?"><Choice value={a.inv ?? ""} onChange={s("inv")} options={[{ v: "0", l: "Nada" }, { v: "pouco", l: "Até R$ 300" }, { v: "mais", l: "Mais que isso" }]} /></Field>
      <Field l="Você já possui audiência?"><Choice value={a.aud ?? ""} onChange={s("aud")} options={[{ v: "sim", l: "Sim" }, { v: "nao", l: "Não" }]} /></Field>
      <Field l="Já possui clientes?"><Choice value={a.cli ?? ""} onChange={s("cli")} options={[{ v: "sim", l: "Sim" }, { v: "nao", l: "Não" }]} /></Field>
      <p className="text-sm text-muted-foreground md:col-span-2">Responda tudo para montar seu teste de 7 dias.</p>
    </div>
  );
  return (
    <div className="space-y-10">
      <p className="eyebrow">Seu teste de 7 dias</p>
      <ol className="relative border-l">
        {dias.map(([t, d], j) => <li key={t} className="py-3 pl-6"><span className="absolute -left-[5px] mt-2 h-2.5 w-2.5 bg-primary" /><p className="font-display font-bold">Dia {j + 1} · {t}</p><p className="text-muted-foreground">{d}</p></li>)}
      </ol>
      {a.inv === "mais" && <p className="border-l-2 border-highlight pl-3 text-sm">Você não precisa gastar mais que isso para fazer esse teste. Guarde o dinheiro para depois da decisão.</p>}
      <div className="grid gap-px border bg-border md:grid-cols-3">
        {[["Validar", "Atingiu ou passou o número do dia 1, e pelo menos uma pessoa pagou ou se comprometeu de verdade."], ["Ajustar", "Houve interesse, mas as objeções se repetem (preço, prazo, confiança). Mude esse ponto e repita."], ["Abandonar", "Quase ninguém se interessou mesmo depois do ajuste. Abandonar a ideia não é fracasso: você economizou meses."]].map(([t, d]) => (
          <div key={t} className="bg-background p-5"><p className="font-display text-xl font-extrabold">{t}</p><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </div>
      <Button variant="outline" onClick={() => setA({})}><RotateCcw />Recomeçar</Button>
    </div>
  );
}
function Field({ l, children }: { l: string; children: ReactNode }) {
  return <div><p className="mb-2 text-sm">{l}</p>{children}</div>;
}
