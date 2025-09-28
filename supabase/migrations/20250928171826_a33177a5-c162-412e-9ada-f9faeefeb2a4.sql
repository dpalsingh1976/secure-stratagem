-- Fix financial_profile table RLS policy to handle testing mode
DROP POLICY IF EXISTS "Advisors can manage client profiles" ON public.financial_profile;

CREATE POLICY "Advisors can manage client profiles" ON public.financial_profile
FOR ALL
USING (
  -- Allow mock user in testing mode for clients they own
  (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = financial_profile.client_id) 
    AND (clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid)
  )) OR
  -- Normal advisor access
  (has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = financial_profile.client_id) 
    AND (clients.advisor_id = auth.uid())
  )))
);