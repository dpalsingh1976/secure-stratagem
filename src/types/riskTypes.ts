// Risk assessment data types and interfaces

export interface RiskInputs {
  // Personal info
  currentAge: number;
  plannedRetirementAge: number;
  lifeExpectancyAge: number; // default 92
  
  // Income & expenses
  annualIncome: number;
  monthlyExpenses: number;
  inflationRatePct: number; // default 3
  taxRatePct: number; // default 22

  // Life insurance
  currentLifeCoverage: number;
  liquidAssets: number;
  debtsTotal: number;
  mortgageBalance: number;
  finalExpensesEstimate: number; // default 15000
  educationFundNeeded: number; // optional, default 0
  incomeReplacementYears: number; // default 10
  spouseIncomeOffsetPct: number; // default 0

  // Longevity / retirement
  retirementIncomeSourcesAnnual: number; // pensions + SS + annuity income
  investableAssets: number;
  expectedReturnPct: number; // default 5 real
  withdrawalRatePct: number; // default 4

  // Estate planning flags
  hasEstateDocs: boolean;
  beneficiariesUpdated: boolean;
}

export interface RiskScores {
  lifeInsurance: number;
  longevity: number;
  market: number;
  tax: number;
  overall: number;
}

export interface RiskModalContent {
  title: string;
  chips: string[];
  explainer: string;
  impact: string[];
  ctaPrimary: { label: string; actionId: string };
  ctaSecondary?: { label: string; actionId: string };
  chart: { kind: 'donut' | 'bar'; valuePct: number; caption: string };
}

export type RiskType = 'lifeInsurance' | 'longevity' | 'market' | 'taxEstate';