import {
  Plan529VsIulInputs,
  Plan529VsIulResult,
  RecommendationResult,
  AssumptionsSnapshot,
  InfiniteBankingResult,
} from '@/types/plan529VsIul';

// Return rate assumptions by risk tolerance
const RETURN_RATES_529: Record<string, number> = {
  conservative: 0.06,  // 6%
  balanced: 0.06,      // 6%
  growth: 0.06,        // 6%
};

// Fixed 6% IUL illustrated rate
const IUL_ILLUSTRATED_RATE = 0.06;

const PENALTY_RATE_529 = 0.10; // 10% penalty on earnings for non-qualified withdrawals
const IUL_INCOME_WITHDRAWAL_RATE = 0.05; // 5% sustainable withdrawal via policy loans
const IUL_INCOME_YEARS = 20; // Default years of income distribution

/**
 * Compute future value with monthly compounding
 * FV = PMT * [((1+r/12)^(12*years)-1)/(r/12)] + lump_sum*(1+r/12)^(12*years)
 */
function computeFutureValue(
  monthlyContribution: number,
  lumpSum: number,
  annualRate: number,
  years: number
): number {
  if (years <= 0) return lumpSum;
  if (annualRate === 0) {
    return monthlyContribution * years * 12 + lumpSum;
  }
  
  const r = annualRate / 12;
  const n = years * 12;
  const fvContributions = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
  const fvLumpSum = lumpSum * Math.pow(1 + r, n);
  return fvContributions + fvLumpSum;
}

/**
 * Compute total contributions over time
 */
function computeTotalContributions(
  monthlyContribution: number,
  lumpSum: number,
  years: number
): number {
  return monthlyContribution * years * 12 + lumpSum;
}

/**
 * Compute Roth rollover possible amount
 * - Max $35,000 lifetime
 * - Account must be open 15+ years
 * - Subject to annual Roth limits
 * - Beneficiary must have earned income
 */
function computeRothRollover(
  earnings529: number,
  inputs: Plan529VsIulInputs
): number {
  if (!inputs.considerRothRollover) return 0;
  if (!inputs.beneficiaryHasEarnedIncome) return 0;
  if (inputs.yearsAccountOpened < 15) return 0;
  
  // Years available for rollover (assuming max 5 years of rollovers)
  const yearsAvailable = Math.min(5, inputs.yearsAccountOpened - 15 + 1);
  const maxFromAnnualLimits = yearsAvailable * inputs.annualRothLimit;
  
  return Math.min(
    inputs.rothRolloverLimit,
    earnings529,
    maxFromAnnualLimits
  );
}

/**
 * Compute 529 non-qualified net after taxes and penalties
 */
function compute529NonQualifiedNet(
  grossValue: number,
  earnings: number,
  taxRate: number,
  penaltyRate: number
): { net: number; taxes: number; penalties: number } {
  const taxes = earnings * taxRate;
  const penalties = earnings * penaltyRate;
  return {
    net: grossValue - taxes - penalties,
    taxes,
    penalties,
  };
}

/**
 * Compute 529 mixed scenario net
 * Pro-rata split between qualified and non-qualified
 */
function compute529MixedNet(
  grossValue: number,
  totalContributed: number,
  percentEducation: number,
  taxRate: number,
  penaltyRate: number
): number {
  const earnings = Math.max(0, grossValue - totalContributed);
  const educationPortion = grossValue * (percentEducation / 100);
  const nonQualPortion = grossValue - educationPortion;
  
  // Earnings are proportionally split
  const earningsRatio = earnings / grossValue;
  const nonQualEarnings = nonQualPortion * earningsRatio;
  
  const taxOnNonQual = nonQualEarnings * taxRate;
  const penaltyOnNonQual = nonQualEarnings * penaltyRate;
  
  return grossValue - taxOnNonQual - penaltyOnNonQual;
}

/**
 * Compute IUL accessible amount based on loan-to-value ratio
 */
function computeIulAccessible(
  cashValueGross: number,
  maxLoanRatio: number
): { accessible: number; riskFlag: boolean } {
  const accessible = cashValueGross * maxLoanRatio;
  const riskFlag = maxLoanRatio > 0.90;
  return { accessible, riskFlag };
}

/**
 * Compute Infinite Banking income projections for IUL
 */
