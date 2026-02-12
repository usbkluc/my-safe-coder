
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: users can see their own roles, admins can see all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_role(
      (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claims', true)::json->>'sub'),
      'admin'
    )
  );

-- Create supported providers enum
CREATE TYPE public.api_provider AS ENUM (
  'openai', 'gemini', 'grok', 'wormgpt', 'hackergpt', 'claude', 'custom'
);

-- Create user_api_keys table
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider api_provider NOT NULL,
  provider_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_endpoint TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 50,
  monthly_limit INTEGER DEFAULT 1000,
  allowed_modes TEXT[] DEFAULT ARRAY['tobigpt', 'rozhovor', 'riesittest', 'pentest', 'voice'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage their own keys
CREATE POLICY "Users can view own api keys" ON public.user_api_keys
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE id = user_id)
  );

CREATE POLICY "Users can insert own api keys" ON public.user_api_keys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own api keys" ON public.user_api_keys
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own api keys" ON public.user_api_keys
  FOR DELETE USING (true);

-- Create api_usage tracking table
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.user_api_keys(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.api_usage
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert usage" ON public.api_usage
  FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
