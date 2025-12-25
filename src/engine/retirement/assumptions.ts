// Retirement Planning Assumptions - Deterministic Constants
// These are industry-standard defaults; do NOT use AI to compute

export const INFLATION_ASSUMPTIONS = {
  DEFAULT: 0.03,      // 3% annual inflation
  LOW: 0.02,          // 2% - optimistic
  HIGH: 0.04,         // 4% - pessimistic
} as const;

export const RETURN_ASSUMPTIONS = {
  CONSERVATIVE: 0.04,  // 4% annual return (bonds/fixed)
  BASE: 0.06,          // 6% annual return (balanced portfolio)
  AGGRESSIVE: 0.075,   // 7.5% annual return (equity-heavy)
} as const;

export const WITHDRAWAL_RATES = {
  SAFE_RATE: 0.04,     // 4% SWR (Trinity Study)
  CONSERVATIVE: 0.035, // 3.5% for longer retirements
  AGGRESSIVE: 0.05,    // 5% if shorter retirement expected
} as const;

export const LIFE_EXPECTANCY = {
  MALE_65: 84,
  FEMALE_65: 87,
  CONSERVATIVE: 95,    // Plan to age 95 for safety
  OPTIMISTIC: 90,
} as const;

export const TAX_ASSUMPTIONS = {
  MARGINAL_RATE_DEFAULT: 0.22,
  MARGINAL_RATE_HIGH: 0.32,
  MARGINAL_RATE_LOW: 0.12,
  TAX_DRAG_ANNUAL: 0.01, // 1% drag from annual taxes on taxable accounts
} as const;

export const SOCIAL_SECURITY_ASSUMPTIONS = {
  FULL_RETIREMENT_AGE: 67,
  EARLY_REDUCTION_FACTOR: 0.0667, // ~6.67% per year before FRA
  DELAYED_CREDIT_FACTOR: 0.08,   // 8% per year after FRA until 70
  CONFIDENCE_HAIRCUTS: {
    low: 0.75,    // 25% reduction for low confidence
    medium: 0.90, // 10% reduction for medium confidence
    high: 1.0,    // Full amount for high confidence
  },
} as const;

export const LIFESTYLE_MULTIPLIERS = {
  basic: 0.7,      // 70% of target for basic lifestyle
  comfortable: 1.0, // 100% for comfortable
  premium: 1.3,    // 130% for premium lifestyle
} as const;

export const INSURANCE_ASSUMPTIONS = {
  TERM_YEARS_DEFAULT: 20,
  INCOME_REPLACEMENT_YEARS: 10,
  EDU_COST_PER_CHILD: 100000,
  FINAL_EXPENSES: 15000,
  LTC_DAILY_COST_AVG: 200,
  LTC_BENEFIT_YEARS: 3,
} as const;

export const CONTRIBUTION_LIMITS_2024 = {
  CONTRIBUTION_401K: 23000,
  CONTRIBUTION_401K_CATCHUP: 7500, // Age 50+
  CONTRIBUTION_IRA: 7000,
  CONTRIBUTION_IRA_CATCHUP: 1000,
  CONTRIBUTION_HSA_INDIVIDUAL: 4150,
  CONTRIBUTION_HSA_FAMILY: 8300,
} as const;

// Sequence of returns risk - early retirement years
export const SEQUENCE_RISK_RETURNS = {
  NORMAL: [0.06, 0.06, 0.06, 0.06, 0.06],
  BAD_EARLY: [-0.10, 0.00, -0.05, 0.02, 0.04], // Bad first 5 years
  GOOD_EARLY: [0.15, 0.12, 0.10, 0.08, 0.06],  // Good first 5 years
} as const;

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,  // 80-100: Minimal risk
  GOOD: 60,       // 60-79: Low risk
  MODERATE: 40,   // 40-59: Moderate risk
  CONCERNING: 20, // 20-39: High risk
  CRITICAL: 0,    // 0-19: Critical risk
} as const;

export const GRADE_THRESHOLDS = {
  A: 80,
  B: 65,
  C: 50,
  D: 35,
  F: 0,
} as const;
