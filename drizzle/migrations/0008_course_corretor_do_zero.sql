INSERT INTO public.courses (slug, title, subtitle, instructor, level, status, is_public, access_policy, position)
VALUES ('corretor-do-zero', 'Corretor do zero: dos primeiros passos à primeira venda', 'Um caminho prático para entrar no mercado imobiliário.', 'Vinicius Silva', 'Iniciante', 'published', true, 'enrollment', 5)
ON CONFLICT (slug) DO NOTHING;