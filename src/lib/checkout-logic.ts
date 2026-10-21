import { z } from "zod";

/**
 * Data the Payment Brick sends. Unknown fields (e.g. amount, raw card data) are accepted and STRIPPED by zod;
 * buildPaymentBody copies only allowlisted fields, so nothing extra ever reaches Mercado Pago. Card needs a token; Pix does not.
 */
export const brickSchema = z
  .object({
    payment_method_id: z
      .string()
      .min(1)
      .max(40)
      .regex(/^[a-z0-9_]+$/),
    token: z.string().min(1).max(200).optional(),
    issuer_id: z.union([z.string().max(40), z.number()]).optional(),
    installments: z.number().int().min(1).max(12).optional(),
    transaction_amount: z.number().optional(), // ignored: amount always comes from the database
    payment_method_option_id: z.string().max(80).optional(),
    processing_mode: z.string().max(40).optional(),
    payer: z.object({
      email: z.string().email().max(255),
      identification: z
        .object({
          type: z.string().max(10),
          number: z
            .string()
            .max(20)
            .regex(/^[0-9A-Za-z.\-/]*$/),
        })
        .optional(),
      first_name: z.string().max(80).optional(),
      last_name: z.string().max(80).optional(),
    }),
  })
  .superRefine((d, ctx) => {
    if (d.payment_method_id !== "pix" && !d.token)
      ctx.addIssue({ code: "custom", path: ["token"], message: "token obrigatório para cartão" });
  });
export type BrickData = z.infer<typeof brickSchema>;

/** Splits a display name into first/last for Mercado Pago antifraud (only real data we already have). */
export function splitName(name: string | null | undefined): { first_name?: string; last_name?: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  const first_name = (parts[0] ?? "").slice(0, 80);
  const last_name = parts.slice(1).join(" ").slice(0, 80);
  return last_name ? { first_name, last_name } : { first_name };
}

/** Device fingerprint from Mercado Pago security.js; sent as X-meli-session-id. */
export const deviceIdSchema = z
  .string()
  .max(200)
  .regex(/^[A-Za-z0-9_:.-]+$/)
  .optional();

export function buildPaymentBody(
  p: { id: string; amount_cents: number },
  fd: BrickData,
  o: {
    title: string;
    notificationUrl: string;
    attemptId?: string;
    slug?: string;
    payerName?: string | null;
    registeredAt?: string | null;
  },
) {
  const isPix = fd.payment_method_id === "pix";
  const name = {
    ...splitName(o.payerName),
    ...(fd.payer.first_name ? { first_name: fd.payer.first_name } : {}),
    ...(fd.payer.last_name ? { last_name: fd.payer.last_name } : {}),
  };
  const unit = p.amount_cents / 100;
  return {
    transaction_amount: unit,
    description: o.title.slice(0, 120),
    payment_method_id: fd.payment_method_id,
    external_reference: p.id,
    ...(o.attemptId ? { metadata: { checkout_attempt_id: o.attemptId } } : {}),
    notification_url: o.notificationUrl,
    statement_descriptor: "OUTRO ANGULO",
    payer: {
      email: fd.payer.email,
      ...name,
      ...(fd.payer.identification ? { identification: fd.payer.identification } : {}),
    },
    additional_info: {
      items: [
        {
          id: (o.slug ?? p.id).slice(0, 120),
          title: o.title.slice(0, 120),
          description: `Curso online: ${o.title}`.slice(0, 250),
          category_id: "learnings",
          quantity: 1,
          unit_price: unit,
        },
      ],
      payer: {
        ...name,
        ...(o.registeredAt ? { registration_date: o.registeredAt } : {}),
      },
    },
    ...(isPix
      ? {}
      : {
          token: fd.token,
          installments: fd.installments ?? 1,
          ...(fd.issuer_id != null ? { issuer_id: String(fd.issuer_id) } : {}),
        }),
  };
}

/** X-Idempotency-Key: two dash-less UUIDs = 64 chars (Mercado Pago limit is 64). */
export const idempotencyKey = (purchaseId: string, attemptId: string) =>
  `${purchaseId.replace(/-/g, "")}${attemptId.replace(/-/g, "")}`.slice(0, 64);

