import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminReport } from "./report-types";

const Input = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  withAnalysis: z.boolean().default(true),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Acesso restrito à administração.");
}

async function buildReport(from: string, to: string, withAnalysis: boolean): Promise<AdminReport> {
  const start = new Date(`${from}T00:00:00-03:00`);
  const end = new Date(`${to}T23:59:59.999-03:00`);
  if (!(start <= end)) throw new Error("Período inválido.");
  if (end.getTime() - start.getTime() > 366 * 86400000) throw new Error("Escolha um período de até 1 ano.");
  const s = start.toISOString(), e = end.toISOString();
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  const users: { created_at: string; email_confirmed_at?: string | null; last_sign_in_at?: string | null }[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Falha ao ler contas.");
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const inRange = (d?: string | null) => !!d && d >= s && d <= e;

  const [courses, purchases, enrollments, interest, spend] = await Promise.all([
    db.from("courses").select("id, title"),
    db.from("purchases").select("course_id, payment_status, payment_provider, amount_cents, origin, provider_status, created_at").gte("created_at", s).lte("created_at", e),
    db.from("enrollments").select("course_id, status, created_at, last_accessed_at"),
    db.from("course_interest").select("course_id, created_at").gte("created_at", s).lte("created_at", e),
    db.from("ai_spend").select("feature, requests, est_cost_cents, day").gte("day", from).lte("day", to),
  ]);
  for (const r of [courses, purchases, enrollments, interest, spend]) if (r.error) throw new Error("Falha ao ler os dados do relatório.");
  const title = (id: string | null) => courses.data!.find((c) => c.id === id)?.title ?? "Outro";

  const paid = purchases.data!.filter((p) => p.payment_status === "paid");
  const failed = purchases.data!.filter((p) => p.payment_status === "failed" || p.payment_status === "cancelled");
  const pending = purchases.data!.filter((p) => p.payment_status === "pending");
  const group = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number = () => 1) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const active = enrollments.data!.filter((x) => x.status === "active");
  const staleCut = new Date(end.getTime() - 14 * 86400000).toISOString();

  const report: AdminReport = {
    from, to, generatedAt: new Date().toISOString(),
    sales: {
      paidCount: paid.length,
      revenueCents: paid.reduce((t, p) => t + (p.amount_cents ?? 0), 0),
      byCourse: group(paid, (p) => title(p.course_id)),
      byOrigin: group(paid, (p) => p.origin || "direto / sem origem"),
      failedCount: failed.length,
      failedReasons: group(failed, (p) => reason(p.provider_status, p.payment_status)),
      pendingCount: pending.length,
    },
    accounts: {
      total: users.length,
      newCount: users.filter((u) => inRange(u.created_at)).length,
      newConfirmed: users.filter((u) => inRange(u.created_at) && u.email_confirmed_at).length,
      signedInInPeriod: users.filter((u) => inRange(u.last_sign_in_at)).length,
    },
    learning: {
      activeEnrollments: active.length,
      newEnrollments: active.filter((x) => inRange(x.created_at)).length,
      neverAccessed: active.filter((x) => !x.last_accessed_at).length,
      inactive14d: active.filter((x) => x.last_accessed_at && x.last_accessed_at < staleCut).length,
      interest: group(interest.data!, (i) => title(i.course_id)),
    },
    ai: {
      requests: spend.data!.reduce((t, r) => t + (r.requests ?? 0), 0),
      estCostCents: spend.data!.reduce((t, r) => t + Number(r.est_cost_cents ?? 0), 0),
      byFeature: group(spend.data!, (r) => r.feature, (r) => r.requests ?? 0),
    },
    analysis: null,
  };
  if (withAnalysis) report.analysis = await analyze(report);
  return report;
}

const REASONS: Record<string, string> = {
  cc_rejected_high_risk: "Recusado pelo antifraude",
  cc_rejected_insufficient_amount: "Limite insuficiente",
  cc_rejected_bad_filled_security_code: "CVV inválido",
  cc_rejected_call_for_authorize: "Banco pediu autorização",
  cc_rejected_other_reason: "Recusado pelo banco",
};
function reason(provider: string | null, status: string) {
  if (provider?.startsWith("session/") && provider.includes("expired")) return "Checkout abandonado (expirou sem pagar)";
  const code = provider?.split("/").pop() ?? "";
  return REASONS[code] ?? (status === "cancelled" ? "Cancelado" : "Recusado (outro motivo)");
}

async function analyze(r: AdminReport): Promise<string[] | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const { analysis: _a, ...facts } = r;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra", max_output_tokens: 900, store: false,
        instructions: `Você escreve a leitura do relatório interno da plataforma Outro Ângulo para a administração. Use SOMENTE os números do JSON; não invente dados, causas ou comparações com períodos que não estão no JSON. Valores em centavos de real. Escreva de 3 a 6 observações curtas em português brasileiro: o que aconteceu e pontos de atenção. Não dê ordens nem recomende decisões. Responda SOMENTE JSON: {"points":["..."]}`,
        input: JSON.stringify(facts),
        text: { format: { type: "json_object" } },
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const txt: string = j.output_text ?? (j.output ?? []).flatMap((o: { content?: { text?: string }[] }) => o.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    const points = (JSON.parse(txt).points ?? []).slice(0, 6).map((p: unknown) => String(p).slice(0, 400));
    return points.length ? points : null;
  } catch (e) {
    console.error("report analysis", e);
    return null;
  }
}

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return buildReport(data.from, data.to, data.withAnalysis);
  });

/** Sends the report only to the signed-in admin's own e-mail. */
export const emailMyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const email = (context.claims as { email?: string }).email;
    if (!email) throw new Error("Sua conta não tem e-mail.");
    const report = await buildReport(data.from, data.to, data.withAnalysis);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const res = await sendTemplateEmail("admin-report", email, {
      templateData: { report },
      idempotencyKey: `admin-report-${context.userId}-${data.from}-${data.to}-${report.generatedAt.slice(0, 16)}`,
    });
    return { sent: res.sent, email };
  });
