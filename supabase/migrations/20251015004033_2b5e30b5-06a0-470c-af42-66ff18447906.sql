-- ============================================
-- SECURITY FIX: Remove Hardcoded UUID Backdoor
-- ============================================
-- This migration removes the hardcoded UUID (12345678-1234-1234-1234-123456789abc) 
-- from all RLS policies and the has_role function.

-- Fix has_role function - remove hardcoded UUID bypass
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix clients table policies
DROP POLICY IF EXISTS "Advisors and owners can view clients" ON public.clients;
CREATE POLICY "Advisors and owners can view clients"
ON public.clients
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

DROP POLICY IF EXISTS "Anyone can create client records" ON public.clients;
CREATE POLICY "Anyone can create client records"
ON public.clients
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

DROP POLICY IF EXISTS "Advisors can update their clients" ON public.clients;
CREATE POLICY "Advisors can update their clients"
ON public.clients
FOR UPDATE
USING (
  (has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  (has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Advisors can delete their clients" ON public.clients;
CREATE POLICY "Advisors can delete their clients"
ON public.clients
FOR DELETE
USING (
  (has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Fix assets table policies
DROP POLICY IF EXISTS "Advisors and anonymous can view client assets" ON public.assets;
CREATE POLICY "Advisors can view client assets"
ON public.assets
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

DROP POLICY IF EXISTS "Advisors and anonymous can insert client assets" ON public.assets;
CREATE POLICY "Advisors can insert client assets"
ON public.assets
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

DROP POLICY IF EXISTS "Advisors and anonymous can update client assets" ON public.assets;
CREATE POLICY "Advisors can update client assets"
ON public.assets
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

DROP POLICY IF EXISTS "Advisors and anonymous can delete client assets" ON public.assets;
CREATE POLICY "Advisors can delete client assets"
ON public.assets
FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

-- Fix appointments table policies
DROP POLICY IF EXISTS "Only staff can view appointments" ON public.appointments;
CREATE POLICY "Only staff can view appointments"
ON public.appointments
FOR SELECT
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Only staff can update appointments" ON public.appointments;
CREATE POLICY "Only staff can update appointments"
ON public.appointments
FOR UPDATE
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Only staff can delete appointments" ON public.appointments;
CREATE POLICY "Only staff can delete appointments"
ON public.appointments
FOR DELETE
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Fix chat_conversations table policies
DROP POLICY IF EXISTS "Only staff can view chat conversations" ON public.chat_conversations;
CREATE POLICY "Only staff can view chat conversations"
ON public.chat_conversations
FOR SELECT
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Only staff can update chat conversations" ON public.chat_conversations;
CREATE POLICY "Only staff can update chat conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Only staff can delete chat conversations" ON public.chat_conversations;
CREATE POLICY "Only staff can delete chat conversations"
ON public.chat_conversations
FOR DELETE
USING (
  has_role(auth.uid(), 'advisor'::user_role) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Fix documents table policies - remove hardcoded UUID
DROP POLICY IF EXISTS "Anyone can upload documents" ON public.documents;
CREATE POLICY "Users can upload documents"
ON public.documents
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their documents" ON public.documents;
CREATE POLICY "Users can view their documents"
ON public.documents
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their documents" ON public.documents;
CREATE POLICY "Users can update their documents"
ON public.documents
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their documents" ON public.documents;
CREATE POLICY "Users can delete their documents"
ON public.documents
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix liabilities table policies
DROP POLICY IF EXISTS "Advisors can manage client liabilities" ON public.liabilities;
CREATE POLICY "Advisors can manage client liabilities"
ON public.liabilities
FOR ALL
USING (
  has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = liabilities.client_id AND clients.advisor_id = auth.uid()
  )
);

-- Fix financial_profile table policies  
DROP POLICY IF EXISTS "Advisors can manage client profiles" ON public.financial_profile;
CREATE POLICY "Advisors can manage client profiles"
ON public.financial_profile
FOR ALL
USING (
  has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = financial_profile.client_id AND clients.advisor_id = auth.uid()
  )
);

-- Fix computed_metrics table policies
DROP POLICY IF EXISTS "Advisors can manage client metrics" ON public.computed_metrics;
CREATE POLICY "Advisors can manage client metrics"
ON public.computed_metrics
FOR ALL
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND client_id IN (
    SELECT clients.id FROM clients WHERE clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND client_id IN (
    SELECT clients.id FROM clients WHERE clients.advisor_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
);

-- Fix reports table policies
DROP POLICY IF EXISTS "Advisors can manage client reports" ON public.reports;
CREATE POLICY "Advisors can manage client reports"
ON public.reports
FOR ALL
USING (
  has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = reports.client_id AND clients.advisor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create reports for their clients" ON public.reports;
CREATE POLICY "Users can create reports for their clients"
ON public.reports
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = reports.client_id AND clients.advisor_id = auth.uid()
  )
);

-- Fix stress_test_scenarios table policies
DROP POLICY IF EXISTS "Admins can manage scenarios" ON public.stress_test_scenarios;
CREATE POLICY "Admins can manage scenarios"
ON public.stress_test_scenarios
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);

-- Fix iul_illustrations table policies
DROP POLICY IF EXISTS "Admins can manage illustrations" ON public.iul_illustrations;
CREATE POLICY "Admins can manage illustrations"
ON public.iul_illustrations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);

-- Fix digital_twin_conversations table policies
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.digital_twin_conversations;
CREATE POLICY "Admins can manage conversations"
ON public.digital_twin_conversations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);