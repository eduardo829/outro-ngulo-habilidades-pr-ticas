import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm";
  return url ? (
    <img src={url} alt="" className={cn("shrink-0 rounded-full object-cover", cls)} />
  ) : (
    <div aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-foreground", cls)}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs", tone === "primary" ? "border-primary/30 text-primary" : "text-muted-foreground")}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <div className={cn("mx-auto px-5 py-8 md:px-8 md:py-10", narrow ? "max-w-2xl" : "max-w-5xl")}>{children}</div>;
}
