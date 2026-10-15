import { z } from "zod";

/** Data the Payment Brick sends. Strict: raw card data (number, CVV) is rejected — only the Brick token is accepted. */
export const brickSchema = z.object({
  payment_method_id: z.string().min(1).max(40).regex(/^[a-z0-9_]+$/),
  token: z.string().min(1).max(200).optional(),
  issuer_id: z.union([z.string().max(40), z.number()]).optional(),
  installments: z.number().int().min(1).max(12).optional(),
  transaction_amount: z.number().optional(), // ignored: amount always comes from the database
  payment_method_option_id: z.string().max(80).optional(),
  processing_mode: z.string().max(40).optional(),
  payer: z.object({
    email: z.string().email().max(255),
    identification: z.object({ type: z.string().max(10), number: z.string().max(20).regex(/^[0-9A-Za-z.\-/]*$/) }).strict().optional(),
    first_name: z.string().max(80).optional(),
    last_name: z.string().max(80).optional(),
  }).strict(),
}).strict();
export type BrickData = z.infer<typeof brickSchema>;

export function buildPaymentBody(p: { id: string; amount_cents: number }, fd: BrickData, o: { title: string; notificationUrl: string }) {
  const isPix = fd.payment_method_id === "pix";
  return {
    transaction_amount: p.amount_cents / 100,
    description: o.title.slice(0, 120),
    payment_method_id: fd.payment_method_id,
    external_reference: p.id,
    notification_url: o.notificationUrl,
    statement_descriptor: "OUTRO ANGULO",
    payer: { email: fd.payer.email, ...(fd.payer.identification ? { identification: fd.payer.identification } : {}) },
    ...(isPix ? {} : {
      token: fd.token,
      installments: fd.installments ?? 1,
      ...(fd.issuer_id != null ? { issuer_id: String(fd.issuer_id) } : {}),
    }),
  };
}

export const idempotencyKey = (purchaseId: string, attemptId: string) => `oa-${purchaseId}-${attemptId}`;

export type PayStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded";
export function mapPaymentStatus(pay: { status: string; transaction_amount?: number | undefined }, amountCents: number): PayStatus {
  const amountOk = pay.transaction_amount != null && Math.round(pay.transaction_amount * 100) === amountCents;
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
