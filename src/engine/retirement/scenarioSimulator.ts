// Scenario Comparison Simulator
// Computes "Current Path" vs "Optimized Strategy" projections
// DETERMINISTIC - No AI, pure math

import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData, 
  ComputedMetrics,
  ProtectionHealthData,
  PlanningReadinessData
} from '@/types/financial';

import type { 
  RetirementPreferencesData, 
  RetirementProjection,
  ScenarioProjection,
  ScenarioComparison,
  YearlyProjection
} from '@/types/retirement';

import { 
  RETURN_ASSUMPTIONS, 
  INFLATION_ASSUMPTIONS,
  WITHDRAWAL_RATES,
  TAX_ASSUMPTIONS,
  LIFE_EXPECTANCY
} from './assumptions';

import { getCurrentAge, getYearsToRetirement, futureValue } from './projection';

// ============================================
// CONSTANTS
// ============================================

const IUL_ILLUSTRATED_RATE = 0.055; // Conservative 5.5% illustrated rate
const IUL_LOAN_RATE = 0.05; // Assumed wash loan rate
const IUL_DEATH_BENEFIT_MULTIPLE = 8; // DB = 8x annual premium typical
const FIA_INCOME_RIDER_RATE = 0.055; // 5.5% benefit base growth
const FIA_PAYOUT_RATE = 0.05; // 5% of benefit base at activation
const RMD_START_AGE = 73;

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateRMD(balance: number, age: number): number {
  // Simplified RMD table (uniform lifetime table approximation)
  if (age < RMD_START_AGE) return 0;
  const divisor = Math.max(1, 27.4 - (age - 72) * 0.9);
  return balance / divisor;
}

