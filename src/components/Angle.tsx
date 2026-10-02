import { cn } from "@/lib/utils";

/**
 * The Outro Ângulo device: an open corner (⌞) with a displaced plane.
 * Used beside titles, as bullets, on active navigation, and as loader.
 */
export function Angle({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("inline-block h-3.5 w-3.5 shrink-0", spin && "animate-spin [animation-duration:1.6s]", className)}>
      <path d="M2 3v11h11" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7" y="2" width="6" height="6" fill="var(--color-highlight)" transform="rotate(12 10 5)" />
    </svg>
  );
}

export function SectionLabel({ n, children, className }: { n?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-2", className)}>
      <Angle className="text-current" />
      {n && <span className="tabular-nums">{n} /</span>}
      {children}
    </p>
  );
}
