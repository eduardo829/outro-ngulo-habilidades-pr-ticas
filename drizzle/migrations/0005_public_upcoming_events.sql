create or replace function public.public_upcoming_events()
returns table(title text, theme text, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.title, e.theme, e.starts_at from public.events e
  where e.is_demo = false and e.status <> 'cancelled' and e.starts_at > now()
  order by e.starts_at limit 3
$$;
grant execute on function public.public_upcoming_events() to anon, authenticated;