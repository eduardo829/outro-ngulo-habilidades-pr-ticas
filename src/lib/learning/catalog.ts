import type { Course } from "./types";

/** "What do you want to improve?" areas used by /cursos. Engine categories map into them. */
export const AREAS = ["Carreira", "Comunicação", "Dinheiro", "Tecnologia & IA", "Relacionamentos", "Execução", "Profissões", "Negócios"] as const;
export type Area = (typeof AREAS)[number];

export function areaOf(c: Course): Area {
  switch (c.category) {
    case "Networking": return "Relacionamentos";
    case "Vendas": return "Negócios";
    case "Carreira": return "Carreira";
    case "Comunicação": return "Comunicação";
    case "Dinheiro": return "Dinheiro";
    case "Tecnologia & IA": return "Tecnologia & IA";
    case "Profissões": return "Profissões";
    default: return "Negócios";
  }
}

/** Planned courses: listed honestly as "em preparação", no modules, no dates. */
export type Upcoming = { title: string; area: Area; thesis: string; output: string };
export const UPCOMING: Upcoming[] = [];
