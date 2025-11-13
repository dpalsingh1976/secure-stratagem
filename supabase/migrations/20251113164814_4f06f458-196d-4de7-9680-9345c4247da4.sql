-- Tax Comparison System Tables

-- Table to store tax scenarios
CREATE TABLE IF NOT EXISTS public.tax_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('401k', 'roth_lirp')),
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  outputs JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Table to store calculation history
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.tax_scenarios(id) ON DELETE CASCADE,
  calc_type TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to store presets
CREATE TABLE IF NOT EXISTS public.tax_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_scenarios
CREATE POLICY "Users can view their own scenarios"
  ON public.tax_scenarios FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own scenarios"
  ON public.tax_scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own scenarios"
  ON public.tax_scenarios FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own scenarios"
  ON public.tax_scenarios FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for tax_calculations
CREATE POLICY "Users can view calculations for their scenarios"
  ON public.tax_calculations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tax_scenarios
      WHERE tax_scenarios.id = tax_calculations.scenario_id
      AND (tax_scenarios.user_id = auth.uid() OR tax_scenarios.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create calculations for their scenarios"
  ON public.tax_calculations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tax_scenarios
      WHERE tax_scenarios.id = tax_calculations.scenario_id
      AND (tax_scenarios.user_id = auth.uid() OR tax_scenarios.user_id IS NULL)
    )
  );

-- RLS Policies for tax_presets (read-only for all)
CREATE POLICY "Anyone can view active presets"
  ON public.tax_presets FOR SELECT
  USING (is_active = true);

-- Triggers for updated_at
CREATE TRIGGER update_tax_scenarios_updated_at
  BEFORE UPDATE ON public.tax_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed presets
INSERT INTO public.tax_presets (name, description, inputs) VALUES
(
  'Ryan & Jen',
  '35 years to retirement, $6k annual contribution, 33% tax bracket, 7.5% return, SSI $28k (MFJ)',
  '{
    "annual_contrib": 6000,
    "years": 35,
    "pre_tax_rate_now": 0.33,
    "assumed_return": 0.075,
    "draw_mode": "interest",
    "retire_return": 0.075,
    "retire_bracket": 0.33,
    "ssi_annual": 28000,
    "filing_status": "mfj",
    "annual_contrib_after_tax": 4020
  }'::jsonb
),
(
  'Max & Trisha',
  '20 years to retirement, $16k annual contribution, 25% tax bracket, 8% return, 5-year payback',
  '{
    "annual_contrib": 16000,
    "years": 20,
    "pre_tax_rate_now": 0.25,
    "assumed_return": 0.08,
    "draw_mode": "swr",
    "swr_rate": 0.04,
    "retire_bracket": 0.25,
    "ssi_annual": 30000,
    "filing_status": "mfj",
    "annual_contrib_after_tax": 12000
  }'::jsonb
),
(
  'John & Erin',
  '12 years to retirement, $30k annual contribution, 35% tax bracket, 7.5% accumulation, 25-year spend-down at 6.75%, SSI $32k',
  '{
    "annual_contrib": 30000,
    "years": 12,
    "pre_tax_rate_now": 0.35,
    "assumed_return": 0.075,
    "draw_mode": "fixed_period",
    "retire_return": 0.0675,
    "fixed_years": 25,
    "retire_bracket": 0.35,
    "ssi_annual": 32000,
    "filing_status": "mfj",
    "annual_contrib_after_tax": 19500
  }'::jsonb
);