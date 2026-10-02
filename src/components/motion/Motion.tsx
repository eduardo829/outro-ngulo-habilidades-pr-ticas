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

/** 0 → 1 as the element scrolls through the viewport (top hits top → bottom hits bottom). */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) { setP(1); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

export function ScrollReveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "p" | "section" }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <Tag ref={ref as never} className={cn("transition-[opacity,transform] duration-700 ease-[var(--ease-out)]", inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0", className)} style={{ transitionDelay: `${delay}ms` }}>
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

/** A tall section whose sticky viewport shows one step at a time, driven by scroll. */
export function StickyStory({ steps, className, render }: { steps: number; className?: string; render: (active: number, progress: number) => ReactNode }) {
  const [ref, p] = useScrollProgress<HTMLDivElement>();
  const active = Math.min(steps - 1, Math.floor(p * steps));
  return (
    <div ref={ref} className={cn("relative", className)} style={{ height: `${steps * 70 + 30}vh` } as CSSProperties}>
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center overflow-hidden">{render(active, p)}</div>
    </div>
  );
}
