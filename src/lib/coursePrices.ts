import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Commerce data per course (admin-editable in public.courses), keyed by slug. Pricing is never hardcoded in UI. */
export type CourseCommerce = {
  id: string; slug: string; price_cents: number | null; currency: string; sale_price_cents: number | null;
  sale_start: string | null; sale_end: string | null; is_free: boolean; is_purchasable: boolean;
  preview_enabled: boolean; preview_module_key: string | null;
};

export function useCourseCommerce() {
  return useQuery({
    queryKey: ["course-commerce"],
    queryFn: async () => {
      const { data } = await supabase.from("courses")
        .select("id, slug, price_cents, currency, sale_price_cents, sale_start, sale_end, is_free, is_purchasable, preview_enabled, preview_module_key");
      return Object.fromEntries((data ?? []).map((r) => [r.slug, r as CourseCommerce])) as Record<string, CourseCommerce>;
    },
    staleTime: 60_000,
  });
}

/** Back-compat: slug → effective price in cents. */
export function useCoursePrices() {
  const q = useCourseCommerce();
  return { ...q, data: q.data ? Object.fromEntries(Object.entries(q.data).map(([k, v]) => [k, effectivePrice(v)])) : undefined };
}

/** Sale price applies only inside its real window. */
export function effectivePrice(c: CourseCommerce | undefined): number | null {
  if (!c) return null;
  if (c.is_free) return 0;
  const now = Date.now();
  const onSale = c.sale_price_cents != null && (!c.sale_start || Date.parse(c.sale_start) <= now) && (!c.sale_end || Date.parse(c.sale_end) >= now);
  return onSale ? c.sale_price_cents : c.price_cents;
}

export const brl = (cents: number | null | undefined) =>
  cents == null ? null : cents === 0 ? "Gratuito" : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 ? 2 : 0 });

/** Member's course ownership (active enrollments) and saved-work counts, for catalogue and Meus cursos. */
export function useMyLearning(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-learning", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [en, out, int] = await Promise.all([
        supabase.from("enrollments").select("course_id, status, last_accessed_at").eq("user_id", userId!),
        supabase.from("learning_outputs").select("course_id, key, updated_at").eq("user_id", userId!),
        supabase.from("course_interest").select("course_id").eq("user_id", userId!),
      ]);
      const owned = new Set((en.data ?? []).filter((e) => e.status === "active").map((e) => e.course_id));
      const keys: Record<string, string[]> = {}; const last: Record<string, string> = {};
      for (const r of out.data ?? []) { (keys[r.course_id] ??= []).push(r.key); if (!last[r.course_id] || r.updated_at > last[r.course_id]!) last[r.course_id] = r.updated_at; }
      return { owned, keys, last, interest: new Set((int.data ?? []).map((r) => r.course_id)) };
    },
  });
}
