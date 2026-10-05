/**
 * Reusable Gestor profile template. Values in square brackets ("[...]") are
 * placeholders awaiting verified information and are rendered as such.
 * Only facts from the gestor's own public sources or the project go here.
 */
import viniPhoto from "@/assets/gestor-vinicius-silva.jpg.asset.json";

export type GestorLink = { label: string; url: string };
export type GestorVenture = { name: string; area: string; role?: string; years?: string; note?: string; url?: string };
export type GestorItem = { title: string; href?: string; note?: string };

export type GestorProfile = {
  slug: string;
  name: string;
  photo?: string;
  photoAlt?: string;
  location: string;
  positioning: string;
  tagline: string;
  biography: string[];
  areas_of_experience: string[];
  ventures: GestorVenture[]; // companies, projects, roles, timeline
  knowledge_topics: string[]; // "O que aprendi fazendo"
  learning_tracks: string[]; // must match TRILHAS titles
  courses: GestorItem[];
  tools: GestorItem[];
  discussions: GestorItem[]; // community posts, answers, discussions
  events: GestorItem[]; // events / live sessions
  recommended_reading: GestorItem[];
  social_links: GestorLink[];
  website?: string;
  what_i_am_building: string[];
  what_i_can_help_with: string[];
  what_i_am_learning: string[];
  sources: GestorLink[];
};

export const isPending = (s: string) => s.trim().startsWith("[");

export const GESTORES: GestorProfile[] = [
  {
    slug: "eduardo-araujo",
    name: "Eduardo Araújo",
    photo: "https://araujoeduardo.com/__l5e/assets-v1/fe221ab7-a1ec-4117-9f88-658f50101682/eduardo-hero-watch.png",
    photoAlt: "Eduardo Araújo em Londres",
    location: "Londres · Brasil",
    positioning: "Negócios · Operações · IA · Execução",
    tagline: "Não fala de empreendedorismo olhando de fora. Divide o que aprendeu construindo e operando.",
    biography: [
      "Mais de uma década na Europa, com atuação entre Reino Unido e Brasil.",
      "Constrói e opera negócios, sistemas e processos. Combina experiência operacional, tecnologia, automação e inteligência artificial para resolver gargalos reais de empresas.",
    ],
    areas_of_experience: ["Empreendedorismo", "Gestão", "Estratégia", "Execução", "Operações", "Processos", "Automação", "IA aplicada", "Construção de negócios", "Reino Unido e Brasil"],
    ventures: [
      { name: "Refurb Hub", area: "Reformas e construção", url: "https://refurbishmenthub.co.uk/" },
      { name: "The Flooring Empire", area: "Pisos e revestimentos", url: "https://theflooringempire.co.uk/" },
      { name: "Lanzilotti", area: "Tecnologia, IA e automação", url: "https://lanzilotti.com.br/" },
      { name: "Imvest / Imvestidor", area: "Tecnologia e mercado imobiliário", url: "https://imvestidor.com/" },
    ],
    knowledge_topics: [
      "Como sair da ideia para a execução",
      "Como estruturar uma operação",
      "Como pensar processos",
      "Como vender serviços",
      "Como validar oportunidades",
      "Como usar IA dentro de empresas reais",
      "Como analisar um negócio antes de investir",
      "Como construir empresas fora do Brasil",
      "Como lidar com crescimento operacional",
    ],
    learning_tracks: ["Começar a empreender", "Conseguir meus primeiros clientes", "Usar IA no dia a dia"],
    courses: [],
    tools: [{ title: "[ferramentas]" }],
    discussions: [{ title: "[discussões]" }],
    events: [{ title: "[encontros]" }],
    recommended_reading: [],
    social_links: [],
    website: "https://araujoeduardo.com/",
    what_i_am_building: ["Outro Ângulo"],
    what_i_can_help_with: ["Estruturar operação e processos", "Aplicar automação e IA em empresas reais", "Avaliar uma oportunidade antes de investir"],
    what_i_am_learning: ["[o que está aprendendo]"],
    sources: [{ label: "araujoeduardo.com", url: "https://araujoeduardo.com/" }],
  },
  {
    slug: "vinicius-silva",
    name: "Vinicius Silva",
    photo: viniPhoto.url,
    photoAlt: "Vinicius Silva, consultor imobiliário",
    location: "Itapema · Porto Belo, SC",
    positioning: "Consultor imobiliário · Mercado de alto padrão",
    tagline: "Trabalho que vai além da venda: análise, visão de valorização e atendimento de perto.",
    biography: [
      "Atua no mercado imobiliário de alto padrão no litoral catarinense, com foco em Itapema e Porto Belo.",
      "Conecta clientes a oportunidades de investimento. O trabalho envolve análise estratégica, leitura de valorização e atendimento personalizado para quem busca patrimônio, qualidade de vida e rentabilidade.",
    ],
    areas_of_experience: ["Mercado imobiliário", "Alto padrão", "Investimento em imóveis", "Análise de oportunidades", "Negociação", "Atendimento ao cliente", "Litoral catarinense"],
    ventures: [{ name: "Vinicius Silva Consultor Imobiliário", area: "Consultoria imobiliária em Itapema e Porto Belo", role: "Consultor" }],
    knowledge_topics: [
      "Como entender o perfil e o objetivo de um cliente",
      "Como selecionar imóveis que fazem sentido para cada pessoa",
      "Como avaliar viabilidade, retorno e potencial de valorização",
      "Como conduzir uma negociação com transparência",
      "Como acompanhar o cliente depois da venda",
      "Como ler o movimento de uma região",
    ],
    learning_tracks: [],
    courses: [{ title: "Corretor do zero", href: "/cursos/corretor-do-zero" }],
    tools: [{ title: "[ferramentas]" }],
    discussions: [{ title: "[discussões]" }],
    events: [{ title: "[encontros]" }],
    recommended_reading: [],
    social_links: [{ label: "Instagram", url: "https://www.instagram.com/sillvaviniicius" }],
    what_i_am_building: ["Outro Ângulo"],
    what_i_can_help_with: ["Começar como corretor", "Analisar um imóvel antes de comprar ou investir", "Atender e negociar com clientes"],
    what_i_am_learning: ["[o que está aprendendo]"],
    sources: [{ label: "Apresentação Vinicius Silva 2026", url: "https://www.instagram.com/sillvaviniicius" }],
  },
];

export const getGestor = (slug: string) => GESTORES.find((g) => g.slug === slug);

/** Signature format: one question, two gestores, different reasoning. */
export const DOIS_ANGULOS = {
  question: "É melhor começar um negócio sozinho ou com um sócio?",
  a: { slug: "eduardo-araujo", view: "[perspectiva a gravar]" },
  b: { slug: "vinicius-silva", view: "[perspectiva a gravar]" },
};
