
create policy "avatar upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admin metrics with explicit definitions (real data only)
create or replace function public.admin_metrics()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return json_build_object(
    'enrolled_students', (select count(distinct user_id) from enrollments where status='active'),
    'active_enrollments', (select count(*) from enrollments where status='active'),
    'started_students', (select count(distinct p.user_id) from lesson_progress p join enrollments e on e.user_id=p.user_id and e.course_id=p.course_id and e.status='active'),
    'lessons_completed', (select count(*) from lesson_progress),
    'courses_completed', (select count(*) from (
        select e.user_id, e.course_id from enrollments e
        where e.status='active'
          and (select count(*) from lessons l where l.course_id=e.course_id and l.status='published') > 0
          and (select count(*) from lessons l where l.course_id=e.course_id and l.status='published')
            = (select count(*) from lesson_progress p join lessons l on l.id=p.lesson_id where p.user_id=e.user_id and p.course_id=e.course_id and l.status='published')
      ) x),
    'waitlist', (select count(*) from waitlist),
    'accounts', (select count(*) from profiles)
  );
end $$;
