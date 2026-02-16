
-- Reassign all clients from the old hardcoded UUID to the real advisor
UPDATE public.clients 
SET advisor_id = '4b6789ae-b592-4451-bd5b-15fcd11f5180'
WHERE advisor_id = '12345678-1234-1234-1234-123456789abc';

-- Also reassign the system user's client
UPDATE public.clients 
SET advisor_id = '4b6789ae-b592-4451-bd5b-15fcd11f5180'
WHERE advisor_id = '00000000-0000-0000-0000-000000000001';

-- Give the real advisor admin role too so they can see everything
INSERT INTO public.user_roles (user_id, role)
VALUES ('4b6789ae-b592-4451-bd5b-15fcd11f5180', 'admin')
ON CONFLICT DO NOTHING;
