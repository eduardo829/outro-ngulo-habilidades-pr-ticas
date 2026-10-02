import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/pessoas/")({
  head: () => ({ meta: [{ title: "Pessoas — Outro Ângulo" }, { name: "description", content: "Descubra quem está na comunidade e em que pode ajudar." }] }),
  component: People,
});

export const PEOPLE_COLS = "id, display_name, avatar_url, city, area, persona, working_on, bio, interests, skills, learn_tags";

function People() {
  const { user } = useAuth();
  const [q, setQ] = useState({ area: "", interest: "", city: "", help: "" });
  const list = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await supabase.from("profiles").select(PEOPLE_COLS).eq("in_directory", true).eq("suspended", false).order("display_name")).data ?? [],
  });
  const all = (list.data ?? []).filter((p) => p.id !== user?.id);
  const opts = useMemo(() => ({
    area: [...new Set(all.map((p) => p.persona).filter(Boolean))] as string[],
    interest: [...new Set(all.flatMap((p) => p.interests))].sort(),
  }), [list.data]);
  const has = (arr: string[], t: string) => arr.some((x) => x.toLowerCase().includes(t.toLowerCase()));
  const filtered = all.filter((p) =>
    (!q.area || p.persona === q.area) && (!q.interest || p.interests.includes(q.interest)) &&
    (!q.city || (p.city ?? "").toLowerCase().includes(q.city.toLowerCase())) && (!q.help || has(p.skills, q.help)));
  const sel = "h-10 rounded-md border bg-background px-3 text-sm";

  return (
    <Page>
      <h1 className="text-3xl font-extrabold">Pessoas</h1>
      <p className="mt-1 text-muted-foreground">Quem está aqui dentro, o que faz e em que pode ajudar.</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-4">
        <select className={sel} value={q.area} onChange={(e) => setQ({ ...q, area: e.target.value })} aria-label="Área"><option value="">Toda área</option>{opts.area.map((a) => <option key={a}>{a}</option>)}</select>
        <select className={sel} value={q.interest} onChange={(e) => setQ({ ...q, interest: e.target.value })} aria-label="Interesse"><option value="">Todo interesse</option>{opts.interest.map((a) => <option key={a}>{a}</option>)}</select>
        <Input placeholder="Cidade" value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })} />
        <Input placeholder="Pode me ajudar com…" value={q.help} onChange={(e) => setQ({ ...q, help: e.target.value })} />
      </div>
      {list.isLoading ? <p className="mt-8 text-muted-foreground">Carregando…</p> : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <PersonCard key={p.id} p={p} />)}
          {!filtered.length && <li className="text-muted-foreground">Ninguém com esses filtros ainda.</li>}
        </ul>
      )}
    </Page>
  );
}

export function PersonCard({ p }: { p: { id: string; display_name: string; avatar_url: string | null; city: string | null; persona: string | null; working_on: string | null; skills: string[]; learn_tags: string[] } }) {
  return (
    <li className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={p.display_name} url={p.avatar_url} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{p.display_name}</p>
          <p className="truncate text-xs text-muted-foreground">{[p.persona, p.city].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {p.working_on && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.working_on}</p>}
      {p.skills.length > 0 && <><p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Posso ajudar com</p><div className="mt-1.5 flex flex-wrap gap-1">{p.skills.slice(0, 4).map((s) => <Tag key={s} tone="primary">{s}</Tag>)}</div></>}
      {p.learn_tags.length > 0 && <><p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quero aprender</p><div className="mt-1.5 flex flex-wrap gap-1">{p.learn_tags.slice(0, 4).map((s) => <Tag key={s}>{s}</Tag>)}</div></>}
      <Link to="/pessoas/$id" params={{ id: p.id }} className="mt-auto pt-4 text-sm font-medium text-primary hover:underline">Ver perfil →</Link>
    </li>
  );
}
