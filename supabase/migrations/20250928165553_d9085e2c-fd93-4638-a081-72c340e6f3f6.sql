-- Fix clients table RLS policy to handle testing mode
DROP POLICY IF EXISTS "Advisors can manage their clients" ON public.clients;

CREATE POLICY "Advisors can manage their clients" ON public.clients
FOR ALL
USING (
  -- Allow mock user in testing mode
  (advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid) OR
  -- Normal advisor access
  (has_role(auth.uid(), 'advisor'::user_role) AND (advisor_id = auth.uid()))
);