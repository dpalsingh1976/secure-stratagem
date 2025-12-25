// Stress Testing Module - Deterministic scenario analysis
import type { RetirementProjection, RetirementScenarioResult } from '@/types/retirement';
import { 
  RETURN_ASSUMPTIONS, 
  INFLATION_ASSUMPTIONS,
  WITHDRAWAL_RATES,
  LIFE_EXPECTANCY,
  TAX_ASSUMPTIONS,
  SEQUENCE_RISK_RETURNS
} from './assumptions';
import { futureValue, adjustForInflation } from './projection';

/**
 * Simulate portfolio through retirement with given returns
 */
function simulatePortfolio(
  startingBalance: number,
  annualWithdrawal: number,
  returnSequence: readonly number[],
  normalReturn: number,
  yearsToSimulate: number
): { endingBalance: number; shortfallYear: number | null; totalWithdrawn: number } {
  let balance = startingBalance;
  let totalWithdrawn = 0;
  let shortfallYear: number | null = null;
  
  for (let year = 0; year < yearsToSimulate; year++) {
    // Use sequence returns for early years, then normal returns
    const returnRate = year < returnSequence.length ? returnSequence[year] : normalReturn;
    
    // Apply return
    balance = balance * (1 + returnRate);
    
    // Withdraw
    const withdrawal = Math.min(balance, annualWithdrawal);
    balance -= withdrawal;
    totalWithdrawn += withdrawal;
    
    // Check for shortfall
    if (balance <= 0 && shortfallYear === null) {
      shortfallYear = year + 1;
      break;
    }
  }
  
  return { endingBalance: Math.max(0, balance), shortfallYear, totalWithdrawn };
}

/**
 * Calculate success probability based on gap ratio
 */
function calculateSuccessProbability(
  portfolioAtRetirement: number,
  annualNeed: number,
  yearsInRetirement: number,
  returnRate: number
): number {
  if (annualNeed <= 0) return 100;
  
  const totalNeeded = annualNeed * yearsInRetirement;
  const projectedGrowth = portfolioAtRetirement * Math.pow(1 + returnRate, yearsInRetirement / 2);
  
  const coverage = projectedGrowth / totalNeeded;
  
  // Map coverage to probability (simplified)
  if (coverage >= 1.5) return 95;
  if (coverage >= 1.2) return 85;
  if (coverage >= 1.0) return 70;
  if (coverage >= 0.8) return 50;
  if (coverage >= 0.6) return 30;
  return 15;
}

/**
 * Generate Base Case Scenario
 */
export function generateBaseScenario(
  projection: RetirementProjection
): RetirementScenarioResult {
  const yearsInRetirement = LIFE_EXPECTANCY.CONSERVATIVE - projection.retirement_age;
  const annualWithdrawal = projection.monthly_income_target * 12;
  
  const simulation = simulatePortfolio(
    projection.projected_portfolio_at_retirement,
    annualWithdrawal,
    SEQUENCE_RISK_RETURNS.NORMAL,
    RETURN_ASSUMPTIONS.BASE,
    yearsInRetirement
  );
  
  const successProbability = calculateSuccessProbability(
    projection.projected_portfolio_at_retirement,
    annualWithdrawal,
    yearsInRetirement,
    RETURN_ASSUMPTIONS.BASE
  );
  
  const sustainableIncome = (projection.projected_portfolio_at_retirement * WITHDRAWAL_RATES.SAFE_RATE) / 12;
  
  return {
    scenario_name: 'Base Case',
    scenario_description: 'Standard assumptions: 6% returns, 3% inflation, retire at target age',
    success_probability: successProbability,
    projected_shortfall_age: simulation.shortfallYear 
      ? projection.retirement_age + simulation.shortfallYear 
      : null,
    ending_balance_at_90: simulation.endingBalance,
    total_income_received: simulation.totalWithdrawn,
    monthly_sustainable_income: sustainableIncome + 
      projection.income_sources.social_security + 
      projection.income_sources.pension,
    key_insight: simulation.shortfallYear 
      ? `Portfolio depletes at age ${projection.retirement_age + simulation.shortfallYear}. Consider reducing expenses or increasing savings.`
      : `Portfolio projected to last through age 95 with ${formatCurrency(simulation.endingBalance)} remaining.`
  };
}

/**
 * Generate Sequence Risk Scenario (Bad early market years)
 */
