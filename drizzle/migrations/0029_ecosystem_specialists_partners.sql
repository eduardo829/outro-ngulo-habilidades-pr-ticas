CREATE TABLE public.professional_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text NOT NULL DEFAULT '' CHECK (char_length(headline) <= 140),
  about text NOT NULL DEFAULT '' CHECK (char_length(about) <= 3000),
  experience text NOT NULL DEFAULT '' CHECK (char_length(experience) <= 3000),
  categories text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  city text CHECK (char_length(city) <= 80),
  remote boolean NOT NULL DEFAULT false,
  availability text CHECK (char_length(availability) <= 120),
  budget_text text CHECK (char_length(budget_text) <= 120),
  portfolio jsonb NOT NULL DEFAULT '[]'::jsonb,
  credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent_public boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','suspended')),
  verified_at timestamptz,
  verified_by uuid,
  community_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professional_profiles(user_id) ON DELETE SET NULL,
  category text NOT NULL,
  need text NOT NULL CHECK (char_length(need) BETWEEN 10 AND 3000),
  budget_text text CHECK (char_length(budget_text) <= 120),
  deadline text CHECK (char_length(deadline) <= 120),
  city text CHECK (char_length(city) <= 80),
  remote boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','forwarded','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.service_request_matches (
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  sent_by uuid,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, professional_id)
);
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_kind text NOT NULL,
  target_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ADD COLUMN sector text, ADD COLUMN stage text, ADD COLUMN skills_wanted text[] NOT NULL DEFAULT '{}', ADD COLUMN partnership_type text, ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
ALTER TABLE public.opportunity_interests ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_profiles, public.service_requests, public.service_request_matches TO authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.professional_profiles, public.service_requests, public.service_request_matches, public.admin_actions TO service_role;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.protect_professional_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft','pending') THEN NEW.status := 'draft'; END IF;
    NEW.verified_at := NULL; NEW.verified_by := NULL;
  ELSE
    IF OLD.status = 'suspended' AND NEW.status <> 'suspended' THEN RAISE EXCEPTION 'suspended'; END IF;
    IF NEW.status NOT IN ('draft','pending') AND NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'status_forbidden'; END IF;
    -- material edits of an approved profile send it back to review
    IF OLD.status = 'approved' AND NEW.status = 'approved' AND (NEW.headline, NEW.about, NEW.experience, NEW.categories, NEW.credentials) IS DISTINCT FROM (OLD.headline, OLD.about, OLD.experience, OLD.categories, OLD.credentials) THEN NEW.status := 'pending'; END IF;
    IF NEW.credentials IS DISTINCT FROM OLD.credentials THEN NEW.verified_at := NULL; NEW.verified_by := NULL;
    ELSE NEW.verified_at := OLD.verified_at; NEW.verified_by := OLD.verified_by; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_professional_profile BEFORE INSERT OR UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.protect_professional_profile();

CREATE OR REPLACE FUNCTION public.service_requests_rate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.service_requests WHERE requester_id=NEW.requester_id AND created_at > now()-interval '1 day') >= 5 THEN RAISE EXCEPTION 'rate_limited'; END IF;
  IF NOT public.is_staff(auth.uid()) THEN NEW.status := 'new'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER service_requests_rate BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.service_requests_rate();

CREATE OR REPLACE FUNCTION public.notify_service_match() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, title, link) VALUES (NEW.professional_id, 'service', 'Você recebeu uma solicitação de serviço', '/especialistas/painel');
  UPDATE public.service_requests SET status='forwarded' WHERE id=NEW.request_id AND status='new';
  RETURN NEW;
END $$;
CREATE TRIGGER notify_service_match AFTER INSERT ON public.service_request_matches FOR EACH ROW EXECUTE FUNCTION public.notify_service_match();

CREATE OR REPLACE FUNCTION public.notify_interest_decision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','declined') THEN
    INSERT INTO public.notifications(user_id, kind, title, link) VALUES (NEW.user_id, 'opportunity', CASE WHEN NEW.status='accepted' THEN 'Seu interesse foi aceito — já pode conversar' ELSE 'Seu interesse não foi aceito desta vez' END, '/mural');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER interest_decision_notify AFTER UPDATE ON public.opportunity_interests FOR EACH ROW EXECUTE FUNCTION public.notify_interest_decision();

CREATE POLICY "read approved or own or staff" ON public.professional_profiles FOR SELECT TO authenticated USING ((status='approved' AND consent_public) OR user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own insert" ON public.professional_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_active_member(auth.uid()));
CREATE POLICY "own update" ON public.professional_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff update" ON public.professional_profiles FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "own delete" ON public.professional_profiles FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "read requests" ON public.service_requests FOR SELECT TO authenticated USING (requester_id = auth.uid() OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.service_request_matches m WHERE m.request_id = id AND m.professional_id = auth.uid()));
CREATE POLICY "create request" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND public.is_active_member(auth.uid()));
CREATE POLICY "requester closes" ON public.service_requests FOR UPDATE TO authenticated USING (requester_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (requester_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "read matches" ON public.service_request_matches FOR SELECT TO authenticated USING (professional_id = auth.uid() OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND r.requester_id = auth.uid()));
CREATE POLICY "staff forward" ON public.service_request_matches FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.user_id = professional_id AND p.status='approved'));
CREATE POLICY "pro answers" ON public.service_request_matches FOR UPDATE TO authenticated USING (professional_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (professional_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff remove match" ON public.service_request_matches FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "staff read log" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write log" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

CREATE POLICY "author decides interest" ON public.opportunity_interests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id=opportunity_id AND o.author_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id=opportunity_id AND o.author_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.has_public_specialists() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.professional_profiles WHERE status='approved' AND consent_public) $$;
GRANT EXECUTE ON FUNCTION public.has_public_specialists() TO authenticated;