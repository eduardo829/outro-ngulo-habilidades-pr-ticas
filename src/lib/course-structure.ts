import { supabase } from "@/integrations/supabase/client";

export async function fetchCourseStructure(courseId: string, userId: string) {
  const [{ data: modules }, { data: outline }, { data: done }, { data: enr }] = await Promise.all([
    supabase.from("modules").select("id, title, activity, position").eq("course_id", courseId).order("position"),
    supabase.rpc("course_outline", { _course: courseId }),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId).eq("course_id", courseId),
    supabase.from("enrollments").select("id").eq("user_id", userId).eq("course_id", courseId).eq("status", "active").maybeSingle(),
  ]);
  const mods = modules ?? [];
  const order = new Map(mods.map((m) => [m.id, m.position]));
  const lessons = (outline ?? []).slice().sort(
    (a, b) => (order.get(a.module_id) ?? 0) - (order.get(b.module_id) ?? 0) || a.pos - b.pos,
  );
  const completed = new Set((done ?? []).map((d) => d.lesson_id));
  return { modules: mods, lessons, completed, enrolled: !!enr };
}
