CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_messages_user_idx ON public.assistant_messages(user_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assistant messages read" ON public.assistant_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own assistant messages insert" ON public.assistant_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own assistant messages delete" ON public.assistant_messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.assistant_visitor_usage (
  ip_hash text NOT NULL,
  day date NOT NULL DEFAULT current_date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
GRANT ALL ON public.assistant_visitor_usage TO service_role;
ALTER TABLE public.assistant_visitor_usage ENABLE ROW LEVEL SECURITY;