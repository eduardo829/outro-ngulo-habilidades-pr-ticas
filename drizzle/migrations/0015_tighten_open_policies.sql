DROP POLICY IF EXISTS "anyone joins waitlist" ON public.waitlist;
CREATE POLICY "anyone joins waitlist" ON public.waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND char_length(email) BETWEEN 5 AND 255 AND (name IS NULL OR char_length(name) <= 120));

DROP POLICY IF EXISTS "members read announcements" ON public.announcements;
CREATE POLICY "members read announcements" ON public.announcements FOR SELECT TO authenticated
  USING (public.is_active_member(auth.uid()) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "members read events" ON public.events;
CREATE POLICY "members read events" ON public.events FOR SELECT TO authenticated
  USING (public.is_active_member(auth.uid()) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "read questions" ON public.event_questions;
CREATE POLICY "read questions" ON public.event_questions FOR SELECT TO authenticated
  USING (public.is_active_member(auth.uid()) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "read votes" ON public.event_question_votes;
CREATE POLICY "read votes" ON public.event_question_votes FOR SELECT TO authenticated
  USING (public.is_active_member(auth.uid()) OR public.is_staff(auth.uid()));