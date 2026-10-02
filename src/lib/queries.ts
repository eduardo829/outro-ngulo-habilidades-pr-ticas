import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Founder = { name: string; bio: string; photo_url: string | null };
export type Offer = { price_cents: number; label: string; payments_enabled: boolean };

export const publishedCoursesQuery = queryOptions({
  queryKey: ["courses", "published"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, subtitle, cover_url, level, duration_text, instructor")
      .eq("status", "published")
      .eq("is_public", true)
      .order("position");
    if (error) throw error;
    return data;
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) throw error;
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    return {
      founders: (map["founders"] ?? []) as Founder[],
      offer: (map["offer"] ?? { price_cents: 9900, label: "Pagamento único", payments_enabled: false }) as Offer,
      support: (map["support"] ?? {}) as { email: string | null; note?: string },
    };
  },
});

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
