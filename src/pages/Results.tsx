import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RiskProgressRing from "@/components/RiskProgressRing";
import RiskScoreModal from "@/components/RiskScoreModal";
import ChatBot from "@/components/ChatBot";
import PredictiveInsights from "@/components/PredictiveInsights";
import RiskExplanationDrawer from "@/components/RiskExplanationDrawer";

import { Phone, Mail, Calendar, Download, Share2, AlertTriangle, TrendingUp, Shield, Clock } from "lucide-react";
import { RiskInputs, RiskScores as IRiskScores } from "@/types/riskTypes";
import { calculateAllRisks, getRiskLevel } from "@/utils/riskCalculations";
import { mapAssessmentToRiskInputs } from "@/utils/assessmentDataMapper";
import { getOverallRiskMessage } from "@/utils/riskExplanations";

// Use interface from types
interface RiskScores extends IRiskScores {}

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
  const [riskInputs, setRiskInputs] = useState<RiskInputs | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    // Get assessment data from sessionStorage
    const assessmentData = sessionStorage.getItem('assessmentData');
    if (assessmentData) {
      const data = JSON.parse(assessmentData);
      setPersonalizedData(data);
      
      // Map assessment data to structured inputs
      const inputs = mapAssessmentToRiskInputs(data);
      setRiskInputs(inputs);
      
      // Calculate risk scores using new rule-based system
      const scores = calculateAllRisks(inputs);
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

      // Show CTA after 10 seconds
      const timer = setTimeout(() => {
        setShowCTA(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      // Redirect back to assessment if no data
      window.location.href = '/assessment';
    }
  }, []);

  // Risk calculation is now handled by the new rule-based system

  // getRiskLevel is now imported from utils


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
  const urgencyMessage = getOverallRiskMessage(riskScores.overall, age);
  const recommendations = getRecommendations(riskScores, personalizedData);

  const riskCategories = [
    {
      title: "Life Insurance Gap",
      riskType: "lifeInsurance" as const,
      score: riskScores.lifeInsurance,
      level: riskLevels.lifeInsurance,
      icon: Shield,
    },
    {
      title: "Longevity Risk", 
      riskType: "longevity" as const,
      score: riskScores.longevity,
      level: riskLevels.longevity,
      icon: Clock,
    },
    {
      title: "Market Risk",
      riskType: "market" as const,
      score: riskScores.market,
      level: riskLevels.market,
      icon: TrendingUp,
    },
    {
      title: "Tax & Estate Risk",
      riskType: "taxEstate" as const,
      score: riskScores.tax,
      level: riskLevels.tax,
      icon: AlertTriangle,
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
              {riskInputs && (
                <RiskScoreModal riskScores={riskScores} riskInputs={riskInputs}>
                  <div 
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full inline-block mb-6"
                    aria-label="Open risk score details"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <RiskProgressRing 
                      score={riskScores.overall} 
                      size={200} 
                      strokeWidth={12}
                    />
                  </div>
                </RiskScoreModal>
              )}
              <h2 className="text-3xl font-bold text-foreground mb-4 font-heading">
                Overall Risk Level: {riskLevels.overall}
              </h2>
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
              Personalized Risk Assessment
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {riskCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="card-financial">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg font-heading">
                            {category.title}
                          </CardTitle>
                        </div>
                        {riskInputs && (
                          <RiskExplanationDrawer 
                            riskType={category.riskType}
                            exposurePct={category.score}
                            inputs={riskInputs}
                          />
                        )}
                      </div>
                      <div className="mb-4">
                        <RiskProgressRing 
                          score={category.score} 
                          size={120}
                          className="mb-4"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Risk Level: <span className="text-foreground">{category.level}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Click "Why this risk?" above for detailed explanation and next steps.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Future Analysis */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-heading">
              Personalized Future Outlook
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
          {showCTA && (
            <div className="text-center space-y-6 animate-fade-in">
              {/* Primary CTAs - Action-Oriented */}
              <Card className="card-financial bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20 max-w-5xl mx-auto shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-3xl font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    🎯 Ready to Implement These Recommendations?
                  </CardTitle>
                <CardDescription className="text-lg text-foreground">
                  Your personalized analysis shows opportunities to optimize your protection strategy. 
                  <span className="font-semibold text-primary"> Don't wait - secure your future today!</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Action Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Buy Insurance CTA */}
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                          <Shield className="w-8 h-8" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-xl font-bold mb-2">Get Instant Term Insurance Quote</h3>
                          <p className="text-white/90 text-sm mb-4">
                            Lock in your rate today • Coverage in 24 hours • No medical exam options available
                          </p>
                          <Button 
                            size="lg" 
                            className="w-full bg-white text-green-600 hover:bg-white/90 font-bold"
                            onClick={() => window.open('https://agents.ethoslife.com/invite/6b8bb', '_blank')}
                          >
                            Get Term Quote Now →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Schedule Strategy Call CTA */}
                  <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-xl font-bold mb-2">Book Your Free Strategy Session</h3>
                          <p className="text-white/90 text-sm mb-4">
                            Expert analysis • Custom solutions • Tax optimization strategies • Retirement planning
                          </p>
                          <Button 
                            size="lg" 
                            className="w-full bg-white text-blue-600 hover:bg-white/90 font-bold"
                            onClick={() => window.open('https://calendly.com', '_blank')}
                          >
                            Schedule Now (Free) →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-primary/20">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Phone className="w-5 h-5" />
                    Call: 1-800-RISK-PRO
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Mail className="w-5 h-5" />
                    Email Expert
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No obligation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Licensed professionals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Personalized solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>10,000+ clients served</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

export default Results;
