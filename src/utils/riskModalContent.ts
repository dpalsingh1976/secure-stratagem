// Rule-based modal content generation

import { RiskInputs, RiskModalContent } from '@/types/riskTypes';
import { formatCurrency, getRiskLevel, estimateYearsShort, estimateDrawdownImpact, calculateLifeInsuranceRisk } from './riskCalculations';

// Generate content based on risk band
const getRiskBandMessage = (exposurePct: number): string => {
  if (exposurePct >= 80) return "Action is urgent to avoid shortfalls that could impact your family's lifestyle.";
  if (exposurePct >= 60) return "This gap is significant; delaying may increase cost or reduce options.";
  if (exposurePct >= 30) return "There's a meaningful gap; addressing it now keeps goals on track.";
  return "You're in a good range; keep reviewing annually.";
};

// Risk content generators
export const generateLifeInsuranceContent = (inputs: RiskInputs, exposurePct: number): RiskModalContent => {
  const liResult = calculateLifeInsuranceRisk(inputs);
  const riskLevel = getRiskLevel(exposurePct);
  
  return {
    title: `Life Insurance Gap: Why this is ${riskLevel}`,
    chips: [
      `Income: ${formatCurrency(inputs.annualIncome)}/yr`,
      `Years to replace: ${inputs.incomeReplacementYears}`,
      `Debts: ${formatCurrency(inputs.debtsTotal + inputs.mortgageBalance)}`,
      `Current coverage: ${formatCurrency(inputs.currentLifeCoverage)}`,
      `Liquid assets: ${formatCurrency(inputs.liquidAssets)}`
    ],
    explainer: `We estimated your family's total need using DIME (debts, income replacement, mortgage, education, final expenses) and compared it to your current coverage and liquid assets.`,
    impact: [
      exposurePct >= 60
        ? `If something happens today, your family could face a funding shortfall of ~${Math.round(exposurePct)}% for living costs, debt payoff, and goals.`
        : `There is still a ${Math.round(exposurePct)}% shortfall; reviewing coverage keeps your plan resilient.`,
      getRiskBandMessage(exposurePct)
    ],
    ctaPrimary: { label: 'See your recommended coverage', actionId: 'openCoveragePlanner' },
    ctaSecondary: { label: 'Compare term vs. IUL income options', actionId: 'openPolicyCompare' },
    chart: { kind: 'donut', valuePct: exposurePct, caption: `${Math.round(exposurePct)}% gap vs. need` }
  };
};

export const generateLongevityContent = (inputs: RiskInputs, exposurePct: number): RiskModalContent => {
  const yearsShort = estimateYearsShort(inputs);
  const riskLevel = getRiskLevel(exposurePct);
  
  return {
    title: `Longevity Risk: Why this is ${riskLevel}`,
    chips: [
      `Retirement age: ${inputs.plannedRetirementAge}`,
      `Life expectancy: ${inputs.lifeExpectancyAge}`,
      `Retirement years: ${inputs.lifeExpectancyAge - inputs.plannedRetirementAge}`,
      `Monthly need: ${formatCurrency(inputs.monthlyExpenses)}`,
      `Guaranteed income: ${formatCurrency(inputs.retirementIncomeSourcesAnnual)}/yr`,
      `Investable assets: ${formatCurrency(inputs.investableAssets)}`
    ],
    explainer: `We projected retirement years and compared your annual need to guaranteed income plus a prudent withdrawal from investments.`,
    impact: [
      exposurePct >= 80
        ? `At current pace, you may outlive savings by ${yearsShort} years. Healthcare and inflation amplify this risk.`
        : `There is a measurable income gap later in retirement that could limit lifestyle or force asset liquidation.`,
      getRiskBandMessage(exposurePct)
    ],
    ctaPrimary: { label: 'Get a guaranteed income quote', actionId: 'openAnnuityQuote' },
    ctaSecondary: { label: 'Run "what-if" retirement scenarios', actionId: 'openLongevityScenarios' },
    chart: { kind: 'bar', valuePct: exposurePct, caption: `${Math.round(exposurePct)}% lifetime income shortfall` }
  };
};

export const generateMarketContent = (inputs: RiskInputs, exposurePct: number): RiskModalContent => {
  const drawdownImpact = estimateDrawdownImpact(inputs);
  const riskLevel = getRiskLevel(exposurePct);
  
  return {
    title: `Market Risk: Why this is ${riskLevel}`,
    chips: [
      `Volatile assets: ${Math.round(exposurePct)}%`,
      `Expected return: ${inputs.expectedReturnPct}%`,
      `Withdrawal rate: ${inputs.withdrawalRatePct}%`
    ],
    explainer: `Your exposure reflects how much of the portfolio is in assets that can decline sharply during market downturns.`,
    impact: [
      `A −20% drawdown could delay retirement or reduce sustainable withdrawals by ~${formatCurrency(drawdownImpact)}/yr.`,
      getRiskBandMessage(exposurePct)
    ],
    ctaPrimary: { label: 'See protection options', actionId: 'openProtection' },
    ctaSecondary: { label: 'Test a −20% scenario', actionId: 'openMarketScenario' },
    chart: { kind: 'donut', valuePct: exposurePct, caption: `${Math.round(exposurePct)}% in volatile assets` }
  };
};

export const generateTaxEstateContent = (inputs: RiskInputs, exposurePct: number): RiskModalContent => {
  const riskLevel = getRiskLevel(exposurePct);
  
  return {
    title: `Tax & Estate Risk: Why this is ${riskLevel}`,
    chips: [
      `Marginal tax: ${inputs.taxRatePct}%`,
      `Has will/trust: ${inputs.hasEstateDocs ? 'Yes' : 'No'}`,
      `Beneficiaries updated: ${inputs.beneficiariesUpdated ? 'Yes' : 'No'}`
    ],
    explainer: `Exposure reflects potential tax drag on withdrawals plus leakage from missing or outdated estate documents.`,
    impact: [
      `Uncoordinated withdrawals can forfeit ${inputs.taxRatePct}%+ to taxes. Missing documents can delay asset transfer and increase costs for family.`,
      getRiskBandMessage(exposurePct)
    ],
    ctaPrimary: { label: 'Optimize taxes & beneficiaries', actionId: 'openTaxEstatePlanner' },
    ctaSecondary: { label: 'Download estate checklist', actionId: 'downloadEstateChecklist' },
    chart: { kind: 'donut', valuePct: exposurePct, caption: `${Math.round(exposurePct)}% potential leakage` }
  };
};