// Professional IUL Suitability Engine
// Based on CFP suitability standards and top advisory best practices

import type { 
  ComputedMetrics, 
  ProtectionHealthData,
  PlanningReadinessData,
  IncomeExpensesData
} from '@/types/financial';

export type IULFit = 'strong' | 'moderate' | 'weak' | 'not_recommended';

export interface IULPreconditionCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  importance: 'critical' | 'important' | 'helpful';
}

export interface IULSuitabilityResult {
  score: number;                    // 0-100
  fit: IULFit;
  reasons: string[];                // 3-6 bullets with dynamic values
  notIf: string[];                  // 3-6 bullets
  nextSteps: string[];              // 3-5 bullets
  preconditions: IULPreconditionCheck[];
  disqualified: boolean;
  disqualification_reason?: string;
  disclaimer: string;
}

interface SuitabilityInputs {
  planningReadiness: PlanningReadinessData;
  protectionData: ProtectionHealthData;
  incomeData: IncomeExpensesData;
  metrics: ComputedMetrics;
  hasEmployerMatch: boolean;
  yearsToRetirement: number;
  dependents: number;
}

/**
 * Professional IUL Suitability Computation
 * 
 * CRITICAL: This engine is NOT biased toward IUL.
 * It will confidently say "Not Recommended" when fundamentals aren't met.
 */
