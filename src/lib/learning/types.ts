/** Data-driven learning engine. Courses are composed of modules made of reusable blocks. */
export type Field = { k: string; l: string; ph?: string; multiline?: boolean; options?: string[] };

export type Block =
  | { type: "text"; title?: string; body: string }
  /** Written lesson: what it is, why it matters, a concrete example and a common mistake. */
  | { type: "concept"; title: string; what: string; why: string; example: string; mistake: string }
  | { type: "question"; key: string; prompt: string; help?: string }
  | { type: "fields"; key: string; title: string; help?: string; fields: Field[] }
  | { type: "choices"; key: string; prompt: string; options: string[]; multi?: boolean }
  /** Complementary video. Source, thumbnail, duration and transcript live in public.course_videos (admin-editable). */
  | { type: "video"; title: string }
  | { type: "compare"; before: string; after: string; title?: string }
  | { type: "scenarios"; key: string; intro: string; items: string[]; framework: string[]; title?: string }
  | { type: "list"; key: string; title: string; max: number; fields: Field[]; statusLabel: string; statuses: string[] }
  | { type: "decision"; key: string; paths: { k: string; when: string }[]; ask: string }
  | { type: "tool"; tool: "viabilidade" | "validador" | "plano"; key: string; intro: string }
  /** Sort items into categories, then reveal a suggested reading for each. */
  | { type: "classify"; key: string; prompt: string; categories: string[]; items: { t: string; a: string; why?: string }[] }
  /** Add names/items under fixed groups (network mapper, relationship tracker, task inventory). */
  | { type: "groups"; key: string; title: string; help?: string; groups: string[]; ph?: string };

export type Module = {
  key: string;
  title: string;
  question: string;
  blocks: Block[];
  output: { key: string; title: string };
  community: string;
  next: string;
};

export type Category = "Negócios" | "Vendas" | "Networking" | "Tecnologia & IA" | "Dinheiro" | "Carreira";

export type Course = {
  slug: string;
  title: string;
  thesis: string;
  category: Category;
  gestor?: string; // gestor slug (src/lib/gestores.ts); omitted when not yet defined
  difficulty: string;
  commitment: string;
  project: string; // name of the project the member builds ("Meu negócio")
  outcomes: string[];
  tools: string[];
  modules: Module[];
  finalPlan: { title: string; sections: { t: string; keys: string[] }[] };
  /** Rule-based "continue construindo" suggestions. */
  next: { slug: string; why: string }[];
};

/** Keys a member must save for a module to count as done. Videos are always optional. */
export function requiredKeys(m: Module): string[] {
  return m.blocks.flatMap((b) => ("key" in b ? [b.key] : []));
}
