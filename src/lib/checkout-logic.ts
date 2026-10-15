import { z } from "zod";

/** Data the Payment Brick sends. Strict: raw card data (number, CVV) is rejected — only the Brick token is accepted. */
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
    payer: z
      .object({
        email: z.string().email().max(255),
        identification: z
          .object({
            type: z.string().max(10),
            number: z
              .string()
              .max(20)
              .regex(/^[0-9A-Za-z.\-/]*$/),
          })
          .strict()
          .optional(),
        first_name: z.string().max(80).optional(),
        last_name: z.string().max(80).optional(),
      })
      .strict(),
  })
  .strict();
export type BrickData = z.infer<typeof brickSchema>;

export function buildPaymentBody(
  p: { id: string; amount_cents: number },
  fd: BrickData,
  o: { title: string; notificationUrl: string },
) {
  const isPix = fd.payment_method_id === "pix";
  return {
    transaction_amount: p.amount_cents / 100,
    description: o.title.slice(0, 120),
    payment_method_id: fd.payment_method_id,
    external_reference: p.id,
    notification_url: o.notificationUrl,
    statement_descriptor: "OUTRO ANGULO",
    payer: {
      email: fd.payer.email,
      ...(fd.payer.identification ? { identification: fd.payer.identification } : {}),
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
export function phaseAfterPay(r: PayResult): "paid" | "pix" | "pending" | "rejected" | "verifying" {
  if (!r) return "verifying";
  if (r.status === "paid") return "paid";
  if (r.status === "pending") return r.pix?.qr_code ? "pix" : "pending";
  if (r.status === "failed" || r.status === "cancelled") return "rejected";
  return "verifying";
}
/** A fresh attemptId (new idempotency key) is allowed only after a confirmed rejection. */
export const canStartNewAttempt = (status: string) => status === "failed" || status === "cancelled";

export type PayStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded";
export function mapPaymentStatus(
  pay: { status: string; transaction_amount?: number | undefined },
  amountCents: number,
): PayStatus {
  const amountOk =
    pay.transaction_amount != null && Math.round(pay.transaction_amount * 100) === amountCents;
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
