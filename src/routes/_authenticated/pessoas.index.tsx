import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Page } from "@/components/community/Bits";
import { PersonCard, PEOPLE_COLS } from "@/components/community/PersonCard";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/pessoas/")({
  head: () => ({ meta: [{ title: "Pessoas — Outro Ângulo" }, { name: "description", content: "Descubra quem está na comunidade e em que pode ajudar." }] }),
  component: People,
});


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

