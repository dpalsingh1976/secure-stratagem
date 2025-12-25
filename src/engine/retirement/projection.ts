// Retirement Projection Engine - Pure deterministic math, NO AI
import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData 
} from '@/types/financial';
import type { 
  RetirementPreferencesData, 
  RetirementProjection,
  IncomeSourceProjection 
} from '@/types/retirement';
import { 
  RETURN_ASSUMPTIONS, 
  INFLATION_ASSUMPTIONS,
  WITHDRAWAL_RATES,
  SOCIAL_SECURITY_ASSUMPTIONS,
  LIFESTYLE_MULTIPLIERS
} from './assumptions';

/**
 * Calculate current age from DOB
 */
export function getCurrentAge(dob: string): number {
  if (!dob) return 40; // Default fallback
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(18, Math.min(age, 100));
}

/**
 * Calculate years to retirement
 */
export function getYearsToRetirement(dob: string, retirementAge: number): number {
  const currentAge = getCurrentAge(dob);
  return Math.max(0, retirementAge - currentAge);
}

/**
 * Future Value calculation with compound growth
 * FV = PV * (1 + r)^n
 */
export function futureValue(presentValue: number, rate: number, years: number): number {
  if (years <= 0) return presentValue;
  return presentValue * Math.pow(1 + rate, years);
}

/**
 * Future Value of Annuity (regular contributions)
 * FV = PMT * [((1 + r)^n - 1) / r]
 */
export function futureValueOfAnnuity(
  annualPayment: number, 
  rate: number, 
  years: number
): number {
  if (years <= 0 || rate === 0) return annualPayment * years;
  return annualPayment * ((Math.pow(1 + rate, years) - 1) / rate);
}

/**
 * Adjust future dollars to today's dollars
 */
export function adjustForInflation(
  futureAmount: number, 
  inflationRate: number, 
  years: number
): number {
  if (years <= 0) return futureAmount;
  return futureAmount / Math.pow(1 + inflationRate, years);
}

/**
 * Filter retirement-eligible assets
 */
export function getRetirementAssets(assets: AssetFormData[]): AssetFormData[] {
  const retirementTypes = [
    'retirement_401k', 'retirement_403b', 'retirement_457',
    'retirement_trad_ira', 'retirement_sep', 'retirement_simple',
    'retirement_roth_ira', 'retirement_roth_401k',
    'annuity_fia', 'annuity_rila', 'annuity_spia', 'annuity_dia',
    'insurance_iul', 'insurance_whole_life', 'insurance_vul'
  ];
  return assets.filter(a => retirementTypes.includes(a.asset_type));
}

/**
 * Calculate projected portfolio value at retirement
 */
export function calculateProjectedPortfolio(
  assets: AssetFormData[],
  annualContribution: number,
  contributionGrowthRate: number,
  yearsToRetirement: number,
  returnRate: number = RETURN_ASSUMPTIONS.BASE
): { portfolioAtRetirement: number; totalContributions: number } {
  const retirementAssets = getRetirementAssets(assets);
  const currentRetirementBalance = retirementAssets.reduce((sum, a) => sum + a.current_value, 0);
  
  // Future value of existing assets
  const fvExisting = futureValue(currentRetirementBalance, returnRate, yearsToRetirement);
  
  // Future value of contributions with growth
  let totalContributions = 0;
  let fvContributions = 0;
  
  for (let year = 0; year < yearsToRetirement; year++) {
    const yearlyContribution = annualContribution * Math.pow(1 + contributionGrowthRate / 100, year);
    totalContributions += yearlyContribution;
    const yearsToGrow = yearsToRetirement - year - 1;
    fvContributions += futureValue(yearlyContribution, returnRate, yearsToGrow);
  }
  
  return {
    portfolioAtRetirement: fvExisting + fvContributions,
    totalContributions
  };
}

/**
 * Calculate monthly income from portfolio using withdrawal rate
 */
