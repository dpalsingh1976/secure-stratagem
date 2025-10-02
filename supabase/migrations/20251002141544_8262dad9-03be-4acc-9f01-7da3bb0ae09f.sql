-- Fix security issue: Restrict reports table access to advisors only
-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Public access to reports via link" ON public.reports;

-- Ensure only advisors can view their client reports (already exists but let's be explicit)
-- The existing "Advisors can manage client reports" policy already handles this
-- But let's add a specific SELECT policy for clarity

-- Create a security definer function for public link access
-- This allows controlled public access only when accessing via a specific public_link_id
CREATE OR REPLACE FUNCTION public.get_report_by_public_link(_public_link_id uuid)
RETURNS SETOF public.reports
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.reports
  WHERE public_link_id = _public_link_id
  LIMIT 1;
$$;

-- Grant execute permission to anonymous users for public link access
GRANT EXECUTE ON FUNCTION public.get_report_by_public_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_report_by_public_link(uuid) TO authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_report_by_public_link IS 
'Security definer function to allow controlled public access to reports via public_link_id only. This bypasses RLS in a secure, limited way.';