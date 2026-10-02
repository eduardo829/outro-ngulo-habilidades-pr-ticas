import closePhoto from "@/assets/photo-close-gestor.jpg";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Closing } from "@/components/public/Story";
import { SectionLabel } from "@/components/Angle";
import { ScrollReveal } from "@/components/motion/Motion";
import { Connections, GestorPhoto, KnowledgeGraph, Txt, Ventures } from "@/components/gestores/GestorParts";
import { getGestor, isPending } from "@/lib/gestores";

export const Route = createFileRoute("/gestor/$slug")({
  loader: ({ params }) => {
    const g = getGestor(params.slug);
    if (!g) throw notFound();
    return g;
  },
  head: ({ loaderData: g }) => {
    const t = g ? `${g.name} — Gestores · Outro Ângulo` : "Gestor — Outro Ângulo";
    const d = g && !isPending(g.tagline) ? g.tagline : "Experiência real, conhecimento e conversas de um gestor do Outro Ângulo.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <PublicLayout><div className="mx-auto max-w-6xl px-5 py-24"><p>Gestor não encontrado.</p><Link to="/gestores" className="underline">Ver gestores</Link></div></PublicLayout>,
  component: Profile,
});

function List({ items }: { items: string[] }) {
  return <ul className="mt-4 space-y-2">{items.map((t) => <li key={t} className="border-l-2 border-primary/30 pl-3 text-lg"><Txt v={t} /></li>)}</ul>;
}

function Profile() {
  const g = Route.useLoaderData();
  return (
    <PublicLayout>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.3fr_1fr] md:items-end md:py-24">
          <div>
            <Link to="/gestores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Gestores</Link>
            <SectionLabel>Gestor</SectionLabel>
            <h1 className="display-xl reveal is-visible mt-6">{g.name}</h1>
            <p className="mt-4 font-display text-lg font-bold"><Txt v={g.positioning} /></p>
            <p className="text-muted-foreground"><Txt v={g.location} /></p>
            <p className="mt-8 max-w-xl text-2xl font-display font-bold leading-snug md:pl-[8%]"><Txt v={g.tagline} /></p>
          </div>
          <GestorPhoto g={g} className="aspect-[4/5] w-full max-w-sm justify-self-end" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel n="01">Quem é</SectionLabel>
        <div className="mt-8 max-w-3xl space-y-4 text-xl leading-relaxed">{g.biography.map((p) => <ScrollReveal key={p}><p><Txt v={p} /></p></ScrollReveal>)}</div>
        <div className="mt-8 flex flex-wrap gap-2">{g.areas_of_experience.map((a) => <span key={a} className="border px-2.5 py-1 text-sm"><Txt v={a} /></span>)}</div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionLabel n="02">O que construiu</SectionLabel>
          <div className="mt-10"><Ventures g={g} /></div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionLabel n="03">O que aprendeu fazendo</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">Áreas de experiência e conversa, não promessas.</p>
          <ol className="mt-10 grid gap-x-10 md:grid-cols-2">
            {g.knowledge_topics.map((t, i) => (
              <ScrollReveal as="li" key={t} delay={i * 60}><div className="flex gap-4 border-t py-4"><span className="eyebrow pt-1">{String(i + 1).padStart(2, "0")}</span><span className="font-display text-xl font-bold"><Txt v={t} /></span></div></ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <KnowledgeGraph g={g} />

      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel n="04">Onde encontrar na plataforma</SectionLabel>
        <div className="mt-10"><Connections g={g} /></div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-3">
          <div><p className="eyebrow">Está construindo</p><List items={g.what_i_am_building} /></div>
          <div><p className="eyebrow">Pode ajudar com</p><List items={g.what_i_can_help_with} /></div>
          <div className="border-l-2 border-highlight pl-6"><p className="eyebrow">Está aprendendo</p><List items={g.what_i_am_learning} /><p className="mt-4 text-sm text-muted-foreground">Aqui todo mundo continua aprendendo. Inclusive os gestores.</p></div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-5 py-8 text-sm text-muted-foreground">
          <span>Fontes:</span>
          {[...g.sources, ...(g.website && !g.sources.some((s) => s.url === g.website) ? [{ label: "Site", url: g.website }] : [])].map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">{s.label}<ArrowUpRight className="h-3.5 w-3.5" /></a>)}
          <span>Itens tracejados aguardam informação confirmada.</span>
        </div>
      </section>
      <Closing photo={closePhoto} a="Decida você" b="se essa experiência te serve." />
    </PublicLayout>
  );
}
