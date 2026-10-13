// Server-only AI allowance checks. All limits are enforced atomically in Postgres (ai_consume).
export type AiFeature = "assistant" | "trilhas" | "outro_angulo";
export type AiQuota = {
  allowed: boolean;
  reason: null | "budget" | "messages" | "time" | "ip" | "rate" | "unavailable";
  member?: boolean;
  limit?: number;
  remaining?: number;
  session_minutes?: number;
  session_ends_at?: string | null;
  resets_at?: string;
};

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function ipHash(request: Request) {
  const salt = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}|${clientIp(request)}`));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Fails closed: any error means "not allowed". */
export async function aiQuota(request: Request, userId: string | null, feature: AiFeature, commit: boolean): Promise<AiQuota> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("ai_consume", {
      _user: userId as string,
      _ip_hash: await ipHash(request),
      _feature: feature,
      _commit: commit,
    });
    if (error || !data) {
      console.error("ai_consume failed", error?.message);
      return { allowed: false, reason: "unavailable" };
    }
    return data as unknown as AiQuota;
  } catch (e) {
    console.error("ai_consume error", e);
    return { allowed: false, reason: "unavailable" };
  }
}

export function quotaMessage(q: AiQuota): string {
  const when = q.resets_at
    ? new Date(q.resets_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    : "amanhã";
  switch (q.reason) {
    case "rate": return "Muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.";
    case "budget": return "As ferramentas de IA atingiram o limite de uso de hoje. Voltam a funcionar a partir de " + when + " (horário de Brasília).";
    case "unavailable": return "As ferramentas de IA estão indisponíveis no momento. Tente de novo mais tarde.";
    case "time": return `Seu tempo de IA de hoje acabou. Ele volta a partir de ${when} (horário de Brasília).`;
    default:
      return q.member
        ? `Você usou todas as mensagens de IA de hoje. Elas voltam a partir de ${when} (horário de Brasília).`
        : `Você usou as perguntas gratuitas de hoje. [Crie sua conta gratuita](/auth) para ter mais mensagens por dia, ou volte a partir de ${when} (horário de Brasília).`;
  }
}
