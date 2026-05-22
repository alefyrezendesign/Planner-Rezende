-- Execute no Supabase SQL Editor para adicionar o campo de data de vencimento nas tarefas:
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
