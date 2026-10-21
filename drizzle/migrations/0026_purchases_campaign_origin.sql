ALTER TABLE public.purchases ADD COLUMN origin text;
COMMENT ON COLUMN public.purchases.origin IS 'Marketing campaign origin (?origem, e.g. instagram) captured at checkout; nullable.';