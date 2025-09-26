-- Create admin users and roles system
CREATE TYPE public.user_role AS ENUM ('admin', 'advisor', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- IUL Illustrations table
CREATE TABLE public.iul_illustrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  carrier_name TEXT,
  policy_type TEXT,
  extracted_data JSONB NOT NULL DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.iul_illustrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for IUL illustrations
CREATE POLICY "Admins can manage illustrations" 
ON public.iul_illustrations 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'advisor'));

-- Stress test scenarios table
CREATE TABLE public.stress_test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  illustration_id UUID REFERENCES public.iul_illustrations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scenario_name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stress_test_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for stress test scenarios
CREATE POLICY "Admins can manage scenarios" 
ON public.stress_test_scenarios 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'advisor'));

-- Digital twin conversations table
CREATE TABLE public.digital_twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  illustration_id UUID REFERENCES public.iul_illustrations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  response JSONB NOT NULL DEFAULT '{}',
  simulation_results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_twin_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for digital twin conversations
CREATE POLICY "Admins can manage conversations" 
ON public.digital_twin_conversations 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'advisor'));

-- Update triggers
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_iul_illustrations_updated_at
  BEFORE UPDATE ON public.iul_illustrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stress_test_scenarios_updated_at
  BEFORE UPDATE ON public.stress_test_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();