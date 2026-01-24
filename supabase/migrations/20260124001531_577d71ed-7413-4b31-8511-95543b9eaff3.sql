-- Step 0: Clean up duplicates in financial_profile (keep the most recent one per client_id)
DELETE FROM public.financial_profile a
WHERE a.id != (
  SELECT id FROM public.financial_profile b
  WHERE a.client_id = b.client_id
  ORDER BY b.updated_at DESC NULLS LAST, b.created_at DESC NULLS LAST
  LIMIT 1
);

-- Step 1: Add unique constraint to financial_profile for ON CONFLICT
ALTER TABLE public.financial_profile 
ADD CONSTRAINT financial_profile_client_id_key UNIQUE (client_id);

-- Step 2: Clean up duplicates in computed_metrics (keep the most recent one per client_id)
DELETE FROM public.computed_metrics a
WHERE a.id != (
  SELECT id FROM public.computed_metrics b
  WHERE a.client_id = b.client_id
  ORDER BY b.updated_at DESC NULLS LAST, b.created_at DESC NULLS LAST
  LIMIT 1
);

-- Step 3: Add unique constraint to computed_metrics for ON CONFLICT
ALTER TABLE public.computed_metrics 
ADD CONSTRAINT computed_metrics_client_id_key UNIQUE (client_id);

-- Step 4: Fix save_guest_assets RPC to use correct column names
CREATE OR REPLACE FUNCTION public.save_guest_assets(p_client_id uuid, p_assets jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asset_record jsonb;
BEGIN
  DELETE FROM public.assets WHERE client_id = p_client_id;
  
  FOR asset_record IN SELECT * FROM jsonb_array_elements(p_assets)
  LOOP
    INSERT INTO public.assets (
      client_id,
      asset_type,
      title,
      current_value,
      tax_wrapper,
      notes
    ) VALUES (
      p_client_id,
      (asset_record->>'asset_type')::asset_type_enum,
      COALESCE(asset_record->>'description', asset_record->>'title', 'Untitled Asset'),
      COALESCE((asset_record->>'current_value')::numeric, 0),
      COALESCE((asset_record->>'tax_wrapper')::tax_wrapper_type, 'TAX_NOW'),
      asset_record->>'notes'
    );
  END LOOP;
END;
$$;

-- Step 5: Fix save_guest_liabilities RPC to use correct column names
CREATE OR REPLACE FUNCTION public.save_guest_liabilities(p_client_id uuid, p_liabilities jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liability_record jsonb;
BEGIN
  DELETE FROM public.liabilities WHERE client_id = p_client_id;
  
  FOR liability_record IN SELECT * FROM jsonb_array_elements(p_liabilities)
  LOOP
    INSERT INTO public.liabilities (
      client_id,
      type,
      balance,
      rate,
      payment_monthly,
      notes
    ) VALUES (
      p_client_id,
      (liability_record->>'type')::liability_type_enum,
      COALESCE((liability_record->>'balance')::numeric, 0),
      COALESCE((liability_record->>'rate')::numeric, 0),
      COALESCE((liability_record->>'payment_monthly')::numeric, 0),
      liability_record->>'notes'
    );
  END LOOP;
END;
$$;

-- Step 6: Create save_guest_computed_metrics RPC
CREATE OR REPLACE FUNCTION public.save_guest_computed_metrics(
  p_client_id uuid,
  p_metrics jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics_id uuid;
BEGIN
  INSERT INTO public.computed_metrics (
    client_id,
    net_worth,
    liquid_pct,
    top_concentration_pct,
    liquidity_runway_months,
    dime_need,
    protection_gap,
    disability_gap,
    ltc_gap,
    retirement_gap_mo,
    seq_risk_index,
    tax_bucket_now_pct,
    tax_bucket_later_pct,
    tax_bucket_never_pct,
    lifetime_tax_drag_est,
    scores_jsonb
  ) VALUES (
    p_client_id,
    (p_metrics->>'net_worth')::numeric,
    (p_metrics->>'liquid_pct')::numeric,
    (p_metrics->>'top_concentration_pct')::numeric,
    (p_metrics->>'liquidity_runway_months')::numeric,
    (p_metrics->>'dime_need')::numeric,
    (p_metrics->>'protection_gap')::numeric,
    (p_metrics->>'disability_gap')::numeric,
    (p_metrics->>'ltc_gap')::numeric,
    (p_metrics->>'retirement_gap_mo')::numeric,
    (p_metrics->>'seq_risk_index')::numeric,
    (p_metrics->>'tax_bucket_now_pct')::numeric,
    (p_metrics->>'tax_bucket_later_pct')::numeric,
    (p_metrics->>'tax_bucket_never_pct')::numeric,
    (p_metrics->>'lifetime_tax_drag_est')::numeric,
    (p_metrics->'scores_jsonb')::jsonb
  )
  ON CONFLICT (client_id) DO UPDATE SET
    net_worth = EXCLUDED.net_worth,
    liquid_pct = EXCLUDED.liquid_pct,
    top_concentration_pct = EXCLUDED.top_concentration_pct,
    liquidity_runway_months = EXCLUDED.liquidity_runway_months,
    dime_need = EXCLUDED.dime_need,
    protection_gap = EXCLUDED.protection_gap,
    disability_gap = EXCLUDED.disability_gap,
    ltc_gap = EXCLUDED.ltc_gap,
    retirement_gap_mo = EXCLUDED.retirement_gap_mo,
    seq_risk_index = EXCLUDED.seq_risk_index,
    tax_bucket_now_pct = EXCLUDED.tax_bucket_now_pct,
    tax_bucket_later_pct = EXCLUDED.tax_bucket_later_pct,
    tax_bucket_never_pct = EXCLUDED.tax_bucket_never_pct,
    lifetime_tax_drag_est = EXCLUDED.lifetime_tax_drag_est,
    scores_jsonb = EXCLUDED.scores_jsonb,
    updated_at = now()
  RETURNING id INTO v_metrics_id;
  
  RETURN v_metrics_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.save_guest_computed_metrics TO anon;
GRANT EXECUTE ON FUNCTION public.save_guest_computed_metrics TO authenticated;