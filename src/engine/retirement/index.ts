// Retirement Readiness Engine - Main Entry Point
import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData, 
  LiabilityFormData, 
  ProtectionHealthData,
  ComputedMetrics
} from '@/types/financial';
import type { 
  RetirementPreferencesData, 
  RetirementReadinessResult,
  RetirementProjection,
  RetirementScenarioResult,
  ProductRecommendation,
  RetirementSubScores
} from '@/types/retirement';

import { calculateRetirementProjection } from './projection';
import { generateAllScenarios } from './stressTests';
import { calculateSubScores, calculateOverallScore, getGrade } from './scores';
import { generateProductRecommendations } from './recommendations';

export * from './assumptions';
export * from './projection';
export * from './stressTests';
export * from './scores';
export * from './recommendations';
export * from './allocationEngine';
export * from './iulSuitability';
export * from './annuitySuitability';
export * from './scenarioSimulator';
export * from './bestInterestGuardrails';

/**
 * Generate key insights based on analysis
 */
function generateKeyInsights(
  projection: RetirementProjection,
  scenarios: RetirementScenarioResult[],
  subScores: RetirementSubScores,
  metrics: ComputedMetrics
): string[] {
  const insights: string[] = [];
  
  // Income gap insight
  if (projection.monthly_gap > 0) {
    insights.push(
      `You have a projected monthly income gap of ${formatCurrency(projection.monthly_gap)} ` +
      `(${Math.round(projection.gap_percentage)}% of target).`
    );
  } else {
    insights.push('Your projected retirement income meets or exceeds your target. Great progress!');
  }
  
  // Sequence risk insight
  const sequenceScenario = scenarios.find(s => s.scenario_name === 'Sequence Risk');
  if (sequenceScenario && sequenceScenario.projected_shortfall_age) {
    insights.push(
      `Under sequence risk (poor early returns), your portfolio could deplete by age ${sequenceScenario.projected_shortfall_age}.`
    );
  }
  
  // Tax insight
  if (metrics.tax_bucket_later_pct > 60) {
    insights.push(
      `${Math.round(metrics.tax_bucket_later_pct)}% of assets are tax-deferred, ` +
      `which may create tax burden in retirement.`
    );
  }
  
  // Guaranteed income insight
  const guaranteedPct = projection.monthly_income_target > 0
    ? ((projection.income_sources.social_security + projection.income_sources.pension) / 
       projection.monthly_income_target) * 100
    : 0;
  
  if (guaranteedPct < 40) {
    insights.push(
      `Only ${Math.round(guaranteedPct)}% of target income is from guaranteed sources. ` +
      `Consider adding guaranteed income floor.`
    );
  } else if (guaranteedPct >= 60) {
    insights.push(
      `${Math.round(guaranteedPct)}% of target income comes from guaranteed sources, ` +
      `providing solid foundation.`
    );
  }
  
  // Protection insight
  if (metrics.protection_gap > 100000) {
    insights.push(
      `A protection gap of ${formatCurrency(metrics.protection_gap)} could leave your family vulnerable.`
    );
  }
  
  return insights.slice(0, 5); // Max 5 insights
}

/**
 * Generate action items based on analysis
 */
function generateActionItems(
  projection: RetirementProjection,
  subScores: RetirementSubScores,
  metrics: ComputedMetrics,
  recommendations: ProductRecommendation[]
): string[] {
  const actions: string[] = [];
  
  // Income action
  if (projection.monthly_gap > 500) {
    const annualGap = projection.monthly_gap * 12;
    const additionalSavingsNeeded = annualGap * 25; // 4% rule inverse
    actions.push(
      `Increase retirement savings to close ${formatCurrency(projection.monthly_gap)}/month gap`
    );
  }
  
  // Tax action
  if (subScores.tax_risk < 60) {
    actions.push('Consider Roth conversions or tax-free savings vehicles');
  }
  
  // Liquidity action
  if (subScores.liquidity < 50) {
    actions.push('Build emergency fund to 6+ months of expenses');
  }
  
  // Protection action
  if (subScores.protection < 60 && metrics.protection_gap > 0) {
    actions.push('Review life insurance coverage options');
  }
  
  // Product-specific actions
  const strongRecs = recommendations.filter(r => r.fit === 'strong');
  if (strongRecs.length > 0) {
    actions.push(`Schedule consultation to discuss ${strongRecs.map(r => r.product).join(', ')} options`);
  }
  
  // General action
  if (actions.length === 0) {
    actions.push('Continue current savings trajectory and review annually');
  }
  
  return actions.slice(0, 4); // Max 4 actions
}

/**
 * Main computation function - computes complete Retirement Readiness Result
 * This is DETERMINISTIC - no AI calls, pure math
 */
export function computeRetirementReadiness(
  profileData: ProfileGoalsData,
  incomeData: IncomeExpensesData,
  assets: AssetFormData[],
  liabilities: LiabilityFormData[],
  protectionData: ProtectionHealthData,
  metrics: ComputedMetrics,
  preferences: RetirementPreferencesData
): RetirementReadinessResult {
  // Step 1: Calculate projection
  const projection = calculateRetirementProjection(
    profileData,
    incomeData,
    assets,
    preferences
  );
  
  // Step 2: Run stress tests
  const scenarios = generateAllScenarios(projection, metrics.tax_bucket_later_pct);
  
  // Step 3: Calculate sub-scores
  const subScores = calculateSubScores(projection, scenarios, metrics);
  
  // Step 4: Calculate overall score
  const overallScore = calculateOverallScore(subScores);
  const overallGrade = getGrade(overallScore);
  
  // Step 5: Generate product recommendations
  const recommendations = generateProductRecommendations(
    profileData,
    incomeData,
    liabilities,
    metrics,
    protectionData,
    projection,
    preferences
  );
  
  // Step 6: Generate insights and action items
  const keyInsights = generateKeyInsights(projection, scenarios, subScores, metrics);
  const actionItems = generateActionItems(projection, subScores, metrics, recommendations);
  
  return {
    overall_score: overallScore,
    overall_grade: overallGrade,
    sub_scores: subScores,
    projection,
    scenarios,
    recommendations,
    key_insights: keyInsights,
    action_items: actionItems
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
