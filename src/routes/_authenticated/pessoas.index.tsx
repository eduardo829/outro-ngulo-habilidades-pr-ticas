import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyProfile } from "@/components/AppShell";
import { PersonCard, PEOPLE_COLS } from "@/components/community/PersonCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import photo from "@/assets/photo-pessoas.jpg";

export const Route = createFileRoute("/_authenticated/pessoas/")({
  head: () => ({ meta: [{ title: "Pessoas — Outro Ângulo" }, { name: "description", content: "Descubra quem está na comunidade e em que pode ajudar." }] }),
  component: People,
});

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const overlap = (a: string[], b: string[]) => { const B = b.map(norm); return a.filter((x) => B.some((y) => y && (y.includes(norm(x)) || norm(x).includes(y)))); };

function People() {
  const { user } = useAuth();
  const me = useMyProfile();
  const [q, setQ] = useState({ text: "", area: "", city: "", skill: "" });
  const list = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await supabase.from("profiles").select(PEOPLE_COLS).eq("in_directory", true).eq("suspended", false).order("display_name")).data ?? [],
  });
  const all = useMemo(() => (list.data ?? []).filter((p) => p.id !== user?.id), [list.data, user?.id]);

  const areas = useMemo(() => [...new Set(all.map((p) => p.persona).filter(Boolean))] as string[], [all]);
  const topSkills = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((p) => p.skills.forEach((s) => m.set(s, (m.get(s) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s]) => s);
  }, [all]);

  const myLearn = me.data?.learn_tags ?? [];
  const mySkills = me.data?.skills ?? [];
  const canHelpMe = useMemo(() => myLearn.length ? all.map((p) => ({ p, hit: overlap(myLearn, p.skills) })).filter((x) => x.hit.length).slice(0, 3) : [], [all, myLearn]);
  const iCanHelp = useMemo(() => mySkills.length ? all.map((p) => ({ p, hit: overlap(mySkills, p.learn_tags) })).filter((x) => x.hit.length).slice(0, 3) : [], [all, mySkills]);

  const t = norm(q.text);
  const filtered = all.filter((p) =>
    (!t || norm([p.display_name, p.working_on, p.bio, p.persona, ...p.skills, ...p.interests].filter(Boolean).join(" ")).includes(t)) &&
    (!q.area || p.persona === q.area) &&
    (!q.city || norm(p.city ?? "").includes(norm(q.city))) &&
    (!q.skill || p.skills.includes(q.skill)));
  const active = Object.values(q).some(Boolean);
  const sel = "h-10 border bg-background px-3 text-sm";

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b bg-foreground text-background">
        <img src={photo} alt="" width={1600} height={800} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground via-foreground/80 to-transparent" />
        <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-highlight">Pessoas · diretório</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">Quem está aqui<br />e no que pode ajudar.</h1>
          <p className="mt-4 max-w-xl text-background/80">Só aparece quem escolheu aparecer. Ninguém vê seu e-mail. Puxe conversa com respeito: diga quem você é e por que escreveu.</p>
          <p className="mt-8 font-display text-5xl font-extrabold">{list.isLoading ? "…" : String(all.length).padStart(2, "0")}<span className="ml-3 align-middle text-sm font-semibold uppercase tracking-wider text-background/70">{all.length === 1 ? "pessoa no diretório" : "pessoas no diretório"}</span></p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        {(canHelpMe.length > 0 || iCanHelp.length > 0) && (
          <section className="mb-12 grid gap-px border bg-border md:grid-cols-2">
            <Match n="01" title="Podem te ajudar" hint="Sabem o que você quer aprender" rows={canHelpMe} />
            <Match n="02" title="Você pode ajudar" hint="Querem aprender o que você sabe" rows={iCanHelp} />
          </section>
        )}
        {me.data && !myLearn.length && !mySkills.length && (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-l-2 border-highlight bg-card px-5 py-4">
            <p className="text-sm">Preencha "Posso ajudar com" e "Quero aprender" no seu perfil para ver quem combina com você.</p>
            <Button asChild size="sm" variant="outline"><Link to="/perfil">Completar perfil</Link></Button>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 border-b pb-3">
          <h2 className="font-display text-2xl font-extrabold">Explorar</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} de {all.length}</p>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-[2fr_1fr_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input className="pl-9" placeholder="Buscar por nome, projeto ou habilidade" value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} aria-label="Buscar pessoas" />
          </label>
          <select className={sel} value={q.area} onChange={(e) => setQ({ ...q, area: e.target.value })} aria-label="Área"><option value="">Todas as áreas</option>{areas.map((a) => <option key={a}>{a}</option>)}</select>
          <Input placeholder="Cidade" value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })} aria-label="Cidade" />
        </div>
        {topSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pode ajudar com</span>
            {topSkills.map((s) => (
              <button key={s} type="button" aria-pressed={q.skill === s} onClick={() => setQ({ ...q, skill: q.skill === s ? "" : s })}
                className={cn("border px-2.5 py-1 text-xs transition-colors", q.skill === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{s}</button>
            ))}
            {active && <button type="button" onClick={() => setQ({ text: "", area: "", city: "", skill: "" })} className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline"><X className="h-3 w-3" />Limpar</button>}
          </div>
        )}

        {list.isLoading ? <p className="mt-8 text-muted-foreground">Carregando…</p> : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <PersonCard key={p.id} p={p} />)}
            {!filtered.length && (
              <li className="col-span-full border-y py-10 text-center">
                <p className="font-display text-xl font-bold">{all.length ? "Ninguém corresponde a esses filtros." : "O diretório ainda está vazio."}</p>
                <p className="mt-1 text-sm text-muted-foreground">{all.length ? "Tente tirar um filtro ou buscar outra palavra." : "Ative a opção de aparecer no diretório no seu perfil e seja a primeira pessoa."}</p>
              </li>
            )}
          </ul>
        )}

        <div className="mt-14 grid gap-6 border-t pt-8 md:grid-cols-3">
          {[["Diga quem você é", "Uma linha de apresentação abre mais portas do que um “oi”."], ["Peça algo específico", "“Pode me contar como entrou na área?” é mais fácil de responder que “me ajuda?”."], ["Devolva", "Se alguém te ajudou, conte depois o que aconteceu. Isso fortalece a rede."]].map(([h, b], i) => (
            <div key={h}><p className="font-display text-3xl font-extrabold text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</p><p className="mt-1 font-semibold">{h}</p><p className="mt-1 text-sm text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Match({ n, title, hint, rows }: { n: string; title: string; hint: string; rows: { p: { id: string; display_name: string; persona: string | null }; hit: string[] }[] }) {
  return (
    <div className="bg-background p-5">
      <p className="text-[11px] font-bold text-muted-foreground">{n}</p>
      <p className="font-display text-lg font-extrabold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {rows.length ? (
        <ul className="mt-4 divide-y">
          {rows.map(({ p, hit }) => (
            <li key={p.id}><Link to="/pessoas/$id" params={{ id: p.id }} className="group flex items-baseline justify-between gap-3 py-2.5">
              <span className="font-semibold group-hover:underline">{p.display_name}</span>
              <span className="truncate text-xs text-muted-foreground">{hit.slice(0, 2).join(", ")}</span>
            </Link></li>
          ))}
        </ul>
      ) : <p className="mt-4 text-sm text-muted-foreground">Ninguém por enquanto.</p>}
    </div>
  );
}
