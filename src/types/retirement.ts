// Retirement Readiness Types

export type RetirementLifestyle = 'basic' | 'comfortable' | 'premium';
export type SpendingTargetMethod = 'fixed' | 'percent';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type LiquidityNeed = 'low' | 'medium' | 'high';
export type ProductFit = 'strong' | 'moderate' | 'weak' | 'not_recommended';

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
  whyBullets: string[];
  notIfBullets: string[];
  nextSteps: string[];
  disclaimer: string;
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
