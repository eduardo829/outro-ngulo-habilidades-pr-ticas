
create type public.app_role as enum ('admin','moderator','member');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin') and user_id <> auth.uid())
  with check (public.has_role(auth.uid(),'admin') and user_id <> auth.uid());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  bio text,
  city text,
  area text,
  interests text[] not null default '{}',
  can_share text,
  wants_learn text,
  link text,
  in_directory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or in_directory or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create type public.content_status as enum ('draft','published','archived');
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  cover_url text,
  instructor text,
  objectives text[] not null default '{}',
  level text,
  duration_text text,
  status content_status not null default 'draft',
  is_public boolean not null default true,
  access_policy text not null default 'Acesso mediante matrícula ativa.',
  price_cents integer,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  activity text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  summary text,
  video_provider text check (video_provider in ('youtube','vimeo','panda','bunny')),
  video_ref text,
  body text,
  duration_text text,
  exercise text,
  status content_status not null default 'draft',
  is_preview boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  source text not null default 'manual',
  granted_by uuid,
  last_lesson_id uuid references public.lessons(id) on delete set null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create or replace function public.is_enrolled(_user uuid, _course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments where user_id=_user and course_id=_course and status='active')
$$;

grant select on public.courses, public.modules, public.lessons to anon, authenticated;
grant insert, update, delete on public.courses, public.modules, public.lessons to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant all on public.courses, public.modules, public.lessons, public.enrollments to service_role;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;

create policy "published courses visible" on public.courses for select to anon, authenticated
  using (status = 'published' or public.has_role(auth.uid(),'admin') or (auth.uid() is not null and public.is_enrolled(auth.uid(), id)));
create policy "admin courses" on public.courses for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "modules of visible courses" on public.modules for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (c.status='published' or public.has_role(auth.uid(),'admin') or (auth.uid() is not null and public.is_enrolled(auth.uid(), c.id)))));
create policy "admin modules" on public.modules for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "lessons access" on public.lessons for select to anon, authenticated
  using (
    public.has_role(auth.uid(),'admin')
    or (status='published' and exists (select 1 from public.courses c where c.id=course_id and c.status in ('published','archived'))
        and (is_preview or (auth.uid() is not null and public.is_enrolled(auth.uid(), course_id))))
  );
create policy "admin lessons" on public.lessons for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "own enrollments" on public.enrollments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin enrollments" on public.enrollments for all to authenticated
  using (public.has_role(auth.uid(),'admin') and user_id <> auth.uid())
  with check (public.has_role(auth.uid(),'admin') and user_id <> auth.uid());

create or replace function public.touch_last_lesson(_lesson uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _course uuid;
begin
  select course_id into _course from public.lessons where id=_lesson;
  update public.enrollments set last_lesson_id=_lesson, last_accessed_at=now()
   where user_id=auth.uid() and course_id=_course and status='active';
end $$;

create or replace function public.course_outline(_course uuid)
returns table(lesson_id uuid, module_id uuid, title text, duration_text text, is_preview boolean, pos integer)
language sql stable security definer set search_path = public as $$
  select l.id, l.module_id, l.title, l.duration_text, l.is_preview, l.position
  from public.lessons l join public.courses c on c.id=l.course_id
  where l.course_id=_course and l.status='published' and (c.status='published' or public.has_role(auth.uid(),'admin') or public.is_enrolled(auth.uid(), c.id))
  order by l.position
$$;

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table public.lesson_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table public.exercise_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  answer text not null default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
grant select, insert, update, delete on public.lesson_progress, public.lesson_notes, public.exercise_answers to authenticated;
grant all on public.lesson_progress, public.lesson_notes, public.exercise_answers to service_role;
alter table public.lesson_progress enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.exercise_answers enable row level security;
create policy "own progress read" on public.lesson_progress for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own progress write" on public.lesson_progress for insert to authenticated with check (user_id=auth.uid() and public.is_enrolled(auth.uid(), course_id));
create policy "own progress delete" on public.lesson_progress for delete to authenticated using (user_id=auth.uid());
create policy "own notes" on public.lesson_notes for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own answers" on public.exercise_answers for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings readable" on public.site_settings for select to anon, authenticated using (true);
create policy "admin settings" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 255 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text check (name is null or char_length(name) <= 120),
  course_id uuid references public.courses(id) on delete set null,
  created_at timestamptz not null default now()
);
grant insert on public.waitlist to anon, authenticated;
grant select, delete on public.waitlist to authenticated;
grant all on public.waitlist to service_role;
alter table public.waitlist enable row level security;
create policy "anyone joins waitlist" on public.waitlist for insert to anon, authenticated with check (true);
create policy "admin reads waitlist" on public.waitlist for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes waitlist" on public.waitlist for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "members read announcements" on public.announcements for select to authenticated using (true);
create policy "staff manage announcements" on public.announcements for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));

insert into public.site_settings (key, value) values
('founders', '[{"name":"Eduardo","bio":"Biografia em preparação. Edite no painel administrativo.","photo_url":null},{"name":"Vinícius","bio":"Biografia em preparação. Edite no painel administrativo.","photo_url":null}]'),
('offer', '{"price_cents":9900,"label":"Pagamento único","payments_enabled":false}'),
('support', '{"email":null,"note":"Canal de suporte ainda não configurado."}');

insert into public.courses (slug, title, subtitle, status, position) values
('antes-dos-25','O que ninguém te explicou antes dos 25','Conteúdo em preparação','draft',1),
('networking-do-zero','Networking do zero','Conteúdo em preparação','draft',2),
('planejamento-que-sai-do-papel','Planejamento que sai do papel','Conteúdo em preparação','draft',3),
('comunicacao-e-posicionamento','Comunicação e posicionamento','Conteúdo em preparação','draft',4),
('negociacao-e-oportunidades','Negociação e oportunidades','Conteúdo em preparação','draft',5),
('ia-aplicada','IA aplicada à vida e ao trabalho','Conteúdo em preparação','draft',6);

insert into public.modules (course_id, title, position)
select c.id, m.title, m.pos from public.courses c
cross join lateral (values
 ('O que networking realmente significa',1),('Como mapear relações e ambientes',2),('Como iniciar uma conversa',3),
 ('Como contribuir antes de pedir',4),('Como manter contato',5),('Plano prático de relacionamento',6)) as m(title,pos)
where c.slug='networking-do-zero';

insert into public.modules (course_id, title, position)
select c.id, m.title, m.pos from public.courses c
cross join lateral (values
 ('Escolher uma prioridade',1),('Transformar objetivos em ações',2),('Montar um plano de 90 dias',3),
 ('Organizar uma semana possível',4),('Revisar o progresso',5),('Ajustar quando o plano falha',6)) as m(title,pos)
where c.slug='planejamento-que-sai-do-papel';
