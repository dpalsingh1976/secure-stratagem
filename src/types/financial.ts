// Financial planning types and interfaces

export type TaxWrapperType = 'TAX_NOW' | 'TAX_LATER' | 'TAX_NEVER';
export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_household';

export type AssetType = 
  | 'cash_checking' | 'cash_savings' | 'cash_cd' | 'cash_money_market' | 'cash_tbills'
  | 'brokerage_equity' | 'brokerage_etf' | 'brokerage_mutual_fund' | 'brokerage_bond' 
  | 'brokerage_options' | 'brokerage_alternatives' | 'brokerage_crypto'
  | 'retirement_401k' | 'retirement_403b' | 'retirement_457' | 'retirement_trad_ira' 
  | 'retirement_sep' | 'retirement_simple' | 'retirement_roth_ira' | 'retirement_roth_401k'
  | 'education_529' | 'education_utma' | 'education_ugma'
  | 'insurance_term' | 'insurance_whole_life' | 'insurance_iul' | 'insurance_vul'
  | 'annuity_fia' | 'annuity_rila' | 'annuity_spia' | 'annuity_dia'
  | 'business_equity' | 'real_estate_primary' | 'real_estate_rental' | 'real_estate_land'
  | 'pension' | 'social_security' | 'hsa';

export type LiabilityType = 
  | 'mortgage_primary' | 'mortgage_rental' | 'heloc' | 'student_loan' 
  | 'auto_loan' | 'credit_card' | 'business_loan' | 'personal_loan';

export type InsuranceType = 
  | 'life_term' | 'life_whole' | 'life_iul' | 'life_vul' 
  | 'disability_own_occ' | 'disability_any_occ' | 'ltc' | 'umbrella' | 'health';

