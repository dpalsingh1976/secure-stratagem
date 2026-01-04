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