function computeInfiniteBanking(
  cashValueAtStart: number
): InfiniteBankingResult {
  // Sustainable income = 5% of cash value annually via policy loans
  const annualIncome = cashValueAtStart * IUL_INCOME_WITHDRAWAL_RATE;
  const totalIncome = annualIncome * IUL_INCOME_YEARS;
  
  // Cash value after income phase (simplified model)
  // Cash value grows at 6%, loans accrue at ~5%, net ~1% growth
  const netGrowthDuringIncome = 0.01;
  const cashValueAfterIncome = cashValueAtStart * Math.pow(1 + netGrowthDuringIncome, IUL_INCOME_YEARS);
  
  return {
    iulAnnualIncomeAvailable: annualIncome,
    iulIncomeYears: IUL_INCOME_YEARS,
    iulTotalIncomeProjected: totalIncome,
    iulCashValueAfterIncome: cashValueAfterIncome,
    can529GenerateIncome: false,
    reason529CannotDoIB: '529 funds must be spent on qualified education or face 10% penalty + taxes. Cannot be used as a family bank for ongoing tax-free income.',
  };
}

/**
 * Generate recommendation based on inputs and results
 */
function computeRecommendation(
  inputs: Plan529VsIulInputs,
  totalContributed: number
): RecommendationResult {
  const { educationProbability, liquidityNeed, nonTraditionalPath, scholarshipLikely, goals } = inputs;
  
  const whyBullets: string[] = [];
  const considerations: string[] = [];
  
  let primaryRecommendation: '529_first' | 'iul_consideration' | 'hybrid';
  let confidenceLevel: 'high' | 'medium' | 'low';
  
  // Rule 1: High education certainty + low flex need → 529 first
  if (educationProbability >= 75 && liquidityNeed === 'low' && !nonTraditionalPath) {
    primaryRecommendation = '529_first';
    confidenceLevel = educationProbability >= 90 ? 'high' : 'medium';
    
    whyBullets.push('High probability of using funds for qualified education');
    whyBullets.push('529 offers tax-free growth for education expenses');
    whyBullets.push('Lower flexibility need reduces 529 penalty risk');
    
    if (inputs.stateTaxBenefitEnabled && totalContributed > 0) {
      whyBullets.push(`State tax benefit adds ${((inputs.stateTaxBenefitAmount / totalContributed) * 100).toFixed(1)}% effective return`);
    }
    
    considerations.push('Non-qualified withdrawals still face taxes + 10% penalty');
    considerations.push('Limited to education expenses for tax-free treatment');
  }
  // Rule 2: Low education certainty OR high flex need → IUL consideration
  else if (educationProbability <= 50 || nonTraditionalPath || liquidityNeed === 'high') {
    primaryRecommendation = 'iul_consideration';
    confidenceLevel = liquidityNeed === 'high' ? 'high' : 'medium';
    
    if (educationProbability <= 50) {
      whyBullets.push('Education probability is uncertain—flexibility is valuable');
    }
    if (nonTraditionalPath) {
      whyBullets.push('Non-traditional education path may not qualify for 529 benefits');
    }
    if (liquidityNeed === 'high') {
      whyBullets.push('High liquidity need favors IUL\'s flexible access via policy loans');
    }
    if (scholarshipLikely) {
      whyBullets.push('Scholarship potential reduces need for education-specific savings');
    }
    if (goals.includes('legacy')) {
      whyBullets.push('IUL provides death benefit for legacy planning');
    }
    if (goals.includes('flex_savings')) {
      whyBullets.push('IUL can serve as a "family bank" for multiple goals');
    }
    
    considerations.push('IUL requires proper design to maximize cash value');
    considerations.push('Policy loans accrue interest and can cause lapse if mismanaged');
    considerations.push('Underwriting required—costs vary by health');
  }
  // Rule 3: Mid-range → Hybrid approach
  else {
    primaryRecommendation = 'hybrid';
    confidenceLevel = 'medium';
    
    whyBullets.push('Moderate education certainty suggests diversified approach');
    whyBullets.push('Fund 529 up to expected education cost for tax efficiency');
    whyBullets.push('Place excess savings in IUL for flexibility and legacy');
    
    if (inputs.considerRothRollover) {
      whyBullets.push('Roth rollover can rescue some 529 overfunding (limited to $35k)');
    }
    
    considerations.push('More complex to manage two accounts');
    considerations.push('Requires monitoring education cost projections');
  }
  
  // Add Roth rollover consideration if applicable
  if (inputs.considerRothRollover && educationProbability < 90) {
    considerations.push('Roth rollover cap of $35k limits rescue of large overfunding');
  }
  
  // Generate summary
  const summaryMap = {
    '529_first': 'Based on your high education certainty and low flexibility needs, a 529 plan is likely your best primary vehicle for education savings.',
    'iul_consideration': 'Given the uncertainty around education use and/or your need for flexibility, a properly designed IUL may offer advantages worth considering.',
    'hybrid': 'A balanced approach—funding a 529 for expected education costs while using IUL for additional flexibility—may best serve your goals.',
  };
  
  return {
    primaryRecommendation,
    confidenceLevel,
    whyBullets: whyBullets.slice(0, 5),
    considerations: considerations.slice(0, 3),
    summary: summaryMap[primaryRecommendation],
  };
}

