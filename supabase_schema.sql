-- Script SQL para o Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  gender TEXT CHECK (gender IN ('M', 'F')),
  birth_date DATE,
  rg TEXT,
  cpf TEXT,
  phone TEXT,
  baptism_date DATE,
  marital_status TEXT,
  spouse_name TEXT,
  marriage_date DATE,
  
  -- Endereço
  address_street TEXT,
  address_complement TEXT,
  address_number TEXT,
  address_neighborhood TEXT,
  address_zip TEXT,
  address_city TEXT,
  address_state TEXT,
  
  education_level TEXT,
  employment_status TEXT CHECK (employment_status IN ('Empregado', 'Desempregado')),
  profession TEXT,
  
  -- Congregação Anterior
  prev_church_name TEXT,
  prev_church_address TEXT,
  prev_church_number TEXT,
  prev_church_neighborhood TEXT,
  prev_church_zip TEXT,
  prev_church_city TEXT,
  prev_church_state TEXT,
  prev_church_pastor TEXT,
  prev_church_phone TEXT,
  
  -- Posição na Igreja
  church_position TEXT, -- Visitante, Novo convertido, Jovem, Membro, Obreiro, Diácono, Evangelista, Presbítero, Pastor, Missionário
  active_ministries TEXT,
  children_count INTEGER DEFAULT 0,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Avisos e Eventos
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- Nova coluna para fotos do mural
  event_date TIMESTAMP WITH TIME ZONE,
  is_event BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- INSTRUÇÕES PARA STORAGE (SUPABASE):
-- 1. Vá em 'Storage' no painel do Supabase.
-- 2. Crie um novo bucket chamado 'avisos'.
-- 3. Marque como 'Public' (Público) para que todos possam ver as imagens.

-- 3. Tabela de Escalas
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_name TEXT NOT NULL,
  member_name TEXT NOT NULL,
  member_id UUID REFERENCES public.profiles(id),
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Pedidos de Oração
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  praying_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- FUNÇÕES DE SEGURANÇA (FIX RECURSION)
-- SECURITY DEFINER faz a função rodar com privilégios de superusuário (postgres), ignorando RLS.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- POLÍTICAS DE SEGURANÇA (RLS) - LIMPEZA E APLICAÇÃO
DO $$ 
BEGIN
    -- Limpeza de políticas da tabela profiles
    DROP POLICY IF EXISTS "Profiles are viewable by owner or admins" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

    -- Limpeza de políticas das outras tabelas
    DROP POLICY IF EXISTS "notices_select_policy" ON public.notices;
    DROP POLICY IF EXISTS "notices_insert_policy" ON public.notices;
    DROP POLICY IF EXISTS "Notices are viewable by authenticated users" ON public.notices;
    DROP POLICY IF EXISTS "Only admins can insert notices" ON public.notices;

    DROP POLICY IF EXISTS "schedules_select_policy" ON public.schedules;
    DROP POLICY IF EXISTS "schedules_insert_policy" ON public.schedules;
    DROP POLICY IF EXISTS "Schedules are viewable by registered members" ON public.schedules;
    DROP POLICY IF EXISTS "Only admins can insert schedules" ON public.schedules;

    DROP POLICY IF EXISTS "prayers_select_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "prayers_insert_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "prayers_update_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Public prayer requests are viewable by everyone" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Users can create prayer requests" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Users can update own prayer requests" ON public.prayer_requests;
END $$;

-- Aplicar novas políticas
-- PERFIS
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- AVISOS
CREATE POLICY "notices_select_policy" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "notices_insert_policy" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());

-- ESCALAS
CREATE POLICY "schedules_select_policy" ON public.schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "schedules_insert_policy" ON public.schedules FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());

-- ORAÇÃO
CREATE POLICY "prayers_select_policy" ON public.prayer_requests FOR SELECT TO authenticated USING (NOT is_private OR auth.uid() = user_id OR public.check_is_admin());
CREATE POLICY "prayers_insert_policy" ON public.prayer_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prayers_update_policy" ON public.prayer_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- GATILHOS (Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Verifica se é o primeiro usuário do sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    CASE WHEN is_first_user THEN 'admin' ELSE 'member' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMANDO MANUAL PARA TORNAR ADMIN (Caso necessário):
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'SEU_UUID_AQUI';
-- Ou pelo e-mail (mais fácil):
-- UPDATE public.profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com');

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
