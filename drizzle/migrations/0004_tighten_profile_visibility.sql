CREATE OR REPLACE FUNCTION public.profile_visible(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select _viewer = _target
    or exists (select 1 from profiles where id=_target and in_directory)
    or has_role(_viewer,'admin') or has_role(_viewer,'moderator')
    or exists (select 1 from posts where author_id=_target and not removed)
    or exists (select 1 from comments where author_id=_target)
    or exists (select 1 from conversations where (user_a=_viewer and user_b=_target) or (user_b=_viewer and user_a=_target))
$$;
DROP POLICY IF EXISTS "members read profiles" ON public.profiles;
CREATE POLICY "members read visible profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.profile_visible(auth.uid(), id));