-- Update create_guest_client with fallback logic for system user
CREATE OR REPLACE FUNCTION public.create_guest_client(
  p_name_first text,
  p_name_last text,
  p_email text,
  p_dob date,
  p_state text,
  p_filing_status text,
  p_household_jsonb jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_default_advisor_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Check if system user exists, fallback to first available advisor if not
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_default_advisor_id) THEN
    SELECT user_id INTO v_default_advisor_id 
    FROM public.user_roles 
    WHERE role = 'advisor'
    LIMIT 1;
    
    IF v_default_advisor_id IS NULL THEN
      RAISE EXCEPTION 'No valid advisor found for guest client assignment';
    END IF;
  END IF;

  INSERT INTO public.clients (
    advisor_id,
    name_first,
    name_last,
    email,
    dob,
    state,
    filing_status,
    household_jsonb
  ) VALUES (
    v_default_advisor_id,
    p_name_first,
    COALESCE(p_name_last, ''),
    p_email,
    p_dob,
    p_state,
    COALESCE(p_filing_status, 'single'),
    COALESCE(p_household_jsonb, '{}'::jsonb)
  )
  RETURNING id INTO v_client_id;
  
  RETURN v_client_id;
END;
$$;

-- Grant execute permissions on all guest-related functions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_guest_client TO anon;
GRANT EXECUTE ON FUNCTION public.create_guest_client TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_guest_financial_profile TO anon;
GRANT EXECUTE ON FUNCTION public.save_guest_financial_profile TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_guest_assets TO anon;
GRANT EXECUTE ON FUNCTION public.save_guest_assets TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_guest_liabilities TO anon;
GRANT EXECUTE ON FUNCTION public.save_guest_liabilities TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_guest_insurances TO anon;
GRANT EXECUTE ON FUNCTION public.save_guest_insurances TO authenticated;