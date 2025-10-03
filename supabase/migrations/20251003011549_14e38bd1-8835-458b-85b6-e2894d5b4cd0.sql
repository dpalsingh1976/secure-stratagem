-- Fix assets table RLS policies to support anonymous users

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Advisors can insert client assets" ON public.assets;

-- Recreate INSERT policy to allow anonymous users with mock advisor
CREATE POLICY "Advisors and anonymous can insert client assets"
ON public.assets
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated advisors creating assets for their clients
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  )))
  OR
  -- Authenticated admins can create any asset
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  -- Allow anonymous users creating assets for mock advisor clients
  (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
);

-- Also fix SELECT, UPDATE, and DELETE policies for consistency
DROP POLICY IF EXISTS "Advisors can view client assets" ON public.assets;
DROP POLICY IF EXISTS "Advisors can update client assets" ON public.assets;
DROP POLICY IF EXISTS "Advisors can delete client assets" ON public.assets;

CREATE POLICY "Advisors and anonymous can view client assets"
ON public.assets
FOR SELECT
TO public
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  )))
  OR
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
);

CREATE POLICY "Advisors and anonymous can update client assets"
ON public.assets
FOR UPDATE
TO public
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  )))
  OR
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  )))
  OR
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
);

CREATE POLICY "Advisors and anonymous can delete client assets"
ON public.assets
FOR DELETE
TO public
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = auth.uid()
  )))
  OR
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = assets.client_id AND clients.advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid
  ))
);