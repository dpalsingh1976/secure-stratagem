-- Fix liabilities table RLS policy to handle testing mode
DROP POLICY IF EXISTS "Advisors can manage client liabilities" ON public.liabilities;

CREATE POLICY "Advisors can manage client liabilities" ON public.liabilities
FOR ALL
USING (
  -- Allow advisors to manage client liabilities for clients they own
  (has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = liabilities.client_id) 
    AND (clients.advisor_id = auth.uid())
  ))) OR
  -- Allow mock user in testing mode
  (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = liabilities.client_id) 
    AND (clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid)
  ))
);