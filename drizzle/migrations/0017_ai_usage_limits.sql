CREATE TABLE public.ai_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  session_minutes int NOT NULL DEFAULT 10 CHECK (session_minutes BETWEEN 1 AND 1440),
  member_daily_messages int NOT NULL DEFAULT 15 CHECK (member_daily_messages BETWEEN 0 AND 1000),
  visitor_daily_messages int NOT NULL DEFAULT 4 CHECK (visitor_daily_messages BETWEEN 0 AND 100),
  ip_daily_messages int NOT NULL DEFAULT 40 CHECK (ip_daily_messages BETWEEN 0 AND 5000),
  per_minute_limit int NOT NULL DEFAULT 5 CHECK (per_minute_limit BETWEEN 1 AND 100),
  daily_spend_limit_cents int NOT NULL DEFAULT 500 CHECK (daily_spend_limit_cents >= 0),
  est_cost_cents_per_message numeric NOT NULL DEFAULT 1 CHECK (est_cost_cents_per_message >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ai_settings (id) VALUES (1);
GRANT SELECT, UPDATE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read ai settings" ON public.ai_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update ai settings" ON public.ai_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_usage (
  subject text NOT NULL,
  day date NOT NULL,
  messages int NOT NULL DEFAULT 0,
  first_at timestamptz,
  minute_start timestamptz,
  minute_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, day)
);
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_spend (
  day date NOT NULL,
  feature text NOT NULL,
  requests int NOT NULL DEFAULT 0,
  est_cost_cents numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (day, feature)
);
GRANT SELECT ON public.ai_spend TO authenticated;
GRANT ALL ON public.ai_spend TO service_role;
ALTER TABLE public.ai_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read ai spend" ON public.ai_spend FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ai_consume(_user uuid, _ip_hash text, _feature text, _commit boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.ai_settings;
  d date := (now() AT TIME ZONE 'utc')::date;
  subj text;
  u public.ai_usage;
  ipu public.ai_usage;
  lim int;
  spent numeric;
  reason text := null;
  ends timestamptz;
BEGIN
  IF _ip_hash IS NULL OR length(_ip_hash) < 16 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unavailable');
  END IF;
  SELECT * INTO s FROM public.ai_settings WHERE id = 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', false, 'reason', 'unavailable'); END IF;

  subj := CASE WHEN _user IS NULL THEN 'v:' || _ip_hash ELSE 'u:' || _user::text END;
  lim := CASE WHEN _user IS NULL THEN s.visitor_daily_messages ELSE s.member_daily_messages END;

  INSERT INTO public.ai_usage (subject, day) VALUES (subj, d) ON CONFLICT DO NOTHING;
  SELECT * INTO u FROM public.ai_usage WHERE subject = subj AND day = d FOR UPDATE;
  INSERT INTO public.ai_usage (subject, day) VALUES ('ip:' || _ip_hash, d) ON CONFLICT DO NOTHING;
  SELECT * INTO ipu FROM public.ai_usage WHERE subject = 'ip:' || _ip_hash AND day = d FOR UPDATE;

  SELECT coalesce(sum(est_cost_cents), 0) INTO spent FROM public.ai_spend WHERE day = d;
  IF _user IS NOT NULL AND u.first_at IS NOT NULL THEN ends := u.first_at + make_interval(mins => s.session_minutes); END IF;

  IF spent >= s.daily_spend_limit_cents THEN reason := 'budget';
  ELSIF u.messages >= lim THEN reason := 'messages';
  ELSIF ends IS NOT NULL AND ends <= now() THEN reason := 'time';
  ELSIF ipu.messages >= s.ip_daily_messages THEN reason := 'ip';
  ELSIF u.minute_start > now() - interval '1 minute' AND u.minute_count >= s.per_minute_limit THEN reason := 'rate';
  END IF;

  IF _commit AND reason IS NULL THEN
    UPDATE public.ai_usage SET
      messages = messages + 1,
      first_at = coalesce(first_at, now()),
      minute_start = CASE WHEN minute_start > now() - interval '1 minute' THEN minute_start ELSE now() END,
      minute_count = CASE WHEN minute_start > now() - interval '1 minute' THEN minute_count + 1 ELSE 1 END
    WHERE subject = subj AND day = d RETURNING * INTO u;
    UPDATE public.ai_usage SET messages = messages + 1 WHERE subject = 'ip:' || _ip_hash AND day = d;
    INSERT INTO public.ai_spend (day, feature, requests, est_cost_cents) VALUES (d, _feature, 1, s.est_cost_cents_per_message)
      ON CONFLICT (day, feature) DO UPDATE SET requests = ai_spend.requests + 1, est_cost_cents = ai_spend.est_cost_cents + EXCLUDED.est_cost_cents;
    IF _user IS NOT NULL THEN ends := u.first_at + make_interval(mins => s.session_minutes); END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', reason IS NULL, 'reason', reason,
    'member', _user IS NOT NULL,
    'limit', lim, 'remaining', greatest(lim - u.messages, 0),
    'session_minutes', s.session_minutes,
    'session_ends_at', CASE WHEN _user IS NULL THEN null ELSE ends END,
    'resets_at', ((d + 1)::timestamp AT TIME ZONE 'utc')
  );
END $$;
REVOKE ALL ON FUNCTION public.ai_consume(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_consume(uuid, text, text, boolean) TO service_role;