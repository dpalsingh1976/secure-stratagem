// Rule-based risk calculation utilities

import { RiskInputs, RiskScores } from '@/types/riskTypes';

// Helper function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to clamp values between min and max
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Get risk level from percentage
export const getRiskLevel = (score: number): string => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
};

// Life Insurance Gap Calculation (DIME method)
export const calculateLifeInsuranceRisk = (inputs: RiskInputs): { exposurePct: number; need: number; available: number; gap: number } => {
  // Calculate total need using DIME method
  const need = 
    inputs.debtsTotal + 
    inputs.mortgageBalance + 
    inputs.finalExpensesEstimate + 
    inputs.educationFundNeeded + 
    (inputs.annualIncome * 10); // Standard DIME: 10x annual income

  const available = inputs.currentLifeCoverage + inputs.liquidAssets;
  const gap = Math.max(0, need - available);
  const exposurePct = need > 0 ? clamp((gap / need) * 100, 0, 100) : 0;

  return { exposurePct, need, available, gap };
};

// Longevity Risk Calculation
export const calculateLongevityRisk = (inputs: RiskInputs): { exposurePct: number; yearsShort: number; lifetimeGap: number } => {
  const retYears = inputs.lifeExpectancyAge - inputs.plannedRetirementAge;
  const retNeed = inputs.monthlyExpenses * 12; // Annual retirement need

  const guaranteedIncome = inputs.retirementIncomeSourcesAnnual;
  const portfolioIncome = inputs.investableAssets * (inputs.withdrawalRatePct / 100);
  const annualGap = Math.max(0, retNeed - (guaranteedIncome + portfolioIncome));
  const lifetimeGap = annualGap * retYears;
  const lifetimeNeed = retNeed * retYears;
  
  const exposurePct = lifetimeNeed > 0 ? clamp((lifetimeGap / lifetimeNeed) * 100, 0, 100) : 0;
  const yearsShort = retNeed > 0 ? Math.round((lifetimeGap / retNeed)) : 0;

  return { exposurePct, yearsShort, lifetimeGap };
};

// Market Risk Calculation (simplified)
export const calculateMarketRisk = (inputs: RiskInputs): number => {
  // Simplified market risk based on age and asset allocation
  const age = inputs.currentAge;
  let riskPct = 60; // Base market exposure assumption

  // Age-based adjustment (rule of thumb: 100 - age = stock allocation)
  const recommendedEquityPct = Math.max(20, 100 - age);
  if (riskPct > recommendedEquityPct + 20) riskPct += 20; // Too aggressive for age
  if (riskPct < recommendedEquityPct - 20) riskPct += 15; // Too conservative, inflation risk

  return clamp(riskPct, 0, 100);
};

// Tax & Estate Risk Calculation
export const calculateTaxEstateRisk = (inputs: RiskInputs): number => {
  let riskPct = 35; // Base score

  // Higher risk if no estate planning
  if (!inputs.hasEstateDocs) riskPct += 25;
  if (!inputs.beneficiariesUpdated) riskPct += 15;

  // Higher risk for high earners without tax diversification
  if (inputs.annualIncome > 200000) {
    riskPct += 15;
  }

  // Tax rate impact
  riskPct += Math.max(0, inputs.taxRatePct - 22) * 0.5;

  return clamp(riskPct, 0, 100);
};

// Main calculation function
export const calculateAllRisks = (inputs: RiskInputs): RiskScores => {
  const lifeInsuranceResult = calculateLifeInsuranceRisk(inputs);
  const longevityResult = calculateLongevityRisk(inputs);
  const marketRisk = calculateMarketRisk(inputs);
  const taxRisk = calculateTaxEstateRisk(inputs);

  // Calculate overall risk (weighted average)
  const overall = Math.round(
    (lifeInsuranceResult.exposurePct * 0.3) + 
    (longevityResult.exposurePct * 0.3) + 
    (marketRisk * 0.2) + 
    (taxRisk * 0.2)
  );

  return {
    lifeInsurance: Math.round(lifeInsuranceResult.exposurePct),
    longevity: Math.round(longevityResult.exposurePct),
    market: Math.round(marketRisk),
    tax: Math.round(taxRisk),
    overall
  };
};

// Helper functions for modal content
export const estimateYearsShort = (inputs: RiskInputs): number => {
  const longevityResult = calculateLongevityRisk(inputs);
  return longevityResult.yearsShort;
};

export const estimateDrawdownImpact = (inputs: RiskInputs): number => {
  // Estimate impact of 20% market drawdown on annual withdrawal
  const portfolioValue = inputs.investableAssets;
  const currentWithdrawal = portfolioValue * (inputs.withdrawalRatePct / 100);
  const drawdownValue = portfolioValue * 0.8; // 20% drawdown
  const newWithdrawal = drawdownValue * (inputs.withdrawalRatePct / 100);
  
  return Math.round(currentWithdrawal - newWithdrawal);
};