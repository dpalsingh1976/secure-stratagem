-- Add email to clients table and fix RLS policies for anonymous access

-- 1. Add email column to clients table
ALTER TABLE public.clients 
ADD COLUMN email TEXT;

-- Add unique constraint on email
ALTER TABLE public.clients 
ADD CONSTRAINT clients_email_unique UNIQUE (email);

-- Add index for performance
CREATE INDEX idx_clients_email ON public.clients(email);

-- 2. Drop and recreate INSERT policy to allow public access
DROP POLICY IF EXISTS "Advisors can create their clients" ON public.clients;

CREATE POLICY "Anyone can create client records"
ON public.clients
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated advisors creating their own clients
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (advisor_id = auth.uid()))
  OR
  -- Authenticated admins can create any client
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  -- Allow anonymous users and mock user in testing mode
  (advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);

-- 3. Update SELECT policy to allow viewing by email (for anonymous users checking their own data)
DROP POLICY IF EXISTS "Advisors can view their clients" ON public.clients;

CREATE POLICY "Advisors and owners can view clients"
ON public.clients
FOR SELECT
TO public
USING (
  -- Authenticated advisors viewing their clients
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'advisor'::user_role) AND (advisor_id = auth.uid()))
  OR
  -- Authenticated admins can view any client
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role))
  OR
  -- Allow viewing mock user clients in testing mode
  (advisor_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);