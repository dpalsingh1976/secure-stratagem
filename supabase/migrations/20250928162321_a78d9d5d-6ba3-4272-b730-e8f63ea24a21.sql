-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE tax_wrapper_type AS ENUM ('TAX_NOW', 'TAX_LATER', 'TAX_NEVER');
CREATE TYPE asset_type_enum AS ENUM (
  'cash_checking', 'cash_savings', 'cash_cd', 'cash_money_market', 'cash_tbills',
  'brokerage_equity', 'brokerage_etf', 'brokerage_mutual_fund', 'brokerage_bond', 
  'brokerage_options', 'brokerage_alternatives', 'brokerage_crypto',
  'retirement_401k', 'retirement_403b', 'retirement_457', 'retirement_trad_ira', 
  'retirement_sep', 'retirement_simple', 'retirement_roth_ira', 'retirement_roth_401k',
  'education_529', 'education_utma', 'education_ugma',
  'insurance_term', 'insurance_whole_life', 'insurance_iul', 'insurance_vul',
  'annuity_fia', 'annuity_rila', 'annuity_spia', 'annuity_dia',
  'business_equity', 'real_estate_primary', 'real_estate_rental', 'real_estate_land',
  'pension', 'social_security', 'hsa'
);

CREATE TYPE liability_type_enum AS ENUM (
  'mortgage_primary', 'mortgage_rental', 'heloc', 'student_loan', 
  'auto_loan', 'credit_card', 'business_loan', 'personal_loan'
);

CREATE TYPE insurance_type_enum AS ENUM (
  'life_term', 'life_whole', 'life_iul', 'life_vul', 
  'disability_own_occ', 'disability_any_occ', 'ltc', 'umbrella', 'health'
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name_first TEXT NOT NULL,
  name_last TEXT NOT NULL,
  dob DATE NOT NULL,
  state TEXT NOT NULL,
  filing_status TEXT NOT NULL CHECK (filing_status IN ('single', 'married_joint', 'married_separate', 'head_household')),
  household_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_profile table
CREATE TABLE public.financial_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  horizons_jsonb JSONB DEFAULT '{}', -- short/medium/long term goals
  goals_jsonb JSONB DEFAULT '{}', -- retirement goals, drawdown tolerance, etc.
  income_jsonb JSONB DEFAULT '{}', -- all income sources
  expenses_jsonb JSONB DEFAULT '{}', -- monthly expenses breakdown
  preferences_jsonb JSONB DEFAULT '{}', -- risk tolerance, constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  asset_type asset_type_enum NOT NULL,
  tax_wrapper tax_wrapper_type NOT NULL,
  title TEXT NOT NULL,
  current_value DECIMAL(15,2) NOT NULL CHECK (current_value >= 0),
  cost_basis DECIMAL(15,2) DEFAULT 0,
  fee_bps INTEGER DEFAULT 0, -- basis points
  expected_return_low DECIMAL(5,2) DEFAULT 0,
  expected_return_base DECIMAL(5,2) DEFAULT 5,
  expected_return_high DECIMAL(5,2) DEFAULT 10,
  liquidity_score INTEGER DEFAULT 5 CHECK (liquidity_score BETWEEN 1 AND 10),
  notes TEXT,
  meta_jsonb JSONB DEFAULT '{}', -- additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create liabilities table
CREATE TABLE public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type liability_type_enum NOT NULL,
  balance DECIMAL(15,2) NOT NULL CHECK (balance >= 0),
  rate DECIMAL(5,2) NOT NULL,
  term_months INTEGER,
  payment_monthly DECIMAL(10,2) NOT NULL,
  variable BOOLEAN DEFAULT FALSE,
  deductible BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insurances table
CREATE TABLE public.insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  policy_type insurance_type_enum NOT NULL,
  carrier TEXT,
  face_amount DECIMAL(15,2) DEFAULT 0,
  cash_value DECIMAL(15,2) DEFAULT 0,
  premium DECIMAL(10,2) DEFAULT 0,
  riders_jsonb JSONB DEFAULT '{}',
  expiry_year INTEGER,
  loan_balance DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pensions_social table
CREATE TABLE public.pensions_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL, -- 'pension' or 'social_security'
  start_age INTEGER NOT NULL CHECK (start_age BETWEEN 50 AND 80),
  monthly_benefit_est DECIMAL(10,2) NOT NULL,
  cola DECIMAL(5,2) DEFAULT 0, -- cost of living adjustment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create computed_metrics table
CREATE TABLE public.computed_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  net_worth DECIMAL(15,2) DEFAULT 0,
  liquid_pct DECIMAL(5,2) DEFAULT 0,
  top_concentration_pct DECIMAL(5,2) DEFAULT 0,
  liquidity_runway_months DECIMAL(8,2) DEFAULT 0,
  dime_need DECIMAL(15,2) DEFAULT 0,
  protection_gap DECIMAL(15,2) DEFAULT 0,
  disability_gap DECIMAL(15,2) DEFAULT 0,
  ltc_gap DECIMAL(15,2) DEFAULT 0,
  retirement_gap_mo DECIMAL(10,2) DEFAULT 0,
  seq_risk_index DECIMAL(5,2) DEFAULT 0,
  tax_bucket_now_pct DECIMAL(5,2) DEFAULT 0,
  tax_bucket_later_pct DECIMAL(5,2) DEFAULT 0,
  tax_bucket_never_pct DECIMAL(5,2) DEFAULT 0,
  lifetime_tax_drag_est DECIMAL(15,2) DEFAULT 0,
  scores_jsonb JSONB DEFAULT '{}', -- risk scores object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  report_jsonb JSONB NOT NULL,
  pdf_url TEXT,
  public_link_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pensions_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for advisors
CREATE POLICY "Advisors can manage their clients" ON public.clients
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND advisor_id = auth.uid()
);

CREATE POLICY "Advisors can manage client profiles" ON public.financial_profile
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client assets" ON public.assets
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client liabilities" ON public.liabilities
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client insurances" ON public.insurances
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client pensions" ON public.pensions_social
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client metrics" ON public.computed_metrics
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

CREATE POLICY "Advisors can manage client reports" ON public.reports
FOR ALL USING (
  has_role(auth.uid(), 'advisor'::user_role) AND 
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND advisor_id = auth.uid())
);

-- Allow public access to reports via public link
CREATE POLICY "Public access to reports via link" ON public.reports
FOR SELECT USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_profile_updated_at
  BEFORE UPDATE ON public.financial_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurances_updated_at
  BEFORE UPDATE ON public.insurances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pensions_social_updated_at
  BEFORE UPDATE ON public.pensions_social
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_computed_metrics_updated_at
  BEFORE UPDATE ON public.computed_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();