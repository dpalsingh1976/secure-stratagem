// Product Fit Recommendations Engine
import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  LiabilityFormData,
  ComputedMetrics,
  ProtectionHealthData,
  PlanningReadinessData
} from '@/types/financial';
import type { 
  RetirementPreferencesData, 
  RetirementProjection,
  ProductRecommendation,
  ProductFit
} from '@/types/retirement';
import { INSURANCE_ASSUMPTIONS } from './assumptions';
import { computeIULSuitability, getDefaultPlanningReadiness } from './iulSuitability';
import { computeAnnuitySuitability } from './annuitySuitability';

/**
 * Evaluate Term Life Insurance fit
 */
export function evaluateTermFit(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  liabilities: LiabilityFormData[],
  metrics: ComputedMetrics,
  protectionData: ProtectionHealthData
): ProductRecommendation {
  const whyBullets: string[] = [];
  const notIfBullets: string[] = [];
  const nextSteps: string[] = [];
  
  let fitScore = 0;
  
  // Check dependents
  if (profileData.dependents > 0) {
    fitScore += 30;
    whyBullets.push(`You have ${profileData.dependents} dependent(s) who rely on your income`);
  }
  
  // Check liabilities
  const totalDebt = liabilities.reduce((sum, l) => sum + l.balance, 0);
  if (totalDebt > 100000) {
    fitScore += 25;
    whyBullets.push(`Outstanding debt of ${formatCurrency(totalDebt)} needs protection`);
  }
  
  // Check protection gap
  if (metrics.protection_gap > 0) {
    fitScore += 30;
    whyBullets.push(`Protection gap of ${formatCurrency(metrics.protection_gap)} exists`);
  }
  
  // Check income
  const annualIncome = (incomeData.w2_income + incomeData.business_income) * 12;
  if (annualIncome > 50000) {
    fitScore += 15;
    whyBullets.push('Income replacement needed to protect family lifestyle');
  }
  
  // Not recommended if conditions
  if (profileData.dependents === 0 && totalDebt < 50000) {
    notIfBullets.push('No dependents and low debt may reduce need for coverage');
  }
  
  if (protectionData.term_life_coverage + protectionData.permanent_life_db >= metrics.dime_need) {
    notIfBullets.push('Current coverage already meets or exceeds DIME need');
    fitScore -= 30;
  }
  
  const currentAge = getCurrentAge(profileData.dob);
  if (currentAge > 65) {
    notIfBullets.push('Term life becomes expensive and harder to qualify after 65');
    fitScore -= 20;
  }
  
  // Determine fit
  let fit: ProductFit;
  if (fitScore >= 70) fit = 'strong';
  else if (fitScore >= 45) fit = 'moderate';
  else if (fitScore >= 20) fit = 'weak';
  else fit = 'not_recommended';
  
  // Next steps
  if (fit !== 'not_recommended') {
    nextSteps.push('Request term life quotes for 10, 20, or 30-year terms');
    nextSteps.push('Compare coverage levels based on DIME calculation');
    nextSteps.push('Consider "laddering" multiple policies with different terms');
  }
  
  return {
    product: 'Term',
    fit,
    whyBullets: whyBullets.length > 0 ? whyBullets : ['Basic protection for income replacement'],
    notIfBullets: notIfBullets.length > 0 ? notIfBullets : ['May not be needed if no dependents or debts'],
    nextSteps: nextSteps.length > 0 ? nextSteps : ['Discuss with a licensed insurance professional'],
    disclaimer: 'Term life insurance provides temporary coverage. Consult a licensed agent for personalized recommendations.'
  };
}

/**
 * Evaluate Annuity fit
 * Now uses the professional Annuity suitability engine
 */
