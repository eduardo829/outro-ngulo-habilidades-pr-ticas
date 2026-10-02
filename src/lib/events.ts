import { supabase } from "@/integrations/supabase/client";
import { EVENT_COLS } from "@/lib/community";

export type EventRow = {
  id: string; expert_id: string | null; title: string; theme: string; description: string | null; starts_at: string;
  duration_min: number; capacity: number; recording_url: string | null; summary: string | null; materials: string | null; status: string; is_demo: boolean;
};
export type Expert = { id: string; name: string; photo_url: string | null; headline: string | null; experience: string | null; area: string | null; topics: string[]; active: boolean; is_demo: boolean; position: number; user_id: string | null };

export async function fetchEvents(me: string, opts: { upcoming?: boolean; expertId?: string; ids?: string[] } = {}) {
  let q = supabase.from("events").select(EVENT_COLS).order("starts_at", { ascending: !!opts.upcoming || !opts.ids });
  if (opts.upcoming) q = q.gte("starts_at", new Date(Date.now() - 2 * 3600000).toISOString()).eq("status", "scheduled");
  if (opts.expertId) q = q.eq("expert_id", opts.expertId);
  if (opts.ids) q = q.in("id", opts.ids);
  const { data: events, error } = await q;
  if (error) throw error;
  const list = (events ?? []) as EventRow[];
  const ids = list.map((e) => e.id);
  const [{ data: bookings }, { data: experts }] = await Promise.all([
    ids.length ? supabase.from("event_bookings").select("event_id, user_id").in("event_id", ids) : Promise.resolve({ data: [] as { event_id: string; user_id: string }[] }),
    supabase.from("experts").select("*"),
  ]);
  return list.map((e) => {
    const b = (bookings ?? []).filter((x) => x.event_id === e.id);
    return { ...e, booked: b.length, mine: b.some((x) => x.user_id === me), left: Math.max(0, e.capacity - b.length), expert: (experts ?? []).find((x) => x.id === e.expert_id) as Expert | undefined };
  });
}
export type EventFull = Awaited<ReturnType<typeof fetchEvents>>[number];
