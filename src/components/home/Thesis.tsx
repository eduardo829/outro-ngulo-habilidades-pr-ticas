import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Angle, SectionLabel } from "@/components/Angle";
import { TRILHAS } from "@/lib/trilhas";

const LINES = [
  "Como encontrar oportunidades.",
  "Como construir relações.",
  "Como negociar.",
  "Como vender uma ideia.",
  "Como validar um negócio.",
  "Como tomar decisões quando ninguém tem a resposta.",
];

export function Manifesto() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <SectionLabel>Manifesto</SectionLabel>
          <p className="mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl font-display">A escola ensina muita coisa.</p>
        </div>
        <div className="md:pt-16">
          <p className="text-lg text-muted-foreground">Mas dificilmente ensina</p>
          <ul className="mt-4 border-t">
            {LINES.map((l, i) => (
              <li key={l} className={`reveal border-b py-4 font-display text-2xl font-bold leading-snug md:text-3xl ${i % 2 ? "md:pl-[10%]" : ""}`}>{l}</li>
            ))}
          </ul>
          <p className="mt-10 flex items-center gap-3 text-lg font-semibold">
            <Angle className="h-5 w-5" /> O Outro Ângulo nasceu para explorar essas conversas.
          </p>
        </div>
      </div>
    </section>
  );
}

type Course = { id: string; slug: string; title: string };

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo", timeZoneName: "short" });

export function Acontecendo({ courses }: { courses: Course[] }) {
  const events = useQuery({
    queryKey: ["public-upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_upcoming_events");
      if (error) throw error;
      return data ?? [];
    },
  });
  const items = [
    ...(events.data ?? []).map((e) => ({ k: "Próximo encontro", t: e.title, m: fmt.format(new Date(e.starts_at)), to: "/conheca-os-encontros" as const })),
    ...courses.slice(0, 3).map((c) => ({ k: "Curso aberto", t: c.title, m: "Catálogo", to: "/cursos" as const })),
  ];
  return (
    <section className="border-y bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_2fr]">
        <div>
          <SectionLabel>Acontecendo agora</SectionLabel>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Apenas atividade real da plataforma: encontros agendados e cursos publicados.</p>
        </div>
        {events.isLoading ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Angle spin /> Carregando…</p>
        ) : items.length > 0 ? (
          <ul className="border-t">
            {items.map((it) => (
              <li key={it.k + it.t} className="border-b">
                <Link to={it.to} className="group grid gap-1 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline sm:gap-6">
                  <span className="eyebrow">{it.k}</span>
                  <span className="font-display text-lg font-semibold transition-transform duration-300 group-hover:translate-x-1">{it.t}</span>
                  <span className="text-sm text-muted-foreground">{it.m}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-l-2 border-highlight pl-6">
            <p className="font-display text-xl font-bold">Estamos nos primeiros dias.</p>
            <p className="mt-2 max-w-lg text-muted-foreground">Ainda não há encontros agendados nem cursos publicados. Enquanto isso, estas trilhas estão em preparação:</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TRILHAS.slice(0, 4).map((t) => <li key={t.title} className="rounded-sm border px-3 py-1 text-sm">{t.title}</li>)}
            </ul>
            <Link to="/trilhas" className="link-arrow mt-5 text-sm">Ver trilhas <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

const STEPS = ["Aprender", "Conversar", "Conectar", "Construir", "Compartilhar"];

export function Ciclo() {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow !text-ink-foreground/60">O ciclo</p>
          <p className="mt-6 font-display text-3xl font-extrabold leading-[1.08] md:text-4xl">O conhecimento não termina quando o vídeo acaba.</p>
          <div className="mt-8 space-y-2 text-lg text-ink-foreground/75">
            <p>Uma ideia pode gerar uma conversa.</p>
            <p>Uma conversa pode gerar uma conexão.</p>
            <p>Uma conexão pode gerar um projeto.</p>
            <p className="pt-3 text-ink-foreground">E um projeto gera novas experiências para compartilhar.</p>
          </div>
        </div>
        <ol className="relative">
          {STEPS.map((s, i) => (
            <li key={s} className="reveal relative flex items-center gap-5 border-l border-ink-foreground/25 py-4 pl-6" style={{ marginLeft: `${i * 9}%` }}>
              <span className="absolute -left-[5px] h-2.5 w-2.5 bg-highlight" />
              <span className="font-display text-xs font-bold tabular-nums text-ink-foreground/50">0{i + 1}</span>
              <span className="font-display text-3xl font-extrabold md:text-4xl">{s}</span>
            </li>
          ))}
          <li className="mt-4 flex items-center gap-3 pl-6 text-sm text-ink-foreground/60">
            <Angle className="h-4 w-4 -scale-x-100" /> e volta a aprender
          </li>
        </ol>
      </div>
    </section>
  );
}
