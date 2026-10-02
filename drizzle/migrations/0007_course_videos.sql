CREATE TABLE public.course_videos (
  course_slug text NOT NULL,
  module_key text NOT NULL,
  title text,
  gestor text,
  provider text CHECK (provider IN ('youtube','vimeo')),
  video_url text,
  thumbnail_url text,
  duration_text text,
  description text,
  transcript text,
  captions_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_slug, module_key)
);
GRANT SELECT ON public.course_videos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_videos TO authenticated;
GRANT ALL ON public.course_videos TO service_role;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read lesson videos" ON public.course_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lesson videos" ON public.course_videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));