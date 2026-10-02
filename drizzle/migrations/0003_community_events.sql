
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS working_on text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learn_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "members read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_profile_flags() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.suspended := old.suspended;
    new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
CREATE TRIGGER profiles_protect_flags BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_flags();

CREATE OR REPLACE FUNCTION public.is_active_member(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  select exists(select 1 from public.profiles where id=_u and not suspended)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  select public.has_role(_u,'admin') or public.has_role(_u,'moderator')
$$;

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'discussao' CHECK (kind IN ('pergunta','discussao','experiencia','aprendizado','ajuda','oportunidade')),
  category text NOT NULL DEFAULT 'Geral',
  opportunity_type text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 4000),
  link_url text CHECK (link_url IS NULL OR link_url ~ '^https?://'),
  image_url text,
  featured boolean NOT NULL DEFAULT false,
  removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read posts" ON public.posts FOR SELECT TO authenticated USING (NOT removed OR author_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid() AND public.is_active_member(auth.uid()) AND NOT featured AND NOT removed);
CREATE POLICY "staff update posts" ON public.posts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "delete posts" ON public.posts FOR DELETE TO authenticated USING (author_id=auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  offers_help boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON public.comments(post_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid() AND public.is_active_member(auth.uid()));
CREATE POLICY "delete comments" ON public.comments FOR DELETE TO authenticated USING (author_id=auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.reactions (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like','save')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read reactions" ON public.reactions FOR SELECT TO authenticated USING (kind='like' OR user_id=auth.uid());
CREATE POLICY "own reactions insert" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "own reactions delete" ON public.reactions FOR DELETE TO authenticated USING (user_id=auth.uid());

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() IN (user_a, user_b));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.in_conversation(_c uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  select exists(select 1 from public.conversations where id=_c and _u in (user_a,user_b))
$$;
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.in_conversation(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id=auth.uid() AND public.in_conversation(conversation_id, auth.uid()) AND public.is_active_member(auth.uid()));
CREATE POLICY "recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (sender_id<>auth.uid() AND public.in_conversation(conversation_id, auth.uid())) WITH CHECK (sender_id<>auth.uid() AND public.in_conversation(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid, _post uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare _a uuid; _b uuid; _id uuid;
begin
  if auth.uid() is null or _other is null or _other = auth.uid() then raise exception 'invalid'; end if;
  if not public.is_active_member(auth.uid()) then raise exception 'suspended'; end if;
  if not exists(select 1 from profiles where id=_other) then raise exception 'not found'; end if;
  _a := least(auth.uid(), _other); _b := greatest(auth.uid(), _other);
  select id into _id from conversations where user_a=_a and user_b=_b;
  if _id is null then
    insert into conversations(user_a,user_b,context_post_id) values(_a,_b,_post) returning id into _id;
  end if;
  return _id;
end $$;

CREATE TABLE public.experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  photo_url text,
  headline text,
  experience text,
  area text,
  topics text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experts TO authenticated;
GRANT ALL ON public.experts TO service_role;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read experts" ON public.experts FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage experts" ON public.experts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL,
  title text NOT NULL,
  theme text NOT NULL DEFAULT 'Geral',
  description text,
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 15 AND 480),
  capacity integer NOT NULL DEFAULT 12 CHECK (capacity BETWEEN 1 AND 1000),
  meeting_url text CHECK (meeting_url IS NULL OR meeting_url ~ '^https://'),
  recording_url text CHECK (recording_url IS NULL OR recording_url ~ '^https://'),
  summary text,
  materials text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_starts_idx ON public.events(starts_at);
GRANT SELECT (id, expert_id, title, theme, description, starts_at, duration_min, capacity, recording_url, summary, materials, status, is_demo, created_at) ON public.events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_bookings (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, DELETE ON public.event_bookings TO authenticated;
GRANT ALL ON public.event_bookings TO service_role;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read bookings" ON public.event_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "cancel own booking" ON public.event_bookings FOR DELETE TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.book_event(_event uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare _e events%rowtype; _n int;
begin
  if auth.uid() is null or not public.is_active_member(auth.uid()) then raise exception 'forbidden'; end if;
  select * into _e from events where id=_event for update;
  if not found or _e.status <> 'scheduled' then raise exception 'Encontro indisponível'; end if;
  if _e.starts_at + make_interval(mins => _e.duration_min) < now() then raise exception 'Encontro já terminou'; end if;
  if exists(select 1 from event_bookings where event_id=_event and user_id=auth.uid()) then return; end if;
  select count(*) into _n from event_bookings where event_id=_event;
  if _n >= _e.capacity then raise exception 'Não há mais vagas'; end if;
  insert into event_bookings(event_id,user_id) values(_event, auth.uid());
end $$;

CREATE OR REPLACE FUNCTION public.event_join_url(_event uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  select e.meeting_url from events e
  where e.id=_event and (
    public.has_role(auth.uid(),'admin')
    or (exists(select 1 from event_bookings b where b.event_id=e.id and b.user_id=auth.uid())
        and now() between e.starts_at - interval '15 minutes' and e.starts_at + make_interval(mins => e.duration_min))
  )
$$;

CREATE TABLE public.event_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.event_questions TO authenticated;
GRANT ALL ON public.event_questions TO service_role;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions" ON public.event_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ask question" ON public.event_questions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND public.is_active_member(auth.uid()));
CREATE POLICY "delete question" ON public.event_questions FOR DELETE TO authenticated USING (user_id=auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.event_question_votes (
  question_id uuid NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_question_votes TO authenticated;
GRANT ALL ON public.event_question_votes TO service_role;
ALTER TABLE public.event_question_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read votes" ON public.event_question_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "own vote" ON public.event_question_votes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "own unvote" ON public.event_question_votes FOR DELETE TO authenticated USING (user_id=auth.uid());

CREATE TABLE public.next_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 300),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.next_actions TO authenticated;
GRANT ALL ON public.next_actions TO service_role;
ALTER TABLE public.next_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own actions" ON public.next_actions FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.notify_comment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare _p posts%rowtype;
begin
  select * into _p from posts where id=new.post_id;
  if _p.author_id <> new.author_id then
    insert into notifications(user_id,kind,title,link) values(_p.author_id,'comment',
      case when _p.kind='ajuda' then 'Alguém respondeu ao seu pedido de ajuda.'
           when _p.kind='pergunta' then 'Alguém respondeu sua pergunta.'
           else 'Alguém respondeu sua publicação.' end,
      '/comunidade/'||_p.id);
  end if;
  return new;
end $$;
CREATE TRIGGER comments_notify AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_comment();

CREATE OR REPLACE FUNCTION public.notify_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare _c conversations%rowtype; _to uuid;
begin
  select * into _c from conversations where id=new.conversation_id;
  update conversations set last_message_at=new.created_at where id=_c.id;
  _to := case when _c.user_a=new.sender_id then _c.user_b else _c.user_a end;
  if not exists(select 1 from notifications where user_id=_to and kind='message' and link='/mensagens/'||_c.id and read_at is null) then
    insert into notifications(user_id,kind,title,link) values(_to,'message','Você recebeu uma nova mensagem.','/mensagens/'||_c.id);
  end if;
  return new;
end $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();

CREATE OR REPLACE FUNCTION public.notify_new_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
begin
  if new.status='scheduled' and not new.is_demo then
    insert into notifications(user_id,kind,title,link)
    select id,'event','Novo encontro publicado: '||new.title,'/encontros/'||new.id from profiles where not is_demo and not suspended;
  end if;
  return new;
end $$;
CREATE TRIGGER events_notify AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_new_event();

CREATE OR REPLACE FUNCTION public.ensure_event_reminders() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
begin
  insert into notifications(user_id,kind,title,link)
  select b.user_id,'reminder','Seu encontro começa em breve: '||e.title,'/encontros/'||e.id
  from event_bookings b join events e on e.id=b.event_id
  where b.user_id=auth.uid() and not b.reminded and e.status='scheduled'
    and e.starts_at between now() and now() + interval '24 hours';
  update event_bookings b set reminded=true from events e
  where e.id=b.event_id and b.user_id=auth.uid() and not b.reminded and e.status='scheduled'
    and e.starts_at between now() and now() + interval '24 hours';
end $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

INSERT INTO public.experts (id, name, headline, experience, area, topics, is_demo, position) VALUES
 ('a0000000-0000-4000-8000-000000000001','Eduardo Araújo','Empreendedor','12+ anos empreendendo fora do Brasil, com empresas de construção e serviços.','Empreendedorismo',ARRAY['Construção','Vendas','Negociação','Empreendedorismo','Tecnologia aplicada a negócios'],true,1),
 ('a0000000-0000-4000-8000-000000000002','Renata Moraes','Gerente comercial','Lidera times de vendas B2B há 9 anos; começou como vendedora interna.','Vendas',ARRAY['Vendas','Prospecção','Comunicação','Carreira'],true,2),
 ('a0000000-0000-4000-8000-000000000003','Thiago Nakamura','Gestor de produto','Trabalha com produtos digitais e automação há 10 anos, hoje em uma fintech.','Tecnologia',ARRAY['Tecnologia & IA','Carreira','Planejamento','Produtividade'],true,3);

INSERT INTO public.events (expert_id, title, theme, description, starts_at, duration_min, capacity, is_demo) VALUES
 ('a0000000-0000-4000-8000-000000000001','Como fazer networking do zero','Networking','Uma conversa prática sobre como construir relações profissionais quando você ainda não conhece ninguém.', date_trunc('day', now()) + interval '3 days 22 hours', 60, 12, true),
 ('a0000000-0000-4000-8000-000000000002','Primeiros clientes sem indicação','Vendas','Como abordar desconhecidos sem parecer insistente, e o que fazer depois do primeiro “não”.', date_trunc('day', now()) + interval '6 days 22 hours', 60, 15, true),
 ('a0000000-0000-4000-8000-000000000003','IA no trabalho do dia a dia','Tecnologia & IA','Ferramentas simples de IA para organizar tarefas, escrever melhor e ganhar tempo — com exemplos reais.', date_trunc('day', now()) + interval '9 days 23 hours', 75, 20, true),
 ('a0000000-0000-4000-8000-000000000001','Negociar preço sem medo','Negociação','Como defender o seu preço, quando ceder e quando dizer não.', date_trunc('day', now()) + interval '13 days 22 hours', 60, 10, true),
 ('a0000000-0000-4000-8000-000000000002','Organizando a primeira carteira de contatos','Networking','Encontro já realizado: como registrar e manter contato com quem você conhece.', date_trunc('day', now()) - interval '5 days' + interval '22 hours', 60, 12, true);
UPDATE public.events SET summary='Conversamos sobre como manter uma lista simples de contatos e retomar conversas sem parecer interesseiro.', materials='Modelo de planilha de contatos (pedir na comunidade)' WHERE is_demo AND starts_at < now();
