import { Link } from "@tanstack/react-router";

type C = { slug: string; title: string; subtitle: string | null; cover_url: string | null; level?: string | null; duration_text?: string | null };

export function CourseCover({ title, cover }: { title: string; cover: string | null }) {
  if (cover) return <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />;
  return (
    <div className="relative flex aspect-[16/9] w-full items-end overflow-hidden bg-ink p-4" aria-hidden>
      <span className="absolute -right-6 -top-6 h-24 w-24 rotate-12 rounded-lg border-2 border-primary" />
      <span className="absolute right-6 top-6 h-4 w-4 rotate-12 bg-highlight" />
      <span className="font-display text-lg font-bold leading-tight text-ink-foreground line-clamp-2">{title}</span>
    </div>
  );
}

export function CourseCard({ course, to }: { course: C; to?: "app" }) {
  const inner = (
    <>
      <CourseCover title={course.title} cover={course.cover_url} />
      <div className="p-5">
        <h3 className="font-display text-lg font-bold leading-snug group-hover:text-primary">{course.title}</h3>
        {course.subtitle && <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p>}
        {(course.level || course.duration_text) && (
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {[course.level, course.duration_text].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </>
  );
  const cls = "group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md";
  return to === "app" ? (
    <Link to="/curso/$slug" params={{ slug: course.slug }} className={cls}>{inner}</Link>
  ) : (
    <Link to="/cursos/$slug" params={{ slug: course.slug }} className={cls}>{inner}</Link>
  );
}
