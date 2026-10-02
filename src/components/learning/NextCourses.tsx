import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getEngineCourse } from "@/lib/learning/courses";
import type { Course } from "@/lib/learning/types";

/** Rule-based "continue construindo" suggestions defined on each course. */
export function NextCourses({ c, done }: { c: Course; done: boolean }) {
  const items = c.next.map((n) => ({ ...n, course: getEngineCourse(n.slug) })).filter((n) => n.course);
  if (!items.length) return null;
  return (
    <section className="mt-16 border-t-2 border-foreground pt-8 print:hidden">
      <p className="eyebrow">Continue construindo</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold md:text-3xl">{done ? `Você concluiu ${c.title}. E agora?` : "Depois deste curso"}</h2>
      <ul className="mt-6 grid gap-px border bg-border md:grid-cols-2">
        {items.map((n) => (
          <li key={n.slug}>
            <Link to="/cursos/$slug" params={{ slug: n.slug }} className="group block h-full bg-background p-5 transition-colors hover:bg-card">
              <p className="eyebrow">{n.course!.category}</p>
              <p className="mt-2 font-display text-xl font-extrabold group-hover:underline">{n.course!.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{n.why}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Explorar curso<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
