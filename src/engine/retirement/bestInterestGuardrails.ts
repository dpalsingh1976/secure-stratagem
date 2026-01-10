// Best-Interest Guardrails Engine
// NAIC Model #275 / FINRA Rule 2330 aligned checks
// Ensures recommendations meet best-interest standards

import type { 
  PlanningReadinessData, 
  ProtectionHealthData,
  IncomeExpensesData,
  ProfileGoalsData
} from '@/types/financial';

export interface DataCompletenessCheck {
  is_complete: boolean;
  missing_fields: string[];
  education_only_mode: boolean;
  reason: string;
  completeness_score: number; // 0-100
}

export type GuardrailConstraintType = 
  | 'liquidity' 
  | 'health' 
  | 'time_horizon' 
  | 'goal_conflict' 
  | 'experience'
  | 'emergency_fund'
  | 'debt_pressure';

export interface SuitabilityGuardrail {
  passes: boolean;
  constraint_type: GuardrailConstraintType;
  message: string;
  severity: 'block' | 'warn';
}

export interface GuardrailResult {
  data_completeness: DataCompletenessCheck;
  suitability_guardrails: SuitabilityGuardrail[];
  all_guardrails_pass: boolean;
  education_only: boolean;
  education_reason?: string;
  explicit_rejection_reasons: string[];
}

/**
 * Required fields for producing recommendations
 * Based on NAIC Model #275 minimum data requirements
 */
const REQUIRED_FIELDS: { field: string; label: string; category: string }[] = [
  { field: 'age', label: 'Age', category: 'demographics' },
  { field: 'retirement_age', label: 'Target Retirement Age', category: 'demographics' },
  { field: 'income', label: 'Annual Income', category: 'financial' },
  { field: 'total_assets', label: 'Total Assets', category: 'financial' },
  { field: 'risk_tolerance', label: 'Risk Tolerance', category: 'preferences' },
  { field: 'liquidity_need', label: 'Liquidity Needs', category: 'preferences' },
  { field: 'time_horizon', label: 'Time Horizon', category: 'planning' },
  { field: 'tax_status', label: 'Tax Status', category: 'tax' }
];

/**
 * Check minimum data completeness before producing recommendations
 * Aligned with NAIC Model #275 requirements
 */
export function checkDataCompleteness(
  profileData?: ProfileGoalsData,
  incomeData?: IncomeExpensesData,
  protectionData?: ProtectionHealthData,
  planningReadiness?: PlanningReadinessData,
  totalAssets?: number
): DataCompletenessCheck {
  const missing: string[] = [];
  let fieldsPresent = 0;
  const totalFields = REQUIRED_FIELDS.length;
  
  // Check demographics
  if (!profileData?.dob) {
    missing.push('Age/Date of Birth');
  } else {
    fieldsPresent++;
  }
  
  if (!profileData?.retirement_age || profileData.retirement_age === 0) {
    missing.push('Target Retirement Age');
  } else {
    fieldsPresent++;
  }
  
  // Check financial data
  const annualIncome = incomeData 
    ? ((incomeData.w2_income || 0) + (incomeData.business_income || 0)) * 12 
    : 0;
  
  if (annualIncome === 0) {
    missing.push('Annual Income');
  } else {
    fieldsPresent++;
  }
  
  if (totalAssets === undefined || totalAssets === 0) {
    missing.push('Total Assets');
  } else {
    fieldsPresent++;
  }
  
  // Check preferences
  if (!planningReadiness?.behavior_in_down_market) {
    missing.push('Risk Tolerance/Behavior');
  } else {
    fieldsPresent++;
  }
  
  if (!planningReadiness?.near_term_liquidity_need) {
    missing.push('Liquidity Needs');
  } else {
    fieldsPresent++;
  }
  
  // Check time horizon (funding commitment)
  if (!planningReadiness?.funding_commitment_years) {
    missing.push('Time Horizon');
  } else {
    fieldsPresent++;
  }
  
  // Check tax status
  if (!planningReadiness?.current_tax_bracket || planningReadiness.current_tax_bracket === 'not_sure') {
    missing.push('Tax Bracket Estimate');
  } else {
    fieldsPresent++;
  }
  
  const completenessScore = Math.round((fieldsPresent / totalFields) * 100);
  const isComplete = missing.length <= 2; // Allow up to 2 missing fields
  const educationOnlyMode = missing.length > 3;
  
  let reason = '';
  if (missing.length === 0) {
    reason = 'All required data present for personalized recommendations';
  } else if (missing.length <= 2) {
    reason = `Minor data gaps: ${missing.join(', ')}. Recommendations may be general.`;
  } else {
    reason = `Cannot produce personalized recommendations: Missing ${missing.join(', ')}`;
  }
  
  return {
    is_complete: isComplete,
    missing_fields: missing,
    education_only_mode: educationOnlyMode,
    reason,
    completeness_score: completenessScore
  };
}

