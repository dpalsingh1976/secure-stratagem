// Retirement Allocation Engine - Unbiased Savings Waterfall
// Based on CFP standards and top advisory recommendations (Vanguard, Fidelity, Marotta, Berger)

import type {
  ProfileGoalsData,
  IncomeExpensesData,
  ProtectionHealthData,
  ComputedMetrics,
  FilingStatus
} from '@/types/financial';
import type {
  RetirementPreferencesData,
  RetirementProjection,
  ProductRecommendation,
  AllocationRecommendation,
  SavingsWaterfallStep,
  SavingsVehicle,
  PrimaryRetirementGoal
} from '@/types/retirement';

// 2024 contribution limits
const LIMITS = {
  '401k': 23000,
  '401k_catch_up': 7500,      // Age 50+
  'roth_ira': 7000,
  'roth_ira_catch_up': 1000,  // Age 50+
  'hsa_individual': 4150,
  'hsa_family': 8300,
  'hsa_catch_up': 1000        // Age 55+
};

// Roth IRA income phase-out limits (2024)
const ROTH_LIMITS: Record<FilingStatus, { start: number; end: number }> = {
  single: { start: 146000, end: 161000 },
  married_joint: { start: 230000, end: 240000 },
  married_separate: { start: 0, end: 10000 },
  head_household: { start: 146000, end: 161000 }
};

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculate total MONTHLY income (all income fields are monthly)
 */
function calculateMonthlyIncome(incomeData: IncomeExpensesData): number {
  return (
    (incomeData.w2_income || 0) +
    (incomeData.business_income || 0) +
    (incomeData.rental_income || 0) +
    (incomeData.social_security || 0)
  );
}

/**
 * Calculate total annual income (convert monthly to annual)
 */
function calculateAnnualIncome(incomeData: IncomeExpensesData): number {
  return calculateMonthlyIncome(incomeData) * 12;
}

/**
 * Calculate monthly savings capacity (income - expenses, all monthly)
 */
function calculateMonthlySavingsCapacity(incomeData: IncomeExpensesData): number {
  const totalMonthlyIncome = calculateMonthlyIncome(incomeData);
  const totalMonthlyExpenses = (
    (incomeData.fixed_expenses || 0) +
    (incomeData.variable_expenses || 0) +
    (incomeData.debt_service || 0)
  );
  return Math.max(0, totalMonthlyIncome - totalMonthlyExpenses);
}

/**
 * Check Roth IRA eligibility based on income
 */
function getRothEligibility(
  income: number,
  filingStatus: FilingStatus
): { eligible: boolean; partial: boolean; reason?: string } {
  const limits = ROTH_LIMITS[filingStatus];
  
  if (income < limits.start) {
    return { eligible: true, partial: false };
  }
  if (income <= limits.end) {
    return { eligible: true, partial: true, reason: 'Income in phase-out range - partial contribution allowed' };
  }
  return { eligible: false, partial: false, reason: `Income exceeds Roth IRA limit of ${formatCurrency(limits.end)}` };
}

/**
 * Get contribution limit with catch-up if applicable
 */
function getContributionLimit(vehicle: string, age: number, hasFamily: boolean = false): number {
  const is50Plus = age >= 50;
  const is55Plus = age >= 55;
  
  switch (vehicle) {
    case '401k':
      return LIMITS['401k'] + (is50Plus ? LIMITS['401k_catch_up'] : 0);
    case 'roth_ira':
      return LIMITS['roth_ira'] + (is50Plus ? LIMITS['roth_ira_catch_up'] : 0);
    case 'hsa':
      const base = hasFamily ? LIMITS['hsa_family'] : LIMITS['hsa_individual'];
      return base + (is55Plus ? LIMITS['hsa_catch_up'] : 0);
    default:
      return 0;
  }
}

/**
 * Calculate fit score for a vehicle based on client profile
 */
