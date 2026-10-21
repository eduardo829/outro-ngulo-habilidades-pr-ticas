CREATE OR REPLACE FUNCTION public.checkout_apply_verified_payment(_purchase uuid, _status text, _transaction_id text, _provider_status text, _attempt uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.purchases%ROWTYPE; st text := _status;
BEGIN
  IF _status NOT IN ('paid','pending','failed','cancelled','refunded') THEN RAISE EXCEPTION 'bad status'; END IF;
  SELECT * INTO p FROM public.purchases WHERE id=_purchase FOR UPDATE;
  IF NOT FOUND OR p.payment_provider NOT IN ('mercadopago','stripe') THEN RETURN NULL; END IF;
  IF p.payment_status = 'refunded' THEN RETURN 'refunded'; END IF;
  IF p.payment_status = 'paid' AND _status <> 'refunded' THEN RETURN 'paid'; END IF;
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