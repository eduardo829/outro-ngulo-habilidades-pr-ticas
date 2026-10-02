import { supabase } from "@/integrations/supabase/client";

export const PERSONAS = ["Empreendedor", "Profissional", "Estudante", "Criador", "Freelancer", "Outro"];
export const GOALS = ["Networking", "Empreendedorismo", "Comunicação", "Carreira", "Planejamento", "Negociação", "Tecnologia & IA", "Finanças", "Vendas", "Liderança"];
export const CATEGORIES = ["Geral", "Networking", "Empreendedorismo", "Carreira", "Comunicação", "Negociação", "Tecnologia & IA", "Dinheiro", "Oportunidades"];
export const KINDS: Record<string, string> = {
  pergunta: "Pergunta",
  discussao: "Discussão",
  experiencia: "Experiência",
  aprendizado: "Aprendizado",
  ajuda: "Preciso de ajuda",
  oportunidade: "Oportunidade",
};
export const OPP_TYPES = ["Procuro parceiro", "Procuro fornecedor", "Procuro profissional", "Tenho uma oportunidade", "Procuro emprego", "Procuro freelancer", "Procuro sócio", "Tenho projeto"];

export type MiniProfile = { id: string; display_name: string; avatar_url: string | null; area: string | null; city: string | null; persona: string | null };

export async function fetchProfiles(ids: string[]) {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return new Map<string, MiniProfile>();
  const { data } = await supabase.from("profiles").select("id, display_name, avatar_url, area, city, persona").in("id", uniq);
  return new Map((data ?? []).map((p) => [p.id, p as MiniProfile]));
}

export async function openConversation(otherId: string, postId?: string) {
  const { data, error } = await supabase.rpc("start_conversation", (postId ? { _other: otherId, _post: postId } : { _other: otherId }));
  if (error) throw error;
  return data as string;
}

export function tagsFrom(s: string) {
  return s.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function eventWhen(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
}

export function eventPhase(e: { starts_at: string; duration_min: number; status: string }) {
  if (e.status === "cancelled") return "cancelled" as const;
  const start = new Date(e.starts_at).getTime();
  const end = start + e.duration_min * 60000;
  const now = Date.now();
  if (now > end) return "done" as const;
  if (now >= start - 15 * 60000) return "live" as const;
  return "upcoming" as const;
}

export const EVENT_COLS = "id, expert_id, title, theme, description, starts_at, duration_min, capacity, recording_url, summary, materials, status, is_demo";
