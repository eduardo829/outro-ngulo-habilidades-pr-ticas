import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { proposalSchema, overLimit } from "./partners";

async function optionalUserId(): Promise<string | null> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
  return data.user?.id ?? null;
}

/** Public partnership form. Validated, honeypot + hourly limits per network address and e-mail; stored for admins only. */
export const submitPartnerProposal = createServerFn({ method: "POST" })
  .inputValidator((d) => proposalSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const }; // bot: pretend success, store nothing
    const { getRequest } = await import("@tanstack/react-start/server");
    const { ipHash } = await import("./ai-limits.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = await ipHash(getRequest());
    const email = data.email.toLowerCase();
    const since = new Date(Date.now() - 3600_000).toISOString();
    const [byIp, byEmail] = await Promise.all([
      supabaseAdmin.from("partner_proposals").select("id", { count: "exact", head: true }).eq("ip_hash", ip).gte("created_at", since),
      supabaseAdmin.from("partner_proposals").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since),
    ]);
    if (overLimit(byIp.count ?? 0, byEmail.count ?? 0)) return { ok: false as const, error: "Muitos envios em pouco tempo. Tente novamente mais tarde." };
    const userId = await optionalUserId();
    let partnerName: string | null = null;
    if (data.partnerId) {
      const { data: p } = await supabaseAdmin.from("partners").select("name").eq("id", data.partnerId).eq("published", true).maybeSingle();
      partnerName = p?.name ?? null;
    }
    const { data: row, error } = await supabaseAdmin
      .from("partner_proposals")
      .insert({
        partner_id: partnerName ? data.partnerId! : null,
        name: data.name,
        email,
        company: data.company || null,
        country: data.country || null,
        area: data.area || null,
        interest: data.interest,
        proposal: data.proposal,
        link: data.link || null,
        origin: data.origin || null,
        is_member: !!userId,
        user_id: userId,
        ip_hash: ip,
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: "Não foi possível enviar agora. Tente novamente." };
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      await sendTemplateEmail("partner-proposal", "suporte@outroangulo.com", {
        idempotencyKey: `partner-proposal-${row.id}`,
        templateData: { name: data.name, interest: data.interest, partner: partnerName ?? "Outro Ângulo", company: data.company || "", member: userId ? "Membro" : "Visitante" },
      });
    } catch (e) {
      console.error("[partner-proposal] notify failed", e instanceof Error ? e.message : "");
    }
    return { ok: true as const };
  });

/** Counts an outbound click to a published partner's website (no personal data stored). */
export const trackPartnerClick = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ partnerId: z.string().uuid(), member: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("partners").select("id").eq("id", data.partnerId).eq("published", true).maybeSingle();
    if (p) await supabaseAdmin.from("partner_clicks").insert({ partner_id: p.id, is_member: data.member });
    return { ok: true };
  });