export interface Client {
  id: string;
  advisor_id: string;
  name_first: string;
  name_last: string;
  email: string;
  dob: string;
  state: string;
  filing_status: FilingStatus;
  household_jsonb: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FinancialProfile {
  id: string;
  client_id: string;
  horizons_jsonb: {
    short_term_goals?: string[];
    medium_term_goals?: string[];
    long_term_goals?: string[];
  };
  goals_jsonb: {
    retirement_age?: number;
    desired_monthly_income?: number;
    drawdown_tolerance?: number;
    liquidity_buffer_months?: number;
    concentration_threshold?: number;
    insurance_priorities?: string[];
  };
  income_jsonb: {
    w2_income?: number;
    business_income?: number;
    rental_income?: number;
    pension_income?: number;
    social_security?: number;
    annuity_income?: number;
  };
  expenses_jsonb: {
    fixed_expenses?: number;      // Essential fixed expenses
    variable_expenses?: number;   // Discretionary spending
    debt_service?: number;
  };
  preferences_jsonb: {
    risk_tolerance?: number;
    loss_aversion?: number;
    investment_knowledge?: number;
    sequence_risk_sensitivity?: 'low' | 'medium' | 'high';
    tax_sensitivity?: 'low' | 'medium' | 'high';
    ethical_exclusions?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  client_id: string;
  asset_type: AssetType;
  tax_wrapper: TaxWrapperType;
  title: string;
  current_value: number;
  cost_basis: number;
  fee_bps: number;
  expected_return_low: number;
  expected_return_base: number;
  expected_return_high: number;
  liquidity_score: number;
  notes?: string;
  meta_jsonb: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  client_id: string;
  type: LiabilityType;
  balance: number;
  rate: number;
  term_months?: number;
  payment_monthly: number;
  variable: boolean;
  deductible: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Insurance {
  id: string;
  client_id: string;
  policy_type: InsuranceType;
  carrier?: string;
  face_amount: number;
  cash_value: number;
  premium: number;
  riders_jsonb: Record<string, any>;
  expiry_year?: number;
  loan_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComputedMetrics {
  id?: string;
  client_id: string;
  net_worth: number;
  liquid_pct: number;
  top_concentration_pct: number;
  liquidity_runway_months: number;
  dime_need: number;
  protection_gap: number;
  disability_gap: number;
  ltc_gap: number;
  retirement_gap_mo: number;
  seq_risk_index: number;
  tax_bucket_now_pct: number;
  tax_bucket_later_pct: number;
  tax_bucket_never_pct: number;
  lifetime_tax_drag_est: number;
  scores_jsonb: {
    protection: number;
    liquidity: number;
    concentration: number;
    volatility_sequence: number;
    longevity: number;
    inflation: number;
    tax: number;
    overall: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Report {
  id: string;
  client_id: string;
  report_jsonb: {
    summary: any;
    recommendations: any[];
    tax_buckets: any;
    coverage_income: any;
    appendix: any;
  };
  pdf_url?: string;
  public_link_id: string;
  created_at: string;
  updated_at: string;
}

// Primary Retirement Goal type
export type PrimaryRetirementGoal = 
  | 'maximize_tax_free'
  | 'secure_guaranteed_income'
  | 'protect_family'
  | 'balanced_growth_protection'
  | 'minimize_taxes';

// Form step data interfaces
export interface ProfileGoalsData {
  name_first: string;
  name_last: string;
  email: string;
  dob: string;
  state: string;
  filing_status: FilingStatus;
  dependents: number;
  retirement_age: number;
  desired_monthly_income: number;
  insurance_priorities: string[];
  primary_retirement_goal: PrimaryRetirementGoal;
  // Retirement planning additions
  retirement_lifestyle: 'basic' | 'comfortable' | 'premium';
  spending_target_method: 'fixed' | 'percent';
  spending_percent_of_income: number;
  planned_retirement_state: string;
}

export interface IncomeExpensesData {
  w2_income: number;
  business_income: number;
  rental_income: number;
  pension_income: number;
  social_security: number;
  annuity_income: number;
  fixed_expenses: number;       // Essential fixed expenses (mortgage, utilities, insurance, loans)
  variable_expenses: number;    // Discretionary spending (dining, entertainment, shopping, travel)
  debt_service: number;
  employer_match_pct: number;
  hsa_eligible: boolean;
  // Retirement planning additions
  annual_retirement_contribution: number;
  contribution_growth_rate: number;
  social_security_confidence: 'low' | 'medium' | 'high';
  expected_part_time_income: number;
  // Additional guaranteed income (NEW)
  monthly_retirement_income_goal_net: number;
  other_guaranteed_income_monthly: number; // Beyond SS/pension (e.g., rental, existing annuity)
  // Available Cash & Rollover Assets (for allocation optimization)
  monthly_checking_balance: number;         // Idle cash in checking after monthly spending
  has_old_401k: boolean;                    // Has 401(k) from previous employer
  old_401k_balance: number;                 // Balance available for rollover
  old_401k_employer_name: string;           // Previous employer name (optional)
}

export interface AssetFormData {
  asset_type: AssetType;
  tax_wrapper: TaxWrapperType;
  title: string;
  current_value: number;
  cost_basis: number;
  fee_bps: number;
  expected_return_low: number;
  expected_return_base: number;
  expected_return_high: number;
  liquidity_score: number;
  notes: string;
}

export interface LiabilityFormData {
  type: LiabilityType;
  balance: number;
  rate: number;
  term_months: number;
  payment_monthly: number;
  variable: boolean;
  deductible: boolean;
  notes: string;
}

export interface ProtectionHealthData {
  term_life_coverage: number;
  term_life_years: number;
  permanent_life_cv: number;
  permanent_life_db: number;
  ltc_daily_benefit: number;
  ltc_benefit_period: number;
  emergency_fund_months: number;
  // Retirement suitability additions
  prefers_guaranteed_income: boolean;
  liquidity_need_next_5yr: 'low' | 'medium' | 'high';
  can_commit_10yr_contributions: boolean;
  open_to_tax_diversification: boolean;
  // Spouse info (for survivor income calculations)
  spouse_age?: number;
  // Existing guaranteed income sources
  existing_db_pension_monthly: number;
}

// IUL Suitability - Planning Readiness Data
export type IncomeStability = 'stable' | 'somewhat_stable' | 'unstable';
export type FundingCommitmentYears = '3-5' | '5-10' | '10-20' | '20+';
export type FundingDiscipline = 'high' | 'medium' | 'low';
export type TaxBracketEstimate = '10-12' | '22' | '24' | '32' | '35+' | 'not_sure';
export type ConcernLevel = 'low' | 'medium' | 'high';
export type MaxingQualifiedPlans = 'no' | 'some' | 'yes' | 'not_applicable';

// Health & Longevity
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';
export type LongevityHistory = 'below_average' | 'average' | 'above_average';

// Investment Experience & Behavior
export type InvestmentExperience = 'novice' | 'intermediate' | 'experienced';
export type ProductComfort = 'low' | 'medium' | 'high';
export type DownMarketBehavior = 'panic_sell' | 'reduce_risk' | 'hold' | 'buy_more' | 'unsure';

// Goal Hierarchy Types
export interface GoalPriorityRanking {
  guaranteed_income: number; // 1-4 priority
  flexibility_liquidity: number;
  legacy_estate: number;
  inflation_protection: number;
}

export interface PlanningReadinessData {
  // A) Cashflow & Commitment
  income_stability: IncomeStability;
  funding_commitment_years: FundingCommitmentYears;
  funding_discipline: FundingDiscipline;
  
  // B) Emergency & Liquidity (emergency_fund_months is in ProtectionHealthData)
  near_term_liquidity_need: ConcernLevel;
  short_term_cash_needs_1_3yr: ConcernLevel; // New: 1-3 year cash needs
  
  // C) Retirement Basics
  contributing_to_401k_match: boolean;
  maxing_qualified_plans: MaxingQualifiedPlans;
  
  // D) Tax & Diversification
  current_tax_bracket: TaxBracketEstimate;
  tax_concern_level: ConcernLevel;
  wants_tax_free_bucket: boolean;
  expects_higher_future_taxes: boolean; // New
  rmd_concern: ConcernLevel; // New
  
  // E) Volatility / Sequence Risk
  sequence_risk_concern: ConcernLevel;
  
  // F) Legacy / Permanent Need
  legacy_priority: ConcernLevel;
  permanent_coverage_need: boolean;
  
  // G) Suitability Guardrails
  debt_pressure_level: ConcernLevel;
  
  // H) Demographics & Health (NEW - optional until collected)
  self_assessed_health?: HealthStatus;
  family_longevity_history?: LongevityHistory;
  longevity_concern?: ConcernLevel;
  
  // I) Goal Hierarchy (Priority Ranking 1-4) (NEW - optional until collected)
  goal_priorities?: GoalPriorityRanking;
  
  // J) Risk, Time Horizon & Behavior (NEW - optional until collected)
  investment_experience_level?: InvestmentExperience;
  comfort_with_complex_products?: ProductComfort;
  willingness_illiquidity_years?: number; // Years willing to keep funds locked
  behavior_in_down_market?: DownMarketBehavior;
  
  // K) Income stability preference (neutral wording for guaranteed income)
  wants_monthly_paycheck_feel?: boolean;
  sleep_at_night_priority?: ConcernLevel;
  survivor_income_need?: ConcernLevel;
}

// Simplified retirement answers for streamlined 8-question form
export interface SimplifiedRetirementAnswers {
  emergencyFund?: 'less_than_3' | '3_to_6' | '6_plus';
  contributionStatus?: 'not_contributing' | 'contributing_not_maxing' | 'maxing';
  primaryPriority?: 'predictable_income' | 'tax_efficient' | 'growth_protection' | 'legacy' | 'flexibility';
  marketBehavior?: 'panic' | 'uneasy' | 'calm';
  lockupTolerance?: 'less_than_5' | '5_to_7' | '7_plus';
  longevity?: 'below_average' | 'average' | 'above_average';
  majorExpenses?: 'none' | 'possibly' | 'yes';
  incomeStability?: 'very_stable' | 'mostly_stable' | 'variable';
}

export interface RiskPreferencesData {
  risk_tolerance: number;
  loss_aversion: number;
  investment_knowledge: number;
  sequence_risk_sensitivity: 'low' | 'medium' | 'high';
  tax_sensitivity: 'low' | 'medium' | 'high';
  ethical_exclusions: string[];
}

// Asset type configurations for UI
export const ASSET_TYPE_CONFIG: Record<AssetType, {
  label: string;
  category: string;
  defaultTaxWrapper: TaxWrapperType;
  icon: string;
}> = {
  cash_checking: { label: 'Checking Account', category: 'Cash & Equivalents', defaultTaxWrapper: 'TAX_NOW', icon: 'DollarSign' },
  cash_savings: { label: 'Savings Account', category: 'Cash & Equivalents', defaultTaxWrapper: 'TAX_NOW', icon: 'Piggybank' },
  cash_cd: { label: 'Certificate of Deposit', category: 'Cash & Equivalents', defaultTaxWrapper: 'TAX_NOW', icon: 'FileText' },
  cash_money_market: { label: 'Money Market', category: 'Cash & Equivalents', defaultTaxWrapper: 'TAX_NOW', icon: 'TrendingUp' },
  cash_tbills: { label: 'Treasury Bills', category: 'Cash & Equivalents', defaultTaxWrapper: 'TAX_NOW', icon: 'Building' },
  
  brokerage_equity: { label: 'Individual Stocks', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'TrendingUp' },
  brokerage_etf: { label: 'ETFs', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'BarChart3' },
  brokerage_mutual_fund: { label: 'Mutual Funds', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'PieChart' },
  brokerage_bond: { label: 'Bonds', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'Shield' },
  brokerage_options: { label: 'Options', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'Zap' },
  brokerage_alternatives: { label: 'REITs/Alternatives', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'Home' },
  brokerage_crypto: { label: 'Cryptocurrency', category: 'Brokerage', defaultTaxWrapper: 'TAX_NOW', icon: 'Bitcoin' },
  
  retirement_401k: { label: '401(k)', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'Building2' },
  retirement_403b: { label: '403(b)', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'GraduationCap' },
  retirement_457: { label: '457', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'Users' },
  retirement_trad_ira: { label: 'Traditional IRA', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'PiggyBank' },
  retirement_sep: { label: 'SEP-IRA', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'Briefcase' },
  retirement_simple: { label: 'SIMPLE IRA', category: 'Tax-Deferred', defaultTaxWrapper: 'TAX_LATER', icon: 'Building' },
  
  retirement_roth_ira: { label: 'Roth IRA', category: 'Tax-Free', defaultTaxWrapper: 'TAX_NEVER', icon: 'Star' },
  retirement_roth_401k: { label: 'Roth 401(k)', category: 'Tax-Free', defaultTaxWrapper: 'TAX_NEVER', icon: 'Star' },
  hsa: { label: 'HSA', category: 'Tax-Free', defaultTaxWrapper: 'TAX_NEVER', icon: 'Heart' },
  
  education_529: { label: '529 Plan', category: 'Education', defaultTaxWrapper: 'TAX_NEVER', icon: 'GraduationCap' },
  education_utma: { label: 'UTMA', category: 'Education', defaultTaxWrapper: 'TAX_NOW', icon: 'Users' },
  education_ugma: { label: 'UGMA', category: 'Education', defaultTaxWrapper: 'TAX_NOW', icon: 'Users' },
  
  insurance_term: { label: 'Term Life Insurance', category: 'Insurance', defaultTaxWrapper: 'TAX_NEVER', icon: 'Shield' },
  insurance_whole_life: { label: 'Whole Life Insurance', category: 'Insurance', defaultTaxWrapper: 'TAX_NEVER', icon: 'ShieldCheck' },
  insurance_iul: { label: 'Indexed Universal Life', category: 'Insurance', defaultTaxWrapper: 'TAX_NEVER', icon: 'TrendingUp' },
  insurance_vul: { label: 'Variable Universal Life', category: 'Insurance', defaultTaxWrapper: 'TAX_NEVER', icon: 'BarChart3' },
  
  annuity_fia: { label: 'Fixed Index Annuity', category: 'Annuities', defaultTaxWrapper: 'TAX_LATER', icon: 'TrendingUp' },
  annuity_rila: { label: 'Registered Index-Linked Annuity', category: 'Annuities', defaultTaxWrapper: 'TAX_LATER', icon: 'BarChart3' },
  annuity_spia: { label: 'Single Premium Immediate Annuity', category: 'Annuities', defaultTaxWrapper: 'TAX_LATER', icon: 'DollarSign' },
  annuity_dia: { label: 'Deferred Income Annuity', category: 'Annuities', defaultTaxWrapper: 'TAX_LATER', icon: 'Clock' },
  
  business_equity: { label: 'Business Ownership', category: 'Private Assets', defaultTaxWrapper: 'TAX_NOW', icon: 'Briefcase' },
  real_estate_primary: { label: 'Primary Residence', category: 'Real Estate', defaultTaxWrapper: 'TAX_NOW', icon: 'Home' },
  real_estate_rental: { label: 'Rental Property', category: 'Real Estate', defaultTaxWrapper: 'TAX_NOW', icon: 'Building' },
  real_estate_land: { label: 'Land Investment', category: 'Real Estate', defaultTaxWrapper: 'TAX_NOW', icon: 'Mountain' },
  
  pension: { label: 'Pension', category: 'Guaranteed Income', defaultTaxWrapper: 'TAX_LATER', icon: 'Building2' },
  social_security: { label: 'Social Security', category: 'Guaranteed Income', defaultTaxWrapper: 'TAX_LATER', icon: 'Users' },
};

export const TAX_WRAPPER_CONFIG = {
  TAX_NOW: {
    label: 'Taxable (Pay Now)',
    description: 'Income and gains are taxed annually',
    color: 'bg-red-100 text-red-800 border-red-200',
    examples: ['Brokerage accounts', 'Cash accounts', 'Taxable bonds']
  },
  TAX_LATER: {
    label: 'Tax-Deferred (Pay Later)', 
    description: 'Taxes deferred until withdrawal',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    examples: ['401(k)', 'Traditional IRA', 'Annuities']
  },
  TAX_NEVER: {
    label: 'Tax-Free (Never Pay)',
    description: 'Tax-free growth and distributions',
    color: 'bg-green-100 text-green-800 border-green-200',
    examples: ['Roth IRA', 'HSA', 'Life insurance cash value']
  }
};