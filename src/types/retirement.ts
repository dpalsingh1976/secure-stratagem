// Retirement Readiness Types

export type RetirementLifestyle = 'basic' | 'comfortable' | 'premium';
export type SpendingTargetMethod = 'fixed' | 'percent';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type LiquidityNeed = 'low' | 'medium' | 'high';
export type ProductFit = 'strong' | 'moderate' | 'weak' | 'not_recommended';

// FIA-specific types
export type FIAStrategy = 
  | 'FIA_BUFFER_REDZONE'      // Near retirement or high sequence risk
  | 'FIA_INCOME_FLOOR'        // Income gap needs + guaranteed income preference
  | 'FIA_GROWTH_PROTECTION'   // Sequence risk with moderate gap
  | 'FIA_OPTIONAL'            // No gap, well covered, low sequence risk
  | 'FIA_NOT_FIT_YET';        // Gated - need reserves first

export type AnnuityFit = 'strong' | 'moderate' | 'explore' | 'not_fit_yet';

export type PrimaryRetirementGoal = 
  | 'maximize_tax_free'
  | 'secure_guaranteed_income'
  | 'protect_family'
  | 'balanced_growth_protection'
  | 'minimize_taxes';

export type SavingsVehicle = 
  | '401k_match' | '401k_max' | 'roth_ira' | 'roth_401k' 
  | 'hsa' | 'backdoor_roth' | 'mega_backdoor' 
  | 'annuity' | 'iul' | 'taxable';

export interface RetirementPreferencesData {
  // Profile & Goals additions
  retirement_lifestyle: RetirementLifestyle;
  spending_target_method: SpendingTargetMethod;
  spending_percent_of_income: number;
  planned_retirement_state: string;
  
  // Income & Expenses additions
  annual_retirement_contribution: number;
  contribution_growth_rate: number;
  social_security_confidence: ConfidenceLevel;
  expected_part_time_income: number;
  
  // Protection & Health additions (suitability gating)
  prefers_guaranteed_income: boolean;
  liquidity_need_next_5yr: LiquidityNeed;
  can_commit_10yr_contributions: boolean;
  open_to_tax_diversification: boolean;
}

export interface IncomeSourceProjection {
  social_security: number;
  pension: number;
  annuity: number;
  portfolio_withdrawal: number;
  part_time: number;
}

export interface RetirementProjection {
  years_to_retirement: number;
  current_age: number;
  retirement_age: number;
  projected_portfolio_at_retirement: number;
  monthly_income_projected: number;
  monthly_income_target: number;
  monthly_gap: number;
  gap_percentage: number;
  income_sources: IncomeSourceProjection;
  total_retirement_assets_today: number;
  total_contributions_future: number;
}

export interface RetirementScenarioResult {
  scenario_name: string;
  scenario_description: string;
  success_probability: number;
  projected_shortfall_age: number | null;
  ending_balance_at_90: number;
  total_income_received: number;
  monthly_sustainable_income: number;
  key_insight: string;
}

export interface ProductRecommendation {
  product: 'Term' | 'Annuity' | 'IUL';
  fit: ProductFit;
  score?: number; // 0-100 for suitability
  whyBullets: string[];
  notIfBullets: string[];
  fixFirstBullets?: string[]; // Actionable remediation steps when not recommended
  nextSteps: string[];
  disclaimer: string;
  // Enhanced suitability fields (IUL & Annuity)
  preconditions?: IULPreconditionCheck[];
  disqualified?: boolean;
  disqualification_reason?: string;
}

// IUL Precondition Check (matches iulSuitability.ts)
export interface IULPreconditionCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  importance: 'critical' | 'important' | 'helpful';
}

export interface RetirementSubScores {
  income_adequacy: number;
  tax_risk: number;
  sequence_risk: number;
  longevity_risk: number;
  liquidity: number;
  protection: number;
}

export interface RetirementReadinessResult {
  overall_score: number;
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  sub_scores: RetirementSubScores;
  projection: RetirementProjection;
  scenarios: RetirementScenarioResult[];
  recommendations: ProductRecommendation[];
  key_insights: string[];
  action_items: string[];
  // Education-only mode (when guardrails fail or data incomplete)
  education_only?: boolean;
  education_reason?: string;
  guardrail_warnings?: string[];
}

// Savings Waterfall Types for Allocation Engine
export interface SavingsWaterfallStep {
  priority: number;
  vehicle: SavingsVehicle;
  label: string;
  monthly_amount: number;
  annual_limit: number;
  current_contribution: number;
  suggested_contribution: number;
  rationale: string;
  fit_score: number;
  is_applicable: boolean;
  not_applicable_reason?: string;
}

export interface AllocationRecommendation {
  savings_waterfall: SavingsWaterfallStep[];
  monthly_allocation_summary: {
    total_savings_capacity: number;
    allocated: number;
    remaining: number;
  };
  tax_efficiency_score: number;
  risk_balance_score: number;
  rationale: string[];
  disclaimers: string[];
}

