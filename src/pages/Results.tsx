import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RiskProgressRing from "@/components/RiskProgressRing";
import ChatBot from "@/components/ChatBot";
import PredictiveInsights from "@/components/PredictiveInsights";

import { Phone, Mail, Calendar, Download, Share2, AlertTriangle, TrendingUp, Shield, Clock } from "lucide-react";

interface RiskScores {
  lifeInsurance: number;
  longevity: number;
  market: number;
  tax: number;
  overall: number;
}

interface RiskLevels {
  lifeInsurance: string;
  longevity: string;
  market: string;
  tax: string;
  overall: string;
}

const Results = () => {
  const [riskScores, setRiskScores] = useState<RiskScores>({
    lifeInsurance: 0,
    longevity: 0,
    market: 0,
    tax: 0,
    overall: 0
  });
  
  const [riskLevels, setRiskLevels] = useState<RiskLevels>({
    lifeInsurance: "",
    longevity: "",
    market: "",
    tax: "",
    overall: ""
  });

  const [personalizedData, setPersonalizedData] = useState<any>(null);

  useEffect(() => {
    // Get assessment data from sessionStorage
    const assessmentData = sessionStorage.getItem('assessmentData');
    if (assessmentData) {
      const data = JSON.parse(assessmentData);
      setPersonalizedData(data);
      
      // Calculate risk scores based on assessment data
      const scores = calculateRiskScores(data);
      setRiskScores(scores);
      
      // Calculate risk levels
      const levels = {
        lifeInsurance: getRiskLevel(scores.lifeInsurance),
        longevity: getRiskLevel(scores.longevity),
        market: getRiskLevel(scores.market),
        tax: getRiskLevel(scores.tax),
        overall: getRiskLevel(scores.overall)
      };
      setRiskLevels(levels);
    } else {
      // Redirect back to assessment if no data
      window.location.href = '/assessment';
    }
  }, []);

  const calculateRiskScores = (data: any): RiskScores => {
    // This is a simplified risk calculation algorithm
    // In a real application, this would be more sophisticated
    
    const age = parseInt(data.age) || 30;
    
    // Life Insurance Risk Calculation
    let lifeInsuranceRisk = 50; // Base score
    
    // Higher risk if married with dependents
    if (data.maritalStatus === 'married') lifeInsuranceRisk += 15;
    if (parseInt(data.dependents) > 0) lifeInsuranceRisk += parseInt(data.dependents) * 10;
    
    // Higher risk if no or low coverage
    if (data.lifeInsurance === 'none') lifeInsuranceRisk += 30;
    else if (data.lifeInsurance === 'under100k') lifeInsuranceRisk += 20;
    
    // Higher risk with age (premium increases)
    if (age > 40) lifeInsuranceRisk += (age - 40) * 2;
    
    // Longevity Risk Calculation
    let longevityRisk = 40; // Base score
    
    // Higher risk if low retirement savings
    if (data.retirementSavings === 'none') longevityRisk += 40;
    else if (data.retirementSavings === 'under50k') longevityRisk += 30;
    
    // Higher risk if planning late retirement
    const retirementAge = parseInt(data.retirementAge) || 65;
    const yearsToRetirement = retirementAge - age;
    if (yearsToRetirement < 15) longevityRisk += 20;
    
    // Higher risk if wanting high replacement income
    const replacementIncome = parseInt(data.retirementIncome) || 70;
    if (replacementIncome > 80) longevityRisk += 15;
    
    // Market Risk Calculation
    let marketRisk = 30; // Base score
    
    // Higher risk if conservative but young, or aggressive but old
    if (data.riskTolerance === 'conservative' && age < 40) marketRisk += 20;
    if (data.riskTolerance === 'aggressive' && age > 50) marketRisk += 25;
    
    // Higher risk if low diversification
    if (data.investmentAccounts === 'none') marketRisk += 20;
    
    // Tax Risk Calculation
    let taxRisk = 35; // Base score
    
    // Higher risk if no estate planning
    if (data.estatePlanning === 'none') taxRisk += 25;
    
    // Higher risk if high income but poor tax diversification
    if (data.annualIncome.includes('200k') || data.annualIncome.includes('300k')) {
      if (data.retirementSavings === 'none' || data.investmentAccounts === 'none') {
        taxRisk += 20;
      }
    }
    
    // Cap all scores at 100
    lifeInsuranceRisk = Math.min(lifeInsuranceRisk, 100);
    longevityRisk = Math.min(longevityRisk, 100);
    marketRisk = Math.min(marketRisk, 100);
    taxRisk = Math.min(taxRisk, 100);
    
    // Calculate overall risk (weighted average)
    const overallRisk = Math.round(
      (lifeInsuranceRisk * 0.3) + 
      (longevityRisk * 0.3) + 
      (marketRisk * 0.2) + 
      (taxRisk * 0.2)
    );

    return {
      lifeInsurance: lifeInsuranceRisk,
      longevity: longevityRisk,
      market: marketRisk,
      tax: taxRisk,
      overall: overallRisk
    };
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const getUrgencyMessage = (age: number, overallRisk: number): string => {
    if (overallRisk >= 80) {
      return `At age ${age}, your financial risks are critical. Immediate action is needed to protect your family's future. Every day you wait increases your exposure.`;
    } else if (overallRisk >= 60) {
      return `At age ${age}, you have significant financial gaps that need attention. Taking action now can save you thousands in the future.`;
    } else if (overallRisk >= 40) {
      return `You're on the right track, but there are opportunities to strengthen your financial protection at age ${age}.`;
    } else {
      return `Excellent work! Your financial protection strategy is well-positioned for your age.`;
    }
  };

  const getRecommendations = (scores: RiskScores, data: any) => {
    const recommendations = [];
    
    if (scores.lifeInsurance >= 60) {
      recommendations.push({
        category: "Life Insurance",
        priority: "High",
        action: "Increase Life Insurance Coverage",
        description: `Consider obtaining ${10 * (parseInt(data.annualIncome?.split('-')[0]?.replace(/\D/g, '')) || 75)}k in term life insurance coverage.`,
        impact: "Protects family from financial hardship"
      });
    }
    
    if (scores.longevity >= 60) {
      recommendations.push({
        category: "Retirement Planning",
        priority: "High",
        action: "Boost Retirement Savings",
        description: "Increase 401(k) contributions and consider opening a Roth IRA for tax diversification.",
        impact: "Ensures comfortable retirement lifestyle"
      });
    }
    
    if (scores.market >= 60) {
      recommendations.push({
        category: "Investment Strategy",
        priority: "Medium",
        action: "Optimize Asset Allocation",
        description: "Rebalance portfolio based on your age and risk tolerance for better risk-adjusted returns.",
        impact: "Reduces volatility and improves long-term growth"
      });
    }
    
    if (scores.tax >= 60) {
      recommendations.push({
        category: "Tax Planning",
        priority: "Medium", 
        action: "Diversify Tax-Advantaged Accounts",
        description: "Balance traditional and Roth retirement accounts for future tax flexibility.",
        impact: "Minimizes future tax burden"
      });
    }

    return recommendations;
  };

  const age = personalizedData ? parseInt(personalizedData.age) : 35;
  const urgencyMessage = getUrgencyMessage(age, riskScores.overall);
  const recommendations = getRecommendations(riskScores, personalizedData);

  const riskCategories = [
    {
      title: "Life Insurance Risk",
      score: riskScores.lifeInsurance,
      level: riskLevels.lifeInsurance,
      icon: Shield,
      description: "Your family's financial protection gap"
    },
    {
      title: "Longevity Risk", 
      score: riskScores.longevity,
      level: riskLevels.longevity,
      icon: Clock,
      description: "Retirement income sustainability"
    },
    {
      title: "Market Risk",
      score: riskScores.market,
      level: riskLevels.market,
      icon: TrendingUp,
      description: "Investment volatility exposure"
    },
    {
      title: "Tax Risk",
      score: riskScores.tax,
      level: riskLevels.tax,
      icon: AlertTriangle,
      description: "Future tax burden exposure"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container-financial py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-heading">Your Financial Risk Analysis</h1>
              <p className="text-sm text-muted-foreground">
                Personalized assessment completed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="section-padding">
        <div className="container-financial">
          {/* Overall Risk Score */}
          <div className="text-center mb-16">
            <div className="max-w-2xl mx-auto">
              <RiskProgressRing 
                score={riskScores.overall} 
                size={200} 
                strokeWidth={12}
                className="mb-6"
              />
              <h2 className="text-3xl font-bold text-foreground mb-4 font-heading">
                Overall Risk Level: {riskLevels.overall}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {urgencyMessage}
              </p>
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <p className="text-accent font-medium">
                  ⚠️ Remember: Life insurance premiums increase 4-8% each year you wait. 
                  Acting now can save your family thousands.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Risk Categories */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-heading">
              Risk Category Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {riskCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="card-financial text-center">
                    <CardHeader className="pb-4">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg font-heading flex items-center justify-center gap-2">
                        {category.title}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RiskProgressRing 
                        score={category.score} 
                        size={120}
                        label={category.title}
                        className="mb-4"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* AI Predictive Insights */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-heading">
              AI-Powered Future Analysis
            </h3>
            <div className="max-w-2xl mx-auto">
              <PredictiveInsights 
                userProfile={personalizedData}
                riskScores={riskScores}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-heading">
              Personalized Recommendations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((rec, index) => (
                <Card key={index} className="card-financial">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-heading">{rec.action}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'High' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <CardDescription>{rec.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground mb-3">{rec.description}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Impact:</strong> {rec.impact}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="card-financial bg-gradient-card max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">
                  Ready to Take Action on Your Financial Future?
                </CardTitle>
                <CardDescription className="text-lg">
                  Schedule a free consultation with our licensed financial professionals 
                  to discuss your personalized protection strategy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" className="btn-primary">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Free Consultation
                  </Button>
                  <Button size="lg" variant="outline">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Now: 1-800-RISK-PRO
                  </Button>
                  <Button size="lg" variant="outline">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Questions
                  </Button>
                </div>
                <div className="mt-6 text-sm text-muted-foreground">
                  ✓ No obligation consultation • ✓ Licensed professionals • ✓ Personalized solutions
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

export default Results;