/**
 * Check for suitability constraint violations that may block recommendations
 * Aligned with FINRA Rule 2330 principles
 */
export function checkSuitabilityConstraints(
  planningReadiness: PlanningReadinessData,
  protectionData: ProtectionHealthData,
  yearsToRetirement: number,
  currentAge?: number
): SuitabilityGuardrail[] {
  const guardrails: SuitabilityGuardrail[] = [];
  
  // 0. AGE-BASED CONSTRAINT FOR GUARANTEED INCOME PRODUCTS (Critical)
  // Young clients with long time horizons should not be recommended annuities
  const AGE_MINIMUM_FOR_ANNUITY = 45;
  const AGE_EXCEPTION_YEARS_TO_RETIREMENT = 15;
  
  if (currentAge && currentAge < AGE_MINIMUM_FOR_ANNUITY && yearsToRetirement > AGE_EXCEPTION_YEARS_TO_RETIREMENT) {
    // Check if extreme indicators are present that would override age constraint
    const hasExtremeIndicators = 
      planningReadiness.longevity_concern === 'high' &&
      planningReadiness.wants_monthly_paycheck_feel === true &&
      ['panic_sell', 'reduce_risk'].includes(planningReadiness.behavior_in_down_market || '');
    
    if (!hasExtremeIndicators) {
      guardrails.push({
        passes: false,
        constraint_type: 'time_horizon',
        message: `At age ${currentAge} with ${yearsToRetirement} years to retirement, focus on growth strategies. Guaranteed income products are better suited for ages 50+, or those within 15 years of retirement.`,
        severity: 'block'
      });
    }
  }
  
  // 1. Emergency Fund Constraint (Critical)
  const emergencyMonths = protectionData.emergency_fund_months || 0;
  if (emergencyMonths < 3) {
    guardrails.push({
      passes: false,
      constraint_type: 'emergency_fund',
      message: `Emergency fund of ${emergencyMonths} months is below minimum. Build 3-6 months before committing to illiquid products.`,
      severity: 'block'
    });
  }
  
  // 2. Liquidity Constraint
  if (planningReadiness.near_term_liquidity_need === 'high' || 
      planningReadiness.short_term_cash_needs_1_3yr === 'high') {
    guardrails.push({
      passes: false,
      constraint_type: 'liquidity',
      message: 'High near-term liquidity needs conflict with illiquid product recommendations. Address expected expenses first.',
      severity: 'block'
    });
  }
  
  // 3. Health/Longevity Constraint
  if (planningReadiness.self_assessed_health === 'poor' && 
      planningReadiness.family_longevity_history === 'below_average') {
    guardrails.push({
      passes: false,
      constraint_type: 'health',
      message: 'Health and longevity factors reduce suitability for lifetime income products. Consider term-based alternatives.',
      severity: 'warn'
    });
  }
  
  // 4. Time Horizon Constraint
  const willingIlliquidity = planningReadiness.willingness_illiquidity_years || 0;
  if (willingIlliquidity < 7 && yearsToRetirement < 5) {
    guardrails.push({
      passes: false,
      constraint_type: 'time_horizon',
      message: 'Short time horizon conflicts with surrender period requirements. Focus on liquid strategies.',
      severity: 'warn'
    });
  }
  
  // 5. Experience/Complexity Constraint
  if (planningReadiness.investment_experience_level === 'novice' && 
      planningReadiness.comfort_with_complex_products === 'low') {
    guardrails.push({
      passes: false,
      constraint_type: 'experience',
      message: 'Complex products may not be suitable for novice investors. Education and simpler alternatives recommended first.',
      severity: 'warn'
    });
  }
  
  // 6. Goal Conflict: Legacy vs Guaranteed Income
  const goalPriorities = planningReadiness.goal_priorities;
  if (goalPriorities && goalPriorities.legacy_estate === 1 && goalPriorities.guaranteed_income > 2) {
    guardrails.push({
      passes: false,
      constraint_type: 'goal_conflict',
      message: 'Legacy is your top priority—guaranteed income products may reduce estate value. Consider life insurance for legacy goals.',
      severity: 'warn'
    });
  }
  
  // 7. Goal Conflict: Flexibility prioritized over guarantees
  if (goalPriorities && goalPriorities.flexibility_liquidity < goalPriorities.guaranteed_income) {
    guardrails.push({
      passes: false,
      constraint_type: 'goal_conflict',
      message: 'You prioritize flexibility over guaranteed income—consider more liquid alternatives first.',
      severity: 'warn'
    });
  }
  
  // 8. Debt Pressure Constraint
  if (planningReadiness.debt_pressure_level === 'high' && emergencyMonths < 6) {
    guardrails.push({
      passes: false,
      constraint_type: 'debt_pressure',
      message: 'High debt pressure combined with low reserves. Address debt and build savings before product commitments.',
      severity: 'block'
    });
  }
  
  return guardrails;
}

