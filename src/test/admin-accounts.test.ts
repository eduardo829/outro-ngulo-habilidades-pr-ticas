import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), listUsers: vi.fn(), from: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { auth: { admin: { listUsers: mocks.listUsers } }, from: mocks.from } }));
import { listAccounts } from "@/lib/admin.functions";
const list = listAccounts as unknown as (args: { context: { userId: string; supabase: { rpc: typeof mocks.rpc } } }) => Promise<Array<{ id: string; email_confirmed_at: string | null; last_sign_in_at: string | null }>>;
const args = { context: { userId: "admin", supabase: { rpc: mocks.rpc } } };
beforeEach(() => { vi.resetAllMocks(); mocks.rpc.mockResolvedValue({ data: true }); mocks.from.mockReturnValue({ select: async () => ({ data: [] }) }); });
describe("admin account inspection", () => {
  it("refuses non-admin users before accessing account emails", async () => {
    mocks.rpc.mockResolvedValue({ data: false });
    await expect(list(args)).rejects.toThrow("Acesso restrito");
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });
  it("includes new users beyond the first 1000 and orders newest first", async () => {
    mocks.listUsers.mockResolvedValueOnce({ data: { users: Array.from({ length: 1000 }, (_, i) => ({ id: `old-${i}`, created_at: "2026-10-01T00:00:00Z" })) } }).mockResolvedValueOnce({ data: { users: [{ id: "new", created_at: "2026-10-23T14:00:00Z", email_confirmed_at: "2026-10-23T14:01:00Z", last_sign_in_at: "2026-10-23T14:02:00Z" }] } });
    const result = await list(args);
    expect(result).toHaveLength(1001);
    expect(result[0]).toMatchObject({ id: "new", email_confirmed_at: "2026-10-23T14:01:00Z", last_sign_in_at: "2026-10-23T14:02:00Z" });
    expect(mocks.listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
  });
});