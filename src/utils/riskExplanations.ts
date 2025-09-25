// Client-focused risk explanation utilities

interface RiskExplanationData {
  age: number;
  annualIncome: string;
  dependents: string;
  retirementAge: string;
  lifeInsurance: string;
  retirementSavings: string;
}

export const getLifeInsuranceExplanation = (riskPercentage: number, data?: RiskExplanationData): string => {
  if (riskPercentage >= 40) {
    return `Your coverage is too low compared to your family's needs. This means in the event of income loss, your family may face a shortfall of ${riskPercentage}% in meeting daily expenses, education, and long-term commitments. Schedule a free strategy session to see how insurance and annuities can close this gap.`;
  } else {
    return `Your coverage is closer to your family's needs, but regular reviews are still important. Consider scheduling a consultation to ensure your protection keeps pace with your growing financial responsibilities.`;
  }
};

export const getLongevityRiskExplanation = (riskPercentage: number, data?: RiskExplanationData): string => {
  if (riskPercentage > 70) {
    return `Your savings may not be sufficient for your expected retirement years. Consider reviewing your retirement savings strategy.`;
  } else if (riskPercentage >= 30) {
    return `Your savings may be enough for early retirement years, but not for later years when expenses like healthcare rise. Consider guaranteed income solutions to protect your retirement lifestyle.`;
  } else {
    return `Your retirement savings are on track, but consider strategies to protect against inflation and healthcare cost increases. Schedule a consultation to optimize your retirement income strategy.`;
  }
};

export const getMarketRiskExplanation = (riskPercentage: number): string => {
  return `Your portfolio has ${riskPercentage}% market exposure. Consider reviewing your risk allocation strategy.`;
};

export const getTaxEstateRiskExplanation = (riskPercentage: number): string => {
  return `Your estate and tax planning may need attention. Consider reviewing your estate planning strategy to optimize tax efficiency.`;
};

export const getOverallRiskMessage = (overallRisk: number, age: number): string => {
  if (overallRisk >= 80) {
    return `At age ${age}, your financial risks are critical. Multiple gaps in your protection strategy need immediate attention. Every day you wait increases your family's exposure to financial hardship.`;
  } else if (overallRisk >= 60) {
    return `At age ${age}, you have significant financial gaps that need attention. Taking action now can save you thousands and secure your family's future.`;
  } else if (overallRisk >= 40) {
    return `You're building a solid foundation, but there are important opportunities to strengthen your financial protection at age ${age}.`;
  } else {
    return `Excellent work! Your financial protection strategy is well-positioned, but regular reviews ensure it stays optimized as your life changes.`;
  }
};