import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), getSession: vi.fn(), applySession: vi.fn(), createSession: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain = {
      middleware: () => chain,
      inputValidator: () => chain,
      handler: (fn: unknown) => fn,
    };
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/stripe.server", () => ({
  stripeGetSession: mocks.getSession, applyStripeSession: mocks.applySession,
  stripeCreateSession: mocks.createSession,
}));

import { getCheckout, createStripeCheckout } from "@/lib/checkout.functions";

const purchase = { id: "11111111-1111-4111-8111-111111111111", amount_cents: 12700, provider_status: "session/cs_live_existing" };
const session = { id: "cs_live_existing", client_reference_id: purchase.id, status: "open", payment_status: "unpaid", amount_total: 12700, currency: "brl", url: "https://checkout.stripe.com/c/pay/existing" };
const args = { data: { slug: "corretor-na-pratica", origin: "https://outroangulo.com" }, context: { userId: "buyer", claims: {} } };
// The real handlers run with only their external database/Stripe boundaries replaced.
const checkout = getCheckout as unknown as (input: typeof args) => Promise<{ state: string }>;
const pay = createStripeCheckout as unknown as (input: typeof args) => Promise<{ checkout_url: string }>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation((table: string) => {
    const result = table === "courses"
      ? { data: { id: "course", slug: args.data.slug, title: "Corretor na prática", status: "published", is_purchasable: true, is_free: false, price_cents: 12700 } }
      : table === "purchases" ? { data: purchase } : { data: null };
    const query = {
      select: () => query, eq: () => query, order: () => query, limit: () => query,
      maybeSingle: async () => result, range: async () => ({ data: [], error: null }),
    };
    return query;
  });
  mocks.getSession.mockResolvedValue(session);
  mocks.applySession.mockResolvedValue("pending");
});

describe("authenticated Stripe checkout resumption", () => {
  it("restores the payable state after abandoning an open unpaid R$127 session", async () => {
    expect(await checkout(args)).toMatchObject({ state: "ready", amount_cents: 12700 });
  });
  it("reuses the exact existing checkout URL without creating a second session or purchase", async () => {
    expect(await pay(args)).toEqual({ checkout_url: session.url });
    expect(mocks.getSession).toHaveBeenCalledWith(session.id);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
  it("keeps a completed unpaid async payment in confirmation", async () => {
    mocks.getSession.mockResolvedValue({ ...session, status: "complete" });
    expect(await checkout(args)).toMatchObject({ state: "stripe-pending", purchaseId: purchase.id });
  });
  it("rejects a new charge while a complete unpaid payment is pending", async () => {
    mocks.getSession.mockResolvedValue({ ...session, status: "complete" });
    await expect(pay(args)).rejects.toThrow("pagamento em análise");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
  it("does not enable checkout on an unverified session", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect(await checkout(args)).toMatchObject({ state: "stripe-pending" });
    await expect(pay(args)).rejects.toThrow("verificar seu pagamento");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});