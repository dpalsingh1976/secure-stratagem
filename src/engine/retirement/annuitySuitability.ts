// Professional FIA (Fixed Indexed Annuity) Suitability Engine
// Based on CFP suitability standards - FIA-specific only
// IMPORTANT: We ONLY recommend Fixed Indexed Annuities (FIA)
// Do NOT recommend SPIA, DIA, MYGA, or Variable Annuities

import type { 
  ProtectionHealthData,
  PlanningReadinessData,
  IncomeExpensesData
} from '@/types/financial';
import type { RetirementProjection, FIAStrategy, AnnuityFit } from '@/types/retirement';

export type { AnnuityFit };

export interface AnnuityPreconditionCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  importance: 'critical' | 'important' | 'helpful';
}

export interface AnnuitySuitabilityResult {
  score: number;                    // 0-100
  fit: AnnuityFit;
  strategy: FIAStrategy;            // FIA strategy output
  positives: string[];              // Top 3 positive reasons
  negatives: string[];              // Top 2 friction factors
  reason: string;                   // One-line summary
  reasons: string[];                // Keep for compatibility
  notIf: string[];                  // Warning conditions
  fixFirst: string[];               // Actionable remediation steps
  nextSteps: string[];              // What to do if it fits
  preconditions: AnnuityPreconditionCheck[];
  disqualified: boolean;
  disqualification_reason?: string;
  disclaimer: string;
}

interface AnnuitySuitabilityInputs {
  planningReadiness: PlanningReadinessData;
  protectionData: ProtectionHealthData;
  incomeData: IncomeExpensesData;
  projection?: RetirementProjection;
  yearsToRetirement: number;
}

/**
 * Professional FIA Suitability Computation
 * 
 * This engine evaluates suitability for Fixed Indexed Annuities ONLY.
 * Uses a balanced scoring model with a single "not fit yet" gate.
 */