function calculateTaxOnWithdrawal(amount: number, marginalRate: number): number {
  return amount * marginalRate;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// SCENARIO A: CURRENT PATH (STATUS QUO)
// ============================================

function simulateScenarioA(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  assets: AssetFormData[],
  preferences: RetirementPreferencesData,
  projection: RetirementProjection
): ScenarioProjection {
  const currentAge = getCurrentAge(profileData.dob);
  const retirementAge = profileData.retirement_age || 65;
  const yearsToRetirement = getYearsToRetirement(profileData.dob, retirementAge);
  const planToAge = LIFE_EXPECTANCY.CONSERVATIVE; // Plan to 95
  
  // Calculate tax-deferred percentage
  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const taxDeferredAssets = assets
    .filter(a => a.tax_wrapper === 'TAX_LATER')
    .reduce((sum, a) => sum + a.current_value, 0);
  const taxDeferredPct = totalAssets > 0 ? taxDeferredAssets / totalAssets : 0.6;
  
  const marginalRate = TAX_ASSUMPTIONS.MARGINAL_RATE_DEFAULT;
  const returnRate = RETURN_ASSUMPTIONS.BASE;
  
  // Portfolio at retirement
  const portfolioAtRetirement = projection.projected_portfolio_at_retirement;
  
  // Simulate year-by-year from retirement to age 95
  const yearlyProjections: YearlyProjection[] = [];
  let portfolioBalance = portfolioAtRetirement;
  let lifetimeTaxes = 0;
  let moneyRunsOutAge: number | null = null;
  
  // Guaranteed income (no tax-free)
  const guaranteedMonthly = projection.income_sources.social_security + 
                            projection.income_sources.pension;
  
  // Target withdrawal
  const targetIncome = projection.monthly_income_target;
  const neededFromPortfolio = Math.max(0, targetIncome - guaranteedMonthly);
  
  for (let age = retirementAge; age <= planToAge; age++) {
    const year = age - retirementAge + 1;
    
    // RMD calculation (forced distribution from tax-deferred portion)
    const taxDeferredBalance = portfolioBalance * taxDeferredPct;
    const rmd = calculateRMD(taxDeferredBalance, age);
    
    // Withdrawal: max of RMD or needed income
    const annualNeed = neededFromPortfolio * 12;
    const withdrawal = Math.max(rmd, Math.min(annualNeed, portfolioBalance));
    
    // Taxes on withdrawal (all taxable)
    const taxesThisYear = calculateTaxOnWithdrawal(withdrawal, marginalRate);
    lifetimeTaxes += taxesThisYear;
    
    // Update portfolio
    portfolioBalance = portfolioBalance - withdrawal;
    if (portfolioBalance > 0) {
      portfolioBalance = portfolioBalance * (1 + returnRate);
    }
    
    // Check depletion
    if (portfolioBalance <= 0 && moneyRunsOutAge === null) {
      moneyRunsOutAge = age;
      portfolioBalance = 0;
    }
    
    const netIncome = (guaranteedMonthly * 12) + withdrawal - taxesThisYear;
    
    yearlyProjections.push({
      age,
      year,
      portfolio_value: Math.max(0, portfolioBalance),
      total_income: netIncome,
      taxes_paid: taxesThisYear,
      withdrawal_amount: withdrawal
    });
  }
  
  // Calculate final values
  const proj90 = yearlyProjections.find(p => p.age === 90);
  const proj95 = yearlyProjections.find(p => p.age === 95);
  
  // Gross vs Net income calculation
  const annualWithdrawal = neededFromPortfolio * 12;
  const annualTax = calculateTaxOnWithdrawal(annualWithdrawal, marginalRate);
  const grossMonthly = guaranteedMonthly + neededFromPortfolio;
  const netMonthly = guaranteedMonthly + neededFromPortfolio - (annualTax / 12);
  
  return {
    scenario_name: 'Current Path',
    scenario_description: 'Continue current strategy with 401(k)/IRA contributions. All retirement income comes from taxable withdrawals.',
    retirement_income_gross: grossMonthly,
    retirement_income_net: netMonthly,
    lifetime_taxes_paid: lifetimeTaxes,
    has_guaranteed_income: guaranteedMonthly > 0,
    has_tax_free_income: false,
    money_runs_out_age: moneyRunsOutAge,
    portfolio_at_retirement: portfolioAtRetirement,
    legacy_value_at_90: proj90?.portfolio_value || 0,
    legacy_value_at_95: proj95?.portfolio_value || 0,
    market_risk_exposure: 'high',
    income_sources: {
      social_security: projection.income_sources.social_security,
      pension: projection.income_sources.pension,
      portfolio_withdrawal: neededFromPortfolio,
      iul_loans: 0,
      annuity_income: 0,
      part_time: projection.income_sources.part_time
    },
    yearly_projections: yearlyProjections
  };
}

// ============================================
// SCENARIO B: OPTIMIZED STRATEGY
// ============================================

function simulateScenarioB(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  assets: AssetFormData[],
  preferences: RetirementPreferencesData,
  projection: RetirementProjection,
  metrics: ComputedMetrics,
  protectionData: ProtectionHealthData,
  planningReadiness: PlanningReadinessData
): ScenarioProjection & { includesIUL: boolean; includesAnnuity: boolean; iulReason?: string; annuityReason?: string } {
  const currentAge = getCurrentAge(profileData.dob);
  const retirementAge = profileData.retirement_age || 65;
  const yearsToRetirement = getYearsToRetirement(profileData.dob, retirementAge);
  const planToAge = LIFE_EXPECTANCY.CONSERVATIVE;
  
  const monthlyIncome = (incomeData.w2_income || 0) + (incomeData.business_income || 0);
  const annualIncome = monthlyIncome * 12;
  const marginalRate = TAX_ASSUMPTIONS.MARGINAL_RATE_DEFAULT;
  const returnRate = RETURN_ASSUMPTIONS.BASE;
  
  // ============================================
  // DETERMINE IF IUL SHOULD BE INCLUDED
  // ============================================
  let includesIUL = false;
  let iulReason: string | undefined;
  let iulAllocationPercent = 0;
  let iulAnnualPremium = 0;
  
  const taxDeferredPct = metrics.tax_bucket_later_pct || 0;
  const taxFreePct = metrics.tax_bucket_never_pct || 0;
  const highTaxBracket = ['24', '32', '35+'].includes(planningReadiness.current_tax_bracket || '');
  const wantsTaxFree = planningReadiness.wants_tax_free_bucket;
  const hasLegacyPriority = planningReadiness.legacy_priority === 'high';
  const hasProtectionGap = metrics.protection_gap > 50000;
  
  // IUL inclusion logic
  if (
    (taxDeferredPct > 60 || taxFreePct < 20) ||
    highTaxBracket ||
    wantsTaxFree ||
    hasLegacyPriority ||
    hasProtectionGap
  ) {
    includesIUL = true;
    iulAllocationPercent = 12; // 12% of contributions reallocated
    iulAnnualPremium = preferences.annual_retirement_contribution * (iulAllocationPercent / 100);
    
    // Build reason
    const reasons: string[] = [];
    if (taxDeferredPct > 60) reasons.push('over 60% in tax-deferred accounts');
    if (taxFreePct < 20) reasons.push('under 20% in tax-free vehicles');
    if (highTaxBracket) reasons.push('high tax bracket');
    if (wantsTaxFree) reasons.push('preference for tax-free income');
    if (hasLegacyPriority) reasons.push('legacy priority');
    if (hasProtectionGap) reasons.push('protection gap');
    
    iulReason = `IUL included because: ${reasons.slice(0, 2).join(', ')}`;
  }
  
  // ============================================
  // DETERMINE IF ANNUITY SHOULD BE INCLUDED
  // ============================================
  let includesAnnuity = false;
  let annuityReason: string | undefined;
  let annuityAllocationPercent = 0;
  let annuityPremium = 0;
  
  const prefersGuaranteed = protectionData.prefers_guaranteed_income || false;
  const hasIncomeGap = projection.gap_percentage > 15;
  const nearRetirement = yearsToRetirement <= 10;
  const sequenceRiskHigh = planningReadiness.sequence_risk_concern === 'high';
  
  const guaranteedIncome = projection.income_sources.social_security + projection.income_sources.pension;
  const fixedExpenses = incomeData.fixed_expenses || (projection.monthly_income_target * 0.6);
  const guaranteedCoverageRatio = fixedExpenses > 0 ? guaranteedIncome / fixedExpenses : 1;
  const lowGuaranteedCoverage = guaranteedCoverageRatio < 0.7;
  
  // Annuity inclusion logic
  if (
    prefersGuaranteed ||
    (hasIncomeGap && nearRetirement) ||
    sequenceRiskHigh ||
    lowGuaranteedCoverage
  ) {
    includesAnnuity = true;
    annuityAllocationPercent = 15; // 15% of retirement assets to FIA
    annuityPremium = projection.projected_portfolio_at_retirement * (annuityAllocationPercent / 100);
    
    const reasons: string[] = [];
    if (prefersGuaranteed) reasons.push('prefers guaranteed income');
    if (hasIncomeGap) reasons.push(`${Math.round(projection.gap_percentage)}% income gap`);
    if (sequenceRiskHigh) reasons.push('high sequence risk concern');
    if (lowGuaranteedCoverage) reasons.push('low guaranteed income coverage');
    
    annuityReason = `Annuity included because: ${reasons.slice(0, 2).join(', ')}`;
  }
  
  // ============================================
  // CALCULATE OPTIMIZED PROJECTIONS
  // ============================================
  
  // IUL projections
  let iulCashValueAtRetirement = 0;
  let iulTaxFreeIncome = 0;
  let iulDeathBenefit = 0;
  
  if (includesIUL && yearsToRetirement > 0) {
    // Cash value accumulation (conservative illustrated rate)
    for (let year = 0; year < yearsToRetirement; year++) {
      iulCashValueAtRetirement = (iulCashValueAtRetirement + iulAnnualPremium) * (1 + IUL_ILLUSTRATED_RATE);
    }
    
    // Tax-free income via loans (80% of cash value over 20 years)
    const loanableValue = iulCashValueAtRetirement * 0.80;
    const retirementYears = 20;
    iulTaxFreeIncome = loanableValue / retirementYears / 12; // Monthly
    
    // Death benefit
    iulDeathBenefit = iulAnnualPremium * IUL_DEATH_BENEFIT_MULTIPLE * yearsToRetirement / 10;
    iulDeathBenefit = Math.max(iulDeathBenefit, iulCashValueAtRetirement * 1.5);
  }
  
  // Annuity projections
  let annuityGuaranteedIncome = 0;
  
  if (includesAnnuity) {
    // FIA with income rider: benefit base grows, then payout at 5%
    let benefitBase = annuityPremium;
    const growthYears = Math.min(yearsToRetirement, 10); // Cap at 10 years of growth
    benefitBase = benefitBase * Math.pow(1 + FIA_INCOME_RIDER_RATE, growthYears);
    annuityGuaranteedIncome = (benefitBase * FIA_PAYOUT_RATE) / 12; // Monthly
  }
  
  // Adjusted portfolio (after IUL/FIA allocations)
  const iulContributionReduction = includesIUL ? preferences.annual_retirement_contribution * (iulAllocationPercent / 100) : 0;
  const adjustedAnnualContribution = preferences.annual_retirement_contribution - iulContributionReduction;
  
  // Recalculate portfolio with reduced 401k contributions
  let portfolioAtRetirement = projection.projected_portfolio_at_retirement;
  if (includesIUL) {
    // Reduce future portfolio by redirected IUL premiums growth
    const iulRedirection = iulAnnualPremium * ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
    portfolioAtRetirement = portfolioAtRetirement - iulRedirection;
  }
  
  // Reduce portfolio by FIA allocation at retirement
  if (includesAnnuity) {
    portfolioAtRetirement = portfolioAtRetirement - annuityPremium;
  }
  
  // Simulate year-by-year
  const yearlyProjections: YearlyProjection[] = [];
  let portfolioBalance = portfolioAtRetirement;
  let lifetimeTaxes = 0;
  let moneyRunsOutAge: number | null = null;
  
  const guaranteedMonthly = projection.income_sources.social_security + 
                            projection.income_sources.pension +
                            annuityGuaranteedIncome;
  
  const taxFreeMonthly = iulTaxFreeIncome;
  
  const targetIncome = projection.monthly_income_target;
  const neededFromPortfolio = Math.max(0, targetIncome - guaranteedMonthly - taxFreeMonthly);
  
  // Lower tax-deferred percentage due to IUL allocation
  const adjustedTaxDeferredPct = includesIUL ? (taxDeferredPct / 100) * 0.85 : (taxDeferredPct / 100);
  
  for (let age = retirementAge; age <= planToAge; age++) {
    const year = age - retirementAge + 1;
    
    const taxDeferredBalance = portfolioBalance * adjustedTaxDeferredPct;
    const rmd = calculateRMD(taxDeferredBalance, age);
    
    const annualNeed = neededFromPortfolio * 12;
    const withdrawal = Math.max(rmd, Math.min(annualNeed, portfolioBalance));
    
    // Taxes only on portfolio withdrawal (not IUL loans or Roth)
    const taxableWithdrawal = withdrawal * adjustedTaxDeferredPct;
    const taxesThisYear = calculateTaxOnWithdrawal(taxableWithdrawal, marginalRate);
    lifetimeTaxes += taxesThisYear;
    
    portfolioBalance = portfolioBalance - withdrawal;
    if (portfolioBalance > 0) {
      portfolioBalance = portfolioBalance * (1 + returnRate);
    }
    
    if (portfolioBalance <= 0 && moneyRunsOutAge === null) {
      moneyRunsOutAge = age;
      portfolioBalance = 0;
    }
    
    const netIncome = (guaranteedMonthly * 12) + (taxFreeMonthly * 12) + withdrawal - taxesThisYear;
    
    yearlyProjections.push({
      age,
      year,
      portfolio_value: Math.max(0, portfolioBalance),
      total_income: netIncome,
      taxes_paid: taxesThisYear,
      withdrawal_amount: withdrawal
    });
  }
  
  const proj90 = yearlyProjections.find(p => p.age === 90);
  const proj95 = yearlyProjections.find(p => p.age === 95);
  
  // Add IUL death benefit to legacy
  const legacyAt90 = (proj90?.portfolio_value || 0) + (includesIUL ? iulDeathBenefit : 0);
  const legacyAt95 = (proj95?.portfolio_value || 0) + (includesIUL ? iulDeathBenefit : 0);
  
  // Gross vs Net income
  const grossMonthly = guaranteedMonthly + taxFreeMonthly + neededFromPortfolio;
  const annualTax = calculateTaxOnWithdrawal(neededFromPortfolio * 12 * adjustedTaxDeferredPct, marginalRate);
  const netMonthly = grossMonthly - (annualTax / 12);
  
  // Market risk assessment
  let marketRisk: 'high' | 'moderate' | 'low' = 'high';
  if (includesAnnuity && includesIUL) {
    marketRisk = 'low';
  } else if (includesAnnuity || includesIUL) {
    marketRisk = 'moderate';
  }
  
  return {
    scenario_name: 'Optimized Strategy',
    scenario_description: includesIUL && includesAnnuity
      ? 'Tax-efficient strategy with IUL for tax-free income and FIA for guaranteed income floor.'
      : includesIUL
        ? 'Tax-efficient strategy introducing IUL for tax-free retirement income and legacy.'
        : includesAnnuity
          ? 'Income-focused strategy with FIA for guaranteed lifetime income.'
          : 'Optimized allocation with improved tax diversification.',
    retirement_income_gross: grossMonthly,
    retirement_income_net: netMonthly,
    lifetime_taxes_paid: lifetimeTaxes,
    has_guaranteed_income: guaranteedMonthly > (projection.income_sources.social_security + projection.income_sources.pension),
    has_tax_free_income: includesIUL,
    money_runs_out_age: moneyRunsOutAge,
    portfolio_at_retirement: portfolioAtRetirement,
    legacy_value_at_90: legacyAt90,
    legacy_value_at_95: legacyAt95,
    market_risk_exposure: marketRisk,
    iul_allocation_percent: includesIUL ? iulAllocationPercent : undefined,
    iul_annual_premium: includesIUL ? iulAnnualPremium : undefined,
    iul_projected_cash_value: includesIUL ? iulCashValueAtRetirement : undefined,
    iul_tax_free_income: includesIUL ? iulTaxFreeIncome : undefined,
    iul_death_benefit: includesIUL ? iulDeathBenefit : undefined,
    annuity_allocation_percent: includesAnnuity ? annuityAllocationPercent : undefined,
    annuity_premium: includesAnnuity ? annuityPremium : undefined,
    annuity_guaranteed_income: includesAnnuity ? annuityGuaranteedIncome : undefined,
    income_sources: {
      social_security: projection.income_sources.social_security,
      pension: projection.income_sources.pension,
      portfolio_withdrawal: neededFromPortfolio,
      iul_loans: iulTaxFreeIncome,
      annuity_income: annuityGuaranteedIncome,
      part_time: projection.income_sources.part_time
    },
    yearly_projections: yearlyProjections,
    includesIUL,
    includesAnnuity,
    iulReason,
    annuityReason
  };
}

// ============================================
// PLAIN-ENGLISH SUMMARY GENERATOR
// ============================================

function generatePlainEnglishSummary(
  scenarioA: ScenarioProjection,
  scenarioB: ScenarioProjection,
  includesIUL: boolean,
  includesAnnuity: boolean
): string {
  const parts: string[] = [];
  
  // Opening statement
  parts.push(
    "If you continue with your current strategy, your retirement income is highly dependent on market performance and taxable withdrawals."
  );
  
  // Comparison
  const incomeImprovement = scenarioB.retirement_income_net - scenarioA.retirement_income_net;
  const taxSavings = scenarioA.lifetime_taxes_paid - scenarioB.lifetime_taxes_paid;
  
  if (incomeImprovement > 0) {
    parts.push(
      `The optimized strategy could provide approximately ${formatCurrency(incomeImprovement)} more per month in net retirement income.`
    );
  }
  
  if (taxSavings > 100000) {
    parts.push(
      `Over your retirement, this approach may reduce your lifetime tax burden by approximately ${formatCurrency(taxSavings)}.`
    );
  }
  
  // Strategy explanation
  if (includesIUL && includesAnnuity) {
    parts.push(
      "By introducing a tax-free income bucket through IUL and securing guaranteed income through an annuity, your retirement becomes more predictable, tax-efficient, and resilient—even if markets underperform."
    );
  } else if (includesIUL) {
    parts.push(
      "By introducing a tax-free income bucket through IUL, you reduce future tax exposure and create a more diversified income stream that isn't fully dependent on market returns."
    );
  } else if (includesAnnuity) {
    parts.push(
      "By securing guaranteed income through a fixed indexed annuity, you create an income floor that cannot be outlived, reducing the risk of running out of money in retirement."
    );
  }
  
  // Legacy note
  if (scenarioB.legacy_value_at_90 > scenarioA.legacy_value_at_90 * 1.2) {
    parts.push(
      "Additionally, the optimized strategy may leave a larger legacy for your heirs."
    );
  }
  
  return parts.join(' ');
}

// ============================================
// PRODUCT POSITIONING (SOFT, NON-SALESY)
// ============================================

function generateProductPositioning(
  includesIUL: boolean,
  includesAnnuity: boolean,
  scenarioB: ScenarioProjection
): { iul_explanation?: string; annuity_explanation?: string } {
  const result: { iul_explanation?: string; annuity_explanation?: string } = {};
  
  if (includesIUL) {
    result.iul_explanation = 
      "This strategy introduces a tax-free income asset to reduce future tax risk. " +
      "The IUL component provides:\n" +
      "• Tax-deferred growth with downside protection\n" +
      "• Tax-free policy loans in retirement (no RMDs)\n" +
      `• Projected monthly tax-free income of ${formatCurrency(scenarioB.iul_tax_free_income || 0)}\n` +
      `• Income-tax-free death benefit of approximately ${formatCurrency(scenarioB.iul_death_benefit || 0)} for legacy\n\n` +
      "This is not a recommendation to buy IUL—it's a demonstration of how tax diversification may improve your retirement outcomes.";
  }
  
  if (includesAnnuity) {
    result.annuity_explanation = 
      "This strategy introduces a guaranteed income floor to hedge longevity risk. " +
      "The Fixed Indexed Annuity component provides:\n" +
      "• Guaranteed lifetime income that cannot be outlived\n" +
      `• Projected monthly guaranteed income of ${formatCurrency(scenarioB.annuity_guaranteed_income || 0)}\n` +
      "• Protection against market downturns in early retirement (sequence risk)\n" +
      "• Peace of mind knowing essential expenses are covered\n\n" +
      "This is scenario modeling, not product advice—consult with a licensed professional to discuss suitability.";
  }
  
  return result;
}

// ============================================
// ADVISOR SUMMARY (INTERNAL)
// ============================================

function generateAdvisorSummary(
  includesIUL: boolean,
  includesAnnuity: boolean,
  iulReason?: string,
  annuityReason?: string,
  metrics?: ComputedMetrics
): {
  iul_included_reason?: string;
  annuity_included_reason?: string;
  client_objections: string[];
  conversation_focus: string[];
} {
  const objections: string[] = [];
  const focus: string[] = [];
  
  if (includesIUL) {
    objections.push("IUL fees are too high—show net illustrated returns after costs");
    objections.push("I don't trust insurance products—emphasize tax code benefits, not product features");
    objections.push("I want liquidity—explain 10-15 year accumulation before accessing via loans");
    focus.push("Tax diversification story: Show current tax bucket imbalance");
    focus.push("Compare illustrated IUL income to equivalent taxable portfolio withdrawal");
  }
  
  if (includesAnnuity) {
    objections.push("I lose control of my money—explain 10% annual free withdrawal and income rider");
    objections.push("Annuity returns are low—compare to bond allocation risk-adjusted returns");
    objections.push("I might die early—discuss joint-life options and return of premium riders");
    focus.push("Essential expenses coverage: Show gap between guaranteed income and fixed costs");
    focus.push("Sequence risk story: Illustrate 2008-style scenario impact on withdrawal strategy");
  }
  
  if (!includesIUL && !includesAnnuity) {
    focus.push("Current strategy appears adequate—discuss monitoring and adjustment triggers");
    focus.push("Consider revisiting when closer to retirement or if circumstances change");
  }
  
  return {
    iul_included_reason: iulReason,
    annuity_included_reason: annuityReason,
    client_objections: objections,
    conversation_focus: focus
  };
}

// ============================================
// MAIN EXPORT: COMPUTE SCENARIO COMPARISON
// ============================================

export function computeScenarioComparison(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  assets: AssetFormData[],
  preferences: RetirementPreferencesData,
  projection: RetirementProjection,
  metrics: ComputedMetrics,
  protectionData: ProtectionHealthData,
  planningReadiness: PlanningReadinessData
): ScenarioComparison {
  // Simulate Scenario A (Current Path)
  const scenarioA = simulateScenarioA(
    profileData,
    incomeData,
    assets,
    preferences,
    projection
  );
  
  // Simulate Scenario B (Optimized Strategy)
  const scenarioBResult = simulateScenarioB(
    profileData,
    incomeData,
    assets,
    preferences,
    projection,
    metrics,
    protectionData,
    planningReadiness
  );
  
  const { includesIUL, includesAnnuity, iulReason, annuityReason, ...scenarioB } = scenarioBResult;
  
  // Calculate comparison metrics
  const incomeImprovementMonthly = scenarioB.retirement_income_net - scenarioA.retirement_income_net;
  const incomeImprovementPercent = scenarioA.retirement_income_net > 0
    ? (incomeImprovementMonthly / scenarioA.retirement_income_net) * 100
    : 0;
  const taxSavingsLifetime = scenarioA.lifetime_taxes_paid - scenarioB.lifetime_taxes_paid;
  
  const longevityA = scenarioA.money_runs_out_age || 95;
  const longevityB = scenarioB.money_runs_out_age || 95;
  const longevityImprovement = longevityB - longevityA;
  
  const legacyImprovement = scenarioB.legacy_value_at_90 - scenarioA.legacy_value_at_90;
  const marketRiskReduction = 
    (scenarioA.market_risk_exposure === 'high' && scenarioB.market_risk_exposure !== 'high') ||
    (scenarioA.market_risk_exposure === 'moderate' && scenarioB.market_risk_exposure === 'low');
  
  // Generate summaries
  const plainEnglishSummary = generatePlainEnglishSummary(scenarioA, scenarioB, includesIUL, includesAnnuity);
  const productPositioning = generateProductPositioning(includesIUL, includesAnnuity, scenarioB);
  const advisorSummary = generateAdvisorSummary(includesIUL, includesAnnuity, iulReason, annuityReason, metrics);
  
  return {
    scenario_a: scenarioA,
    scenario_b: scenarioB,
    comparison_metrics: {
      income_improvement_percent: Math.max(0, incomeImprovementPercent),
      income_improvement_monthly: Math.max(0, incomeImprovementMonthly),
      tax_savings_lifetime: Math.max(0, taxSavingsLifetime),
      longevity_improvement_years: Math.max(0, longevityImprovement),
      legacy_improvement_amount: Math.max(0, legacyImprovement),
      market_risk_reduction: marketRiskReduction
    },
    includes_iul: includesIUL,
    includes_annuity: includesAnnuity,
    iul_reason: iulReason,
    annuity_reason: annuityReason,
    plain_english_summary: plainEnglishSummary,
    product_positioning: productPositioning,
    advisor_summary: advisorSummary,
    disclaimer: "DISCLAIMER: These projections are for educational purposes only and are based on illustrated, " +
      "conservative assumptions. They do not constitute financial, tax, or legal advice. " +
      "IUL cash value and policy loans are subject to policy terms and conditions. " +
      "Annuity guarantees are backed by the claims-paying ability of the issuing insurance company. " +
      "Consult with qualified professionals before making financial decisions."
  };
}
