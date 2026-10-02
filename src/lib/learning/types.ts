/** Data-driven learning engine. Courses are composed of modules made of reusable blocks. */
export type Field = { k: string; l: string; ph?: string; multiline?: boolean; options?: string[] };

export type Block =
  | { type: "text"; title?: string; body: string }
  | { type: "question"; key: string; prompt: string; help?: string }
  | { type: "fields"; key: string; title: string; help?: string; fields: Field[] }
  | { type: "choices"; key: string; prompt: string; options: string[]; multi?: boolean }
  | { type: "video"; title: string; duration?: string; provider?: string; ref?: string }
  | { type: "compare"; before: string; after: string; title?: string }
  | { type: "scenarios"; key: string; intro: string; items: string[]; framework: string[] }
  | { type: "list"; key: string; title: string; max: number; fields: Field[]; statusLabel: string; statuses: string[] }
  | { type: "decision"; key: string; paths: { k: string; when: string }[]; ask: string }
  | { type: "tool"; tool: "viabilidade" | "validador" | "plano"; key: string; intro: string };

export type Module = {
  key: string;
  title: string;
  question: string;
  intro?: string;
  blocks: Block[];
  output: { key: string; title: string };
  community: string;
  next: string;
};

export type Course = {
  slug: string;
  title: string;
  thesis: string;
  gestor: string; // gestor slug (src/lib/gestores.ts)
  difficulty: string;
  commitment: string;
  outcomes: string[];
  tools: string[];
  modules: Module[];
  finalPlan: { title: string; sections: { t: string; keys: string[] }[] };
};

/** Keys a member must save for a module to count as done (videos without a source are optional). */
export function requiredKeys(m: Module): string[] {
  return m.blocks.flatMap((b) => {
    if (b.type === "video") return b.ref ? [`${m.key}.video`] : [];
    if ("key" in b && b.type !== "tool") return [b.key];
    if (b.type === "tool") return [b.key];
    return [];
  });
}
