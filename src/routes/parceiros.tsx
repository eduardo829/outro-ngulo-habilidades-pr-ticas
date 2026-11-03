import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Angle, SectionLabel } from "@/components/Angle";
import { GeneralProposalButton, PartnerGrid, partnersQuery } from "@/components/partners/Partners";
import { BADGES, FOUNDER_NOTE } from "@/lib/partners";

export const Route = createFileRoute("/parceiros")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Parceiros — Outro Ângulo" },
      { name: "description", content: "Parceiros fundadores e empresas do ecossistema Outro Ângulo, com experiência prática no Brasil e no Reino Unido. Proponha uma parceria." },
      { property: "og:title", content: "Parceiros — Outro Ângulo" },
      { property: "og:description", content: "Conhecimento que vem da prática. Conexões que ultrapassam fronteiras." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outroangulo.com/parceiros" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://outroangulo.com/parceiros" }],
  }),
  component: ParceirosPage,
});

const INTERESTS = ["Parcerias comerciais", "Desenvolvimento de negócios", "Tecnologia e automação", "Colaboração entre profissionais", "Expansão empresarial", "Troca de conhecimento"];

function ParceirosPage() {
  const { data: partners = [] } = useQuery(partnersQuery);
  const [area, setArea] = useState("");
  const [country, setCountry] = useState("");
  const [ptype, setPtype] = useState("");
  const opts = useMemo(() => ({
    areas: [...new Set(partners.flatMap((p) => p.areas))].sort(),
    countries: [...new Set(partners.map((p) => p.country))].sort(),
    types: [...new Set(partners.flatMap((p) => p.partnership_types))].sort(),
  }), [partners]);
  const list = partners.filter((p) => (!area || p.areas.includes(area)) && (!country || p.country === country) && (!ptype || p.partnership_types.includes(ptype)));
  const sel = "rounded-sm border bg-background px-3 py-2 text-sm";

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-14 md:pt-24">
        <SectionLabel>Parceiros</SectionLabel>
        <h1 className="display-xl mt-8 max-w-3xl">Conhecimento que vem da prática.<br /><span className="text-muted-foreground">Conexões que ultrapassam fronteiras.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          O Outro Ângulo conecta educação, empreendedorismo, especialistas e oportunidades, apoiado pela experiência prática de empreendedores que desenvolvem negócios no Brasil e no Reino Unido.
        </p>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel n="01">Parceiros fundadores</SectionLabel>
          <p className="mt-6 max-w-2xl text-muted-foreground">Empresas e iniciativas vinculadas ao nosso fundador, Eduardo Araujo, incluindo operações em Londres, Reino Unido.</p>
          {(opts.areas.length > 1 || opts.countries.length > 1 || opts.types.length > 1) && (
            <div className="mt-8 flex flex-wrap gap-3" aria-label="Filtros">
              {opts.areas.length > 1 && <select className={sel} value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área"><option value="">Todas as áreas</option>{opts.areas.map((a) => <option key={a}>{a}</option>)}</select>}
              {opts.countries.length > 1 && <select className={sel} value={country} onChange={(e) => setCountry(e.target.value)} aria-label="País"><option value="">Todos os países</option>{opts.countries.map((a) => <option key={a}>{a}</option>)}</select>}
              {opts.types.length > 1 && <select className={sel} value={ptype} onChange={(e) => setPtype(e.target.value)} aria-label="Tipo de parceria"><option value="">Todos os tipos</option>{opts.types.map((a) => <option key={a}>{a}</option>)}</select>}
            </div>
          )}
          <div className="mt-10">
            {list.length ? <PartnerGrid partners={list} origin="parceiros" /> : <p className="text-muted-foreground">Nenhum parceiro com esses filtros.</p>}
          </div>
          <p className="mt-10 max-w-2xl text-xs text-muted-foreground">{FOUNDER_NOTE}</p>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel n="02">Especialistas verificados</SectionLabel>
          <p className="mt-6 max-w-2xl text-muted-foreground">Profissionais revisados pela equipe aparecem no diretório de especialistas, com o selo “{BADGES.verified}” quando verificados.</p>
          <Link to="/especialistas" className="link-arrow nav-line mt-6 inline-block text-sm">Ver especialistas</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionLabel n="03">Brasil e Reino Unido</SectionLabel>
        <h2 className="mt-8 max-w-3xl text-3xl font-bold md:text-4xl">Conectando experiências e oportunidades entre Brasil e Reino Unido.</h2>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">O ecossistema pretende facilitar conexões entre empreendedores, especialistas e empresas de diferentes mercados. Interesses que queremos desenvolver:</p>
        <ul className="mt-8 grid border-t sm:grid-cols-2 lg:grid-cols-3">
          {INTERESTS.map((a) => (
            <li key={a} className="flex items-baseline gap-3 border-b py-4 sm:pr-6"><Angle className="translate-y-0.5" /><span className="font-medium">{a}</span></li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">Não oferecemos vagas de trabalho, imigração, contratos internacionais ou acesso a investidores. Oportunidades concretas só serão divulgadas quando forem reais e estiverem disponíveis.</p>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel n="04">Futuros parceiros</SectionLabel>
          <p className="mt-6 max-w-2xl text-muted-foreground">Empresas brasileiras, internacionais, prestadores de serviço e organizações de apoio ao empreendedorismo podem propor participação. Nenhum perfil é publicado sem autorização.</p>
          <div className="mt-8"><GeneralProposalButton origin="parceiros-geral" /></div>
        </div>
      </section>
    </PublicLayout>
  );
}
