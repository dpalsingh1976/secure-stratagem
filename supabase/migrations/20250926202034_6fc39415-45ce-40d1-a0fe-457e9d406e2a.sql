-- Update RLS policies to work with testing mode by allowing operations for the mock user ID directly

-- Update iul_illustrations policies
DROP POLICY IF EXISTS "Admins can manage illustrations" ON public.iul_illustrations;

CREATE POLICY "Admins can manage illustrations" ON public.iul_illustrations
FOR ALL USING (
  -- Allow operations for the mock test user or users with admin/advisor roles
  user_id = '12345678-1234-1234-1234-123456789abc'::uuid 
  OR has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);

-- Update stress_test_scenarios policies
DROP POLICY IF EXISTS "Admins can manage scenarios" ON public.stress_test_scenarios;

CREATE POLICY "Admins can manage scenarios" ON public.stress_test_scenarios
FOR ALL USING (
  -- Allow operations for the mock test user or users with admin/advisor roles
  user_id = '12345678-1234-1234-1234-123456789abc'::uuid 
  OR has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);

-- Update digital_twin_conversations policies
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.digital_twin_conversations;

CREATE POLICY "Admins can manage conversations" ON public.digital_twin_conversations
FOR ALL USING (
  -- Allow operations for the mock test user or users with admin/advisor roles
  user_id = '12345678-1234-1234-1234-123456789abc'::uuid 
  OR has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'advisor'::user_role)
);