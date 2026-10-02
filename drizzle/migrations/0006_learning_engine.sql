CREATE TABLE public.learning_outputs (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (char_length(key) <= 80),
  value jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(value) <= 20000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_outputs TO authenticated;
GRANT ALL ON public.learning_outputs TO service_role;
ALTER TABLE public.learning_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outputs read" ON public.learning_outputs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own outputs write" ON public.learning_outputs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.is_enrolled(auth.uid(), course_id) OR public.is_staff(auth.uid())));
CREATE POLICY "own outputs update" ON public.learning_outputs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (public.is_enrolled(auth.uid(), course_id) OR public.is_staff(auth.uid())));
CREATE POLICY "own outputs delete" ON public.learning_outputs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.gestor_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  module_key text,
  gestor_slug text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 5 AND 1000),
  status text NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada','selecionada','respondida')),
  answer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.gestor_questions TO authenticated;
GRANT ALL ON public.gestor_questions TO service_role;
ALTER TABLE public.gestor_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read questions" ON public.gestor_questions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "members ask" ON public.gestor_questions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'enviada' AND answer IS NULL AND public.is_active_member(auth.uid()));
CREATE POLICY "staff moderate questions" ON public.gestor_questions FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'gestor'));