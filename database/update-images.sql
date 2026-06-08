-- Execute no Supabase SQL Editor para adicionar o campo de imagem:
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS image_url TEXT;