export function computeAnnuitySuitability(inputs: AnnuitySuitabilityInputs): AnnuitySuitabilityResult {
  const { 
    planningReadiness, 
    protectionData, 
    incomeData, 
    projection,
    yearsToRetirement
  } = inputs;

  const preconditions: AnnuityPreconditionCheck[] = [];
  const positives: string[] = [];
  const negatives: string[] = [];
  const reasons: string[] = [];
  const notIf: string[] = [];
  const fixFirst: string[] = [];
  const nextSteps: string[] = [];
  
  let score = 0; // Start at 0 and add points
  let disqualified = false;
  let disqualification_reason: string | undefined;
  let strategy: FIAStrategy = 'FIA_OPTIONAL';
  let reason = '';

  // Extract input values
  const emergencyMonths = protectionData.emergency_fund_months || 0;
  const liquidityNeed = planningReadiness.near_term_liquidity_need || 'medium';
  const prefersGuaranteed = protectionData.prefers_guaranteed_income || false;
  const sequenceRisk = planningReadiness.sequence_risk_concern || 'medium';
  const taxConcern = planningReadiness.tax_concern_level || 'medium';
  
  // Calculate income gap percentage
  const gapPercentage = projection?.gap_percentage || 0;
  
  // Calculate guaranteed coverage ratio (as ratio 0-1, not percentage)
  const monthlyTarget = projection?.monthly_income_target || 1;
  const essentialsTarget = monthlyTarget * 0.60; // 60% considered essential
  const guaranteedIncome = projection 
    ? (projection.income_sources.social_security + projection.income_sources.pension)
    : 0;
  const guaranteedCoverageRatio = essentialsTarget > 0 
    ? guaranteedIncome / essentialsTarget 
    : 0;

  // ============================================
  // STEP 2: SINGLE "NOT FIT YET" GATE
  // Only disqualifier: High liquidity need + low emergency fund
  // ============================================

  if (liquidityNeed === 'high' && emergencyMonths < 3) {
    disqualified = true;
    disqualification_reason = 'Not a fit yet—build emergency reserves before allocating to an FIA.';
    score = 0;
    strategy = 'FIA_NOT_FIT_YET';
    negatives.push('High near-term liquidity need');
    negatives.push('Emergency reserves under 3 months');
    fixFirst.push(`Build emergency fund from ${emergencyMonths} to 3-6 months`);
    fixFirst.push('Address expected major expenses before locking funds');
    reason = 'Not a fit yet—build emergency reserves before allocating to an FIA.';
  }

  // ============================================
  // STEP 3: PRECONDITION CHECKS (Informational)
  // ============================================

  // Emergency Fund Check
  preconditions.push({
    id: 'emergency_fund',
    label: 'Emergency Fund',
    status: emergencyMonths >= 6 ? 'pass' : emergencyMonths >= 3 ? 'warning' : 'fail',
    value: `${emergencyMonths} months`,
    importance: 'critical'
  });

  // Liquidity Need Check
  preconditions.push({
    id: 'liquidity_need',
    label: 'Near-Term Liquidity',
    status: liquidityNeed === 'low' ? 'pass' :
            liquidityNeed === 'medium' ? 'warning' : 'fail',
    value: liquidityNeed === 'low' ? 'Low need (good)' :
           liquidityNeed === 'medium' ? 'Some planned expenses' : 'Major expense expected',
    importance: 'critical'
  });

  // Time Horizon Check - Red zone is POSITIVE for FIA!
  preconditions.push({
    id: 'time_horizon',
    label: 'Time to Retirement',
    status: yearsToRetirement <= 3 ? 'pass' :  // Red zone is GOOD for FIA!
            yearsToRetirement <= 9 ? 'pass' : 'warning',
    value: yearsToRetirement <= 3 ? `${yearsToRetirement} years (red zone)` : `${yearsToRetirement} years`,
    importance: 'helpful'
  });

  // Income Gap Check
  preconditions.push({
    id: 'income_gap',
    label: 'Retirement Income Gap',
    status: gapPercentage > 20 ? 'pass' :
            gapPercentage > 10 ? 'warning' : 'pass',
    value: gapPercentage > 0 ? `${Math.round(gapPercentage)}% gap` : 'No gap',
    importance: 'important'
  });

  // Guaranteed Coverage Check - informational only
  preconditions.push({
    id: 'guaranteed_coverage',
    label: 'Guaranteed Income Coverage',
    status: guaranteedCoverageRatio < 0.50 ? 'warning' :
            guaranteedCoverageRatio < 0.80 ? 'pass' : 'pass',
    value: `${Math.round(guaranteedCoverageRatio * 100)}% of essentials`,
    importance: 'helpful'
  });

  // Sequence Risk Check
  preconditions.push({
    id: 'sequence_risk',
    label: 'Sequence Risk Concern',
    status: sequenceRisk === 'high' ? 'pass' :
            sequenceRisk === 'medium' ? 'pass' : 'warning',
    value: sequenceRisk === 'high' ? 'High concern (FIA helps)' :
           sequenceRisk === 'medium' ? 'Some concern' : 'Low concern',
    importance: 'important'
  });

  // ============================================
  // STEP 4: FIA SCORING MODEL (0-100)
  // ============================================

  if (!disqualified) {
    // Sequence risk concern
    if (sequenceRisk === 'high') {
      score += 18;
      positives.push('Concerned about market downturns near retirement');
    } else if (sequenceRisk === 'medium') {
      score += 10;
      positives.push('Some concern about market timing in retirement');
    }

    // Prefers guaranteed income
    if (prefersGuaranteed) {
      score += 14;
      positives.push('Prefers predictable guaranteed income');
    }

    // Income gap (gap_percentage)
    if (gapPercentage > 20) {
      score += 18;
      positives.push(`${Math.round(gapPercentage)}% income gap indicates need for safer retirement income planning`);
    } else if (gapPercentage > 10) {
      score += 12;
      positives.push(`${Math.round(gapPercentage)}% income gap suggests guaranteed floor may help`);
    } else if (gapPercentage > 0) {
      score += 6;
    }
    // <= 0 gap: +0

    // Guaranteed coverage ratio
    if (guaranteedCoverageRatio < 0.50) {
      score += 14;
      positives.push('Current guaranteed income covers less than half of essentials');
    } else if (guaranteedCoverageRatio < 0.80) {
      score += 8;
    } else if (guaranteedCoverageRatio < 1.10) {
      score += 3;
    }
    // > 1.10: +0

    // Emergency fund months
    if (emergencyMonths >= 6) {
      score += 8;
      positives.push('Solid emergency reserves support FIA commitment');
    } else if (emergencyMonths >= 3) {
      score += 3;
    }
    // < 3: +0

    // Years to retirement (FIA "retirement red zone" relevance)
    if (yearsToRetirement <= 3) {
      score += 10;
      positives.push('Near retirement—FIA provides buffer against sequence risk');
    } else if (yearsToRetirement < 10) {
      score += 8;
    } else {
      score += 5;
    }

    // Liquidity friction penalty (NOT gate unless Step 2 triggered)
    if (liquidityNeed === 'high') {
      if (emergencyMonths >= 6) {
        score -= 10; // Reduced penalty
        negatives.push('Liquidity need is high (consider smaller allocation)');
      } else {
        score -= 18;
        negatives.push('Liquidity need is high—caution advised');
      }
    } else if (liquidityNeed === 'medium') {
      score -= 8;
      negatives.push('Some near-term liquidity needs');
    }
    // low: +0

    // Tax concern (minor)
    if (taxConcern === 'high') {
      score += 2;
    }
  }

  // Clamp final score to [0, 100]
  score = Math.max(0, Math.min(100, score));

  // ============================================
  // STEP 5: DETERMINE FIT LEVELS
  // ============================================

  let fit: AnnuityFit;
  if (disqualified) {
    fit = 'not_fit_yet';
  } else if (score >= 70) {
    fit = 'strong';
  } else if (score >= 50) {
    fit = 'moderate';
  } else {
    fit = 'explore';
  }

  // ============================================
  // STEP 6: FIA STRATEGY SELECTION (Priority Order)
  // ============================================

  if (!disqualified) {
    if (
      (fit === 'strong' || fit === 'moderate') && 
      prefersGuaranteed && 
      (gapPercentage > 10 || guaranteedCoverageRatio < 0.80)
    ) {
      strategy = 'FIA_INCOME_FLOOR';
    } else if (yearsToRetirement <= 3 || sequenceRisk === 'high' || sequenceRisk === 'medium') {
      strategy = 'FIA_BUFFER_REDZONE';
    } else if (fit === 'strong' || fit === 'moderate') {
      strategy = 'FIA_GROWTH_PROTECTION';
    } else {
      strategy = 'FIA_OPTIONAL';
    }
  }

  // ============================================
  // STEP 7: GENERATE REASONS / POSITIVES / NEGATIVES
  // ============================================

  // Build reasons from positives for compatibility
  positives.slice(0, 3).forEach(p => reasons.push(p));

  // Ensure minimum reasons
  if (reasons.length === 0 && !disqualified) {
    reasons.push('Fixed Indexed Annuities provide a guaranteed income floor that cannot be outlived.');
    if (yearsToRetirement > 5) {
      reasons.push('Your time horizon allows for FIA income rider accumulation benefits.');
    }
  }

  // Build one-line reason summary
  if (!disqualified) {
    if (strategy === 'FIA_OPTIONAL') {
      reason = 'FIA is optional—consider mainly for protection and peace of mind.';
    } else {
      const topPositives = positives.slice(0, 2).join('; ');
      reason = `FIA may help reduce market risk and improve retirement income reliability. Strengths: ${topPositives || 'protection and guarantees'}.`;
    }
  }

  // ============================================
  // NOT-IF BULLETS (always generate these)
  // ============================================
  
  notIf.push('Not ideal if you need access to these funds within 5-7 years—surrender charges can be significant.');
  notIf.push('Not recommended if you have high-interest debt that should be prioritized.');
  
  if (emergencyMonths < 6) {
    notIf.push(`With only ${emergencyMonths} months in emergency savings, prioritize reserves before locking funds.`);
  }
  
  if (liquidityNeed !== 'low') {
    notIf.push('If major expenses are expected soon (home, education, business), address those first.');
  }
  
  notIf.push('FIA fees and surrender charges vary significantly—compare multiple products carefully.');
  notIf.push('Early withdrawals before 59½ may incur 10% IRS penalty plus ordinary income tax.');

  // ============================================
  // NEXT STEPS
  // ============================================
  
  if (fit === 'not_fit_yet') {
    if (emergencyMonths < 3) {
      nextSteps.push('Build emergency fund to at least 3-6 months of expenses');
    }
    if (liquidityNeed === 'high') {
      nextSteps.push('Create a plan for expected major expenses before committing to long-term products');
    }
    nextSteps.push('Revisit FIA suitability once financial fundamentals are addressed');
  } else {
    nextSteps.push('Request Fixed Index Annuity (FIA) illustration with income rider projections');
    nextSteps.push('Compare FIA products with different cap rates and participation rates');
    nextSteps.push('Review surrender periods and 10% annual free withdrawal provisions');
    nextSteps.push('Calculate income benefit projections at various start ages');
    if (fit === 'explore') {
      nextSteps.push('Consider if other income strategies might better fit your situation');
    }
  }

  // Add low emergency fund to negatives if relevant
  if (emergencyMonths < 3 && !negatives.some(n => n.includes('Emergency'))) {
    negatives.push('Emergency fund is low');
  }

  // Add guaranteed coverage note to negatives if very high
  if (guaranteedCoverageRatio >= 1.0 && !negatives.some(n => n.includes('Guaranteed'))) {
    negatives.push('Guaranteed income already covers essentials');
  }

  return {
    score,
    fit,
    strategy,
    positives: positives.slice(0, 3),
    negatives: negatives.slice(0, 2),
    reason,
    reasons: reasons.slice(0, 6),
    notIf: notIf.slice(0, 6),
    fixFirst: fixFirst.slice(0, 4),
    nextSteps: nextSteps.slice(0, 5),
    preconditions,
    disqualified,
    disqualification_reason,
    disclaimer: 'Fixed Indexed Annuities are long-term insurance contracts. Withdrawals before age 59½ may incur IRS penalties. Surrender charges apply in early years. This analysis is educational—consult a licensed financial professional before making decisions.'
  };
}
