CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'external' CHECK (kind IN ('founder','external')),
  relation text,
  country text NOT NULL,
  city text,
  category text NOT NULL,
  areas text[] NOT NULL DEFAULT '{}',
  partnership_types text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  website text,
  logo_url text,
  published boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners public read" ON public.partners FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "partners admin write" ON public.partners FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.partner_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  country text,
  area text,
  interest text NOT NULL,
  proposal text NOT NULL,
  link text,
  origin text,
  is_member boolean NOT NULL DEFAULT false,
  user_id uuid,
  ip_hash text,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','em_analise','contatado','qualificado','convertido','encerrado')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_proposals_rate ON public.partner_proposals (ip_hash, created_at);
CREATE INDEX partner_proposals_email ON public.partner_proposals (email, created_at);
GRANT SELECT, UPDATE ON public.partner_proposals TO authenticated;
GRANT ALL ON public.partner_proposals TO service_role;
ALTER TABLE public.partner_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals admin read" ON public.partner_proposals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "proposals admin update" ON public.partner_proposals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.partner_clicks (
  id bigserial PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  is_member boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_clicks TO authenticated;
GRANT ALL ON public.partner_clicks TO service_role;
GRANT USAGE ON SEQUENCE public.partner_clicks_id_seq TO service_role;
ALTER TABLE public.partner_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clicks admin read" ON public.partner_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.partners (slug,name,kind,relation,country,city,category,areas,partnership_types,description,website,logo_url,published,position) VALUES
('eduardo-araujo','Eduardo Araujo','founder','Fundador do Outro Ângulo','Reino Unido','Londres','Empreendedorismo, consultoria e parcerias estratégicas',ARRAY['Desenvolvimento de negócios','Estratégia empresarial','Empreendedorismo','Parcerias comerciais','Tecnologia e automação'],ARRAY['Parceria comercial','Colaboração em projetos'],'Empreendedor e operador de negócios baseado em Londres, com cerca de 15 anos construindo e operando empresas em pisos, reformas e construção. Atua com liderança operacional, crescimento comercial e parcerias estratégicas.','https://araujoeduardo.com/','/__l5e/assets-v1/adb21d25-9455-446d-bb55-772c5629365b/partner-ea.png',true,1),
('the-flooring-empire','The Flooring Empire','founder','Empresa vinculada ao fundador Eduardo Araujo','Reino Unido','Londres','Construção, flooring e serviços especializados',ARRAY['Fornecimento de pisos','Instalação de pisos','Projetos residenciais e comerciais','Parcerias B2B'],ARRAY['Parceria comercial','Parceria B2B'],'Especialista em pisos de madeira premium no Reino Unido: madeira engenheirada, vinílico de luxo (LVT) e madeira maciça, com instalação profissional.','https://theflooringempire.co.uk/','/__l5e/assets-v1/4b06a271-1b23-4438-bfa2-03531d49d36d/partner-tfe.webp',true,2),
('refurb-hub','RefurbHub','founder','Empresa vinculada ao fundador Eduardo Araujo','Reino Unido','Londres','Construção, reformas e gerenciamento de projetos',ARRAY['Reformas residenciais','Renovação de imóveis','Gerenciamento de obras','Serviços especializados de construção'],ARRAY['Parceria comercial','Parceria B2B'],'Reformas residenciais completas em Londres, do projeto e obras estruturais ao acabamento, com uma equipe e um gerente de projeto coordenando tudo.','https://refurbishmenthub.co.uk/','/__l5e/assets-v1/6a6b9134-766c-4e11-a575-b859edb52b48/partner-rh.png',true,3);