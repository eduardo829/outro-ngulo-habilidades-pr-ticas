import type { Block, Module } from "./types";

type C = { title: string; what: string; why: string; example: string; mistake: string };

/** Compact module builder: written concept + optional video placeholder + practical exercises. Output = first exercise key. */
export function mod(key: string, title: string, question: string, c: C, video: string | null, exercises: Block[], output: string, community: string, next: string): Module {
  const first = exercises.find((b) => "key" in b) as { key: string } | undefined;
  return {
    key, title, question,
    blocks: [{ type: "concept", ...c }, ...(video ? [{ type: "video", title: video } as Block] : []), ...exercises],
    output: { key: first?.key ?? key, title: output },
    community, next,
  };
}
