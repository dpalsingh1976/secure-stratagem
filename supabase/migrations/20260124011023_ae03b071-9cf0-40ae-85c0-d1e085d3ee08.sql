-- Update create_guest_client to handle returning users with ON CONFLICT
CREATE OR REPLACE FUNCTION public.create_guest_client(
  p_name_first text,
  p_name_last text DEFAULT '',
  p_email text DEFAULT NULL,
  p_dob date DEFAULT NULL,
  p_state text DEFAULT 'TX',
  p_filing_status text DEFAULT 'single',
  p_household_jsonb jsonb DEFAULT '{}'::jsonb
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

  -- Handle case where email already exists (returning user)
  IF p_email IS NOT NULL AND p_email != '' THEN
    INSERT INTO public.clients (
      advisor_id,
      name_first,
      name_last,
      email,
      dob,
      state,
      filing_status,
      household_jsonb,
      updated_at
    ) VALUES (
      v_default_advisor_id,
      p_name_first,
      COALESCE(p_name_last, ''),
      p_email,
      p_dob,
      p_state,
      COALESCE(p_filing_status, 'single'),
      COALESCE(p_household_jsonb, '{}'::jsonb),
      now()
    )
    ON CONFLICT (email) DO UPDATE SET
      name_first = EXCLUDED.name_first,
      name_last = EXCLUDED.name_last,
      dob = COALESCE(EXCLUDED.dob, clients.dob),
      state = EXCLUDED.state,
      filing_status = EXCLUDED.filing_status,
      household_jsonb = EXCLUDED.household_jsonb,
      updated_at = now()
    RETURNING id INTO v_client_id;
  ELSE
    -- No email provided - always create new record
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
      NULL,
      p_dob,
      p_state,
      COALESCE(p_filing_status, 'single'),
      COALESCE(p_household_jsonb, '{}'::jsonb)
    )
    RETURNING id INTO v_client_id;
  END IF;
  
  RETURN v_client_id;
END;
$$;