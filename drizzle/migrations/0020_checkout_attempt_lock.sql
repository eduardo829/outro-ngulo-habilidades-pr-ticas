ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS checkout_kind text,
  ADD COLUMN IF NOT EXISTS attempt_id uuid,
  ADD COLUMN IF NOT EXISTS attempt_state text,
  ADD COLUMN IF NOT EXISTS attempt_started_at timestamptz;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_checkout_kind_check CHECK (checkout_kind IS NULL OR checkout_kind IN ('pro','brick'));
ALTER TABLE public.purchases ADD CONSTRAINT purchases_attempt_state_check CHECK (attempt_state IS NULL OR attempt_state IN ('in_flight','unknown','open','rejected','done'));
-- Every purchase created before this migration came from Checkout Pro (preferences).
UPDATE public.purchases SET checkout_kind = 'pro' WHERE checkout_kind IS NULL;

-- Atomic per-purchase attempt reservation. Server-owned attempt id = idempotency key part.
-- action: 'send' (POST allowed with returned attempt_id), 'busy' (another attempt in flight/open: do not charge), 'paid'.
CREATE OR REPLACE FUNCTION public.checkout_reserve_attempt(_purchase uuid, _stale_seconds integer DEFAULT 120)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.purchases%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.purchases WHERE id = _purchase FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('action','missing'); END IF;
  IF p.payment_status = 'paid' THEN RETURN jsonb_build_object('action','paid'); END IF;
  IF p.checkout_kind IS DISTINCT FROM 'brick' THEN RETURN jsonb_build_object('action','busy','reason','legacy'); END IF;
  IF p.attempt_state = 'open' THEN
    RETURN jsonb_build_object('action','busy','attempt_id',p.attempt_id,'state',p.attempt_state);
  END IF;
  IF p.attempt_state IN ('in_flight','unknown') THEN
    -- Fresh attempt still running: block. Stale/unknown: resend with the SAME key (MP dedupes).
    IF p.attempt_started_at > now() - make_interval(secs => _stale_seconds) THEN
      RETURN jsonb_build_object('action','busy','attempt_id',p.attempt_id,'state',p.attempt_state);
    END IF;
    UPDATE public.purchases SET attempt_state='in_flight', attempt_started_at=now(), updated_at=now() WHERE id=_purchase;
    RETURN jsonb_build_object('action','send','attempt_id',p.attempt_id,'reused',true);
  END IF;
  -- No attempt yet, or last one confirmed rejected: new attempt id.
  UPDATE public.purchases SET attempt_id=gen_random_uuid(), attempt_state='in_flight', attempt_started_at=now(), updated_at=now()
    WHERE id=_purchase RETURNING attempt_id INTO p.attempt_id;
  RETURN jsonb_build_object('action','send','attempt_id',p.attempt_id,'reused',false);
END $$;

-- Marks the outcome of a POST for the current attempt only (unknown keeps blocking new charges).
CREATE OR REPLACE FUNCTION public.checkout_mark_attempt(_purchase uuid, _attempt uuid, _state text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _state NOT IN ('unknown','rejected','open') THEN RAISE EXCEPTION 'bad state'; END IF;
  UPDATE public.purchases SET attempt_state=_state, updated_at=now()
   WHERE id=_purchase AND attempt_id=_attempt AND attempt_state IS DISTINCT FROM 'done';
END $$;

-- Applies a verified Mercado Pago result: purchase + enrollment in ONE transaction.
CREATE OR REPLACE FUNCTION public.checkout_apply_payment(_purchase uuid, _status text, _transaction_id text, _provider_status text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.purchases%ROWTYPE; st text := _status;
BEGIN
  IF _status NOT IN ('paid','pending','failed','cancelled','refunded') THEN RAISE EXCEPTION 'bad status'; END IF;
  SELECT * INTO p FROM public.purchases WHERE id=_purchase FOR UPDATE;
  IF NOT FOUND OR p.payment_provider <> 'mercadopago' THEN RETURN NULL; END IF;
  -- A paid purchase is never downgraded except by refund/chargeback.
  IF p.payment_status = 'paid' AND _status <> 'refunded' THEN RETURN 'paid'; END IF;
  UPDATE public.purchases SET payment_status=st, transaction_id=_transaction_id, provider_status=_provider_status,
    attempt_state = CASE WHEN st IN ('paid','refunded') THEN 'done' WHEN st IN ('failed','cancelled') THEN 'rejected' ELSE 'open' END,
    updated_at=now()
   WHERE id=_purchase;
  IF st = 'paid' AND p.course_id IS NOT NULL THEN
    INSERT INTO public.enrollments(user_id, course_id, status, source, purchase_id)
    VALUES (p.user_id, p.course_id, 'active', 'purchase', p.id)
    ON CONFLICT (user_id, course_id) DO UPDATE SET status='active', source='purchase', purchase_id=EXCLUDED.purchase_id;
  ELSIF st = 'refunded' THEN
    UPDATE public.enrollments SET status='revoked' WHERE purchase_id=p.id;
  END IF;
  RETURN st;
END $$;

REVOKE ALL ON FUNCTION public.checkout_reserve_attempt(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_mark_attempt(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_apply_payment(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_reserve_attempt(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_mark_attempt(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_apply_payment(uuid, text, text, text) TO service_role;