import type { 
  ComputedMetrics, 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData, 
  LiabilityFormData, 
  ProtectionHealthData, 
  RiskPreferencesData,
  TaxWrapperType
} from '@/types/financial';

interface RiskComputationInput {
  profileData: ProfileGoalsData;
  incomeData: IncomeExpensesData;
  assets: AssetFormData[];
  liabilities: LiabilityFormData[];
  protectionData: ProtectionHealthData;
  preferencesData: RiskPreferencesData;
}

export const computeRiskMetrics = async (
  clientId: string, 
  input: RiskComputationInput
): Promise<ComputedMetrics> => {
  const {
    profileData,
    incomeData,
    assets,
    liabilities,
    protectionData,
    preferencesData
  } = input;

  // Calculate basic financial metrics
  const totalAssets = assets.reduce((sum, asset) => sum + asset.current_value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Calculate liquidity metrics
  const liquidAssets = assets.filter(a => a.liquidity_score >= 8).reduce((sum, a) => sum + a.current_value, 0);
  const liquidPct = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;

  const monthlyExpenses = incomeData.fixed_expenses + incomeData.variable_expenses + incomeData.debt_service;
  const liquidityRunwayMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;

  // Calculate concentration risk
  const sortedAssets = [...assets].sort((a, b) => b.current_value - a.current_value);
  const topConcentrationPct = totalAssets > 0 && sortedAssets.length > 0 
    ? (sortedAssets[0].current_value / totalAssets) * 100 
    : 0;

  // Calculate tax bucket allocation
  const taxBuckets = assets.reduce(
    (buckets, asset) => {
      buckets[asset.tax_wrapper] += asset.current_value;
      return buckets;
    },
    { TAX_NOW: 0, TAX_LATER: 0, TAX_NEVER: 0 } as Record<TaxWrapperType, number>
  );

  const taxBucketNowPct = totalAssets > 0 ? (taxBuckets.TAX_NOW / totalAssets) * 100 : 0;
  const taxBucketLaterPct = totalAssets > 0 ? (taxBuckets.TAX_LATER / totalAssets) * 100 : 0;
  const taxBucketNeverPct = totalAssets > 0 ? (taxBuckets.TAX_NEVER / totalAssets) * 100 : 0;

  // Calculate DIME method life insurance need
  const totalDebt = totalLiabilities;
  const annualIncome = (incomeData.w2_income + incomeData.business_income) * 12;
  const incomeReplacementYears = Math.max(0, profileData.retirement_age - getCurrentAge(profileData.dob));
  const incomeReplacement = annualIncome * 10; // Standard DIME: 10x annual income
  const mortgageBalance = liabilities
    .filter(l => l.type === 'mortgage_primary' || l.type === 'mortgage_rental')
    .reduce((sum, l) => sum + l.balance, 0);
  const educationExpenses = profileData.dependents * 50000; // Estimate $50k per dependent

  const dimeNeed = totalDebt + incomeReplacement + mortgageBalance + educationExpenses;
  const existingLifeInsurance = protectionData.term_life_coverage + protectionData.permanent_life_db;
  const protectionGap = Math.max(0, dimeNeed - existingLifeInsurance - liquidAssets);

  // Calculate retirement gap
  const monthlyRetirementNeed = profileData.desired_monthly_income;
  const projectedPension = incomeData.pension_income + incomeData.social_security;
  const retirementGapMo = Math.max(0, monthlyRetirementNeed - projectedPension);

  // Calculate disability gap
  const monthlyIncomeNeed = (annualIncome / 12) * 0.6; // 60% of income
  const disabilityGap = monthlyIncomeNeed; // Assuming no disability coverage since field removed

  // Calculate LTC gap (basic estimate)
  const avgLtcCost = 5000; // $5000/month average
  const ltcGap = Math.max(0, avgLtcCost - protectionData.ltc_daily_benefit * 30);

  // Calculate sequence risk index
  const volatileAssets = assets.filter(a => 
    a.asset_type.startsWith('brokerage_') || 
    a.asset_type.startsWith('retirement_') && a.asset_type !== 'retirement_roth_ira'
  ).reduce((sum, a) => sum + a.current_value, 0);
  
  const sequenceRiskIndex = totalAssets > 0 ? (volatileAssets / totalAssets) * 100 : 0;

  // Estimate lifetime tax drag
  const taxableAssets = taxBuckets.TAX_NOW;
  const avgTaxRate = 0.22; // Assume 22% average tax rate
  const avgReturn = 0.06; // 6% average return
  const yearsToRetirement = Math.max(1, profileData.retirement_age - getCurrentAge(profileData.dob));
  
  const lifetimeTaxDragEst = taxableAssets * avgReturn * avgTaxRate * yearsToRetirement;

  // Calculate risk scores (0-100 scale)
  const protectionScore = calculateProtectionScore(protectionGap, dimeNeed, disabilityGap, ltcGap);
  const liquidityScore = calculateLiquidityScore(liquidityRunwayMonths, 6); // Default 6 months target
  const concentrationScore = calculateConcentrationScore(topConcentrationPct, 15); // Default 15% threshold
  const volatilityScore = calculateVolatilityScore(sequenceRiskIndex, preferencesData.risk_tolerance);
  const longevityScore = calculateLongevityScore(retirementGapMo, monthlyRetirementNeed);
  const inflationScore = calculateInflationScore(taxBucketNeverPct, preferencesData.risk_tolerance);
  const taxScore = calculateTaxScore(taxBucketNowPct, lifetimeTaxDragEst, annualIncome);

  // Calculate overall risk score (weighted average)
  const weights = { protection: 0.2, liquidity: 0.1, concentration: 0.1, volatility: 0.2, longevity: 0.15, inflation: 0.1, tax: 0.15 };
  const overallScore = Math.round(
    protectionScore * weights.protection +
    liquidityScore * weights.liquidity +
    concentrationScore * weights.concentration +
    volatilityScore * weights.volatility +
    longevityScore * weights.longevity +
    inflationScore * weights.inflation +
    taxScore * weights.tax
  );

  return {
    client_id: clientId,
    net_worth: netWorth,
    liquid_pct: liquidPct,
    top_concentration_pct: topConcentrationPct,
    liquidity_runway_months: liquidityRunwayMonths,
    dime_need: dimeNeed,
    protection_gap: protectionGap,
    disability_gap: disabilityGap,
    ltc_gap: ltcGap,
    retirement_gap_mo: retirementGapMo,
    seq_risk_index: sequenceRiskIndex,
    tax_bucket_now_pct: taxBucketNowPct,
    tax_bucket_later_pct: taxBucketLaterPct,
    tax_bucket_never_pct: taxBucketNeverPct,
    lifetime_tax_drag_est: lifetimeTaxDragEst,
    scores_jsonb: {
      protection: protectionScore,
      liquidity: liquidityScore,
      concentration: concentrationScore,
      volatility_sequence: volatilityScore,
      longevity: longevityScore,
      inflation: inflationScore,
      tax: taxScore,
      overall: overallScore
    }
  };
};

// Helper functions for risk score calculations
function getCurrentAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function calculateProtectionScore(protectionGap: number, dimeNeed: number, disabilityGap: number, ltcGap: number): number {
  if (dimeNeed === 0) return 0; // No protection needed
  
  const protectionRatio = protectionGap / dimeNeed;
  const disabilityRisk = disabilityGap > 0 ? 20 : 0;
  const ltcRisk = ltcGap > 0 ? 15 : 0;
  
  let score = protectionRatio * 65 + disabilityRisk + ltcRisk;
  return Math.min(100, Math.max(0, score));
}

function calculateLiquidityScore(actualMonths: number, targetMonths: number): number {
  if (actualMonths >= targetMonths) return 0;
  
  const shortfall = (targetMonths - actualMonths) / targetMonths;
  return Math.min(100, shortfall * 100);
}

function calculateConcentrationScore(actualPct: number, thresholdPct: number): number {
  if (actualPct <= thresholdPct) return 0;
  
  const excess = (actualPct - thresholdPct) / thresholdPct;
  return Math.min(100, excess * 50);
}

function calculateVolatilityScore(sequenceRiskIndex: number, riskTolerance: number): number {
  // Higher sequence risk index = higher score (more risk)
  // Higher risk tolerance = lower score (can handle more risk)
  const riskAdjustment = (8 - riskTolerance) / 7; // Scale risk tolerance
  return Math.min(100, sequenceRiskIndex * riskAdjustment * 0.8);
}

function calculateLongevityScore(retirementGap: number, targetIncome: number): number {
  if (targetIncome === 0) return 0;
  
  const gapRatio = retirementGap / targetIncome;
  return Math.min(100, gapRatio * 100);
}

function calculateInflationScore(taxFreePercent: number, riskTolerance: number): number {
  // Less tax-free assets = higher inflation risk
  // Lower risk tolerance = higher sensitivity to inflation
  const taxFreeProtection = taxFreePercent / 100;
  const riskAdjustment = (8 - riskTolerance) / 7;
  
  return Math.min(100, (1 - taxFreeProtection) * 60 + riskAdjustment * 40);
}

function calculateTaxScore(taxNowPct: number, lifetimeTaxDrag: number, annualIncome: number): number {
  // Higher percentage in taxable accounts = higher tax risk
  // Higher tax drag relative to income = higher score
  const taxDragRatio = annualIncome > 0 ? lifetimeTaxDrag / (annualIncome * 10) : 0; // 10-year income comparison
  
  return Math.min(100, (taxNowPct * 0.6) + (taxDragRatio * 40));
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};