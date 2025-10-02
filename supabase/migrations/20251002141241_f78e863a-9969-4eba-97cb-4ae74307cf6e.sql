-- Fix security issue: Restrict leads table access to authenticated advisors only
-- Drop the overly permissive SELECT policy that allows anyone to view leads
DROP POLICY IF EXISTS "Anyone can view their own leads by email" ON public.leads;

-- Create a new policy that only allows advisors and admins to view leads
CREATE POLICY "Only advisors and admins can view leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'advisor'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Add policy for advisors/admins to manage leads
CREATE POLICY "Advisors and admins can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'advisor'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'advisor'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Advisors and admins can delete leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'advisor'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);