function calculateVehicleFitScore(
  vehicle: SavingsVehicle,
  primaryGoal: PrimaryRetirementGoal,
  preferences: ProtectionHealthData,
  metrics: ComputedMetrics,
  projection: RetirementProjection,
  productRecommendations: ProductRecommendation[]
): number {
  let score = 50; // Base score
  
  switch (vehicle) {
    case '401k_match':
      // Always highest fit - free money
      return 100;
      
    case 'hsa':
      // Triple tax advantage
      if (primaryGoal === 'maximize_tax_free' || primaryGoal === 'minimize_taxes') score += 30;
      return Math.min(100, score + 20);
      
    case 'roth_ira':
    case 'backdoor_roth':
      // Tax-free growth
      if (primaryGoal === 'maximize_tax_free') score += 25;
      if (primaryGoal === 'minimize_taxes') score += 20;
      if (metrics.tax_bucket_never_pct < 20) score += 15;
      return Math.min(100, score);
      
    case '401k_max':
      // Tax-deferred growth
      if (primaryGoal === 'minimize_taxes') score += 20;
      if (metrics.tax_bucket_later_pct < 50) score += 10;
      return Math.min(100, score);
      
    case 'annuity':
      const annuityRec = productRecommendations.find(r => r.product === 'Annuity');
      if (annuityRec?.fit === 'strong') score = 80;
      else if (annuityRec?.fit === 'moderate') score = 60;
      else if (annuityRec?.fit === 'weak') score = 35;
      else score = 20;
      
      if (primaryGoal === 'secure_guaranteed_income') score += 15;
      if (preferences.prefers_guaranteed_income) score += 10;
      return Math.min(100, score);
      
    case 'iul':
      const iulRec = productRecommendations.find(r => r.product === 'IUL');
      if (iulRec?.fit === 'strong') score = 75;
      else if (iulRec?.fit === 'moderate') score = 55;
      else if (iulRec?.fit === 'weak') score = 30;
      else score = 15;
      
      if (primaryGoal === 'protect_family') score += 15;
      if (primaryGoal === 'maximize_tax_free' && preferences.can_commit_10yr_contributions) score += 10;
      return Math.min(100, score);
      
    case 'taxable':
      // Default fallback, moderate fit
      if (preferences.liquidity_need_next_5yr === 'high') score += 20;
      return Math.min(100, score);
      
    default:
      return 50;
  }
}

/**
 * Main allocation computation function
 * DETERMINISTIC - pure math, no bias toward any product
 */