export function evaluateAnnuityFit(
  projection: RetirementProjection,
  preferences: RetirementPreferencesData,
  incomeData: IncomeExpensesData,
  protectionData?: ProtectionHealthData,
  planningReadiness?: PlanningReadinessData
): ProductRecommendation {
  // Use the professional Annuity suitability engine
  const readiness = planningReadiness || getDefaultPlanningReadiness();
  const protection = protectionData || {
    emergency_fund_months: 3,
    prefers_guaranteed_income: preferences.prefers_guaranteed_income || false
  } as ProtectionHealthData;
  
  const suitabilityResult = computeAnnuitySuitability({
    planningReadiness: readiness,
    protectionData: protection,
    incomeData,
    projection,
    yearsToRetirement: projection.years_to_retirement
  });
  
  return {
    product: 'Annuity',
    fit: suitabilityResult.fit,
    score: suitabilityResult.score,
    whyBullets: suitabilityResult.reasons.length > 0 
      ? suitabilityResult.reasons 
      : ['Provides guaranteed lifetime income floor'],
    notIfBullets: suitabilityResult.notIf.length > 0 
      ? suitabilityResult.notIf 
      : ['May lock up funds for extended periods'],
    fixFirstBullets: suitabilityResult.fixFirst,
    nextSteps: suitabilityResult.nextSteps.length > 0 
      ? suitabilityResult.nextSteps 
      : ['Request personalized annuity illustration'],
    disclaimer: suitabilityResult.disclaimer,
    preconditions: suitabilityResult.preconditions,
    disqualified: suitabilityResult.disqualified,
    disqualification_reason: suitabilityResult.disqualification_reason
  };
}

/**
 * Evaluate IUL (Indexed Universal Life) fit
 * Now uses the professional IUL suitability engine
 */
export function evaluateIULFit(
  metrics: ComputedMetrics,
  preferences: RetirementPreferencesData,
  incomeData: IncomeExpensesData,
  protectionData: ProtectionHealthData,
  profileData?: ProfileGoalsData,
  planningReadiness?: PlanningReadinessData
): ProductRecommendation {
  // Use the professional IUL suitability engine
  const readiness = planningReadiness || getDefaultPlanningReadiness();
  
  // Calculate years to retirement
  const currentAge = profileData?.dob ? getCurrentAge(profileData.dob) : 40;
  const retirementAge = profileData?.retirement_age || 65;
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  
  const suitabilityResult = computeIULSuitability({
    planningReadiness: readiness,
    protectionData,
    incomeData,
    metrics,
    hasEmployerMatch: (incomeData.employer_match_pct || 0) > 0,
    yearsToRetirement,
    dependents: profileData?.dependents || 0
  });
  
  return {
    product: 'IUL',
    fit: suitabilityResult.fit,
    score: suitabilityResult.score,
    whyBullets: suitabilityResult.reasons.length > 0 
      ? suitabilityResult.reasons 
      : ['Tax-free growth and retirement income potential'],
    notIfBullets: suitabilityResult.notIf.length > 0 
      ? suitabilityResult.notIf 
      : ['Requires long-term commitment and proper funding'],
    nextSteps: suitabilityResult.nextSteps.length > 0 
      ? suitabilityResult.nextSteps 
      : ['Request personalized IUL illustration'],
    disclaimer: suitabilityResult.disclaimer,
    preconditions: suitabilityResult.preconditions,
    disqualified: suitabilityResult.disqualified,
    disqualification_reason: suitabilityResult.disqualification_reason
  };
}

/**
 * Generate all product recommendations
 */
export function generateProductRecommendations(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  liabilities: LiabilityFormData[],
  metrics: ComputedMetrics,
  protectionData: ProtectionHealthData,
  projection: RetirementProjection,
  preferences: RetirementPreferencesData,
  planningReadiness?: PlanningReadinessData
): ProductRecommendation[] {
  return [
    evaluateTermFit(profileData, incomeData, liabilities, metrics, protectionData),
    evaluateAnnuityFit(projection, preferences, incomeData, protectionData, planningReadiness),
    evaluateIULFit(metrics, preferences, incomeData, protectionData, profileData, planningReadiness)
  ];
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCurrentAge(dob: string): number {
  if (!dob) return 40;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
