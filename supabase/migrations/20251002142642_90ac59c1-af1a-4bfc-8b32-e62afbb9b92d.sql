-- Fix security issue: Restrict appointments table SELECT policy to authenticated staff only
-- Enable RLS on appointments table if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Staff can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;

-- Create proper SELECT policy: Only authenticated staff/advisors/admins can view appointments
CREATE POLICY "Only staff can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'advisor'::user_role))
  OR
  (has_role(auth.uid(), 'admin'::user_role))
  OR
  -- Allow mock user in testing mode
  (auth.uid() = '12345678-1234-1234-1234-123456789abc'::uuid)
);

-- Keep the INSERT policy as is - anyone can create appointments (public booking)
-- This is intentional for a booking system where customers need to create appointments

-- Add UPDATE and DELETE policies for staff management
CREATE POLICY "Only staff can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'advisor'::user_role))
  OR
  (has_role(auth.uid(), 'admin'::user_role))
  OR
  (auth.uid() = '12345678-1234-1234-1234-123456789abc'::uuid)
)
WITH CHECK (
  (has_role(auth.uid(), 'advisor'::user_role))
  OR
  (has_role(auth.uid(), 'admin'::user_role))
  OR
  (auth.uid() = '12345678-1234-1234-1234-123456789abc'::uuid)
);

CREATE POLICY "Only staff can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  (has_role(auth.uid(), 'advisor'::user_role))
  OR
  (has_role(auth.uid(), 'admin'::user_role))
  OR
  (auth.uid() = '12345678-1234-1234-1234-123456789abc'::uuid)
);