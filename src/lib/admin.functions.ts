import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lists accounts (with e-mail) for admins only. E-mails never leave this admin path. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito à administração.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users: import("@supabase/supabase-js").User[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Falha ao listar contas");
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    return users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      email_confirmed_at: u.email_confirmed_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      display_name: profiles?.find((p) => p.id === u.id)?.display_name ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
    })).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  });
