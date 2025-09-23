import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RiskProgressRing from "@/components/RiskProgressRing";
import { Phone, Mail, Calendar, Download, Share2, AlertTriangle, TrendingUp, Shield, Clock, ExternalLink } from "lucide-react";
import { getLifeInsuranceExplanation, getLongevityRiskExplanation, getMarketRiskExplanation, getTaxEstateRiskExplanation, getOverallRiskMessage } from "@/utils/riskExplanations";

interface AssessmentData {
  age: string;
  annualIncome: string;
  maritalStatus: string;
  dependents: string;
  monthlyExpenses: string;
  totalDebt: string;
  emergencyFund: string;
  homeValue: string;
  lifeInsurance: string;
  retirementSavings: string;
  investmentAccounts: string;
  employerBenefits: string;
  retirementAge: string;
  retirementIncome: string;
  riskTolerance: string;
  estatePlanning: string;
}

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

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentData: AssessmentData;
  onClose: () => void;
}

const ResultsModal = ({ open, onOpenChange, assessmentData, onClose }: ResultsModalProps) => {
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

  useEffect(() => {
    if (assessmentData) {
      // Calculate risk scores based on assessment data
      const scores = calculateRiskScores(assessmentData);
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
    }
  }, [assessmentData]);

  const calculateRiskScores = (data: AssessmentData): RiskScores => {
    // This is a simplified risk calculation algorithm
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


  const getRecommendations = (scores: RiskScores, data: AssessmentData) => {
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

  const age = parseInt(assessmentData.age) || 35;
  const urgencyMessage = getOverallRiskMessage(riskScores.overall, age);
  const recommendations = getRecommendations(riskScores, assessmentData);

  const riskCategories = [
    {
      title: "Life Insurance Gap",
      score: riskScores.lifeInsurance,
      level: riskLevels.lifeInsurance,
      icon: Shield,
      explanation: getLifeInsuranceExplanation(riskScores.lifeInsurance, { age, annualIncome: assessmentData.annualIncome, dependents: assessmentData.dependents, retirementAge: assessmentData.retirementAge, lifeInsurance: assessmentData.lifeInsurance, retirementSavings: assessmentData.retirementSavings })
    },
    {
      title: "Longevity Risk", 
      score: riskScores.longevity,
      level: riskLevels.longevity,
      icon: Clock,
      explanation: getLongevityRiskExplanation(riskScores.longevity, { age, annualIncome: assessmentData.annualIncome, dependents: assessmentData.dependents, retirementAge: assessmentData.retirementAge, lifeInsurance: assessmentData.lifeInsurance, retirementSavings: assessmentData.retirementSavings })
    },
    {
      title: "Market Risk",
      score: riskScores.market,
      level: riskLevels.market,
      icon: TrendingUp,
      explanation: getMarketRiskExplanation(riskScores.market)
    },
    {
      title: "Tax & Estate Risk",
      score: riskScores.tax,
      level: riskLevels.tax,
      icon: AlertTriangle,
      explanation: getTaxEstateRiskExplanation(riskScores.tax)
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading text-center">
            Your Financial Risk Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 mt-4">
          {/* Overall Risk Score */}
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              <RiskProgressRing 
                score={riskScores.overall} 
                size={150} 
                strokeWidth={12}
                className="mb-4"
              />
              <h2 className="text-2xl font-bold text-foreground mb-3 font-heading">
                Overall Risk Level: {riskLevels.overall}
              </h2>
              <p className="text-muted-foreground mb-4">
                {urgencyMessage}
              </p>
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                <p className="text-accent font-medium text-sm">
                  ⚠️ Remember: Life insurance premiums increase 4-8% each year you wait. 
                  Acting now can save your family thousands.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Risk Categories */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6 text-center font-heading">
              Personalized Risk Assessment
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {riskCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="card-financial">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-heading">{category.title}</CardTitle>
                      </div>
                      <div className="mb-4">
                        <RiskProgressRing 
                          score={category.score} 
                          size={100}
                          className="mb-2"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground leading-relaxed">
                        {category.explanation}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-foreground mb-6 text-center font-heading">
                Personalized Recommendations
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((rec, index) => (
                  <Card key={index} className="card-financial">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-heading">{rec.action}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'High' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-foreground mb-2">{rec.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Impact:</strong> {rec.impact}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action with Term Coverage Link */}
          <div className="text-center">
            <Card className="card-financial bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-xl font-heading">
                  Ready to Protect Your Family's Future?
                </CardTitle>
                <CardDescription>
                  Take immediate action to secure your financial protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
                  <Button size="lg" className="btn-primary">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Term Life Insurance Quote
                  </Button>
                  <Button size="lg" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Free Consultation
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call: 1-800-RISK-PRO
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Questions
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  ✓ No obligation • ✓ Licensed professionals • ✓ Instant quotes
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;