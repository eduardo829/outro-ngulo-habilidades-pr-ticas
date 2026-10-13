import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Quota = { allowed: boolean; reason: string | null; member?: boolean; limit?: number; remaining?: number; session_minutes?: number; session_ends_at?: string | null; resets_at?: string };

/** Small display of today's AI allowance. Display only; limits are enforced on the server. */
export function AiUsageBadge({ refreshKey = 0, className = "" }: { refreshKey?: unknown; className?: string }) {
  const [q, setQ] = useState<Quota | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token;
      const r = await fetch("/api/ai-usage", { headers: t ? { Authorization: `Bearer ${t}` } : {} }).catch(() => null);
      if (alive && r?.ok) setQ(await r.json());
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!q?.session_ends_at) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [q?.session_ends_at]);

  if (!q || q.limit === undefined) return null;
  const left = q.session_ends_at ? Math.max(0, new Date(q.session_ends_at).getTime() - now) : null;
  const mmss = left !== null ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` : null;
  const reset = q.resets_at ? new Date(q.resets_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
  const out = !q.allowed || q.remaining === 0 || left === 0;

  return (
    <p className={`text-[11px] text-muted-foreground ${className}`} aria-live="polite">
      {out
        ? `Uso de IA de hoje esgotado${reset ? `. Volta às ${reset}` : ""}.`
        : <>IA hoje: {q.remaining} de {q.limit} mensagens{q.member && (mmss ? ` · sessão ${mmss}` : ` · ${q.session_minutes} min disponíveis`)}{!q.member && " · crie uma conta para ter mais"}</>}
    </p>
  );
}