/**
 * Build explicit rejection reason based on client inputs
 */
export function buildExplicitRejectionReason(
  planningReadiness: PlanningReadinessData,
  protectionData: ProtectionHealthData
): string {
  const factors: string[] = [];
  
  const goalPriorities = planningReadiness.goal_priorities;
  if (goalPriorities && goalPriorities.flexibility_liquidity <= 2) {
    factors.push('strong need for flexibility');
  }
  
  if (planningReadiness.near_term_liquidity_need !== 'low') {
    factors.push('near-term liquidity needs');
  }
  
  const willingIlliquidity = planningReadiness.willingness_illiquidity_years || 0;
  if (willingIlliquidity < 7) {
    factors.push('short liquidity horizon');
  }
  
  if (planningReadiness.self_assessed_health === 'poor' || 
      planningReadiness.self_assessed_health === 'fair') {
    factors.push('health considerations');
  }
  
  if (planningReadiness.debt_pressure_level === 'high') {
    factors.push('high debt pressure');
  }
  
  const emergencyMonths = protectionData.emergency_fund_months || 0;
  if (emergencyMonths < 3) {
    factors.push('insufficient emergency reserves');
  }
  
  if (factors.length === 0) {
    return 'Current financial position suggests focusing on foundational planning before specialized products.';
  }
  
  return `Based on your ${factors.join(', ')}, this strategy would not align with your stated priorities.`;
}

/**
 * Apply goal hierarchy logic to determine if guaranteed income should be included
 */
