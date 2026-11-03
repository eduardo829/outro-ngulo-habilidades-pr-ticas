CREATE OR REPLACE FUNCTION public.is_request_owner(_r uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.service_requests WHERE id=_r AND requester_id=_u) $$;
CREATE OR REPLACE FUNCTION public.is_request_recipient(_r uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.service_request_matches WHERE request_id=_r AND professional_id=_u) $$;
DROP POLICY "read requests" ON public.service_requests;
CREATE POLICY "read requests" ON public.service_requests FOR SELECT TO authenticated USING (requester_id = auth.uid() OR public.is_staff(auth.uid()) OR public.is_request_recipient(id, auth.uid()));
DROP POLICY "read matches" ON public.service_request_matches;
CREATE POLICY "read matches" ON public.service_request_matches FOR SELECT TO authenticated USING (professional_id = auth.uid() OR public.is_staff(auth.uid()) OR public.is_request_owner(request_id, auth.uid()));
CREATE OR REPLACE FUNCTION public.protect_interest_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.opportunity_id <> OLD.opportunity_id OR NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_interest_update BEFORE UPDATE ON public.opportunity_interests FOR EACH ROW EXECUTE FUNCTION public.protect_interest_update();