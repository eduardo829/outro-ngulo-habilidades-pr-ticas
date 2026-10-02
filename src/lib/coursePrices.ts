import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Per-course price (editable in admin), keyed by slug. */
export function useCoursePrices() {
  return useQuery({
    queryKey: ["course-prices"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("slug, price_cents");
      return Object.fromEntries((data ?? []).map((r) => [r.slug, r.price_cents])) as Record<string, number | null>;
    },
    staleTime: 60_000,
  });
}

export const brl = (cents: number | null | undefined) =>
  cents == null ? null : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 ? 2 : 0 });
