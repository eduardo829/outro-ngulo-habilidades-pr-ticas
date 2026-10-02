import { cn } from "@/lib/utils";

/** Mark: square with a displaced corner — works as avatar/favicon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-ink font-display text-[13px] font-extrabold text-ink-foreground",
        className,
      )}
    >
      <span className="absolute -right-1 -top-1 h-3 w-3 rotate-12 rounded-[2px] bg-highlight" />
      OÂ
    </span>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[17px] font-extrabold leading-none tracking-tight">
          outro<span className="inline-block -translate-y-[2px] rotate-[-6deg] text-primary">ângulo</span>
        </span>
      )}
      <span className="sr-only">Outro Ângulo</span>
    </span>
  );
}