export function generateSequenceRiskScenario(
  projection: RetirementProjection
): RetirementScenarioResult {
  const yearsInRetirement = LIFE_EXPECTANCY.CONSERVATIVE - projection.retirement_age;
  const annualWithdrawal = projection.monthly_income_target * 12;
  
  // Apply sequence risk haircut to starting portfolio (simulating poor early returns)
  const haircutFactor = 0.75; // 25% reduction from bad early years
  const stressedPortfolio = projection.projected_portfolio_at_retirement * haircutFactor;
  
  const simulation = simulatePortfolio(
    stressedPortfolio,
    annualWithdrawal,
    SEQUENCE_RISK_RETURNS.BAD_EARLY,
    RETURN_ASSUMPTIONS.CONSERVATIVE, // Lower returns after bad start
    yearsInRetirement
  );
  
  const successProbability = calculateSuccessProbability(
    stressedPortfolio,
    annualWithdrawal,
    yearsInRetirement,
    RETURN_ASSUMPTIONS.CONSERVATIVE
  );
  
  const sustainableIncome = (stressedPortfolio * WITHDRAWAL_RATES.CONSERVATIVE) / 12;
  
  return {
    scenario_name: 'Sequence Risk',
    scenario_description: 'Poor market returns in first 5 years of retirement (-10%, 0%, -5%, 2%, 4%)',
    success_probability: Math.max(successProbability - 20, 5),
    projected_shortfall_age: simulation.shortfallYear 
      ? projection.retirement_age + simulation.shortfallYear 
      : null,
    ending_balance_at_90: simulation.endingBalance,
    total_income_received: simulation.totalWithdrawn,
    monthly_sustainable_income: sustainableIncome + 
      projection.income_sources.social_security + 
      projection.income_sources.pension,
    key_insight: simulation.shortfallYear 
      ? `Under sequence risk, portfolio depletes by age ${projection.retirement_age + simulation.shortfallYear}. Guaranteed income sources provide protection.`
      : `Even with poor early returns, portfolio survives but with ${formatCurrency(simulation.endingBalance)} at 90.`
  };
}

/**
 * Generate Tax & Longevity Stress Scenario
 */
export function generateTaxLongevityScenario(
  projection: RetirementProjection,
  taxBucketLaterPct: number
): RetirementScenarioResult {
  // Extended life to 95, higher tax drag
  const yearsInRetirement = 95 - projection.retirement_age;
  
  // Apply higher tax drag to withdrawals
  const taxDragFactor = 1 + (taxBucketLaterPct / 100) * TAX_ASSUMPTIONS.MARGINAL_RATE_HIGH;
  const annualWithdrawal = projection.monthly_income_target * 12 * taxDragFactor;
  
  const simulation = simulatePortfolio(
    projection.projected_portfolio_at_retirement,
    annualWithdrawal,
    SEQUENCE_RISK_RETURNS.NORMAL,
    RETURN_ASSUMPTIONS.CONSERVATIVE,
    yearsInRetirement
  );
  
  const successProbability = calculateSuccessProbability(
    projection.projected_portfolio_at_retirement,
    annualWithdrawal,
    yearsInRetirement,
    RETURN_ASSUMPTIONS.CONSERVATIVE
  );
  
  const sustainableIncome = (projection.projected_portfolio_at_retirement * WITHDRAWAL_RATES.CONSERVATIVE) / 12 / taxDragFactor;
  
  return {
    scenario_name: 'Tax & Longevity',
    scenario_description: `Higher taxes (${Math.round(TAX_ASSUMPTIONS.MARGINAL_RATE_HIGH * 100)}% bracket) + extended life to age 95`,
    success_probability: successProbability,
    projected_shortfall_age: simulation.shortfallYear 
      ? projection.retirement_age + simulation.shortfallYear 
      : null,
    ending_balance_at_90: simulation.endingBalance,
    total_income_received: simulation.totalWithdrawn,
    monthly_sustainable_income: sustainableIncome + 
      projection.income_sources.social_security + 
      projection.income_sources.pension,
    key_insight: taxBucketLaterPct > 50
      ? `High tax-deferred allocation (${Math.round(taxBucketLaterPct)}%) increases tax risk. Consider Roth conversions.`
      : `Tax diversification is reasonable. Monitor future tax law changes.`
  };
}

/**
 * Generate all three scenarios
 */
export function generateAllScenarios(
  projection: RetirementProjection,
  taxBucketLaterPct: number = 0
): RetirementScenarioResult[] {
  return [
    generateBaseScenario(projection),
    generateSequenceRiskScenario(projection),
    generateTaxLongevityScenario(projection, taxBucketLaterPct)
  ];
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
