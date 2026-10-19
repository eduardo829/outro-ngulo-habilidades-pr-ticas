import { z } from "zod";

export const assistantInputSchema = z.object({
  messages: z.array(z.object({
    id: z.string().min(1).max(200),
    role: z.enum(["user", "assistant"]),
    parts: z.array(z.object({ type: z.literal("text"), text: z.string().max(2000) })).min(1).max(8),
  })).min(1).max(30),
}).superRefine(({ messages }, ctx) => {
  const text = messages.flatMap((m) => m.parts).map((p) => p.text).join("");
  const last = messages.at(-1);
  if (text.length > 12000 || last?.role !== "user" || !last.parts.map((p) => p.text).join("").trim()) {
    ctx.addIssue({ code: "custom", message: "Contexto inválido ou longo demais." });
  }
});

/** Read at most 64 KiB, including requests without Content-Length. */
export async function readAssistantInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const parsed = assistantInputSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}