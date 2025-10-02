-- Update RLS policy for reports table to handle demo/testing scenarios
-- Drop existing policies
DROP POLICY IF EXISTS "Advisors can manage client reports" ON public.reports;
DROP POLICY IF EXISTS "Public access to reports via link" ON public.reports;

-- Create new policy that allows testing mode user and advisors
CREATE POLICY "Users can create reports for their clients"
ON public.reports
FOR INSERT
WITH CHECK (
  -- Allow mock testing user
  (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = reports.client_id
    AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
  OR
  -- Allow advisors to create reports for their clients
  (has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = reports.client_id
    AND clients.advisor_id = auth.uid()
  ))
);

-- Allow advisors to view/update their client reports
CREATE POLICY "Advisors can manage client reports"
ON public.reports
FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = reports.client_id
    AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
  OR
  (has_role(auth.uid(), 'advisor'::user_role) AND EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = reports.client_id
    AND clients.advisor_id = auth.uid()
  ))
);

-- Allow public access via report link
CREATE POLICY "Public access to reports via link"
ON public.reports
FOR SELECT
USING (true);