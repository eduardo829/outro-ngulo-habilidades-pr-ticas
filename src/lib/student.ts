import { supabase } from "@/integrations/supabase/client";

/** Enrolled courses with progress, computed from real completions. */
export async function fetchMyCourses(userId: string) {
  const { data: enr, error } = await supabase
    .from("enrollments")
    .select("course_id, last_lesson_id, last_accessed_at, courses(id, slug, title, subtitle, cover_url, status)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  const ids = (enr ?? []).map((e) => e.course_id);
  if (ids.length === 0) return [];
  const [{ data: lessons }, { data: done }] = await Promise.all([
    supabase.from("lessons").select("id, course_id, title").in("course_id", ids).eq("status", "published"),
    supabase.from("lesson_progress").select("lesson_id, course_id").eq("user_id", userId).in("course_id", ids),
  ]);
  return (enr ?? [])
    .filter((e) => e.courses)
    .map((e) => {
      const ls = (lessons ?? []).filter((l) => l.course_id === e.course_id);
      const lessonIds = new Set(ls.map((l) => l.id));
      const completed = (done ?? []).filter((d) => lessonIds.has(d.lesson_id)).length;
      return {
        ...e.courses!,
        total: ls.length,
        completed,
        pct: ls.length ? Math.round((completed / ls.length) * 100) : 0,
        lastLesson: ls.find((l) => l.id === e.last_lesson_id) ?? null,
        lastAccessed: e.last_accessed_at,
      };
    })
    .sort((a, b) => (b.lastAccessed ?? "").localeCompare(a.lastAccessed ?? ""));
}
