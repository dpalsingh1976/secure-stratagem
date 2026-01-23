-- Create a security definer function for guest client creation
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
    p_name_last,
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

-- Create function to save guest financial profile
CREATE OR REPLACE FUNCTION public.save_guest_financial_profile(
  p_client_id uuid,
  p_income_jsonb jsonb,
  p_expenses_jsonb jsonb,
  p_goals_jsonb jsonb,
  p_preferences_jsonb jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  INSERT INTO public.financial_profile (
    client_id,
    income_jsonb,
    expenses_jsonb,
    goals_jsonb,
    preferences_jsonb
  ) VALUES (
    p_client_id,
    COALESCE(p_income_jsonb, '{}'::jsonb),
    COALESCE(p_expenses_jsonb, '{}'::jsonb),
    COALESCE(p_goals_jsonb, '{}'::jsonb),
    COALESCE(p_preferences_jsonb, '{}'::jsonb)
  )
  ON CONFLICT (client_id) DO UPDATE SET
    income_jsonb = EXCLUDED.income_jsonb,
    expenses_jsonb = EXCLUDED.expenses_jsonb,
    goals_jsonb = EXCLUDED.goals_jsonb,
    preferences_jsonb = EXCLUDED.preferences_jsonb,
    updated_at = now()
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Create function to save guest assets (bulk insert)
CREATE OR REPLACE FUNCTION public.save_guest_assets(
  p_client_id uuid,
  p_assets jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asset_record jsonb;
BEGIN
  -- Delete existing assets for this client first
  DELETE FROM public.assets WHERE client_id = p_client_id;
  
  -- Insert new assets
  FOR asset_record IN SELECT * FROM jsonb_array_elements(p_assets)
  LOOP
    INSERT INTO public.assets (
      client_id,
      asset_type,
      description,
      current_value,
      tax_wrapper,
      owner
    ) VALUES (
      p_client_id,
      (asset_record->>'asset_type')::asset_type_enum,
      asset_record->>'description',
      (asset_record->>'current_value')::numeric,
      (asset_record->>'tax_wrapper')::tax_wrapper_type,
      asset_record->>'owner'
    );
  END LOOP;
END;
$$;

-- Create function to save guest liabilities (bulk insert)
CREATE OR REPLACE FUNCTION public.save_guest_liabilities(
  p_client_id uuid,
  p_liabilities jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liability_record jsonb;
BEGIN
  -- Delete existing liabilities for this client first
  DELETE FROM public.liabilities WHERE client_id = p_client_id;
  
  -- Insert new liabilities
  FOR liability_record IN SELECT * FROM jsonb_array_elements(p_liabilities)
  LOOP
    INSERT INTO public.liabilities (
      client_id,
      liability_type,
      description,
      balance,
      interest_rate,
      monthly_payment
    ) VALUES (
      p_client_id,
      (liability_record->>'liability_type')::liability_type_enum,
      liability_record->>'description',
      (liability_record->>'balance')::numeric,
      (liability_record->>'interest_rate')::numeric,
      (liability_record->>'monthly_payment')::numeric
    );
  END LOOP;
END;
$$;

-- Create function to save guest insurances (bulk insert)
CREATE OR REPLACE FUNCTION public.save_guest_insurances(
  p_client_id uuid,
  p_insurances jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  insurance_record jsonb;
BEGIN
  -- Delete existing insurances for this client first
  DELETE FROM public.insurances WHERE client_id = p_client_id;
  
  -- Insert new insurances
  FOR insurance_record IN SELECT * FROM jsonb_array_elements(p_insurances)
  LOOP
    INSERT INTO public.insurances (
      client_id,
      insurance_type,
      provider,
      policy_number,
      coverage_amount,
      premium_annual,
      beneficiary
    ) VALUES (
      p_client_id,
      (insurance_record->>'insurance_type')::insurance_type_enum,
      insurance_record->>'provider',
      insurance_record->>'policy_number',
      (insurance_record->>'coverage_amount')::numeric,
      (insurance_record->>'premium_annual')::numeric,
      insurance_record->>'beneficiary'
    );
  END LOOP;
END;
$$;

-- Grant execute permissions on these functions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.create_guest_client TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_guest_financial_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_guest_assets TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_guest_liabilities TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_guest_insurances TO anon, authenticated;