export function computeSavingsAllocation(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  protectionData: ProtectionHealthData,
  metrics: ComputedMetrics,
  preferences: RetirementPreferencesData,
  projection: RetirementProjection,
  productRecommendations: ProductRecommendation[],
  primaryGoal: PrimaryRetirementGoal
): AllocationRecommendation {
  const waterfall: SavingsWaterfallStep[] = [];
  const age = calculateAge(profileData.dob);
  const annualIncome = calculateAnnualIncome(incomeData);
  const monthlySavingsCapacity = calculateMonthlySavingsCapacity(incomeData);
  let remainingMonthly = monthlySavingsCapacity;
  let priority = 1;
  const hasFamily = profileData.dependents > 0 || profileData.filing_status === 'married_joint';
  
  // Helper to add a step
  const addStep = (
    vehicle: SavingsVehicle,
    label: string,
    annualLimit: number,
    rationale: string,
    isApplicable: boolean = true,
    notApplicableReason?: string
  ) => {
    const fitScore = calculateVehicleFitScore(
      vehicle,
      primaryGoal,
      protectionData,
      metrics,
      projection,
      productRecommendations
    );
    
    const monthlyLimit = Math.round(annualLimit / 12);
    const suggestedMonthly = isApplicable ? Math.min(monthlyLimit, remainingMonthly) : 0;
    
    if (isApplicable && suggestedMonthly > 0) {
      remainingMonthly -= suggestedMonthly;
    }
    
    waterfall.push({
      priority: priority++,
      vehicle,
      label,
      monthly_amount: monthlyLimit,
      annual_limit: annualLimit,
      current_contribution: 0, // Could be populated from actual data
      suggested_contribution: suggestedMonthly,
      rationale,
      fit_score: fitScore,
      is_applicable: isApplicable,
      not_applicable_reason: notApplicableReason
    });
  };
  
  // =====================================================
  // STEP 1: 401(k) to Employer Match (ALWAYS FIRST)
  // =====================================================
  const matchPct = incomeData.employer_match_pct || 0;
  if (matchPct > 0) {
    const matchAmount = Math.round((annualIncome * matchPct) / 100);
    addStep(
      '401k_match',
      '401(k) to Employer Match',
      matchAmount,
      `Employer matches ${matchPct}% - this is free money with 100% instant return`
    );
  } else {
    addStep(
      '401k_match',
      '401(k) to Employer Match',
      0,
      'No employer match available',
      false,
      'No employer match available in your plan'
    );
  }
  
  // =====================================================
  // STEP 2: HSA (Triple Tax Advantage)
  // =====================================================
  const hsaEligible = incomeData.hsa_eligible;
  const hsaLimit = getContributionLimit('hsa', age, hasFamily);
  
  if (hsaEligible) {
    addStep(
      'hsa',
      'Health Savings Account (HSA)',
      hsaLimit,
      'Triple tax advantage: deductible, tax-free growth, tax-free withdrawal for medical'
    );
  } else {
    addStep(
      'hsa',
      'Health Savings Account (HSA)',
      hsaLimit,
      'Triple tax advantage account',
      false,
      'Requires high-deductible health plan (HDHP) enrollment'
    );
  }
  
  // =====================================================
  // STEP 3: Roth IRA (Tax-Free Growth)
  // =====================================================
  const rothLimit = getContributionLimit('roth_ira', age);
  const rothEligibility = getRothEligibility(annualIncome, profileData.filing_status);
  
  if (rothEligibility.eligible && !rothEligibility.partial) {
    addStep(
      'roth_ira',
      'Roth IRA',
      rothLimit,
      'Tax-free growth, no RMDs, more flexibility than 401(k)'
    );
  } else if (rothEligibility.partial) {
    const partialLimit = Math.round(rothLimit * 0.5); // Simplified
    addStep(
      'roth_ira',
      'Roth IRA (Partial)',
      partialLimit,
      `Partial contribution allowed - ${rothEligibility.reason}`
    );
  } else {
    // Suggest backdoor Roth
    addStep(
      'backdoor_roth',
      'Backdoor Roth IRA',
      rothLimit,
      'Convert traditional IRA contributions to Roth for tax-free growth',
      annualIncome > ROTH_LIMITS[profileData.filing_status].end,
      rothEligibility.reason
    );
  }
  
  // =====================================================
  // STEP 4: Max 401(k) Beyond Match
  // =====================================================
  const total401kLimit = getContributionLimit('401k', age);
  const matchContribution = matchPct > 0 ? Math.round((annualIncome * matchPct) / 100) : 0;
  const additional401k = Math.max(0, total401kLimit - matchContribution);
  
  if (additional401k > 0) {
    addStep(
      '401k_max',
      '401(k) Beyond Match',
      additional401k,
      'Tax-deferred growth, reduces current taxable income'
    );
  }
  
  // =====================================================
  // STEP 5: Annuity (ONLY if criteria met - NOT BIASED)
  // =====================================================
  const annuityRec = productRecommendations.find(r => r.product === 'Annuity');
  const annuityFit = annuityRec?.fit || 'not_recommended';
  const hasIncomeGap = projection.gap_percentage > 20;
  const wantsGuaranteed = preferences.prefers_guaranteed_income;
  const goalIsGuaranteed = primaryGoal === 'secure_guaranteed_income';
  
  // Strict criteria for annuity recommendation
  const annuityMeetsCriteria = (
    annuityFit !== 'not_recommended' &&
    (wantsGuaranteed || goalIsGuaranteed) &&
    hasIncomeGap &&
    remainingMonthly >= 500 // Minimum meaningful contribution
  );
  
  if (annuityMeetsCriteria) {
    // Suggest portion of remaining savings, not a fixed amount
    const annuitySuggestion = Math.min(remainingMonthly * 0.3, 2000); // Max 30% or $2k/mo
    addStep(
      'annuity',
      'Fixed Index Annuity',
      Math.round(annuitySuggestion * 12),
      `Addresses ${Math.round(projection.gap_percentage)}% income gap with guaranteed lifetime income`
    );
  } else {
    let notApplicableReason = 'Does not currently meet suitability criteria: ';
    if (!hasIncomeGap) notApplicableReason += 'no significant income gap; ';
    if (!wantsGuaranteed && !goalIsGuaranteed) notApplicableReason += 'guaranteed income not primary goal; ';
    if (annuityFit === 'not_recommended') notApplicableReason += 'product fit analysis indicates poor match; ';
    
    addStep(
      'annuity',
      'Fixed Index Annuity',
      0,
      'Guaranteed lifetime income product',
      false,
      notApplicableReason.slice(0, -2)
    );
  }
  
  // =====================================================
  // STEP 6: IUL (ONLY if criteria met - NOT BIASED)
  // =====================================================
  const iulRec = productRecommendations.find(r => r.product === 'IUL');
  const iulFit = iulRec?.fit || 'not_recommended';
  const needsTaxDiversification = metrics.tax_bucket_never_pct < 15;
  const highIncome = annualIncome > 150000;
  const canCommit = preferences.can_commit_10yr_contributions;
  const openToTaxDiv = preferences.open_to_tax_diversification;
  const hasProtectionNeed = metrics.protection_gap > 100000;
  const goalIsProtection = primaryGoal === 'protect_family';
  const goalIsTaxFree = primaryGoal === 'maximize_tax_free';
  
  // Strict criteria for IUL recommendation
  const iulMeetsCriteria = (
    iulFit !== 'not_recommended' &&
    canCommit &&
    (needsTaxDiversification || hasProtectionNeed) &&
    (openToTaxDiv || goalIsProtection || goalIsTaxFree) &&
    highIncome &&
    remainingMonthly >= 500
  );
  
  if (iulMeetsCriteria) {
    const iulSuggestion = Math.min(remainingMonthly * 0.25, 1500); // Max 25% or $1.5k/mo
    addStep(
      'iul',
      'Indexed Universal Life (IUL)',
      Math.round(iulSuggestion * 12),
      `Provides ${hasProtectionNeed ? 'protection + ' : ''}tax-free retirement income (tax-free bucket at ${metrics.tax_bucket_never_pct}%)`
    );
  } else {
    let notApplicableReason = 'Does not currently meet suitability criteria: ';
    if (!highIncome) notApplicableReason += `income below $150k threshold (${formatCurrency(annualIncome)}); `;
    if (!canCommit) notApplicableReason += 'cannot commit to 10+ year contributions; ';
    if (!needsTaxDiversification && !hasProtectionNeed) notApplicableReason += 'tax-free bucket adequate and no protection gap; ';
    if (iulFit === 'not_recommended') notApplicableReason += 'product fit analysis indicates poor match; ';
    
    addStep(
      'iul',
      'Indexed Universal Life (IUL)',
      0,
      'Tax-free retirement income + permanent protection',
      false,
      notApplicableReason.slice(0, -2)
    );
  }
  
  // =====================================================
  // STEP 7: Taxable Brokerage (Remainder)
  // =====================================================
  if (remainingMonthly > 0) {
    addStep(
      'taxable',
      'Taxable Brokerage Account',
      remainingMonthly * 12,
      'Full liquidity, no contribution limits, flexible access before retirement'
    );
  }
  
  // =====================================================
  // Calculate Summary Metrics
  // =====================================================
  const allocatedMonthly = monthlySavingsCapacity - remainingMonthly;
  
  // Tax efficiency score: higher score = more tax-advantaged allocation
  const taxAdvantaged = waterfall
    .filter(s => s.is_applicable && ['401k_match', '401k_max', 'roth_ira', 'backdoor_roth', 'hsa', 'iul'].includes(s.vehicle))
    .reduce((sum, s) => sum + s.suggested_contribution, 0);
  const taxEfficiencyScore = allocatedMonthly > 0 
    ? Math.round((taxAdvantaged / allocatedMonthly) * 100)
    : 0;
  
  // Risk balance score: balance between growth and protection
  const protectionVehicles = waterfall
    .filter(s => s.is_applicable && ['annuity', 'iul'].includes(s.vehicle))
    .reduce((sum, s) => sum + s.suggested_contribution, 0);
  const protectionRatio = allocatedMonthly > 0 ? protectionVehicles / allocatedMonthly : 0;
  // Optimal is around 20-30% in protection for balanced goal
  const riskBalanceScore = Math.round(100 - Math.abs(0.25 - protectionRatio) * 200);
  
  // Generate rationale
  const rationale: string[] = [];
  if (matchPct > 0) {
    rationale.push(`Capture full ${matchPct}% employer match first for guaranteed 100% return`);
  }
  if (hsaEligible) {
    rationale.push('HSA provides triple tax advantage - prioritized for healthcare and retirement');
  }
  if (rothEligibility.eligible) {
    rationale.push('Roth IRA provides tax-free growth and more flexibility than traditional accounts');
  }
  if (taxEfficiencyScore > 70) {
    rationale.push(`${taxEfficiencyScore}% of savings in tax-advantaged accounts - excellent tax efficiency`);
  }
  
  // Disclaimers
  const disclaimers: string[] = [
    'This allocation is educational and based on general financial planning principles from leading advisors (Vanguard, Fidelity, CFP standards).',
    'Individual circumstances vary. Consult a licensed financial professional before making investment decisions.',
    'Contribution limits are for 2024 and may change annually.',
    'Insurance products involve costs, fees, and surrender charges. Review illustrations carefully.'
  ];
  
  return {
    savings_waterfall: waterfall,
    monthly_allocation_summary: {
      total_savings_capacity: monthlySavingsCapacity,
      allocated: allocatedMonthly,
      remaining: remainingMonthly
    },
    tax_efficiency_score: Math.max(0, Math.min(100, taxEfficiencyScore)),
    risk_balance_score: Math.max(0, Math.min(100, riskBalanceScore)),
    rationale,
    disclaimers
  };
}

// Helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =====================================================
// ALLOCATION SOURCES COMPUTATION
// Calculates available funds for IUL/Annuity allocation
// =====================================================

export interface AllocationSources {
  idle_checking_cash: number;
  old_401k_rollover: number;
  monthly_savings_capacity: number;
  total_available_for_allocation: number;
  suggested_iul_allocation: number;
  suggested_annuity_allocation: number;
}

/**
 * Compute available allocation sources for IUL and Annuity strategies
 * This helps clients understand what funds are available for optimization
 */
export function computeAllocationSources(
  incomeData: IncomeExpensesData,
  protectionGap: number,
  incomeGapMonthly: number,
  hasGuaranteedIncomeGap: boolean,
  annuityEligible: boolean,
  iulEligible: boolean
): AllocationSources {
  // Idle cash in checking (after expenses)
  const idleCash = incomeData.monthly_checking_balance || 0;
  
  // Old 401(k) rollover available
  const rolloverAvailable = incomeData.has_old_401k ? (incomeData.old_401k_balance || 0) : 0;
  
  // Monthly savings capacity
  const monthlySavingsCapacity = calculateMonthlySavingsCapacity(incomeData);
  
  // Total available = idle cash + rollover + annual savings capacity
  const annualSavingsCapacity = monthlySavingsCapacity * 12;
  const totalAvailable = idleCash + rolloverAvailable + annualSavingsCapacity;
  
  // Suggested allocations based on needs and eligibility
  let suggestedIUL = 0;
  let suggestedAnnuity = 0;
  
  // IUL suggestion: Based on protection gap and available cash
  // Rule of thumb: ~$1 of premium per $15 of death benefit needed (rough approximation)
  if (iulEligible && protectionGap > 0 && idleCash > 0) {
    const estimatedPremiumForGap = Math.round(protectionGap / 15);
    // Suggest the smaller of: estimated premium, 60% of idle cash, or $24,000/year
    suggestedIUL = Math.min(
      estimatedPremiumForGap,
      idleCash * 0.6,
      24000
    );
    // Ensure minimum meaningful contribution
    suggestedIUL = suggestedIUL >= 6000 ? suggestedIUL : 0;
  }
  
  // Annuity suggestion: Based on income gap and rollover availability
  if (annuityEligible && hasGuaranteedIncomeGap && rolloverAvailable > 0) {
    // Rule of thumb: ~$100K premium generates ~$5-7K/year income
    // For a monthly gap, calculate needed premium
    const annualGap = incomeGapMonthly * 12;
    const estimatedPremiumForIncome = Math.round(annualGap / 0.06); // ~6% payout rate
    
    // Suggest the smaller of: estimated premium, 40% of rollover, or $200K
    suggestedAnnuity = Math.min(
      estimatedPremiumForIncome,
      rolloverAvailable * 0.4,
      200000
    );
    // Ensure minimum meaningful contribution
    suggestedAnnuity = suggestedAnnuity >= 50000 ? suggestedAnnuity : 0;
  }
  
  return {
    idle_checking_cash: idleCash,
    old_401k_rollover: rolloverAvailable,
    monthly_savings_capacity: monthlySavingsCapacity,
    total_available_for_allocation: totalAvailable,
    suggested_iul_allocation: suggestedIUL,
    suggested_annuity_allocation: suggestedAnnuity
  };
}
