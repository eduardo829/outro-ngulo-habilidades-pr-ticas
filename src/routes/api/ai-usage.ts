import { createFileRoute } from "@tanstack/react-router";
import { aiQuota } from "@/lib/ai-limits.server";

// Read-only allowance status for the current visitor/member (does not consume).
export const Route = createFileRoute("/api/ai-usage")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let userId: string | null = null;
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (token) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin.auth.getUser(token);
          userId = data.user?.id ?? null;
        }
        const q = await aiQuota(request, userId, "assistant", false);
        return new Response(JSON.stringify(q), { headers: { "content-type": "application/json", "cache-control": "private, no-store" } });
      },
    },
  },
});
