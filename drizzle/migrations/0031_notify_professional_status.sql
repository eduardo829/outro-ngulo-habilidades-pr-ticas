CREATE OR REPLACE FUNCTION public.notify_professional_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status='approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    INSERT INTO public.notifications(user_id, kind, title, link) VALUES (NEW.user_id, 'service', 'Seu perfil profissional foi aprovado', '/especialistas/painel');
  END IF;
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    INSERT INTO public.notifications(user_id, kind, title, link) VALUES (NEW.user_id, 'service', 'Seu perfil profissional foi verificado', '/especialistas/painel');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notify_professional_status AFTER UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.notify_professional_status();