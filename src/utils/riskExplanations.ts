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
    const yearsShortfall = data ? Math.round((parseInt(data.retirementAge) - data.age) * (riskPercentage / 100)) : Math.round(riskPercentage / 10);
    return `You're projected to outlive your savings by ${yearsShortfall} years. This creates a critical gap for retirement income and healthcare costs. Ask about solutions that guarantee lifetime income, so you never outlive your savings.`;
  } else if (riskPercentage >= 30) {
    return `Your savings may be enough for early retirement years, but not for later years when expenses like healthcare rise. Consider guaranteed income solutions to protect your retirement lifestyle.`;
  } else {
    return `Your retirement savings are on track, but consider strategies to protect against inflation and healthcare cost increases. Schedule a consultation to optimize your retirement income strategy.`;
  }
};

export const getMarketRiskExplanation = (riskPercentage: number): string => {
  return `${riskPercentage}% exposure means your portfolio may drop during market downturns. Diversification and protection strategies can reduce this risk. Schedule a consultation to review portfolio protection options that can safeguard your wealth.`;
};

export const getTaxEstateRiskExplanation = (riskPercentage: number): string => {
  return `Without proper estate and tax planning, up to ${riskPercentage}% of your assets could be lost to taxes instead of passing to your family. Speak with our estate planning specialists about strategies to protect your legacy.`;
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