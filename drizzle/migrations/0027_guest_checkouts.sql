CREATE TABLE public.guest_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL',
  origin text,
  session_id text,
  email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  user_id uuid,
  purchase_id uuid REFERENCES public.purchases(id),
  invited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guest_checkouts TO service_role;
ALTER TABLE public.guest_checkouts ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.guest_checkouts IS 'Checkout without account; server-only (no client policies). Paid sessions become a purchase+enrollment for the user with that e-mail.';

CREATE OR REPLACE FUNCTION public.auth_user_id_by_email(_email text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_id_by_email(text) TO service_role;

-- Atomically binds a paid guest checkout to a user and creates its single pending purchase.
CREATE OR REPLACE FUNCTION public.guest_checkout_bind(_guest uuid, _user uuid, _email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.guest_checkouts; pid uuid;
BEGIN
  SELECT * INTO g FROM public.guest_checkouts WHERE id = _guest FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF g.purchase_id IS NOT NULL THEN RETURN g.purchase_id; END IF;
  INSERT INTO public.purchases (user_id, course_id, amount_cents, currency, payment_provider, payment_status, checkout_kind, origin)
  VALUES (_user, g.course_id, g.amount_cents, g.currency, 'stripe', 'pending', 'stripe', g.origin)
  RETURNING id INTO pid;
  UPDATE public.guest_checkouts SET purchase_id = pid, user_id = _user, email = lower(_email), updated_at = now() WHERE id = _guest;
  RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.guest_checkout_bind(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_checkout_bind(uuid, uuid, text) TO service_role;