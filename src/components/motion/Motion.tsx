import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Reusable, dependency-free motion language. All honor prefers-reduced-motion. */

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function ScrollReveal({ children, className, delay = 0, as: Tag = "div", style }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "p" | "section"; style?: CSSProperties }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <Tag ref={ref as never} className={cn("transition-[opacity,transform] duration-700 ease-[var(--ease-out)]", inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0", className)} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

/** Words that swap in place with a short vertical slide. */
export function RotatingWord({ words, interval = 2200, className }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom", className)} aria-live="off">
      {words.map((w, n) => (
        <span key={w} aria-hidden={n !== i} className={cn("col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-[var(--ease-out)]", n === i ? "translate-y-0 opacity-100" : n === (i - 1 + words.length) % words.length ? "-translate-y-full opacity-0" : "translate-y-full opacity-0")}>
          {w}
        </span>
      ))}
    </span>
  );
}
