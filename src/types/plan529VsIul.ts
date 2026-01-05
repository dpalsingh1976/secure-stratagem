// Goal types
export type SavingsGoal = 
  | 'education' 
  | 'flex_savings' 
  | 'legacy' 
  | 'retirement_supplement';

export type RiskTolerance = 'conservative' | 'balanced' | 'growth';
export type LiquidityNeed = 'low' | 'medium' | 'high';
export type IULDesignGoal = 'cash_focused' | 'balanced';

// Main input interface
export interface Plan529VsIulInputs {
  // Step 1: Goals
  goals: SavingsGoal[];
  
  // Step 2: Education Certainty
  educationProbability: number; // 0-100
  scholarshipLikely: boolean;
  nonTraditionalPath: boolean;
  
  // Step 3: Funding & Taxes
  childAge: number;
  yearsToGoal: number;
  monthlyContribution: number;
  initialLumpSum: number;
  inflationAssumption: number;
  riskTolerance: RiskTolerance;
  liquidityNeed: LiquidityNeed;
  
  // Tax inputs
  federalTaxBracket: number;
  stateTaxBenefitEnabled: boolean;
  stateTaxBenefitAmount: number;
  stateRecaptureRisk: boolean;
  
  // Roth rollover
  considerRothRollover: boolean;
  rothRolloverLimit: number;
  yearsAccountOpened: number;
  beneficiaryHasEarnedIncome: boolean;
  annualRothLimit: number;
  
  // IUL design
  iulDesignGoal: IULDesignGoal;
  mecRiskGuard: boolean;
  policyLoanInterest: number;
  maxLoanToValueRatio: number;
  
  // Education specifics
  expectedEducationCostToday: number;
  scholarshipCoveragePercent: number;
  percentUsedForEducation: number;
}

// Scenario result
export interface ScenarioResult {
  scenarioName: string;
  scenarioDescription: string;
  fv529Net: number;
  fvIulAccessible: number;
  taxesPaid529: number;
  penalties529: number;
  rothRolloverAmount: number;
  winner: '529' | 'IUL' | 'tie';
  summary: string;
}

// Infinite Banking result
export interface InfiniteBankingResult {
  iulAnnualIncomeAvailable: number;
  iulIncomeYears: number;
  iulTotalIncomeProjected: number;
  iulCashValueAfterIncome: number;
  can529GenerateIncome: boolean;
  reason529CannotDoIB: string;
}

// Full comparison result
export interface Plan529VsIulResult {
  // Contribution totals
  totalContributed: number;
  totalContributedInflationAdjusted: number;
  
  // 529 projections
  fv529Gross: number;
  fv529EducationNet: number;
  fv529NonQualifiedNet: number;
  fv529MixedNet: number;
  earnings529: number;
  stateTaxBenefit: number;
  
  // IUL projections
  fvIulCashValueGross: number;
  fvIulAccessible: number;
  policyLoanRiskFlag: boolean;
  
  // Roth rollover
  rothRolloverPossible: number;
  remainingNonQualified: number;
  
  // Infinite Banking
  infiniteBanking: InfiniteBankingResult;
  
  // Recommendation
  recommendation: RecommendationResult;
  
  // Assumptions used (for audit)
  assumptionsUsed: AssumptionsSnapshot;
}

export interface RecommendationResult {
  primaryRecommendation: '529_first' | 'iul_consideration' | 'hybrid';
  confidenceLevel: 'high' | 'medium' | 'low';
  whyBullets: string[];
  considerations: string[];
  summary: string;
}

export interface AssumptionsSnapshot {
  return529: number;
  returnIulNet: number;
  inflation: number;
  years: number;
  penaltyRate: number;
  federalTaxRate: number;
}

// Scorecard comparison
export interface ScorecardItem {
  category: string;
  label529: string;
  labelIul: string;
  winner: '529' | 'IUL' | 'tie';
  tooltip: string;
}

// Default input values
export const DEFAULT_INPUTS: Plan529VsIulInputs = {
  goals: ['education'],
  educationProbability: 75,
  scholarshipLikely: false,
  nonTraditionalPath: false,
  childAge: 0,
  yearsToGoal: 18,
  monthlyContribution: 500,
  initialLumpSum: 0,
  inflationAssumption: 0.03,
  riskTolerance: 'balanced',
  liquidityNeed: 'medium',
  federalTaxBracket: 0.22,
  stateTaxBenefitEnabled: false,
  stateTaxBenefitAmount: 0,
  stateRecaptureRisk: false,
  considerRothRollover: true,
  rothRolloverLimit: 35000,
  yearsAccountOpened: 18,
  beneficiaryHasEarnedIncome: true,
  annualRothLimit: 7000,
  iulDesignGoal: 'cash_focused',
  mecRiskGuard: true,
  policyLoanInterest: 0.055,
  maxLoanToValueRatio: 0.80,
  expectedEducationCostToday: 100000,
  scholarshipCoveragePercent: 0,
  percentUsedForEducation: 50,
};