/**
 * Main comparison calculation function
 */
export function compute529VsIulComparison(inputs: Plan529VsIulInputs): Plan529VsIulResult {
  const return529 = RETURN_RATES_529[inputs.riskTolerance];
  const returnIulNet = IUL_ILLUSTRATED_RATE; // Fixed 6%
  
  // Calculate total contributions
  const totalContributed = computeTotalContributions(
    inputs.monthlyContribution,
    inputs.initialLumpSum,
    inputs.yearsToGoal
  );
  
  // Inflation-adjusted contributions (for reference)
  const inflationFactor = Math.pow(1 + inputs.inflationAssumption, inputs.yearsToGoal);
  const totalContributedInflationAdjusted = totalContributed / inflationFactor;
  
  // 529 gross future value
  const fv529Gross = computeFutureValue(
    inputs.monthlyContribution,
    inputs.initialLumpSum,
    return529,
    inputs.yearsToGoal
  );
  
  // 529 earnings
  const earnings529 = Math.max(0, fv529Gross - totalContributed);
  
  // State tax benefit
  const stateTaxBenefit = inputs.stateTaxBenefitEnabled 
    ? inputs.stateTaxBenefitAmount * inputs.yearsToGoal 
    : 0;
  
  // 529 Education scenario (tax-free)
  const fv529EducationNet = fv529Gross + stateTaxBenefit;
  
  // 529 Non-qualified scenario
  const nonQualResult = compute529NonQualifiedNet(
    fv529Gross,
    earnings529,
    inputs.federalTaxBracket,
    PENALTY_RATE_529
  );
  const fv529NonQualifiedNet = nonQualResult.net;
  
  // 529 Mixed scenario
  const fv529MixedNet = compute529MixedNet(
    fv529Gross,
    totalContributed,
    inputs.percentUsedForEducation,
    inputs.federalTaxBracket,
    PENALTY_RATE_529
  );
  
  // Roth rollover calculation
  const rothRolloverPossible = computeRothRollover(earnings529, inputs);
  
  // Remaining non-qualified after Roth rollover
  const earningsAfterRollover = earnings529 - rothRolloverPossible;
  const taxesAfterRollover = earningsAfterRollover * inputs.federalTaxBracket;
  const penaltiesAfterRollover = earningsAfterRollover * PENALTY_RATE_529;
  const remainingNonQualified = fv529Gross - taxesAfterRollover - penaltiesAfterRollover;
  
  // IUL gross cash value projection
  const fvIulCashValueGross = computeFutureValue(
    inputs.monthlyContribution,
    inputs.initialLumpSum,
    returnIulNet,
    inputs.yearsToGoal
  );
  
  // IUL accessible amount
  const iulResult = computeIulAccessible(fvIulCashValueGross, inputs.maxLoanToValueRatio);
  
  // Compute Infinite Banking income projections
  const infiniteBanking = computeInfiniteBanking(fvIulCashValueGross);
  
  // Generate recommendation
  const recommendation = computeRecommendation(
    inputs,
    totalContributed
  );
  
  // Assumptions snapshot for audit
  const assumptionsUsed: AssumptionsSnapshot = {
    return529,
    returnIulNet,
    inflation: inputs.inflationAssumption,
    years: inputs.yearsToGoal,
    penaltyRate: PENALTY_RATE_529,
    federalTaxRate: inputs.federalTaxBracket,
  };
  
  return {
    totalContributed,
    totalContributedInflationAdjusted,
    fv529Gross,
    fv529EducationNet,
    fv529NonQualifiedNet,
    fv529MixedNet,
    earnings529,
    stateTaxBenefit,
    fvIulCashValueGross,
    fvIulAccessible: iulResult.accessible,
    policyLoanRiskFlag: iulResult.riskFlag,
    rothRolloverPossible,
    remainingNonQualified,
    infiniteBanking,
    recommendation,
    assumptionsUsed,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
