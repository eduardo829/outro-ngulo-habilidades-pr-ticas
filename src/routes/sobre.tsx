import closePhoto from "@/assets/photo-close-sobre.jpg";
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Statements, Closing } from "@/components/public/Story";
import { StickyStory } from "@/components/motion/Motion";
import { cn } from "@/lib/utils";
import { PhotoBand } from "@/components/PhotoBand";
import bandPhoto from "@/assets/photo-sobre-band.jpg";

const T = "Sobre — Outro Ângulo";
const D = "O conhecimento nunca esteve tão disponível. Mas informação não é experiência. Por que estamos construindo uma rede, não apenas uma escola?";

export const Route = createFileRoute("/sobre")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: About,
});

const DURANTE = ["uma pergunta", "uma conversa", "uma pessoa", "uma conexão", "um projeto"];

// Deterministic conceptual network (no real data).
const NODES = Array.from({ length: 20 }, (_, i) => {
  const a = i * 2.39996, r = i === 0 ? 0 : 18 + Math.sqrt(i) * 17;
  return { x: 150 + r * Math.cos(a), y: 150 + r * Math.sin(a), kind: i % 4 };
});
const EDGES = NODES.flatMap((n, i) => (i === 0 ? [] : [[i, i < 5 ? 0 : (i * 7) % i], ...(i % 3 === 0 ? [[i, (i + 5) % 20]] : [])])) as [number, number][];
const KINDS = ["Conhecimento", "Pessoas", "Projetos", "Oportunidades"];

function About() {
  return (
    <PublicLayout>
      <h1 className="sr-only">Sobre o Outro Ângulo</h1>
      <Statements label="Agora" lines={["O conhecimento nunca esteve tão disponível.", "Mas informação não é experiência.", "E acesso às pessoas certas ainda muda trajetórias."]} />

      <PhotoBand src={bandPhoto} eyebrow="Por que existimos" title={<>Informação está em todo lugar.<span className="block text-ink-foreground/60">Gente para conversar, nem tanto.</span></>} />

      <section className="paper-light border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.1fr] md:py-28">
          <div>
            <p className="eyebrow">O que ninguém ensinou</p>
            <p className="mt-5 font-display text-3xl font-extrabold leading-tight md:text-4xl">Muitas habilidades importantes são cobradas das pessoas sem nunca terem sido ensinadas.</p>
          </div>
          <div>
            <ul className="grid grid-cols-1 gap-x-6 border-t sm:grid-cols-2">
              {["Como escolher uma direção.", "Como se comunicar.", "Como negociar.", "Como cuidar do dinheiro.", "Como construir relações.", "Como usar tecnologia.", "Como mudar de carreira.", "Como entender oportunidades.", "Como começar algo."].map((t) => <li key={t} className="border-b py-3 font-medium">{t}</li>)}
            </ul>
            <p className="mt-8 font-display text-2xl font-extrabold leading-snug">Ninguém precisa aprender tudo.<span className="block text-muted-foreground">Só precisa descobrir o que pode ajudar no próximo passo.</span></p>
          </div>
        </div>
      </section>


      <section className="border-y bg-card">
        <StickyStory steps={DURANTE.length + 1} render={(a) => (
          <div className="mx-auto w-full max-w-6xl px-5">
            <p className="eyebrow">Durante</p>
            <ol className="mt-8 space-y-1">
              {DURANTE.map((d, i) => (
                <li key={d} className={cn("font-display text-4xl font-extrabold transition-all duration-500 ease-[var(--ease-out)] md:text-6xl", i <= a ? "opacity-100" : "translate-y-3 opacity-0")} style={{ paddingLeft: `${i * 7}%` }}>
                  <span className={cn(i === a && a < DURANTE.length && "bg-highlight/70 px-1")}>{d}</span>
                </li>
              ))}
            </ol>
            <p className={cn("mt-10 text-xl font-semibold transition-opacity duration-500", a >= DURANTE.length ? "opacity-100" : "opacity-0")}>Aprender é apenas o começo.</p>
          </div>
        )} />
      </section>

      <section className="bg-ink text-ink-foreground">
        <StickyStory steps={4} render={(a) => {
          const count = [1, 5, 20, 20][a]!;
          return (
            <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
              <div>
                <p className="eyebrow !text-ink-foreground/60">Futuro</p>
                <p className="mt-6 font-display text-4xl font-extrabold leading-[1.04] md:text-5xl">Estamos construindo uma rede.<span className="block text-ink-foreground/55">Não apenas uma escola.</span></p>
                <p className="mt-8 max-w-md text-ink-foreground/75">A ambição é que o que se aprende aqui vire conversa, que conversas virem relações, e que relações virem projetos, trabalhos e negócios — feitos por quem passou pela rede.</p>
                <ul className="mt-6 flex flex-wrap gap-4 text-xs text-ink-foreground/60">
                  {KINDS.map((k, i) => <li key={k} className="flex items-center gap-2"><span className={cn("h-2 w-2", i === 3 ? "bg-highlight" : "bg-ink-foreground")} style={{ opacity: 1 - i * 0.2 }} />{k}</li>)}
                </ul>
                <p className="mt-4 text-xs text-ink-foreground/45">Visualização conceitual: não representa membros reais.</p>
              </div>
              <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-sm" aria-hidden>
                {EDGES.map(([s, t], i) => (
                  <line key={i} x1={NODES[s]!.x} y1={NODES[s]!.y} x2={NODES[t]!.x} y2={NODES[t]!.y} stroke="currentColor" strokeOpacity={a === 3 || (s < count && t < count && a >= 1) ? 0.3 : 0} className="transition-[stroke-opacity] duration-700" />
                ))}
                {NODES.map((n, i) => (
                  <rect key={i} x={n.x - 4} y={n.y - 4} width="8" height="8" transform={`rotate(${i * 12} ${n.x} ${n.y})`} fill={n.kind === 3 ? "var(--color-highlight)" : "currentColor"} fillOpacity={i < count ? 1 - n.kind * 0.18 : 0} className="transition-[fill-opacity] duration-500" style={{ transitionDelay: `${i * 30}ms` }} />
                ))}
              </svg>
            </div>
          );
        }} />
      </section>

      <Closing photo={closePhoto} a="Talvez você entre para aprender alguma coisa." b="Talvez fique pelas pessoas que encontrar." />
    </PublicLayout>
  );
}
