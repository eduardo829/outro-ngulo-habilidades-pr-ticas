DROP POLICY IF EXISTS "settings readable" ON public.site_settings;
CREATE POLICY "public settings readable" ON public.site_settings FOR SELECT TO anon, authenticated
  USING (key IN ('founders', 'offer', 'support'));
CREATE POLICY "admins read all settings" ON public.site_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));