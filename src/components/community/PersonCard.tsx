import { Link } from "@tanstack/react-router";
import { Avatar, Tag } from "@/components/community/Bits";

export const PEOPLE_COLS = "id, display_name, avatar_url, city, area, persona, working_on, bio, interests, skills, learn_tags";

export function PersonCard({ p }: { p: { id: string; display_name: string; avatar_url: string | null; city: string | null; persona: string | null; working_on: string | null; skills: string[]; learn_tags: string[] } }) {
  return (
    <li className="flex flex-col border bg-card p-5 transition-colors hover:border-foreground">
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
