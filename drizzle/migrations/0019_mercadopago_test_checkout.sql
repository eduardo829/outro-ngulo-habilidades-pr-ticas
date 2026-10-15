UPDATE public.courses SET is_purchasable = true WHERE slug = 'corretor-na-pratica';
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS provider_status text;