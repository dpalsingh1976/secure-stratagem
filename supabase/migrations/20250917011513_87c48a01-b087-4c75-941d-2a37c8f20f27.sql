-- Fix security vulnerability: Restrict appointments table access
-- Drop the overly permissive SELECT policy that allows anyone to view all appointments
DROP POLICY IF EXISTS "Anyone can view appointments by email" ON public.appointments;

-- Create a secure policy that only allows authenticated users to view appointments
-- This assumes staff/admin users will be authenticated to manage appointments
CREATE POLICY "Authenticated users can view appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the existing INSERT policy to allow customers to create appointments
-- The "Anyone can create appointments" policy remains unchanged for booking functionality