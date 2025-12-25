// Retirement Readiness Scoring Engine
import type { ComputedMetrics } from '@/types/financial';
import type { 
  RetirementProjection, 
  RetirementScenarioResult,
  RetirementSubScores 
} from '@/types/retirement';
import { SCORE_THRESHOLDS, GRADE_THRESHOLDS } from './assumptions';

/**
 * Calculate Income Adequacy Score (0-100)
 * Based on gap between projected and target income
 */
export function calculateIncomeAdequacyScore(projection: RetirementProjection): number {
  if (projection.monthly_income_target <= 0) return 100; // No target = no risk
  
  const coverageRatio = projection.monthly_income_projected / projection.monthly_income_target;
  
  if (coverageRatio >= 1.2) return 95;  // 120%+ coverage = excellent
  if (coverageRatio >= 1.0) return 85;  // 100%+ coverage = good
  if (coverageRatio >= 0.9) return 70;  // 90%+ coverage = moderate
  if (coverageRatio >= 0.8) return 55;  // 80%+ coverage = concerning
  if (coverageRatio >= 0.7) return 40;  // 70%+ coverage = high risk
  if (coverageRatio >= 0.5) return 25;  // 50%+ coverage = critical
  return 10; // Below 50% = severe
}

/**
 * Calculate Tax Risk Score (0-100)
 * Based on tax bucket allocation
 */
export function calculateTaxRiskScore(metrics: ComputedMetrics): number {
  const { tax_bucket_later_pct, tax_bucket_never_pct, tax_bucket_now_pct } = metrics;
  
  // Ideal: balanced allocation with meaningful tax-free bucket
  let score = 100;
  
  // Penalize heavy concentration in tax-deferred
  if (tax_bucket_later_pct > 70) score -= 30;
  else if (tax_bucket_later_pct > 50) score -= 15;
  
  // Penalize low tax-free allocation
  if (tax_bucket_never_pct < 10) score -= 25;
  else if (tax_bucket_never_pct < 20) score -= 10;
  
  // Penalize too much in taxable (opportunity cost)
  if (tax_bucket_now_pct > 40) score -= 10;
  
  return Math.max(10, Math.min(100, score));
}

/**
 * Calculate Sequence Risk Score (0-100)
 * Based on scenario analysis and asset volatility
 */
export function calculateSequenceRiskScore(
  metrics: ComputedMetrics,
  scenarios: RetirementScenarioResult[]
): number {
  const sequenceScenario = scenarios.find(s => s.scenario_name === 'Sequence Risk');
  const baseScenario = scenarios.find(s => s.scenario_name === 'Base Case');
  
  if (!sequenceScenario || !baseScenario) {
    // Fallback to seq_risk_index
    return Math.max(0, 100 - metrics.seq_risk_index);
  }
  
  // Compare success probabilities
  const probabilityDrop = baseScenario.success_probability - sequenceScenario.success_probability;
  
  let score = 100;
  
  // Penalize based on probability drop
  if (probabilityDrop > 30) score -= 40;
  else if (probabilityDrop > 20) score -= 25;
  else if (probabilityDrop > 10) score -= 15;
  
  // Penalize if sequence risk causes shortfall
  if (sequenceScenario.projected_shortfall_age) {
    score -= 20;
  }
  
  // Penalize high volatile asset concentration
  if (metrics.seq_risk_index > 70) score -= 15;
  else if (metrics.seq_risk_index > 50) score -= 10;
  
  return Math.max(10, Math.min(100, score));
}

/**
 * Calculate Longevity Risk Score (0-100)
 * Based on how long assets will last
 */
