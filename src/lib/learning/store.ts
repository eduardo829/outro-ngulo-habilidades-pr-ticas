import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";

export type Outputs = Record<string, unknown>;

/** Course row (RLS: visible when published, enrolled or admin) + enrollment/staff access. */
export function useEngineAccess(slug: string) {
  const { user, isStaff } = useAuth();
  return useQuery({
    queryKey: ["engine-access", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: course } = await supabase.from("courses").select("id, title").eq("slug", slug).maybeSingle();
      if (!course) return { courseId: null, allowed: false };
      const { data: en } = await supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", user!.id).maybeSingle();
      return { courseId: course.id, allowed: en?.status === "active" || isStaff };
    },
  });
}

export function useOutputs(courseId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["outputs", courseId, user?.id],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase.from("learning_outputs").select("key, value").eq("course_id", courseId!).eq("user_id", user!.id);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Outputs;
    },
  });
}

export function useSaveOutput(courseId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase.from("learning_outputs").upsert({ user_id: user!.id, course_id: courseId!, key, value: value as Json, updated_at: new Date().toISOString() });
      if (error) throw error;
      return { key, value };
    },
    onSuccess: ({ key, value }) => qc.setQueryData<Outputs>(["outputs", courseId, user?.id], (o) => ({ ...(o ?? {}), [key]: value })),
  });
}

export function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v as object).some(hasValue);
  return true;
}
