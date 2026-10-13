DROP POLICY IF EXISTS "Members read lesson videos" ON public.course_videos;
CREATE POLICY "Members read lesson videos" ON public.course_videos FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.courses c WHERE c.slug = course_videos.course_slug
      AND (public.is_enrolled(auth.uid(), c.id) OR public.is_preview_key(c.id, course_videos.module_key))));

DROP POLICY IF EXISTS "members read bookings" ON public.event_bookings;
CREATE POLICY "members read bookings" ON public.event_bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "read comments" ON public.comments;
CREATE POLICY "read comments" ON public.comments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR (public.is_active_member(auth.uid())
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND NOT p.removed)));