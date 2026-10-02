import { requiredKeys, type Course } from "./types";

export type CourseState = "locked" | "owned" | "in_progress" | "completed";

/** Ownership (enrollment) is separate from progress (saved work). */
export function courseState(c: Course, owned: boolean, savedKeys: string[] = []): CourseState {
  if (!owned) return "locked";
  const s = new Set(savedKeys);
  const done = c.modules.filter((m) => { const r = requiredKeys(m); return r.length > 0 && r.every((k) => s.has(k)); }).length;
  if (done === c.modules.length) return "completed";
  return s.size > 0 ? "in_progress" : "owned";
}

export const ctaLabel: Record<CourseState, string> = {
  locked: "Conhecer curso", owned: "Começar curso", in_progress: "Continuar curso", completed: "Revisar curso",
};
