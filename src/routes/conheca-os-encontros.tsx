import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MessageCircleQuestion, PenLine, Users } from "lucide-react";
import { PublicPage } from "@/components/PublicPage";
import { PhotoBand } from "@/components/PhotoBand";
import { SectionLabel } from "@/components/Angle";
import { StickyStory, ScrollReveal } from "@/components/motion/Motion";
import { cn } from "@/lib/utils";
import heroPhoto from "@/assets/photo-encontros.jpg";
import stairsPhoto from "@/assets/photo-escada.jpg";

const T = "Encontros ao vivo — Outro Ângulo";
const D = "Aulas ao vivo, plantões de dúvidas, workshops e encontros de networking com vagas limitadas e perguntas enviadas antes.";

export const Route = createFileRoute("/conheca-os-encontros")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const FORMATS = [
  { title: "Aula ao vivo", body: "Um tema prático, explicado e discutido em tempo real.", icon: CalendarDays,
    preview: <div className="space-y-2 text-sm"><p className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-highlight" />Ao vivo · sala externa</p><p className="text-ink-foreground/70">Duração definida · vagas limitadas</p></div> },
  { title: "Plantão de dúvidas", body: "Espaço para trazer perguntas sobre as aulas e situações reais.", icon: MessageCircleQuestion,
    preview: <div className="text-sm"><p className="eyebrow !text-ink-foreground/60">Pergunta enviada antes</p><p className="mt-2 font-display text-lg font-bold">"Como sei se meu preço está baixo demais?"</p><p className="mt-2 text-ink-foreground/60">▲ votos de outros membros</p></div> },
  { title: "Workshop", body: "Mão na massa: você sai com algo pronto ou começado.", icon: PenLine,
    preview: <div className="space-y-2 text-sm"><p className="eyebrow !text-ink-foreground/60">Durante o workshop</p><div className="h-2 w-full bg-ink-foreground/15"><div className="h-2 w-2/3 bg-highlight" /></div><p className="text-ink-foreground/70">Rascunho da oferta · 2 de 3 partes</p></div> },
  { title: "Networking", body: "Encontros pensados para conhecer pessoas novas com calma.", icon: Users,
    preview: <div className="flex items-center gap-3 text-sm"><div className="flex -space-x-2">{["A", "R", "J"].map((l) => <span key={l} className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-ink-foreground font-bold text-ink">{l}</span>)}</div><p className="text-ink-foreground/70">Grupos pequenos, por interesse</p></div> },
];
const HOW = [
  { title: "Reserve sua vaga", body: "Os encontros têm vagas definidas. A reserva é feita na sua área." },
  { title: "Envie sua pergunta", body: "Membros podem enviar e votar nas perguntas que querem ver respondidas." },
  { title: "Entre no encontro", body: "O link da sala externa aparece para quem reservou, perto do horário." },
  { title: "Saia com uma ação", body: "Depois do encontro, você registra um próximo passo concreto." },
];

function Formats() {
  return (
    <section className="bg-ink text-ink-foreground">
      <StickyStory steps={FORMATS.length} render={(a) => (
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <SectionLabel n="02" className="!text-ink-foreground/60">Formatos</SectionLabel>
            <p className="mt-8 font-display text-4xl font-extrabold leading-[1.02] md:text-6xl">04 formas<span className="block text-ink-foreground/55">de encontrar pessoas e ideias.</span></p>
          </div>
          <ol className="space-y-2">
            {FORMATS.map((f, i) => {
              const on = i === a;
              return (
                <li key={f.title} className={cn("border-l-2 pl-6 transition-all duration-500", on ? "border-highlight py-5" : "border-ink-foreground/15 py-2 opacity-45")}>
                  <div className="flex items-baseline gap-4">
                    <span className={cn("font-display font-extrabold tabular-nums transition-all duration-500", on ? "text-4xl text-highlight" : "text-xl")}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={cn("font-display font-bold uppercase tracking-wide transition-all", on ? "text-2xl" : "text-base")}>{f.title}</h3>
                  </div>
                  <div className={cn("grid transition-all duration-500", on ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="text-ink-foreground/75">{f.body}</p>
                      <div className="mt-4 border border-ink-foreground/15 bg-ink-foreground/[0.04] p-4">{f.preview}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )} />
    </section>
  );
}

function Journey() {
  const [action, setAction] = useState("");
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionLabel n="03">Como funciona</SectionLabel>
      <StickyStory steps={HOW.length} render={(a, p) => (
        <div className="w-full">
          <div className="relative mt-4 hidden h-px bg-border md:block"><div className="absolute inset-y-0 left-0 bg-highlight transition-[width] duration-200" style={{ width: `${Math.min(100, p * 115)}%` }} /></div>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {HOW.map((h, i) => (
              <li key={h.title} className={cn("transition-all duration-500", i <= a ? "opacity-100" : "md:translate-y-3 md:opacity-30")}>
                <span className={cn("block font-display text-6xl font-extrabold leading-none tabular-nums transition-colors", i === a ? "text-foreground" : "text-foreground/15")}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-xl font-bold">{h.title}</h3>
                <p className="mt-2 text-muted-foreground">{h.body}</p>
              </li>
            ))}
          </ol>
          <div className={cn("mt-12 max-w-xl border bg-card p-6 transition-all duration-500", a === HOW.length - 1 ? "opacity-100" : "md:opacity-40")}>
            <label htmlFor="acao" className="eyebrow">Experimente · Minha próxima ação</label>
            <input id="acao" value={action} onChange={(e) => setAction(e.target.value)} maxLength={120} placeholder="Ex.: mandar mensagem para 3 possíveis clientes até sexta" className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-lg outline-none focus:border-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{action.trim() ? <>Na plataforma, isso fica salvo no encontro e aparece na sua área. <Link to="/auth" search={{ modo: "cadastro" }} className="font-semibold text-foreground underline">Criar conta</Link></> : "Só um exemplo. Nada é salvo aqui."}</p>
          </div>
        </div>
      )} />
    </section>
  );
}

function Page() {
  return (
    <PublicPage photo={heroPhoto} label="Encontros" title={<>Aprender junto, ao vivo.</>} intro="Os encontros acontecem em salas externas de videochamada. A agenda fica disponível para membros dentro da plataforma.">
      <Formats />
      <Journey />
      <PhotoBand src={stairsPhoto} align="right" eyebrow="Entre um degrau e outro" title={<>Uma boa conversa<span className="block text-ink-foreground/60">pode economizar meses de tentativa.</span></>} />
      <section className="bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-[1fr_1fr] md:py-28">
          <ScrollReveal>
            <p className="eyebrow">Como aparece na sua área</p>
            <p className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-4xl">Cada encontro tem data, fuso, vagas e um lugar para sua pergunta.</p>
            <p className="mt-4 text-muted-foreground">Exemplo ilustrativo da tela. Não é um encontro agendado.</p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <article className="relative border bg-background p-6 shadow-[12px_12px_0_0_var(--ink)]">
              <p className="eyebrow">Próximo encontro · Aula ao vivo</p>
              <h3 className="mt-3 font-display text-2xl font-extrabold">Como saber se uma ideia merece seu dinheiro?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Quinta · 19:00 (Brasília) · 60 min</p>
              <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm"><span>Vagas limitadas</span><span className="inline-flex items-center gap-1 font-semibold">Ver encontro<ArrowRight className="h-4 w-4" /></span></div>
            </article>
          </ScrollReveal>
        </div>
      </section>
    </PublicPage>
  );
}
