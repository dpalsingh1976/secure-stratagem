// Map assessment form data to RiskInputs format

import { RiskInputs } from '@/types/riskTypes';

// Helper to parse string numbers with defaults
const parseNumber = (value: string | number | undefined, defaultValue: number): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

// Helper to parse income ranges
const parseIncomeRange = (incomeRange: string | undefined): number => {
  if (!incomeRange) return 75000;
  
  const ranges: { [key: string]: number } = {
    'under25k': 25000,
    '25k-50k': 37500,
    '50k-75k': 62500,
    '75k-100k': 87500,
    '100k-150k': 125000,
    '150k-200k': 175000,
    '200k-300k': 250000,
    '300k+': 350000
  };
  
  return ranges[incomeRange] || 75000;
};

// Helper to parse asset ranges
const parseAssetRange = (assetRange: string | undefined): number => {
  if (!assetRange) return 0;
  
  const ranges: { [key: string]: number } = {
    'none': 0,
    'under10k': 5000,
    'under25k': 12500,
    'under50k': 25000,
    'under100k': 50000,
    '50k-100k': 75000,
    '100k-250k': 175000,
    '250k-500k': 375000,
    '500k-1m': 750000,
    '1m+': 1250000
  };
  
  return ranges[assetRange] || 0;
};

// Helper to parse life insurance coverage
const parseLifeInsuranceRange = (coverage: string | undefined): number => {
  if (!coverage) return 0;
  
  const ranges: { [key: string]: number } = {
    'none': 0,
    'under100k': 50000,
    '100k-250k': 175000,
    '250k-500k': 375000,
    '500k-1m': 750000,
    '1m+': 1250000
  };
  
  return ranges[coverage] || 0;
};

// Map assessment data to structured RiskInputs
export const mapAssessmentToRiskInputs = (assessmentData: any): RiskInputs => {
  const currentAge = parseNumber(assessmentData.age, 35);
  const annualIncome = parseIncomeRange(assessmentData.annualIncome);
  
  return {
    // Personal info
    currentAge,
    plannedRetirementAge: parseNumber(assessmentData.retirementAge, 65),
    lifeExpectancyAge: 92, // Default life expectancy

    // Income & expenses
    annualIncome,
    monthlyExpenses: Math.round(annualIncome * 0.7 / 12), // Estimate 70% of gross income
    inflationRatePct: 3,
    taxRatePct: 22,

    // Life insurance
    currentLifeCoverage: parseLifeInsuranceRange(assessmentData.lifeInsurance),
    liquidAssets: parseAssetRange(assessmentData.emergencyFund) || 10000,
    debtsTotal: annualIncome * 0.3, // Estimate 30% of income in non-mortgage debt
    mortgageBalance: assessmentData.maritalStatus === 'married' ? annualIncome * 3 : annualIncome * 2.5,
    finalExpensesEstimate: 15000,
    educationFundNeeded: parseNumber(assessmentData.dependents, 0) * 50000, // $50k per dependent
    incomeReplacementYears: 10,
    spouseIncomeOffsetPct: assessmentData.maritalStatus === 'married' ? 30 : 0,

    // Longevity / retirement
    retirementIncomeSourcesAnnual: annualIncome * 0.4, // Estimate 40% from SS/pensions
    investableAssets: parseAssetRange(assessmentData.retirementSavings),
    expectedReturnPct: 5,
    withdrawalRatePct: 4,

    // Estate planning flags
    hasEstateDocs: assessmentData.estatePlanning !== 'none',
    beneficiariesUpdated: assessmentData.estatePlanning === 'comprehensive'
  };
};