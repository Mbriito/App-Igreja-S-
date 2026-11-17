-- Script SQL para o Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Perfis / Membros
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  status TEXT DEFAULT 'Ativo',
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
  church_position TEXT DEFAULT 'Membro', -- Visitante, Novo convertido, Jovem, Membro, Obreiro, Diácono, Evangelista, Presbítero, Pastor, Missionário
  active_ministries TEXT,
  children_count INTEGER DEFAULT 0,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrações idempotentes para bancos já existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Gatilho para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Tabela de Avisos e Eventos
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_event BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

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

-- 5. Tabela de Configurações do App (Banner da Home, Dados de Dízimos/Ofertas)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Seed/Atualização idempotente da Chave PIX oficial
INSERT INTO public.app_settings (key, value)
VALUES
  ('pix_key', 'aigrejadavilanase@gmail.com'),
  ('pix_recipient', 'Igreja da Vila Sé'),
  ('pix_bank', 'Banco / Instituição Financeira da Igreja')
ON CONFLICT (key) DO UPDATE SET
  value = CASE
    WHEN public.app_settings.key = 'pix_key'
      AND (public.app_settings.value IS NULL OR public.app_settings.value = '' OR public.app_settings.value = 'secretaria@aigrejadavila-se.online')
    THEN EXCLUDED.value
    ELSE public.app_settings.value
  END;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- FUNÇÕES DE SEGURANÇA (FIX RECURSION)
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
    DROP POLICY IF EXISTS "Profiles are viewable by owner or admins" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

    DROP POLICY IF EXISTS "notices_select_policy" ON public.notices;
    DROP POLICY IF EXISTS "notices_insert_policy" ON public.notices;
    DROP POLICY IF EXISTS "notices_update_policy" ON public.notices;
    DROP POLICY IF EXISTS "notices_delete_policy" ON public.notices;
    DROP POLICY IF EXISTS "Notices are viewable by authenticated users" ON public.notices;
    DROP POLICY IF EXISTS "Only admins can insert notices" ON public.notices;

    DROP POLICY IF EXISTS "schedules_select_policy" ON public.schedules;
    DROP POLICY IF EXISTS "schedules_insert_policy" ON public.schedules;
    DROP POLICY IF EXISTS "schedules_update_policy" ON public.schedules;
    DROP POLICY IF EXISTS "schedules_delete_policy" ON public.schedules;
    DROP POLICY IF EXISTS "Schedules are viewable by registered members" ON public.schedules;
    DROP POLICY IF EXISTS "Only admins can insert schedules" ON public.schedules;

    DROP POLICY IF EXISTS "prayers_select_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "prayers_insert_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "prayers_update_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "prayers_delete_policy" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Public prayer requests are viewable by everyone" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Users can create prayer requests" ON public.prayer_requests;
    DROP POLICY IF EXISTS "Users can update own prayer requests" ON public.prayer_requests;

    DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;
    DROP POLICY IF EXISTS "app_settings_insert_policy" ON public.app_settings;
    DROP POLICY IF EXISTS "app_settings_update_policy" ON public.app_settings;
    DROP POLICY IF EXISTS "app_settings_delete_policy" ON public.app_settings;
END $$;

-- PERFIS
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.check_is_admin());
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING (public.check_is_admin());

-- AVISOS
CREATE POLICY "notices_select_policy" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "notices_insert_policy" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());
CREATE POLICY "notices_update_policy" ON public.notices FOR UPDATE TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());
CREATE POLICY "notices_delete_policy" ON public.notices FOR DELETE TO authenticated USING (public.check_is_admin());

-- ESCALAS
CREATE POLICY "schedules_select_policy" ON public.schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "schedules_insert_policy" ON public.schedules FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());
CREATE POLICY "schedules_update_policy" ON public.schedules FOR UPDATE TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());
CREATE POLICY "schedules_delete_policy" ON public.schedules FOR DELETE TO authenticated USING (public.check_is_admin());

-- ORAÇÃO
CREATE POLICY "prayers_select_policy" ON public.prayer_requests FOR SELECT TO authenticated USING (NOT is_private OR auth.uid() = user_id OR public.check_is_admin());
CREATE POLICY "prayers_insert_policy" ON public.prayer_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prayers_update_policy" ON public.prayer_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prayers_delete_policy" ON public.prayer_requests FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.check_is_admin());

-- CONFIGURAÇÕES DO APP
CREATE POLICY "app_settings_select_policy" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings_insert_policy" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());
CREATE POLICY "app_settings_update_policy" ON public.app_settings FOR UPDATE TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());
CREATE POLICY "app_settings_delete_policy" ON public.app_settings FOR DELETE TO authenticated USING (public.check_is_admin());

-- STORAGE BUCKETS E POLÍTICAS (AVISOS E AVATARES)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avisos', 'avisos', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Update Media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Delete Media" ON storage.objects;
END $$;

CREATE POLICY "Public Read Media" ON storage.objects FOR SELECT TO public USING (bucket_id IN ('avisos', 'avatars'));
CREATE POLICY "Authenticated Upload Media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('avisos', 'avatars'));
CREATE POLICY "Authenticated Update Media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('avisos', 'avatars'));
CREATE POLICY "Authenticated Delete Media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('avisos', 'avatars'));

-- GATILHOS (Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    CASE WHEN is_first_user THEN 'admin' ELSE 'member' END,
    'Ativo'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
