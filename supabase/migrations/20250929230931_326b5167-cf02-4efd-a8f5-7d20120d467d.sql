-- Update RLS policy for computed_metrics to allow mock user and proper advisor access
DROP POLICY IF EXISTS "Advisors can manage client metrics" ON public.computed_metrics;

CREATE POLICY "Advisors can manage client metrics"
ON public.computed_metrics
FOR ALL
USING (
  -- Allow mock user for testing
  (client_id IN (
    SELECT id FROM public.clients 
    WHERE advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
  OR
  -- Allow advisors to manage their own clients' metrics
  (
    has_role(auth.uid(), 'advisor'::user_role) 
    AND client_id IN (
      SELECT id FROM public.clients 
      WHERE advisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Allow mock user for testing
  (client_id IN (
    SELECT id FROM public.clients 
    WHERE advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
  OR
  -- Allow advisors to manage their own clients' metrics
  (
    has_role(auth.uid(), 'advisor'::user_role) 
    AND client_id IN (
      SELECT id FROM public.clients 
      WHERE advisor_id = auth.uid()
    )
  )
);