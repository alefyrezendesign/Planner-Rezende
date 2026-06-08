-- ==============================================
-- Schema Creation for Planner Rezende
-- Run this in your Supabase SQL Editor
-- ==============================================

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    estimated_cost NUMERIC DEFAULT 0,
    saved_amount NUMERIC DEFAULT 0,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cars Table
CREATE TABLE IF NOT EXISTS public.cars (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    car_value NUMERIC NOT NULL,
    down_payment_target NUMERIC NOT NULL,
    down_payment_saved NUMERIC DEFAULT 0,
    interest_rate_monthly NUMERIC NOT NULL,
    installments INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Houses Table
CREATE TABLE IF NOT EXISTS public.houses (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_value NUMERIC NOT NULL,
    down_payment_target NUMERIC NOT NULL,
    down_payment_saved NUMERIC DEFAULT 0,
    subsidy NUMERIC DEFAULT 0,
    interest_rate_annual NUMERIC NOT NULL,
    installments INTEGER NOT NULL,
    amortization_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- Row Level Security (RLS) setup
-- (Ensures users can only access their own data)
-- ==============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can manage their own tasks"
ON public.tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for cars
CREATE POLICY "Users can manage their own cars"
ON public.cars
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for houses
CREATE POLICY "Users can manage their own houses"
ON public.houses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
