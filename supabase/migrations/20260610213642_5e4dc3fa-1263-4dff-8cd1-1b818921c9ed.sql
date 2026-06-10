CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE public.annuity_ownership_type AS ENUM ('individual_joint','custodian','trust'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_annuitant_is AS ENUM ('owner','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_contract_issue_type AS ENUM ('non_qualified','qualified'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_app_status AS ENUM ('draft','submitted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_tax_bracket AS ENUM ('0_10','11_20','21_30','31_40','41_plus'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_risk_tolerance AS ENUM ('conservative','moderately_conservative','moderate','moderately_aggressive','aggressive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_distribution_timing AS ENUM ('lt_1yr','1_5yr','6_9yr','10_plus','none'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.annuity_beneficiary_type AS ENUM ('primary','contingent'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.annuity_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status public.annuity_app_status DEFAULT 'draft' NOT NULL,
  client_name text,
  application_date date,
  ownership_type public.annuity_ownership_type,
  annuitant_is public.annuity_annuitant_is,
  prefix text,
  first_name text,
  middle_initial text,
  last_name text,
  suffix text,
  ssn_tin text,
  date_of_birth date,
  gender text,
  is_us_citizen boolean,
  street_address text,
  zip_code text,
  city text,
  state text,
  email text,
  mobile_phone text,
  other_phone text,
  decline_mobile boolean DEFAULT false,
  contract_issue_type public.annuity_contract_issue_type,
  payment_method text,
  add_additional_payments boolean,
  total_expected_amount numeric(14,2),
  checking_savings_electronic numeric(14,2),
  transfer_rollover_exchange numeric(14,2),
  fp_or_client_requested numeric(14,2),
  client_brokerage_account_number text,
  has_existing_policies boolean,
  will_replace_existing boolean,
  edelivery_correspondence boolean,
  edelivery_contract boolean,
  id_document_type text,
  id_document_number text,
  id_document_expiration date,
  gross_monthly_income numeric(14,2),
  monthly_living_expenses numeric(14,2),
  monthly_disposable_income numeric(14,2),
  household_liquid_assets numeric(14,2),
  household_annuities_value numeric(14,2),
  household_net_worth numeric(14,2),
  anticipate_increase_living_expenses boolean,
  anticipate_decrease_income boolean,
  anticipate_decrease_liquid_assets boolean,
  federal_tax_bracket public.annuity_tax_bracket,
  resides_nursing_home boolean,
  has_ltc_insurance boolean,
  has_medicare_supplement boolean,
  actively_employed boolean,
  financial_objectives jsonb DEFAULT '[]'::jsonb,
  other_products_owned jsonb DEFAULT '[]'::jsonb,
  risk_tolerance public.annuity_risk_tolerance,
  distribution_methods jsonb DEFAULT '[]'::jsonb,
  first_distribution_timing public.annuity_distribution_timing,
  premium_sources jsonb DEFAULT '[]'::jsonb,
  client_signature_name text,
  signature_date date,
  joint_signature_name text,
  joint_signature_date date
);

CREATE TABLE IF NOT EXISTS public.application_beneficiaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.annuity_applications(id) ON DELETE CASCADE,
  beneficiary_type public.annuity_beneficiary_type NOT NULL,
  full_name text NOT NULL,
  relationship text,
  date_of_birth date,
  ssn_tin text,
  share_percentage numeric(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.application_allocations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.annuity_applications(id) ON DELETE CASCADE,
  crediting_method text NOT NULL,
  index_option text NOT NULL,
  allocation_percentage numeric(5,2) NOT NULL
);

GRANT SELECT ON public.annuity_applications TO authenticated;
GRANT SELECT ON public.application_beneficiaries TO authenticated;
GRANT SELECT ON public.application_allocations TO authenticated;
GRANT ALL ON public.annuity_applications TO service_role;
GRANT ALL ON public.application_beneficiaries TO service_role;
GRANT ALL ON public.application_allocations TO service_role;

CREATE INDEX IF NOT EXISTS idx_annuity_apps_status ON public.annuity_applications(status);
CREATE INDEX IF NOT EXISTS idx_annuity_apps_created ON public.annuity_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_beneficiaries ON public.application_beneficiaries(application_id);
CREATE INDEX IF NOT EXISTS idx_app_allocations ON public.application_allocations(application_id);

CREATE OR REPLACE FUNCTION public.annuity_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_annuity_updated_at ON public.annuity_applications;
CREATE TRIGGER trg_annuity_updated_at
  BEFORE UPDATE ON public.annuity_applications
  FOR EACH ROW EXECUTE FUNCTION public.annuity_set_updated_at();

ALTER TABLE public.annuity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advisors_read_applications" ON public.annuity_applications;
CREATE POLICY "advisors_read_applications"
  ON public.annuity_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','advisor')));

DROP POLICY IF EXISTS "advisors_read_beneficiaries" ON public.application_beneficiaries;
CREATE POLICY "advisors_read_beneficiaries"
  ON public.application_beneficiaries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','advisor')));

DROP POLICY IF EXISTS "advisors_read_allocations" ON public.application_allocations;
CREATE POLICY "advisors_read_allocations"
  ON public.application_allocations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','advisor')));