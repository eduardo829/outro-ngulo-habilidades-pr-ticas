REVOKE UPDATE ON public.messages FROM PUBLIC, anon, authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.checkout_apply_verified_payment(_purchase uuid, _status text, _transaction_id text, _provider_status text, _attempt uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.purchases%ROWTYPE; st text := _status;
BEGIN
  IF _status NOT IN ('paid','pending','failed','cancelled','refunded') THEN RAISE EXCEPTION 'bad status'; END IF;
  SELECT * INTO p FROM public.purchases WHERE id=_purchase FOR UPDATE;
  IF NOT FOUND OR p.payment_provider <> 'mercadopago' THEN RETURN NULL; END IF;
  -- Refund is terminal for this purchase: a new purchase is required for a replacement payment.
  IF p.payment_status = 'refunded' THEN RETURN 'refunded'; END IF;
  IF p.payment_status = 'paid' AND _status <> 'refunded' THEN RETURN 'paid'; END IF;
  -- Old failed/pending notifications must not unlock or replace a newer attempt.
  IF st IN ('failed','cancelled','pending') AND p.checkout_kind = 'brick' AND p.attempt_id IS NOT NULL THEN
    IF (_attempt IS NOT NULL AND _attempt <> p.attempt_id)
       OR (_attempt IS NULL AND p.attempt_state IN ('in_flight','unknown')) THEN
      RETURN 'pending';
    END IF;
  END IF;
  UPDATE public.purchases SET payment_status=st, transaction_id=_transaction_id, provider_status=_provider_status,
    attempt_state=CASE WHEN st IN ('paid','refunded') THEN 'done' WHEN st IN ('failed','cancelled') THEN 'rejected' ELSE 'open' END,
    updated_at=now() WHERE id=_purchase;
  IF st='paid' AND p.course_id IS NOT NULL THEN
    INSERT INTO public.enrollments(user_id,course_id,status,source,purchase_id)
    VALUES(p.user_id,p.course_id,'active','purchase',p.id)
    ON CONFLICT(user_id,course_id) DO UPDATE SET status='active',source='purchase',purchase_id=EXCLUDED.purchase_id;
  ELSIF st='refunded' THEN
    UPDATE public.enrollments SET status='revoked' WHERE purchase_id=p.id;
  END IF;
  RETURN st;
END $$;
REVOKE ALL ON FUNCTION public.checkout_apply_verified_payment(uuid,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_apply_verified_payment(uuid,text,text,text,uuid) TO service_role;

-- Preserve compatibility with the deployed application without letting unbound results unlock a reservation.
CREATE OR REPLACE FUNCTION public.checkout_apply_payment(_purchase uuid,_status text,_transaction_id text,_provider_status text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT public.checkout_apply_verified_payment(_purchase,_status,_transaction_id,_provider_status,NULL);
$$;
REVOKE ALL ON FUNCTION public.checkout_apply_payment(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_apply_payment(uuid,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ai_consume(_user uuid,_ip_hash text,_feature text,_commit boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 s public.ai_settings; d date := (now() AT TIME ZONE 'utc')::date;
 subj text; u public.ai_usage; ipu public.ai_usage; lim int; spent numeric;
 reason text := NULL; ends timestamptz;
BEGIN
 IF _ip_hash IS NULL OR length(_ip_hash)<16 OR length(_ip_hash)>128 OR _feature NOT IN ('assistant','trilhas','outro_angulo') THEN
  RETURN jsonb_build_object('allowed',false,'reason','unavailable');
 END IF;
 -- One global settings lock serializes the daily estimated-cost reservation across every user and feature.
 SELECT * INTO s FROM public.ai_settings WHERE id=1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('allowed',false,'reason','unavailable'); END IF;
 subj := CASE WHEN _user IS NULL THEN 'v:'||_ip_hash ELSE 'u:'||_user::text END;
 lim := CASE WHEN _user IS NULL THEN s.visitor_daily_messages ELSE s.member_daily_messages END;
 INSERT INTO public.ai_usage(subject,day) VALUES(subj,d) ON CONFLICT DO NOTHING;
 SELECT * INTO u FROM public.ai_usage WHERE subject=subj AND day=d FOR UPDATE;
 INSERT INTO public.ai_usage(subject,day) VALUES('ip:'||_ip_hash,d) ON CONFLICT DO NOTHING;
 SELECT * INTO ipu FROM public.ai_usage WHERE subject='ip:'||_ip_hash AND day=d FOR UPDATE;
 SELECT coalesce(sum(est_cost_cents),0) INTO spent FROM public.ai_spend WHERE day=d;
 IF _user IS NOT NULL AND u.first_at IS NOT NULL THEN ends:=u.first_at+make_interval(mins=>s.session_minutes); END IF;
 IF spent>=s.daily_spend_limit_cents OR spent+s.est_cost_cents_per_message>s.daily_spend_limit_cents THEN reason:='budget';
 ELSIF u.messages>=lim THEN reason:='messages';
 ELSIF ends IS NOT NULL AND ends<=now() THEN reason:='time';
 ELSIF ipu.messages>=s.ip_daily_messages THEN reason:='ip';
 ELSIF (u.minute_start>now()-interval '1 minute' AND u.minute_count>=s.per_minute_limit)
    OR (ipu.minute_start>now()-interval '1 minute' AND ipu.minute_count>=s.per_minute_limit) THEN reason:='rate';
 END IF;
 IF _commit AND reason IS NULL THEN
  UPDATE public.ai_usage SET messages=messages+1,first_at=coalesce(first_at,now()),
   minute_start=CASE WHEN minute_start>now()-interval '1 minute' THEN minute_start ELSE now() END,
   minute_count=CASE WHEN minute_start>now()-interval '1 minute' THEN minute_count+1 ELSE 1 END
   WHERE subject=subj AND day=d RETURNING * INTO u;
  UPDATE public.ai_usage SET messages=messages+1,
   minute_start=CASE WHEN minute_start>now()-interval '1 minute' THEN minute_start ELSE now() END,
   minute_count=CASE WHEN minute_start>now()-interval '1 minute' THEN minute_count+1 ELSE 1 END
   WHERE subject='ip:'||_ip_hash AND day=d;
  INSERT INTO public.ai_spend(day,feature,requests,est_cost_cents) VALUES(d,_feature,1,s.est_cost_cents_per_message)
   ON CONFLICT(day,feature) DO UPDATE SET requests=ai_spend.requests+1,est_cost_cents=ai_spend.est_cost_cents+EXCLUDED.est_cost_cents;
  IF _user IS NOT NULL THEN ends:=u.first_at+make_interval(mins=>s.session_minutes); END IF;
 END IF;
 RETURN jsonb_build_object('allowed',reason IS NULL,'reason',reason,'member',_user IS NOT NULL,
  'limit',lim,'remaining',greatest(lim-u.messages,0),'session_minutes',s.session_minutes,
  'session_ends_at',CASE WHEN _user IS NULL THEN NULL ELSE ends END,'resets_at',((d+1)::timestamp AT TIME ZONE 'utc'));
END $$;
REVOKE ALL ON FUNCTION public.ai_consume(uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ai_consume(uuid,text,text,boolean) TO service_role;