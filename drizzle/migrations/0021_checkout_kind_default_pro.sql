ALTER TABLE public.purchases ALTER COLUMN checkout_kind SET DEFAULT 'pro';
UPDATE public.purchases SET checkout_kind = 'pro' WHERE checkout_kind IS NULL;