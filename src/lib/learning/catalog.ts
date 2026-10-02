import type { Course } from "./types";

/** "What do you want to improve?" areas used by /cursos. Engine categories map into them. */
export const AREAS = ["Carreira", "Comunicação", "Dinheiro", "Tecnologia & IA", "Relacionamentos", "Execução", "Profissões", "Negócios"] as const;
export type Area = (typeof AREAS)[number];

export function areaOf(c: Course): Area {
  switch (c.category) {
    case "Networking": return "Relacionamentos";
    case "Vendas": return "Negócios";
    case "Carreira": return "Carreira";
    case "Dinheiro": return "Dinheiro";
    case "Tecnologia & IA": return "Tecnologia & IA";
    case "Profissões": return "Profissões";
    default: return "Negócios";
  }
}

/** Planned courses: listed honestly as "em preparação", no modules, no dates. */
export type Upcoming = { title: string; area: Area; thesis: string; output: string };
export const UPCOMING: Upcoming[] = [
  { title: "Chegue forte ao mercado de trabalho", area: "Carreira", thesis: "Construa uma apresentação profissional que mostre melhor o que você sabe fazer e onde pode gerar valor.", output: "Meu kit profissional" },
  { title: "Construa uma carreira, não apenas um emprego", area: "Carreira", thesis: "Entenda onde você está, quais competências precisa desenvolver e quais movimentos podem aproximar você de onde quer chegar.", output: "Meu mapa de carreira" },
  { title: "Quero mudar de carreira. E agora?", area: "Carreira", thesis: "Um processo para explorar uma mudança profissional sem precisar jogar sua trajetória inteira fora.", output: "Meu plano de transição" },
  { title: "O próximo passo", area: "Carreira", thesis: "Para quem não precisa recomeçar, apenas entender qual movimento faz mais sentido agora.", output: "Meu próximo passo" },
  { title: "Entrevista sem resposta decorada", area: "Carreira", thesis: "Aprenda a entender o que a empresa está procurando e comunicar melhor o que você pode entregar.", output: "Minha preparação de entrevista" },
  { title: "LinkedIn, CV e presença profissional", area: "Carreira", thesis: "Organize sua experiência para que outras pessoas entendam rapidamente o que você sabe fazer.", output: "Meu perfil profissional" },
  { title: "Comunicação profissional", area: "Comunicação", thesis: "Fale, escreva e se posicione com mais clareza no trabalho.", output: "Meu playbook de comunicação" },
  { title: "Dinheiro sem complicação", area: "Dinheiro", thesis: "Entenda a matemática da sua vida financeira sem precisar virar especialista em finanças.", output: "Meu mapa financeiro" },
];
