CREATE TABLE public.angulo_snapshot (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  now jsonb NOT NULL DEFAULT '{}'::jsonb,
  objective_key text,
  objective_text text,
  explore jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.angulo_snapshot TO authenticated;
GRANT ALL ON public.angulo_snapshot TO service_role;
ALTER TABLE public.angulo_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshot" ON public.angulo_snapshot FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.plan_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
  deadline date,
  notes text CHECK (char_length(notes) <= 4000),
  evidence text CHECK (char_length(evidence) <= 4000),
  resource_type text CHECK (resource_type IN ('course','tool','mission','community','people','opportunity')),
  resource_ref text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.plan_actions(user_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_actions TO authenticated;
GRANT ALL ON public.plan_actions TO service_role;
ALTER TABLE public.plan_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own actions" ON public.plan_actions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  kind text NOT NULL DEFAULT 'outro',
  note text CHECK (char_length(note) <= 2000),
  link_url text CHECK (link_url IS NULL OR link_url ~ '^https?://'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidences TO authenticated;
GRANT ALL ON public.evidences TO service_role;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own evidences" ON public.evidences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.mission_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_key text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  reflection text CHECK (char_length(reflection) <= 6000),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_progress TO authenticated;
GRANT ALL ON public.mission_progress TO service_role;
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own missions" ON public.mission_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());