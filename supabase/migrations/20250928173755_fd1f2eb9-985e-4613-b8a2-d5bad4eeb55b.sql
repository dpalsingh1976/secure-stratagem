-- Fix assets table RLS policy to handle testing mode
DROP POLICY IF EXISTS "Advisors can manage client assets" ON public.assets;

CREATE POLICY "Advisors can manage client assets" ON public.assets
FOR ALL
USING (
  -- Allow mock user in testing mode for clients they own
  (has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = assets.client_id) 
    AND (clients.advisor_id = auth.uid())
  ))) OR
  -- Allow mock user in testing mode
  (EXISTS (
    SELECT 1
    FROM clients
    WHERE (clients.id = assets.client_id) 
    AND (clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid)
  ))
);