CREATE TABLE public.card_cooldowns (
  fingerprint text PRIMARY KEY,
  blocked_until timestamptz NOT NULL,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.card_cooldowns TO service_role;
ALTER TABLE public.card_cooldowns ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.card_cooldowns IS 'Server-only: hashed card fingerprint (method+bin+last4) blocked after issuer/antifraud rejection.';