export function computeIULSuitability(inputs: SuitabilityInputs): IULSuitabilityResult {
  const { 
    planningReadiness, 
    protectionData, 
    incomeData, 
    metrics,
    hasEmployerMatch,
    yearsToRetirement,
    dependents
  } = inputs;

  const preconditions: IULPreconditionCheck[] = [];
  const reasons: string[] = [];
  const notIf: string[] = [];
  const nextSteps: string[] = [];
  
  let score = 50; // Start at neutral
  let disqualified = false;
  let disqualification_reason: string | undefined;

  const monthlyIncome = (incomeData.w2_income || 0) + (incomeData.business_income || 0);
  const annualIncome = monthlyIncome * 12;
  const emergencyMonths = protectionData.emergency_fund_months || 0;
  
  // ============================================
  // EXPENSE RATIO CALCULATION
  // ============================================
  const totalMonthlyExpenses = (incomeData.fixed_expenses || 0) + (incomeData.variable_expenses || 0);
  const expenseRatio = monthlyIncome > 0 ? totalMonthlyExpenses / monthlyIncome : 1;
  const savingsCapacity = monthlyIncome - totalMonthlyExpenses;
  const fixedExpenseRatio = totalMonthlyExpenses > 0 
    ? (incomeData.fixed_expenses || 0) / totalMonthlyExpenses 
    : 0.5;

  // ============================================
  // HARD DISQUALIFIERS - Any true = Not Recommended
  // ============================================

  // 1. Income Stability
  preconditions.push({
    id: 'income_stability',
    label: 'Income Stability',
    status: planningReadiness.income_stability === 'stable' ? 'pass' : 
            planningReadiness.income_stability === 'somewhat_stable' ? 'warning' : 'fail',
    value: planningReadiness.income_stability === 'stable' ? 'Stable' :
           planningReadiness.income_stability === 'somewhat_stable' ? 'Somewhat Stable' : 'Unstable',
    importance: 'critical'
  });

  if (planningReadiness.income_stability === 'unstable') {
    disqualified = true;
    disqualification_reason = 'Unstable income makes consistent IUL funding risky. Focus on income stabilization first.';
    score = 15;
  }

  // 2. Near-term Liquidity Need
  preconditions.push({
    id: 'liquidity_need',
    label: 'Near-Term Liquidity',
    status: planningReadiness.near_term_liquidity_need === 'low' ? 'pass' :
            planningReadiness.near_term_liquidity_need === 'medium' ? 'warning' : 'fail',
    value: planningReadiness.near_term_liquidity_need === 'low' ? 'Low need (good)' :
           planningReadiness.near_term_liquidity_need === 'medium' ? 'Some planned expenses' : 'Major expense expected',
    importance: 'critical'
  });

  if (planningReadiness.near_term_liquidity_need === 'high') {
    disqualified = true;
    disqualification_reason = 'Expected major expenses in 3-5 years conflict with IUL\'s long-term structure.';
    score = Math.min(score, 20);
  }

  // 3. Emergency Fund
  preconditions.push({
    id: 'emergency_fund',
    label: 'Emergency Fund',
    status: emergencyMonths >= 6 ? 'pass' : emergencyMonths >= 3 ? 'warning' : 'fail',
    value: `${emergencyMonths} months`,
    importance: 'critical'
  });

  if (emergencyMonths < 3) {
    disqualified = true;
    disqualification_reason = 'Build an emergency fund of at least 3-6 months before committing to IUL premiums.';
    score = Math.min(score, 20);
  }

  // 4. Funding Commitment + Discipline
  preconditions.push({
    id: 'funding_commitment',
    label: 'Funding Commitment',
    status: ['10-20', '20+'].includes(planningReadiness.funding_commitment_years) ? 'pass' :
            planningReadiness.funding_commitment_years === '5-10' ? 'warning' : 'fail',
    value: planningReadiness.funding_commitment_years + ' years',
    importance: 'critical'
  });

  if (planningReadiness.funding_commitment_years === '3-5') {
    disqualified = true;
    disqualification_reason = 'IUL requires 10+ years of consistent funding to work as designed. A 3-5 year horizon is too short.';
    score = Math.min(score, 15);
  }

  // 5. Debt Pressure + Emergency Fund combo
  preconditions.push({
    id: 'debt_pressure',
    label: 'Debt Pressure',
    status: planningReadiness.debt_pressure_level === 'low' ? 'pass' :
            planningReadiness.debt_pressure_level === 'medium' ? 'warning' : 'fail',
    value: planningReadiness.debt_pressure_level === 'low' ? 'Manageable' :
           planningReadiness.debt_pressure_level === 'medium' ? 'Some pressure' : 'High pressure',
    importance: 'important'
  });

  if (planningReadiness.debt_pressure_level === 'high' && emergencyMonths < 6) {
    disqualified = true;
    disqualification_reason = 'High debt pressure combined with inadequate emergency fund. Address debt and savings before IUL.';
    score = Math.min(score, 20);
  }

  // 6. Employer Match Check
  preconditions.push({
    id: '401k_match',
    label: 'Getting Employer Match',
    status: !hasEmployerMatch || planningReadiness.contributing_to_401k_match ? 'pass' : 'fail',
    value: !hasEmployerMatch ? 'N/A (no match)' : 
           planningReadiness.contributing_to_401k_match ? 'Yes' : 'No',
    importance: 'critical'
  });

  if (hasEmployerMatch && !planningReadiness.contributing_to_401k_match) {
    disqualified = true;
    disqualification_reason = 'You\'re missing free money! Get your employer match before considering IUL.';
    score = Math.min(score, 25);
  }

  // 7. Expense Ratio Check - NEW
  preconditions.push({
    id: 'expense_ratio',
    label: 'Expense-to-Income Ratio',
    status: expenseRatio < 0.70 ? 'pass' : 
            expenseRatio < 0.85 ? 'warning' : 'fail',
    value: `${Math.round(expenseRatio * 100)}% of income`,
    importance: 'important'
  });

  if (expenseRatio > 0.85) {
    disqualified = true;
    disqualification_reason = `Your expenses consume ${Math.round(expenseRatio * 100)}% of income. Build more savings margin before committing to IUL premiums.`;
    score = Math.min(score, 20);
  }

  // ============================================
  // STRONG-FIT SIGNALS (increase score when not disqualified)
  // ============================================
  
  if (!disqualified) {
    // Income stability
    if (planningReadiness.income_stability === 'stable') {
      score += 15;
      reasons.push('Your stable income supports consistent premium payments—a key requirement for IUL success.');
    }

    // Emergency fund adequacy
    if (emergencyMonths >= 6) {
      score += 10;
      reasons.push(`With ${emergencyMonths} months of emergency reserves, you have a solid foundation for premium commitments.`);
    } else if (emergencyMonths >= 3) {
      score += 3;
    }

    // Near-term liquidity low
    if (planningReadiness.near_term_liquidity_need === 'low') {
      score += 10;
      reasons.push('No major near-term expenses expected, allowing policy cash value to grow uninterrupted.');
    }

    // Funding commitment
    if (['10-20', '20+'].includes(planningReadiness.funding_commitment_years)) {
      score += 15;
      reasons.push(`Your ${planningReadiness.funding_commitment_years} year funding commitment aligns with IUL's optimal accumulation period.`);
    } else if (planningReadiness.funding_commitment_years === '5-10') {
      score += 5;
    }

    // Funding discipline
    if (planningReadiness.funding_discipline === 'high') {
      score += 10;
      reasons.push('High funding discipline is crucial—IUL rewards consistent contributions.');
    } else if (planningReadiness.funding_discipline === 'medium') {
      score += 5;
    }

    // Tax bracket signals
    const highTaxBracket = ['24', '32', '35+'].includes(planningReadiness.current_tax_bracket);
    if (highTaxBracket || planningReadiness.tax_concern_level === 'high') {
      score += 10;
      const bracket = planningReadiness.current_tax_bracket !== 'not_sure' 
        ? `${planningReadiness.current_tax_bracket}%` : 'elevated';
      reasons.push(`Your ${bracket} tax bracket makes tax-free retirement income more valuable.`);
    }

    // Tax-free bucket desire
    if (planningReadiness.wants_tax_free_bucket) {
      score += 10;
      reasons.push('You value tax-free income options—IUL cash value grows tax-deferred and can be accessed tax-free via loans.');
    }

    // Tax bucket diversification (from metrics)
    if (metrics.tax_bucket_never_pct < 15) {
      score += 10;
      reasons.push(`Only ${Math.round(metrics.tax_bucket_never_pct)}% of assets are in tax-free vehicles. IUL improves tax diversification.`);
    }

    // Sequence risk concern
    if (planningReadiness.sequence_risk_concern === 'high') {
      score += 5;
      reasons.push('IUL\'s floor protection can buffer against sequence-of-returns risk in early retirement.');
    }

    // Legacy / permanent coverage
    if (planningReadiness.legacy_priority === 'high' || planningReadiness.permanent_coverage_need) {
      score += 10;
      if (planningReadiness.permanent_coverage_need) {
        reasons.push('Your need for permanent life insurance coverage aligns with IUL\'s death benefit structure.');
      } else {
        reasons.push('Your legacy goals can be supported by IUL\'s income-tax-free death benefit.');
      }
    }

    // Income level check
    if (annualIncome >= 200000) {
      score += 10;
      reasons.push('Your income level ($200K+) supports optimal IUL funding and maximizes tax advantages.');
    } else if (annualIncome >= 150000) {
      score += 5;
      reasons.push('Your income level supports proper IUL funding for meaningful accumulation.');
    }

    // Dependents / estate consideration
    if (dependents > 0) {
      score += 5;
    }

    // ============================================
    // EXPENSE-BASED SCORING - NEW
    // ============================================
    
    // Strong savings capacity
    if (expenseRatio < 0.60) {
      score += 10;
      reasons.push(`Your expense ratio of ${Math.round(expenseRatio * 100)}% leaves substantial room for IUL premium commitments.`);
    } else if (expenseRatio < 0.70) {
      score += 5;
      reasons.push(`With ${Math.round(expenseRatio * 100)}% expense-to-income ratio, you have adequate capacity for premiums.`);
    } else if (expenseRatio >= 0.80) {
      score -= 5;
    }

    // High fixed expense ratio indicates need for protection
    if (fixedExpenseRatio > 0.70 && dependents > 0) {
      score += 5;
      reasons.push(`${Math.round(fixedExpenseRatio * 100)}% of expenses are essential fixed costs—permanent coverage provides family protection.`);
    }

    // Positive savings capacity check
    if (savingsCapacity > 1000) {
      score += 5;
    }
  }

  // ============================================
  // NOT-IF BULLETS (always generate these)
  // ============================================
  
  notIf.push('Not ideal if you may need this money in the next 5-7 years—early access can reduce policy efficiency.');
  notIf.push('Not recommended if funding could be inconsistent; interruptions can trigger policy lapse or MEC status.');
  
  if (emergencyMonths < 6) {
    notIf.push('If emergency reserves are below 6 months, prioritize savings before committing to premiums.');
  }
  
  if (annualIncome < 100000) {
    notIf.push('At income levels below $100K, maximizing 401(k), Roth IRA, and HSA may provide better returns.');
  }

  // Expense-based warnings - NEW
  if (expenseRatio >= 0.70 && expenseRatio < 0.85) {
    notIf.push(`Your ${Math.round(expenseRatio * 100)}% expense ratio is borderline—ensure you can maintain premiums through income fluctuations.`);
  }
  
  if (savingsCapacity < 500 && !disqualified) {
    notIf.push('Limited monthly savings capacity may make consistent premium payments challenging.');
  }
  
  notIf.push('IUL is not a "set it and forget it" product—annual policy reviews are essential.');
  notIf.push('Policy loans, if not managed properly, can cause the policy to lapse and trigger taxes.');

  // ============================================
  // DETERMINE FIT
  // ============================================
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let fit: IULFit;
  if (disqualified || score < 40) {
    fit = 'not_recommended';
  } else if (score >= 80) {
    fit = 'strong';
  } else if (score >= 60) {
    fit = 'moderate';
  } else {
    fit = 'weak';
  }

  // ============================================
  // NEXT STEPS
  // ============================================
  
  if (fit === 'not_recommended') {
    // Education-first steps
    nextSteps.push('Build emergency fund to 6+ months of expenses');
    if (hasEmployerMatch && !planningReadiness.contributing_to_401k_match) {
      nextSteps.push('Contribute enough to 401(k) to capture full employer match');
    }
    if (planningReadiness.debt_pressure_level === 'high') {
      nextSteps.push('Create a debt paydown plan for high-interest obligations');
    }
    if (planningReadiness.maxing_qualified_plans === 'no') {
      nextSteps.push('Consider maxing out 401(k)/Roth IRA before exploring IUL');
    }
    nextSteps.push('Revisit IUL suitability once fundamentals are in place');
  } else {
    nextSteps.push('Request IUL illustrations showing minimum, target, and maximum funding scenarios');
    nextSteps.push('Compare cap rates, participation rates, and fees across 2-3 carriers (e.g., Pacific Life, Nationwide, Penn Mutual)');
    nextSteps.push('Understand loan provisions—how tax-free retirement income actually works');
    nextSteps.push('Schedule a consultation to review policy mechanics and projected accumulation');
    if (fit === 'moderate' || fit === 'weak') {
      nextSteps.push('Consider whether term + Roth investments might better fit your situation');
    }
  }

  // Ensure minimum bullets
  while (reasons.length < 3 && !disqualified) {
    if (yearsToRetirement > 15) {
      reasons.push('Your long time horizon allows IUL cash value to compound effectively.');
      break;
    }
    break;
  }

  return {
    score,
    fit,
    reasons: reasons.slice(0, 6),
    notIf: notIf.slice(0, 6),
    nextSteps: nextSteps.slice(0, 5),
    preconditions,
    disqualified,
    disqualification_reason,
    disclaimer: 'IUL policies are complex financial instruments. Policy loans and withdrawals reduce cash value and death benefit. This analysis is educational—consult a licensed financial professional before making decisions.'
  };
}

/**
 * Create default planning readiness data
 */
export function getDefaultPlanningReadiness(): PlanningReadinessData {
  return {
    income_stability: 'somewhat_stable',
    funding_commitment_years: '5-10',
    funding_discipline: 'medium',
    near_term_liquidity_need: 'medium',
    contributing_to_401k_match: true,
    maxing_qualified_plans: 'some',
    current_tax_bracket: 'not_sure',
    tax_concern_level: 'medium',
    wants_tax_free_bucket: false,
    sequence_risk_concern: 'medium',
    legacy_priority: 'medium',
    permanent_coverage_need: false,
    debt_pressure_level: 'low'
  };
}