// Default values
export const DEFAULT_RETIREMENT_PREFERENCES: RetirementPreferencesData = {
  retirement_lifestyle: 'comfortable',
  spending_target_method: 'fixed',
  spending_percent_of_income: 80,
  planned_retirement_state: '',
  annual_retirement_contribution: 0,
  contribution_growth_rate: 2,
  social_security_confidence: 'medium',
  expected_part_time_income: 0,
  prefers_guaranteed_income: false,
  liquidity_need_next_5yr: 'medium',
  can_commit_10yr_contributions: false,
  open_to_tax_diversification: false
};

// ============================================
// SCENARIO COMPARISON TYPES
// ============================================

export type MarketRiskExposure = 'high' | 'moderate' | 'low';

/**
 * Projection for a single retirement scenario (Current Path or Optimized)
 */
export interface ScenarioProjection {
  scenario_name: 'Current Path' | 'Optimized Strategy';
  scenario_description: string;
  
  // Core Income Metrics
  retirement_income_gross: number;
  retirement_income_net: number;
  lifetime_taxes_paid: number;
  
  // Risk & Protection Flags
  has_guaranteed_income: boolean;
  has_tax_free_income: boolean;
  money_runs_out_age: number | null;
  
  // Asset Values at Key Ages
  portfolio_at_retirement: number;
  legacy_value_at_90: number;
  legacy_value_at_95: number;
  
  // Market Exposure Assessment
  market_risk_exposure: MarketRiskExposure;
  
  // Allocation Details (for Scenario B only)
  iul_allocation_percent?: number;
  iul_annual_premium?: number;
  iul_projected_cash_value?: number;
  iul_tax_free_income?: number;
  iul_death_benefit?: number;
  
  annuity_allocation_percent?: number;
  annuity_premium?: number;
  annuity_guaranteed_income?: number;
  
  // Income Sources Breakdown
  income_sources: {
    social_security: number;
    pension: number;
    portfolio_withdrawal: number;
    iul_loans: number;
    annuity_income: number;
    part_time: number;
  };
  
  // Year-by-year projections for timeline
  yearly_projections: YearlyProjection[];
}

export interface YearlyProjection {
  age: number;
  year: number;
  portfolio_value: number;
  total_income: number;
  taxes_paid: number;
  withdrawal_amount: number;
}

/**
 * Allocation overrides from user input
 */
export type OtherAssetType = 'stocks' | 'bonds' | 'balanced' | 'none';

export interface AllocationOverrides {
  iul_annual_premium?: number;
  iul_death_benefit?: number;  // User-specified death benefit
  annuity_one_time_premium?: number;
  other_asset_type?: OtherAssetType;
}

/**
 * Comparison between Current Path and Optimized Strategy
 */
export interface ScenarioComparison {
  // Investment period metadata (optional for backward compatibility)
  investment_start_date?: string;    // Today's date (ISO format)
  retirement_date?: string;          // Calculated retirement date
  current_age?: number;
  retirement_age?: number;
  years_to_retirement?: number;
  
  scenario_a: ScenarioProjection;
  scenario_b: ScenarioProjection;
  scenario_c?: ScenarioProjection; // Alternative investment scenario
  
  // Improvement Metrics
  comparison_metrics: {
    income_improvement_percent: number;
    income_improvement_monthly: number;
    tax_savings_lifetime: number;
    longevity_improvement_years: number;
    legacy_improvement_amount: number;
    market_risk_reduction: boolean;
  };
  
  // Improvement over Scenario C (if present)
  comparison_vs_alternative?: {
    income_improvement_monthly: number;
    tax_savings_lifetime: number;
    legacy_improvement_amount: number;
  };
  
  // Include IUL/Annuity in optimization?
  includes_iul: boolean;
  includes_annuity: boolean;
  iul_reason?: string;
  annuity_reason?: string;
  
  // Plain-English Summaries
  plain_english_summary: string;
  product_positioning: {
    iul_explanation?: string;
    annuity_explanation?: string;
  };
  
  // Advisor-Only Section
  advisor_summary: {
    iul_included_reason?: string;
    annuity_included_reason?: string;
    client_objections: string[];
    conversation_focus: string[];
  };
  
  // Compliance
  disclaimer: string;
  
  // Eligibility Breakdown (for transparency modal)
  annuity_eligibility?: {
    prefers_guaranteed: boolean;
    has_income_gap: boolean;
    income_gap_percent: number;
    near_retirement: boolean;
    years_to_retirement: number;
    sequence_risk_high: boolean;
    guaranteed_coverage_ratio: number;
    has_minimum_assets: boolean;
    minimum_required: number;
    actual_portfolio: number;
    is_eligible: boolean;
    exclusion_reason?: string;
  };
  
  iul_eligibility?: {
    tax_deferred_pct: number;
    tax_free_pct: number;
    high_tax_bracket: boolean;
    wants_tax_free: boolean;
    has_legacy_priority: boolean;
    has_protection_gap: boolean;
    is_eligible: boolean;
    exclusion_reason?: string;
  };
  
  calculation_inputs?: {
    return_rate: number;
    inflation_rate: number;
    marginal_tax_rate: number;
    withdrawal_rate: number;
    life_expectancy: number;
    rmd_start_age: number;
  };
}