export function calculateLongevityRiskScore(
  projection: RetirementProjection,
  scenarios: RetirementScenarioResult[]
): number {
  const taxLongevityScenario = scenarios.find(s => s.scenario_name === 'Tax & Longevity');
  
  let score = 100;
  
  // Check for shortfall in any scenario
  const hasShortfall = scenarios.some(s => s.projected_shortfall_age !== null);
  if (hasShortfall) {
    const earliestShortfall = Math.min(
      ...scenarios
        .filter(s => s.projected_shortfall_age !== null)
        .map(s => s.projected_shortfall_age as number)
    );
    
    if (earliestShortfall < 80) score -= 50;
    else if (earliestShortfall < 85) score -= 35;
    else if (earliestShortfall < 90) score -= 20;
    else score -= 10;
  }
  
  // Check gap percentage
  if (projection.gap_percentage > 30) score -= 25;
  else if (projection.gap_percentage > 20) score -= 15;
  else if (projection.gap_percentage > 10) score -= 10;
  
  // Bonus for guaranteed income sources
  const guaranteedIncome = 
    projection.income_sources.social_security + 
    projection.income_sources.pension + 
    projection.income_sources.annuity;
  const guaranteedPct = projection.monthly_income_target > 0 
    ? (guaranteedIncome / projection.monthly_income_target) * 100 
    : 0;
  
  if (guaranteedPct >= 80) score += 15;
  else if (guaranteedPct >= 60) score += 10;
  else if (guaranteedPct >= 40) score += 5;
  
  return Math.max(10, Math.min(100, score));
}

/**
 * Calculate Liquidity Score (0-100)
 * Based on liquidity runway
 */
export function calculateLiquidityScore(metrics: ComputedMetrics): number {
  const months = metrics.liquidity_runway_months;
  
  if (months >= 12) return 95;
  if (months >= 9) return 85;
  if (months >= 6) return 70;
  if (months >= 4) return 50;
  if (months >= 3) return 35;
  if (months >= 1) return 20;
  return 10;
}

/**
 * Calculate Protection Score (0-100)
 * Based on insurance gaps
 */
export function calculateProtectionScore(metrics: ComputedMetrics): number {
  let score = 100;
  
  // Penalize protection gap
  if (metrics.protection_gap > 500000) score -= 30;
  else if (metrics.protection_gap > 250000) score -= 20;
  else if (metrics.protection_gap > 100000) score -= 10;
  else if (metrics.protection_gap > 0) score -= 5;
  
  // Penalize disability gap
  if (metrics.disability_gap > 5000) score -= 15;
  else if (metrics.disability_gap > 2500) score -= 10;
  else if (metrics.disability_gap > 0) score -= 5;
  
  // Penalize LTC gap
  if (metrics.ltc_gap > 3000) score -= 15;
  else if (metrics.ltc_gap > 1500) score -= 10;
  else if (metrics.ltc_gap > 0) score -= 5;
  
  return Math.max(10, Math.min(100, score));
}

/**
 * Calculate all sub-scores
 */
export function calculateSubScores(
  projection: RetirementProjection,
  scenarios: RetirementScenarioResult[],
  metrics: ComputedMetrics
): RetirementSubScores {
  return {
    income_adequacy: calculateIncomeAdequacyScore(projection),
    tax_risk: calculateTaxRiskScore(metrics),
    sequence_risk: calculateSequenceRiskScore(metrics, scenarios),
    longevity_risk: calculateLongevityRiskScore(projection, scenarios),
    liquidity: calculateLiquidityScore(metrics),
    protection: calculateProtectionScore(metrics)
  };
}

/**
 * Calculate overall Retirement Readiness Score (0-100)
 * Weighted average of sub-scores
 */
export function calculateOverallScore(subScores: RetirementSubScores): number {
  const weights = {
    income_adequacy: 0.25,   // Most important
    tax_risk: 0.15,
    sequence_risk: 0.20,
    longevity_risk: 0.20,
    liquidity: 0.10,
    protection: 0.10
  };
  
  const weightedScore = 
    subScores.income_adequacy * weights.income_adequacy +
    subScores.tax_risk * weights.tax_risk +
    subScores.sequence_risk * weights.sequence_risk +
    subScores.longevity_risk * weights.longevity_risk +
    subScores.liquidity * weights.liquidity +
    subScores.protection * weights.protection;
  
  return Math.round(weightedScore);
}

/**
 * Convert score to letter grade
 */
export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Get score label and color
 */
export function getScoreLabel(score: number): { label: string; colorClass: string } {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return { label: 'Excellent', colorClass: 'text-green-600 bg-green-100' };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return { label: 'Good', colorClass: 'text-blue-600 bg-blue-100' };
  }
  if (score >= SCORE_THRESHOLDS.MODERATE) {
    return { label: 'Moderate', colorClass: 'text-yellow-600 bg-yellow-100' };
  }
  if (score >= SCORE_THRESHOLDS.CONCERNING) {
    return { label: 'Concerning', colorClass: 'text-orange-600 bg-orange-100' };
  }
  return { label: 'Critical', colorClass: 'text-red-600 bg-red-100' };
}