/** Buy CTA: always the checkout route itself; the _authenticated gate sends visitors to login with the full return URL. */
export const buyTarget = (slug: string) => ({ to: "/checkout/$slug" as const, params: { slug } });

/** Mercado Pago payment statuses that are still open (or already successful): no new charge may be created. */
const OPEN_MP = new Set(["pending", "in_process", "authorized", "in_mediation", "approved"]);
/** Given the latest MP payment for a purchase (or none), decide how a new submit may proceed. */
export function attemptPolicy(latestMpStatus: string | null): "same_key" | "block" | "new_attempt" {
  if (latestMpStatus == null) return "same_key";
  return OPEN_MP.has(latestMpStatus) ? "block" : "new_attempt";
}

export type PayResult = { status: string; pix?: { qr_code: string } | null } | null;
/** UI phase after a pay call. null = request failed in transit: a charge may exist, so we verify instead of claiming rejection. */
export function phaseAfterPay(
  r: PayResult,
): "paid" | "pix" | "pending" | "rejected" | "verifying" | "cooldown" {
  if (!r) return "verifying";
  if (r.status === "cooldown") return "cooldown";
  if (r.status === "paid") return "paid";
  if (r.status === "pending") return r.pix?.qr_code ? "pix" : "pending";
  if (r.status === "failed" || r.status === "cancelled") return "rejected";
  return "verifying";
}
/** A fresh attemptId (new idempotency key) is allowed only after a confirmed rejection. */
export const canStartNewAttempt = (status: string) => status === "failed" || status === "cancelled";

export type PayStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded";
export function mapPaymentStatus(
  pay: { status: string; transaction_amount?: number | undefined; currency_id?: string },
  amountCents: number,
  currency = "BRL",
): PayStatus {
  const amountOk =
    pay.currency_id === currency && pay.transaction_amount != null && Number.isFinite(pay.transaction_amount) &&
    amountCents > 0 && Math.round(pay.transaction_amount * 100) === amountCents;
  if (pay.status === "approved") return amountOk ? "paid" : "pending";
  if (pay.status === "refunded" || pay.status === "charged_back") return "refunded";
  if (pay.status === "rejected") return "failed";
  if (pay.status === "cancelled") return "cancelled";
  return "pending";
}

/** UI state for return pages: anything not confirmed by the server stays "checking". */
export function returnView(status: string): "checking" | "paid" | "pending" | "failed" {
  if (status === "paid") return "paid";
  if (status === "pending") return "pending";
  if (status === "failed" || status === "cancelled" || status === "refunded") return "failed";
  return "checking";
}

/**
 * Maps a re-read Stripe Checkout Session to a purchase status. "paid" requires payment_status "paid"
 * AND the exact amount/currency stored in the purchase row — a mismatched amount never unlocks access.
 */
export function stripeSessionStatus(
  s: { status?: string; payment_status?: string; amount_total?: number; currency?: string },
  amountCents: number,
  currency = "BRL",
): "paid" | "pending" | "failed" | "cancelled" {
  if (s.status === "expired") return "cancelled";
  if (s.payment_status === "paid") {
    const ok =
      s.currency === currency.toLowerCase() &&
      s.amount_total != null &&
      Number.isFinite(s.amount_total) &&
      amountCents > 0 &&
      s.amount_total === amountCents;
    return ok ? "paid" : "pending"; // wrong amount: never grant, keep verifying
  }
  return "pending";
}

/** Card cooldown after a failed card payment: only issuer/antifraud rejections; typing errors (CVV, expiry, number) retry at once. */
export const CARD_COOLDOWN_MS = 5 * 60_000;
export function cooldownApplies(statusDetail: string | null | undefined): boolean {
  if (!statusDetail || !statusDetail.startsWith("cc_rejected_")) return false;
  return !statusDetail.startsWith("cc_rejected_bad_filled_");
}
/** Same card = same method + first 6 + last 4 digits (no full number ever exists server-side). */
export async function cardFingerprint(method: string, first6: string, last4: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${method}|${first6}|${last4}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
