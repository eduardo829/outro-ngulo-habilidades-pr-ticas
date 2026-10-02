import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Full-width cinematic photo band: dark photo, ink overlay, editorial text. */
export function PhotoBand({ src, eyebrow, title, children, className, align = "left" }: {
  src: string; eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string; align?: "left" | "right";
}) {
  return (
    <section className={cn("photo-band relative isolate overflow-hidden bg-ink text-ink-foreground", className)}>
      <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className={cn("absolute inset-0 -z-10", align === "left" ? "photo-scrim-l" : "photo-scrim-r")} />
      <div className={cn("mx-auto flex min-h-[340px] max-w-6xl flex-col justify-end px-5 py-16 md:min-h-[440px] md:py-20", align === "right" && "md:items-end md:text-right")}>
        <div className="max-w-xl">
          {eyebrow && <p className="eyebrow !text-ink-foreground/70">{eyebrow}</p>}
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] md:text-5xl">{title}</h2>
          {children && <div className="mt-5 text-ink-foreground/80">{children}</div>}
        </div>
        <span aria-hidden className={cn("mt-8 block h-px w-24 bg-highlight", align === "right" && "md:self-end")} />
      </div>
    </section>
  );
}
