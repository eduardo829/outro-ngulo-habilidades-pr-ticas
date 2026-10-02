import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { ItemGrid } from "@/components/PublicPage";
import { Opening, RevealCard, Illustrative, Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { cn } from "@/lib/utils";
import heroPhoto from "@/assets/photo-networking.jpg";

const T = "Oportunidades — Outro Ângulo";
const D = "Às vezes a oportunidade não é uma vaga. É uma pessoa. Projetos, parcerias e trabalhos compartilhados entre membros.";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const TIPOS = ["Todos", "Projeto", "Parceria", "Trabalho", "Sócio", "Colaboração", "Investimento"] as const;
const FEED = [
  { k: "Projeto", t: "Estou montando um podcast sobre carreira e procuro quem edite áudio.", d: [{ k: "Formato", v: "Projeto pequeno, remoto" }, { k: "Contato", v: "Mensagem privada" }] },
  { k: "Sócio", t: "Tenho um protótipo de app e procuro sócio técnico.", d: [{ k: "Busca", v: "Desenvolvimento mobile" }, { k: "Estágio", v: "Ideia validada com 10 conversas" }] },
  { k: "Trabalho", t: "Preciso de alguém para organizar planilhas financeiras de um pequeno negócio.", d: [{ k: "Formato", v: "Freela pontual" }, { k: "Contato", v: "Mensagem privada" }] },
  { k: "Parceria", t: "Designer e redator para atender clientes juntos?", d: [{ k: "Ideia", v: "Pacote conjunto para pequenas marcas" }] },
  { k: "Colaboração", t: "Grupo de estudo sobre vendas consultivas, uma vez por semana.", d: [{ k: "Formato", v: "Encontros on-line" }] },
  { k: "Investimento", t: "Procuro conversar com quem já captou investimento-anjo.", d: [{ k: "Objetivo", v: "Trocar experiências, não pedir dinheiro" }] },
];
const RULES = [
  { title: "Contato direto", body: "Quem se interessar fala com você por mensagem privada." },
  { title: "Sem intermediação", body: "O Outro Ângulo não cobra comissão nem processa pagamentos entre membros." },
  { title: "Com bom senso", body: "Avalie com cuidado antes de fechar qualquer acordo." },
];

function Page() {
  const [f, setF] = useState<(typeof TIPOS)[number]>("Todos");
  const items = FEED.filter((i) => f === "Todos" || i.k === f);
  return (
    <PublicLayout>
      <Opening photo={heroPhoto} label="Oportunidades" a="Às vezes a oportunidade não é uma vaga." b="É uma pessoa." intro="Na comunidade, membros publicam o que procuram e o que podem oferecer. As oportunidades ficam visíveis apenas para quem tem conta." />

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionLabel n="01">Que tipo de oportunidade aparece</SectionLabel>
          <Illustrative />
        </div>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
          {TIPOS.map((t) => (
            <button key={t} type="button" aria-pressed={f === t} onClick={() => setF(t)} className={cn("rounded-sm border px-3 py-1.5 text-sm transition-colors", f === t ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>{t}</button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((i, n) => (
            <div key={i.t} className="animate-fade-in" style={{ animationDelay: `${n * 80}ms`, animationFillMode: "both" }}>
              <RevealCard eyebrow={i.k} title={i.t} details={i.d} tone={i.k === "Sócio" || i.k === "Projeto" ? "highlight" : undefined} />
            </div>
          ))}
        </div>
      </section>

      <ItemGrid n="02" label="Como funciona" items={RULES} />
      <Closing a="Algumas oportunidades" b="começam com uma conversa." />
    </PublicLayout>
  );
}