export function shouldIncludeGuaranteedIncome(
  planningReadiness: PlanningReadinessData
): { include: boolean; reason: string } {
  const goalPriorities = planningReadiness.goal_priorities;
  
  if (!goalPriorities) {
    return { include: false, reason: 'Goal priorities not specified' };
  }
  
  // Do NOT recommend lifetime income when legacy is top priority
  if (goalPriorities.legacy_estate === 1 && goalPriorities.guaranteed_income > 2) {
    return {
      include: false,
      reason: 'Legacy is your top priority—guaranteed income products may reduce estate value'
    };
  }
  
  // Reduce suitability if flexibility ranks higher than guarantees
  if (goalPriorities.flexibility_liquidity < goalPriorities.guaranteed_income) {
    return {
      include: false,
      reason: 'You prioritize flexibility over guaranteed income—consider more liquid alternatives'
    };
  }
  
  // Strong fit if guaranteed income is priority 1 or 2
  if (goalPriorities.guaranteed_income <= 2) {
    return {
      include: true,
      reason: 'Guaranteed income aligns with your top priorities'
    };
  }
  
  // Moderate consideration if guaranteed income is priority 3
  if (goalPriorities.guaranteed_income === 3) {
    // Check other signals
    if (planningReadiness.longevity_concern === 'high' || 
        planningReadiness.wants_monthly_paycheck_feel ||
        planningReadiness.sleep_at_night_priority === 'high') {
      return {
        include: true,
        reason: 'Your longevity concern and preference for stability support guaranteed income consideration'
      };
    }
  }
  
  return { 
    include: false, 
    reason: 'Goal hierarchy does not strongly support guaranteed income recommendation' 
  };
}

/**
 * Main guardrail check function
 * Returns comprehensive result with all checks
 */
export function runBestInterestGuardrails(
  profileData?: ProfileGoalsData,
  incomeData?: IncomeExpensesData,
  protectionData?: ProtectionHealthData,
  planningReadiness?: PlanningReadinessData,
  totalAssets?: number,
  yearsToRetirement?: number
): GuardrailResult {
  // Default values for missing data
  const defaultProtection: ProtectionHealthData = {
    term_life_coverage: 0,
    term_life_years: 0,
    permanent_life_cv: 0,
    permanent_life_db: 0,
    ltc_daily_benefit: 0,
    ltc_benefit_period: 0,
    emergency_fund_months: 0,
    prefers_guaranteed_income: false,
    liquidity_need_next_5yr: 'medium',
    can_commit_10yr_contributions: false,
    open_to_tax_diversification: false,
    existing_db_pension_monthly: 0
  };
  
  const protection = protectionData || defaultProtection;
  
  // Check data completeness
  const dataCompleteness = checkDataCompleteness(
    profileData,
    incomeData,
    protection,
    planningReadiness,
    totalAssets
  );
  
  // If no planning readiness data, return education-only result
  if (!planningReadiness) {
    return {
      data_completeness: dataCompleteness,
      suitability_guardrails: [],
      all_guardrails_pass: false,
      education_only: true,
      education_reason: 'Complete the planning readiness questionnaire to receive personalized recommendations',
      explicit_rejection_reasons: []
    };
  }
  
  // Calculate current age from DOB if available
  let currentAge: number | undefined;
  if (profileData?.dob) {
    const today = new Date();
    const dob = new Date(profileData.dob);
    currentAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      currentAge--;
    }
  }
  
  // Check suitability constraints
  const guardrails = checkSuitabilityConstraints(
    planningReadiness,
    protection,
    yearsToRetirement || 20,
    currentAge
  );
  
  // Determine if all blocking guardrails pass
  const blockingGuardrails = guardrails.filter(g => !g.passes && g.severity === 'block');
  const allGuardrailsPass = blockingGuardrails.length === 0;
  
  // Build explicit rejection reasons
  const explicitRejectionReasons: string[] = [];
  if (!allGuardrailsPass) {
    explicitRejectionReasons.push(
      buildExplicitRejectionReason(planningReadiness, protection)
    );
    blockingGuardrails.forEach(g => {
      explicitRejectionReasons.push(g.message);
    });
  }
  
  // Determine education-only mode
  const educationOnly = dataCompleteness.education_only_mode || blockingGuardrails.length >= 2;
  const educationReason = educationOnly
    ? dataCompleteness.education_only_mode
      ? dataCompleteness.reason
      : `Multiple suitability concerns: ${blockingGuardrails.map(g => g.constraint_type).join(', ')}`
    : undefined;
  
  return {
    data_completeness: dataCompleteness,
    suitability_guardrails: guardrails,
    all_guardrails_pass: allGuardrailsPass,
    education_only: educationOnly,
    education_reason: educationReason,
    explicit_rejection_reasons: explicitRejectionReasons
  };
}
