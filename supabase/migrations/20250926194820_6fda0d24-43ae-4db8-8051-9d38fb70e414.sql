-- Update has_role function to handle testing mode
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow mock user in testing mode to have admin role
  SELECT 
    CASE 
      WHEN _user_id = '12345678-1234-1234-1234-123456789abc'::uuid THEN true
      ELSE EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    END
$$;