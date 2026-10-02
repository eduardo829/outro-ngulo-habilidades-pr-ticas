import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/community/Bits";
import { eventPhase, eventWhen } from "@/lib/community";
import type { EventFull } from "@/lib/events";

export function EventCard({ e }: { e: EventFull }) {
  const { day, time } = eventWhen(e.starts_at);
  const phase = eventPhase(e);
  return (
    <li className="flex flex-col rounded-xl border bg-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{e.theme}</p>
      <h3 className="mt-2 text-lg font-bold leading-snug">{e.title}</h3>
      {e.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
      {e.expert && (
        <div className="mt-4 flex items-center gap-2 text-sm"><Avatar name={e.expert.name} url={e.expert.photo_url} size="sm" /><span>Com {e.expert.name.split(" ")[0]}</span></div>
      )}
      <p className="mt-4 text-sm">{day} • {time}</p>
      <p className="text-sm text-muted-foreground">
        {e.duration_min} minutos · {phase === "done" ? "Concluído" : phase === "cancelled" ? "Cancelado" : e.left === 0 ? "Esgotado" : `${e.left} ${e.left === 1 ? "vaga restante" : "vagas restantes"}`}
      </p>
      <Link to="/encontros/$id" params={{ id: e.id }} className="mt-auto pt-5">
        <span className={`inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium ${e.mine ? "border border-primary text-primary" : phase === "done" ? "border" : "bg-primary text-primary-foreground"}`}>
          {e.mine ? (phase === "live" ? "Entrar no encontro" : "Vaga reservada · ver") : phase === "done" ? "Ver resumo" : "Participar"}
        </span>
      </Link>
    </li>
  );
}
