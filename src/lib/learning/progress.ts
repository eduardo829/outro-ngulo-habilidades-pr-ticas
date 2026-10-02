import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { COURSES_ENGINE } from "./courses";
import { hasValue, type Outputs } from "./store";
import { requiredKeys, type Course } from "./types";

export type CourseProgress = { course: Course; done: number; total: number; outputs: number; nextKey: string; started: boolean };

/** The signed-in member's saved work across all engine courses (own rows only, RLS). */
export function useMyProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-projects", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CourseProgress[]> => {
      const { data: courses } = await supabase.from("courses").select("id, slug").in("slug", COURSES_ENGINE.map((c) => c.slug));
      const { data: rows, error } = await supabase.from("learning_outputs").select("course_id, key, value").eq("user_id", user!.id);
      if (error) throw error;
      return COURSES_ENGINE.map((course) => {
        const id = courses?.find((x) => x.slug === course.slug)?.id;
        const o: Outputs = Object.fromEntries((rows ?? []).filter((r) => r.course_id === id).map((r) => [r.key, r.value]));
        const states = course.modules.map((m) => { const req = requiredKeys(m); return req.length > 0 && req.every((k) => hasValue(o[k])); });
        const next = course.modules.find((_, i) => !states[i]) ?? course.modules[0]!;
        return { course, done: states.filter(Boolean).length, total: course.modules.length, outputs: course.modules.filter((m) => hasValue(o[m.output.key])).length, nextKey: next.key, started: Object.keys(o).length > 0 };
      }).filter((p) => p.started);
    },
  });
}
