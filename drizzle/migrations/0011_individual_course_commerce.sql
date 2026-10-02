ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS sale_price_cents integer,
  ADD COLUMN IF NOT EXISTS sale_start timestamptz,
  ADD COLUMN IF NOT EXISTS sale_end timestamptz,
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_purchasable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preview_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preview_module_key text;

UPDATE public.courses c SET preview_module_key = v.k FROM (VALUES
('da-ideia-aos-primeiros-clientes','m01'),('networking-do-zero','n01'),('vendas-da-conversa-ao-cliente','v01'),('ia-no-trabalho','ia01'),('corretor-do-zero','c01'),('chegue-forte-ao-mercado','k01'),('carreira-nao-emprego','m01'),('mudar-de-carreira','t01'),('o-proximo-passo','p01'),('entrevista-sem-resposta-decorada','e01'),('linkedin-cv-e-presenca','l01'),('comunicacao-profissional','co01'),('dinheiro-sem-complicacao','d01')
) AS v(s,k) WHERE c.slug = v.s AND c.preview_module_key IS NULL;

-- Orders / purchases: written only by the server after verified payment confirmation.
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id),
  bundle_id uuid,
  payment_provider text,
  transaction_id text UNIQUE,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','cancelled')),
  amount_cents integer,
  currency text NOT NULL DEFAULT 'BRL',
  coupon_code text,
  refund_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases read" ON public.purchases FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS purchase_id uuid REFERENCES public.purchases(id),
  ADD COLUMN IF NOT EXISTS access_granted_at timestamptz NOT NULL DEFAULT now();

-- Bundles: prepared, not launched.
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  price_cents integer,
  currency text NOT NULL DEFAULT 'BRL',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bundle_courses (
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, course_id)
);
GRANT SELECT ON public.bundles, public.bundle_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bundles, public.bundle_courses TO authenticated;
GRANT ALL ON public.bundles, public.bundle_courses TO service_role;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published bundles read" ON public.bundles FOR SELECT USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin bundles write" ON public.bundles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "bundle courses read" ON public.bundle_courses FOR SELECT USING (exists(select 1 from public.bundles b where b.id=bundle_id and (b.is_published or public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admin bundle courses write" ON public.bundle_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Coupons: prepared, admin only.
CREATE TABLE public.coupons (
  code text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('percent','fixed')),
  amount integer NOT NULL CHECK (amount > 0),
  course_id uuid REFERENCES public.courses(id),
  bundle_id uuid REFERENCES public.bundles(id),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- "Tenho interesse" list per member.
CREATE TABLE public.course_interest (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
GRANT SELECT, INSERT, DELETE ON public.course_interest TO authenticated;
GRANT ALL ON public.course_interest TO service_role;
ALTER TABLE public.course_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interest" ON public.course_interest FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Free preview: any signed-in member may save work in the course's open module.
CREATE OR REPLACE FUNCTION public.is_preview_key(_course uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists(select 1 from courses where id=_course and status='published' and preview_enabled and preview_module_key is not null and _key like preview_module_key || '.%')
$$;
DROP POLICY "own outputs write" ON public.learning_outputs;
CREATE POLICY "own outputs write" ON public.learning_outputs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.is_enrolled(auth.uid(), course_id) OR public.is_staff(auth.uid()) OR public.is_preview_key(course_id, key)));
DROP POLICY "own outputs update" ON public.learning_outputs;
CREATE POLICY "own outputs update" ON public.learning_outputs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (public.is_enrolled(auth.uid(), course_id) OR public.is_staff(auth.uid()) OR public.is_preview_key(course_id, key)));