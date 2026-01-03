// Professional Annuity Suitability Engine
// Based on CFP suitability standards and top advisory best practices

import type { 
  ProtectionHealthData,
  PlanningReadinessData,
  IncomeExpensesData
} from '@/types/financial';
import type { RetirementProjection } from '@/types/retirement';

export type AnnuityFit = 'strong' | 'moderate' | 'weak' | 'not_recommended';

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
  reasons: string[];                // Why it's a good fit
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
 * Professional Annuity Suitability Computation
 * 
 * CRITICAL: This engine is NOT biased toward annuities.
 * It will confidently say "Not Recommended" when fundamentals aren't met.
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
  const reasons: string[] = [];
  const notIf: string[] = [];
  const fixFirst: string[] = [];
  const nextSteps: string[] = [];
  
  let score = 50; // Start at neutral
  let disqualified = false;
  let disqualification_reason: string | undefined;

  const emergencyMonths = protectionData.emergency_fund_months || 0;
  const liquidityNeed = planningReadiness.near_term_liquidity_need || 'medium';
  const prefersGuaranteed = protectionData.prefers_guaranteed_income || false;
  
  // Calculate income gap percentage
  const gapPercentage = projection?.gap_percentage || 0;
  
  // Calculate guaranteed income coverage
  const guaranteedIncome = projection 
    ? (projection.income_sources.social_security + projection.income_sources.pension)
    : 0;
  const monthlyTarget = projection?.monthly_income_target || 1;
  const essentialExpenses = monthlyTarget * 0.6; // 60% considered essential
  const guaranteedCoverageRatio = monthlyTarget > 0 ? (guaranteedIncome / essentialExpenses) * 100 : 0;

  // ============================================
  // HARD DISQUALIFIERS - Any true = Not Recommended
  // ============================================

  // 1. Emergency Fund Check
  preconditions.push({
    id: 'emergency_fund',
    label: 'Emergency Fund',
    status: emergencyMonths >= 6 ? 'pass' : emergencyMonths >= 3 ? 'warning' : 'fail',
    value: `${emergencyMonths} months`,
    importance: 'critical'
  });

  // 2. Liquidity Need Check
  preconditions.push({
    id: 'liquidity_need',
    label: 'Near-Term Liquidity',
    status: liquidityNeed === 'low' ? 'pass' :
            liquidityNeed === 'medium' ? 'warning' : 'fail',
    value: liquidityNeed === 'low' ? 'Low need (good)' :
           liquidityNeed === 'medium' ? 'Some planned expenses' : 'Major expense expected',
    importance: 'critical'
  });

  // Combined disqualifier: Low emergency fund AND high liquidity need
  if (emergencyMonths < 3 && liquidityNeed === 'high') {
    disqualified = true;
    disqualification_reason = 'Low emergency reserves combined with high near-term liquidity needs make annuity surrender periods risky.';
    score = 15;
    fixFirst.push(`Build emergency fund from ${emergencyMonths} to 3-6 months before considering annuity`);
    fixFirst.push('Address expected major expenses first—annuity surrender charges apply for 5-10 years');
  }

  // 3. Time Horizon Check
  preconditions.push({
    id: 'time_horizon',
    label: 'Time to Retirement',
    status: yearsToRetirement >= 10 ? 'pass' :
            yearsToRetirement >= 5 ? 'warning' : 'fail',
    value: `${yearsToRetirement} years`,
    importance: 'important'
  });

  if (yearsToRetirement < 3) {
    disqualified = true;
    disqualification_reason = 'With less than 3 years to retirement, deferred annuity benefits may not materialize effectively.';
    score = Math.min(score, 20);
    fixFirst.push(`With only ${yearsToRetirement} years to retirement, consider an immediate annuity (SPIA) instead of a deferred annuity`);
  }

  // 4. Income Gap Check
  preconditions.push({
    id: 'income_gap',
    label: 'Retirement Income Gap',
    status: gapPercentage > 20 ? 'pass' :
            gapPercentage > 10 ? 'warning' : 'fail',
    value: gapPercentage > 0 ? `${Math.round(gapPercentage)}% gap` : 'No gap',
    importance: 'important'
  });

  // 5. Guaranteed Income Coverage Check
  preconditions.push({
    id: 'guaranteed_coverage',
    label: 'Guaranteed Income Coverage',
    status: guaranteedCoverageRatio < 50 ? 'pass' :
            guaranteedCoverageRatio < 80 ? 'warning' : 'fail',
    value: guaranteedCoverageRatio >= 80 ? 'Well covered (80%+)' :
           guaranteedCoverageRatio >= 50 ? 'Partially covered' : 'Under-covered',
    importance: 'helpful'
  });

  // Disqualifier: No income gap AND high guaranteed coverage
  if (gapPercentage <= 0 && guaranteedCoverageRatio >= 80) {
    disqualified = true;
    disqualification_reason = 'No income gap exists and your guaranteed income already covers essential expenses. An annuity may not add significant value.';
    score = Math.min(score, 25);
    fixFirst.push('Your current SS + pension already covers essentials—consider other vehicles for growth');
    fixFirst.push('If legacy is a priority, explore life insurance or investment accounts instead');
  }

  // High liquidity need alone (without emergency fund issue)
  if (liquidityNeed === 'high' && !disqualified) {
    disqualified = true;
    disqualification_reason = 'High near-term liquidity needs conflict with annuity surrender periods (typically 5-10 years).';
    score = Math.min(score, 25);
    fixFirst.push('Address expected major expenses (home purchase, business, education) before locking funds in an annuity');
    fixFirst.push('Consider short-term savings vehicles for near-term needs, then revisit annuity');
  }

  // ============================================
  // POSITIVE SCORING SIGNALS (when not disqualified)
  // ============================================
  
  if (!disqualified) {
    // Prefers guaranteed income (+25)
    if (prefersGuaranteed) {
      score += 25;
      reasons.push('You indicated a preference for guaranteed lifetime income—annuities are designed for this.');
    }

    // Income gap > 20% (+20)
    if (gapPercentage > 20) {
      score += 20;
      reasons.push(`A ${Math.round(gapPercentage)}% retirement income gap could be addressed with guaranteed annuity income.`);
    } else if (gapPercentage > 10) {
      score += 10;
      reasons.push(`A ${Math.round(gapPercentage)}% income gap suggests some guaranteed income floor may be beneficial.`);
    }

    // SS + Pension < essential expenses (+15)
    if (guaranteedCoverageRatio < 50) {
      score += 15;
      reasons.push('Current guaranteed income (SS + pension) covers less than half of essential expenses—an annuity can fill this gap.');
    } else if (guaranteedCoverageRatio < 80) {
      score += 8;
      reasons.push('Adding guaranteed income could provide more security for essential expenses.');
    }

    // Sequence risk concern (+10)
    if (planningReadiness.sequence_risk_concern === 'high') {
      score += 10;
      reasons.push('You\'re concerned about market timing in retirement—annuities provide income regardless of market conditions.');
    }

    // Strong emergency fund (+10)
    if (emergencyMonths >= 6) {
      score += 10;
      reasons.push(`With ${emergencyMonths} months of emergency reserves, you can commit to annuity surrender periods without liquidity stress.`);
    } else if (emergencyMonths >= 3) {
      score += 3;
    }

    // Time horizon (+10)
    if (yearsToRetirement >= 10) {
      score += 10;
      reasons.push(`${yearsToRetirement} years until retirement allows time for deferred annuity growth and income rider accumulation.`);
    } else if (yearsToRetirement >= 5) {
      score += 5;
      reasons.push('Your time horizon supports annuity accumulation, though longer would be ideal.');
    }

    // Tax concern level (+5)
    if (planningReadiness.tax_concern_level === 'high') {
      score += 5;
      reasons.push('Annuity income can be structured for tax efficiency with qualified funds.');
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
  
  notIf.push('Annuity fees and surrender charges vary significantly—compare multiple products carefully.');
  notIf.push('Early withdrawals before 59½ may incur 10% IRS penalty plus ordinary income tax.');

  // ============================================
  // DETERMINE FIT
  // ============================================
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let fit: AnnuityFit;
  if (disqualified || score < 40) {
    fit = 'not_recommended';
  } else if (score >= 75) {
    fit = 'strong';
  } else if (score >= 55) {
    fit = 'moderate';
  } else {
    fit = 'weak';
  }

  // ============================================
  // NEXT STEPS
  // ============================================
  
  if (fit === 'not_recommended') {
    // Fix-first steps
    if (emergencyMonths < 3) {
      nextSteps.push('Build emergency fund to at least 3-6 months of expenses');
    }
    if (liquidityNeed === 'high') {
      nextSteps.push('Create a plan for expected major expenses before committing to long-term products');
    }
    if (yearsToRetirement < 3) {
      nextSteps.push('Explore immediate annuities (SPIA) that begin income within 1 year');
    }
    if (gapPercentage <= 0) {
      nextSteps.push('Review if additional growth vehicles better match your situation');
    }
    nextSteps.push('Revisit annuity suitability once financial fundamentals are addressed');
  } else {
    nextSteps.push('Compare Fixed Index Annuity (FIA) vs SPIA options based on your timeline');
    nextSteps.push('Review income rider options and guaranteed withdrawal benefit rates');
    nextSteps.push('Calculate income benefit projections at various start ages');
    nextSteps.push('Understand surrender periods and any liquidity features (e.g., 10% free withdrawal)');
    if (fit === 'weak') {
      nextSteps.push('Consider if other income strategies might better fit your situation');
    }
  }

  // Ensure minimum reasons when not disqualified
  if (reasons.length === 0 && !disqualified) {
    reasons.push('Annuities provide a guaranteed income floor that cannot be outlived.');
    if (yearsToRetirement > 5) {
      reasons.push('Your time horizon allows for annuity accumulation benefits.');
    }
  }

  return {
    score,
    fit,
    reasons: reasons.slice(0, 6),
    notIf: notIf.slice(0, 6),
    fixFirst: fixFirst.slice(0, 4),
    nextSteps: nextSteps.slice(0, 5),
    preconditions,
    disqualified,
    disqualification_reason,
    disclaimer: 'Annuities are long-term insurance contracts. Withdrawals before age 59½ may incur IRS penalties. Surrender charges apply in early years. This analysis is educational—consult a licensed financial professional before making decisions.'
  };
}
