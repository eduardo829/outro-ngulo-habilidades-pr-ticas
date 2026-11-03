
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','exclusive')),
  active boolean NOT NULL DEFAULT false,
  categories text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_kind text NOT NULL CHECK (target_kind IN ('post','comment','opportunity')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_kind, target_id)
);
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 4 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  category text NOT NULL CHECK (category IN ('socio','parceiro','servicos','profissional','projetos','networking')),
  city text,
  remote boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_created_idx ON public.opportunities (created_at DESC, id);
CREATE TABLE public.opportunity_interests (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, user_id)
);
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('template','planilha','checklist','prompt','guia','material')),
  description text,
  url text CHECK (url IS NULL OR url ~ '^https://'),
  community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN goals text;
ALTER TABLE public.profiles ADD COLUMN open_to_partnerships boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN last_active_at timestamptz;
CREATE INDEX posts_community_idx ON public.posts (community_id, created_at DESC);

INSERT INTO public.communities (slug, name, description, visibility, active, categories, position) VALUES
 ('empreender-do-zero','Empreender do Zero','Para quem quer tirar uma ideia do papel: dúvidas, primeiros passos, erros e aprendizados de quem está começando.','public',true, ARRAY['Ideias','Dúvidas','Primeiros clientes','Aprendizados','Ferramentas'],1),
 ('ia-e-automacao','Inteligência Artificial e Automação','Uso prático de IA e automação no trabalho e no negócio.','public',false, ARRAY['Ferramentas','Prompts','Dúvidas','Casos'],2),
 ('marketing-e-vendas','Marketing e Vendas','Posicionamento, divulgação e vendas no dia a dia.','public',false, ARRAY['Divulgação','Vendas','Dúvidas','Casos'],3),
 ('carreira-e-renda-extra','Carreira e Renda Extra','Crescer na carreira e criar novas fontes de renda.','public',false, ARRAY['Carreira','Renda extra','Dúvidas','Aprendizados'],4);
UPDATE public.posts SET community_id = (SELECT id FROM public.communities WHERE slug='empreender-do-zero') WHERE community_id IS NULL;

CREATE OR REPLACE FUNCTION public.can_view_community(_c uuid, _u uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _c IS NULL OR public.is_staff(_u) OR EXISTS (
    SELECT 1 FROM public.communities c WHERE c.id=_c AND c.active AND (
      c.visibility='public' OR EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id=_c AND m.user_id=_u)))
$$;
CREATE OR REPLACE FUNCTION public.is_community_mod(_c uuid, _u uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(_u) OR EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id=_c AND m.user_id=_u AND m.role IN ('moderator','admin'))
$$;
CREATE OR REPLACE FUNCTION public.touch_activity() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET last_active_at = now() WHERE id = auth.uid() AND (last_active_at IS NULL OR last_active_at < now() - interval '10 minutes')
$$;
REVOKE EXECUTE ON FUNCTION public.touch_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_activity() TO authenticated;

CREATE OR REPLACE FUNCTION public.posts_defaults_and_rate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.community_id IS NULL THEN
    SELECT id INTO NEW.community_id FROM public.communities WHERE slug='empreender-do-zero';
  END IF;
  IF NOT public.is_staff(NEW.author_id) AND (SELECT count(*) FROM public.posts WHERE author_id=NEW.author_id AND created_at > now()-interval '1 minute') >= 3 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER posts_defaults_and_rate BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.posts_defaults_and_rate();

CREATE OR REPLACE FUNCTION public.opportunities_rate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.opportunities WHERE author_id=NEW.author_id AND created_at > now()-interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER opportunities_rate BEFORE INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.opportunities_rate();

CREATE OR REPLACE FUNCTION public.notify_opportunity_interest() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record;
BEGIN
  SELECT author_id, title INTO o FROM public.opportunities WHERE id=NEW.opportunity_id;
  IF o.author_id IS NOT NULL AND o.author_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, kind, title, link)
    VALUES (o.author_id, 'opportunity', 'Alguém demonstrou interesse em "' || left(o.title,60) || '"', '/mural');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER opportunity_interest_notify AFTER INSERT ON public.opportunity_interests FOR EACH ROW EXECUTE FUNCTION public.notify_opportunity_interest();

GRANT SELECT ON public.communities TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members, public.reports, public.opportunities, public.opportunity_interests, public.resources TO authenticated;
GRANT ALL ON public.communities, public.community_members, public.reports, public.opportunities, public.opportunity_interests, public.resources TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read active communities" ON public.communities FOR SELECT USING (active OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage communities" ON public.communities FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read members" ON public.community_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_view_community(community_id, auth.uid()));
CREATE POLICY "join public" ON public.community_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role='member' AND public.is_active_member(auth.uid()) AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id=community_id AND c.active AND c.visibility='public'));
CREATE POLICY "leave or mod remove" ON public.community_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_community_mod(community_id, auth.uid()));
CREATE POLICY "admin manage members" ON public.community_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid()) WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());
CREATE POLICY "admin add members" ON public.community_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());

CREATE POLICY "posts community visibility" ON public.posts AS RESTRICTIVE FOR SELECT USING (public.can_view_community(community_id, auth.uid()));
CREATE POLICY "posts community write" ON public.posts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT pinned AND (community_id IS NULL OR public.can_view_community(community_id, auth.uid())));
CREATE POLICY "community mods update posts" ON public.posts FOR UPDATE TO authenticated USING (public.is_community_mod(community_id, auth.uid())) WITH CHECK (public.is_community_mod(community_id, auth.uid()));

CREATE POLICY "file report" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status='open');
CREATE POLICY "read own or staff" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff resolve" ON public.reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "read opportunities" ON public.opportunities FOR SELECT TO authenticated USING (NOT removed OR author_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "create opportunity" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND NOT removed AND public.is_active_member(auth.uid()));
CREATE POLICY "author updates opportunity" ON public.opportunities FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid() AND NOT removed);
CREATE POLICY "staff moderate opportunity" ON public.opportunities FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "delete opportunity" ON public.opportunities FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "read interests" ON public.opportunity_interests FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id=opportunity_id AND o.author_id=auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "add interest" ON public.opportunity_interests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_active_member(auth.uid()) AND EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id=opportunity_id AND o.status='open' AND NOT o.removed AND o.author_id <> auth.uid()));
CREATE POLICY "remove interest" ON public.opportunity_interests FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "read published resources" ON public.resources FOR SELECT TO authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "admin manage resources" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