export function calculatePortfolioIncome(
  portfolioValue: number,
  withdrawalRate: number = WITHDRAWAL_RATES.SAFE_RATE
): number {
  return (portfolioValue * withdrawalRate) / 12;
}

/**
 * Adjust Social Security based on confidence level
 */
export function adjustSocialSecurity(
  monthlyBenefit: number,
  confidence: 'low' | 'medium' | 'high'
): number {
  const haircut = SOCIAL_SECURITY_ASSUMPTIONS.CONFIDENCE_HAIRCUTS[confidence];
  return monthlyBenefit * haircut;
}

/**
 * Calculate target monthly income based on method and lifestyle
 */
export function calculateTargetIncome(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  preferences: RetirementPreferencesData
): number {
  let baseTarget: number;
  
  if (preferences.spending_target_method === 'fixed') {
    baseTarget = profileData.desired_monthly_income || 0;
  } else {
    const currentMonthlyIncome = (incomeData.w2_income + incomeData.business_income);
    baseTarget = currentMonthlyIncome * (preferences.spending_percent_of_income / 100);
  }
  
  // Apply lifestyle multiplier
  const multiplier = LIFESTYLE_MULTIPLIERS[preferences.retirement_lifestyle];
  return baseTarget * multiplier;
}

/**
 * Main projection calculation
 */
export function calculateRetirementProjection(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  assets: AssetFormData[],
  preferences: RetirementPreferencesData,
  returnRate: number = RETURN_ASSUMPTIONS.BASE,
  inflationRate: number = INFLATION_ASSUMPTIONS.DEFAULT
): RetirementProjection {
  const currentAge = getCurrentAge(profileData.dob);
  const retirementAge = profileData.retirement_age || 65;
  const yearsToRetirement = getYearsToRetirement(profileData.dob, retirementAge);
  
  // Get current retirement assets
  const retirementAssets = getRetirementAssets(assets);
  const currentRetirementBalance = retirementAssets.reduce((sum, a) => sum + a.current_value, 0);
  
  // Project portfolio at retirement
  const { portfolioAtRetirement, totalContributions } = calculateProjectedPortfolio(
    assets,
    preferences.annual_retirement_contribution,
    preferences.contribution_growth_rate,
    yearsToRetirement,
    returnRate
  );
  
  // Calculate income sources at retirement
  const adjustedSS = adjustSocialSecurity(
    incomeData.social_security,
    preferences.social_security_confidence
  );
  
  const incomeSources: IncomeSourceProjection = {
    social_security: adjustedSS,
    pension: incomeData.pension_income || 0,
    annuity: incomeData.annuity_income || 0,
    portfolio_withdrawal: calculatePortfolioIncome(portfolioAtRetirement),
    part_time: preferences.expected_part_time_income || 0
  };
  
  // Total projected monthly income
  const monthlyIncomeProjected = 
    incomeSources.social_security +
    incomeSources.pension +
    incomeSources.annuity +
    incomeSources.portfolio_withdrawal +
    incomeSources.part_time;
  
  // Target income
  const monthlyIncomeTarget = calculateTargetIncome(profileData, incomeData, preferences);
  
  // Gap calculation
  const monthlyGap = monthlyIncomeTarget - monthlyIncomeProjected;
  const gapPercentage = monthlyIncomeTarget > 0 
    ? (monthlyGap / monthlyIncomeTarget) * 100 
    : 0;
  
  return {
    years_to_retirement: yearsToRetirement,
    current_age: currentAge,
    retirement_age: retirementAge,
    projected_portfolio_at_retirement: portfolioAtRetirement,
    monthly_income_projected: monthlyIncomeProjected,
    monthly_income_target: monthlyIncomeTarget,
    monthly_gap: Math.max(0, monthlyGap),
    gap_percentage: Math.max(0, gapPercentage),
    income_sources: incomeSources,
    total_retirement_assets_today: currentRetirementBalance,
    total_contributions_future: totalContributions
  };
}
