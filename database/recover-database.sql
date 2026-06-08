-- =========================================================================
-- SCRIPT DE RECUPERAÇÃO DO BANCO DE DADOS E POLÍTICAS RLS (SUPABASE)
-- =========================================================================

-- 1. ATIVAR RLS NOVAMENTE PARA PROTEGER OS DADOS
-- (Resolve a mensagem de alerta "RLS Disabled" e "UNRESTRICTED")
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Apagar políticas antigas para evitar falhas de duplicidade antes de recriar
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can manage their own houses" ON public.houses;

-- 2. RECRIAR AS POLÍTICAS DE SEGURANÇA SEGUINDO A PRÁTICA CORRETA
-- (Garante que apenas o próprio usuário pode acessar seus dados)
CREATE POLICY "Users can manage their own tasks"
ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cars"
ON public.cars FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own houses"
ON public.houses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. INSERIR AS TAREFAS ORIGINAIS PARA O USUÁRIO ALEFYREZENDE@GMAIL.COM 
-- UID capturado nas imagens: 287d7d93-6683-42ce-a53b-3813afeeb8d6

INSERT INTO public.tasks (id, user_id, title, category, priority, status, subtasks)
VALUES 
(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Comprar carro novo', 'Carro', 'Alta', 'Não iniciado', '[{"id": "c1", "title": "Guardar dinheiro para entrada", "completed": false}, {"id": "c2", "title": "Definir valor da entrada", "completed": false}, {"id": "c3", "title": "Definir valor máximo da parcela", "completed": false}, {"id": "c4", "title": "Pesquisar carros", "completed": false}, {"id": "c5", "title": "Simular financiamento", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Vender Peugeot', 'Carro', 'Alta', 'Não iniciado', '[{"id": "p1", "title": "Fazer limpeza profunda", "completed": false}, {"id": "p2", "title": "Consertar ar-condicionado", "completed": false}, {"id": "p3", "title": "Consertar vazamento de água/arrefecimento", "completed": false}, {"id": "p4", "title": "Fazer revisão mecânica", "completed": false}, {"id": "p5", "title": "Tirar fotos", "completed": false}, {"id": "p6", "title": "Anunciar o carro", "completed": false}, {"id": "p7", "title": "Vender o carro", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Mal Cheiro no Banheiro', 'Banheiro', 'Alta', 'Não iniciado', '[{"id": "b1", "title": "Comprar ralo novo que não suba cheiro", "completed": false}, {"id": "b2", "title": "Comprar encanamentos e peças", "completed": false}, {"id": "b3", "title": "Quebrar parte da varanda para corrigir o encanamento", "completed": false}, {"id": "b4", "title": "Refazer acabamento da varanda", "completed": false}, {"id": "b5", "title": "Testar se o cheiro parou", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Armário novo', 'Banheiro', 'Média', 'Não iniciado', '[{"id": "a1", "title": "Medir espaço do banheiro", "completed": false}, {"id": "a2", "title": "Comprar armário inferior", "completed": false}, {"id": "a3", "title": "Comprar espelho ou armário superior", "completed": false}, {"id": "a4", "title": "Verificar instalação", "completed": false}, {"id": "a5", "title": "Instalar armário novo", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Porta do banheiro', 'Banheiro', 'Média', 'Não iniciado', '[{"id": "po1", "title": "Ver se a porta atual tem conserto", "completed": false}, {"id": "po2", "title": "Comprar porta nova, se necessário", "completed": false}, {"id": "po3", "title": "Comprar fechadura e dobradiças", "completed": false}, {"id": "po4", "title": "Instalar porta", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Suporte de papel higiênico', 'Banheiro', 'Baixa', 'Não iniciado', '[{"id": "su1", "title": "Comprar suporte novo", "completed": false}, {"id": "su2", "title": "Instalar suporte", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Sofá', 'Sala', 'Média', 'Não iniciado', '[{"id": "so1", "title": "Fazer orçamento de higienização", "completed": false}, {"id": "so2", "title": "Fazer orçamento de impermeabilização", "completed": false}, {"id": "so3", "title": "Agendar serviço", "completed": false}, {"id": "so4", "title": "Pagar serviço", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Instalação 220V', 'Elétrica', 'Alta', 'Não iniciado', '[{"id": "e1", "title": "Reservar R$ 500,00", "completed": false}, {"id": "e2", "title": "Confirmar valor final", "completed": false}, {"id": "e3", "title": "Agendar serviço", "completed": false}, {"id": "e4", "title": "Pagar serviço", "completed": false}]'::jsonb),

(gen_random_uuid(), '287d7d93-6683-42ce-a53b-3813afeeb8d6', 'Berço maior', 'Maitê', 'Alta', 'Não iniciado', '[{"id": "ma1", "title": "Medir espaço disponível", "completed": false}, {"id": "ma2", "title": "Pesquisar modelos", "completed": false}, {"id": "ma3", "title": "Comparar preços", "completed": false}, {"id": "ma4", "title": "Comprar berço", "completed": false}, {"id": "ma5", "title": "Montar berço", "completed": false}]'::jsonb)

ON CONFLICT DO NOTHING;
