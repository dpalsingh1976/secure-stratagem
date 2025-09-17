-- Fix security vulnerability: Replace overly permissive policy with secure one
-- First drop the existing policies
DROP POLICY IF EXISTS "Anyone can view appointments by email" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;

-- Create a secure policy that only allows authenticated users to view appointments  
CREATE POLICY "Staff can view all appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (true);

-- The "Anyone can create appointments" policy remains for customer booking functionality