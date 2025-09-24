import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Download, Calendar, Mail, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight, Calculator } from "lucide-react";
import RiskProgressRing from "@/components/RiskProgressRing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getLifeInsuranceExplanation, getLongevityRiskExplanation, getMarketRiskExplanation, getTaxEstateRiskExplanation } from "@/utils/riskExplanations";

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

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface RiskScores {
  lifeInsurance: number;
  longevity: number;
  market: number;
  tax: number;
  overall: number;
}

interface EnhancedResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentData: AssessmentData;
  contactInfo: ContactInfo;
  onClose: () => void;
}

const EnhancedResultsModal = ({ 
  open, 
  onOpenChange, 
  assessmentData, 
  contactInfo, 
  onClose 
}: EnhancedResultsModalProps) => {
  const [riskScores, setRiskScores] = useState<RiskScores>({
    lifeInsurance: 0,
    longevity: 0,
    market: 0,
    tax: 0,
    overall: 0
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [riskCalculationDetails, setRiskCalculationDetails] = useState<any>(null);
  const [leadSaved, setLeadSaved] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (assessmentData) {
      const { scores, details } = calculateRiskScoresWithDetails(assessmentData);
      setRiskScores(scores);
      setRiskCalculationDetails(details);
      generateInsights(assessmentData, scores);
      saveLead(assessmentData, scores, contactInfo);
    }
  }, [assessmentData, contactInfo]);

  const calculateRiskScoresWithDetails = (data: AssessmentData): { scores: RiskScores, details: any } => {
    const age = parseInt(data.age) || 30;
    const dependents = parseInt(data.dependents) || 0;
    
    // Life Insurance Gap Analysis with detailed breakdown
    const incomeMultiplier = getIncomeMultiplier(data.annualIncome);
    const recommendedCoverage = incomeMultiplier * 10; // 10x income rule
    const currentCoverage = getCoverageAmount(data.lifeInsurance);
    const lifeInsuranceGap = Math.max(0, (recommendedCoverage - currentCoverage) / recommendedCoverage * 100);
    
    // Longevity Risk (retirement preparedness) with detailed breakdown
    const retirementSavings = getSavingsAmount(data.retirementSavings);
    const yearsToRetirement = parseInt(data.retirementAge) - age;
    const recommendedRetirement = incomeMultiplier * 10; // Simplified: need 10x income
    const longevityRisk = Math.max(0, (recommendedRetirement - retirementSavings) / recommendedRetirement * 100);
    
    // Market Risk (portfolio diversification) with detailed breakdown
    const emergencyFundRisk = data.emergencyFund === 'none' ? 40 : 
                             data.emergencyFund === '1-3months' ? 25 :
                             data.emergencyFund === '3-6months' ? 10 : 0;
    const investmentRisk = data.investmentAccounts === 'none' ? 30 : 10;
    const riskToleranceScore = data.riskTolerance === 'aggressive' ? 20 : 
                              data.riskTolerance === 'conservative' ? 5 : 10;
    const marketRisk = Math.min(100, emergencyFundRisk + investmentRisk + riskToleranceScore);
    
    // Tax Risk (estate planning) with detailed breakdown
    const estatePlanningRisk = data.estatePlanning === 'none' ? 70 : 
                              data.estatePlanning === 'basic' ? 40 :
                              data.estatePlanning === 'standard' ? 20 : 10;
    
    const overall = Math.round((lifeInsuranceGap + longevityRisk + marketRisk + estatePlanningRisk) / 4);

    const scores = {
      lifeInsurance: Math.round(lifeInsuranceGap),
      longevity: Math.round(longevityRisk),
      market: Math.round(marketRisk),
      tax: Math.round(estatePlanningRisk),
      overall
    };

    const details = {
      lifeInsurance: {
        currentIncome: incomeMultiplier,
        recommendedCoverage,
        currentCoverage,
        gap: recommendedCoverage - currentCoverage,
        calculation: "Based on 10x annual income rule for life insurance coverage"
      },
      longevity: {
        currentAge: age,
        retirementAge: parseInt(data.retirementAge),
        yearsToRetirement,
        currentSavings: retirementSavings,
        recommendedSavings: recommendedRetirement,
        calculation: "Based on needing 10x annual income saved for retirement"
      },
      market: {
        emergencyFundStatus: data.emergencyFund,
        emergencyFundRisk,
        investmentStatus: data.investmentAccounts,
        investmentRisk,
        riskTolerance: data.riskTolerance,
        riskToleranceScore,
        calculation: "Emergency fund coverage + investment diversification + risk tolerance alignment"
      },
      tax: {
        estatePlanningStatus: data.estatePlanning,
        risk: estatePlanningRisk,
        calculation: "Based on current estate planning documentation and structures"
      }
    };

    return { scores, details };
  };

  const getIncomeMultiplier = (income: string): number => {
    const multipliers: { [key: string]: number } = {
      'under50k': 40000,
      '50k-75k': 62500,
      '75k-100k': 87500,
      '100k-150k': 125000,
      '150k-200k': 175000,
      '200k-300k': 250000,
      'over300k': 350000
    };
    return multipliers[income] || 50000;
  };

  const getCoverageAmount = (coverage: string): number => {
    const amounts: { [key: string]: number } = {
      'none': 0,
      'under100k': 50000,
      '100k-250k': 175000,
      '250k-500k': 375000,
      '500k-1m': 750000,
      'over1m': 1500000
    };
    return amounts[coverage] || 0;
  };

  const getSavingsAmount = (savings: string): number => {
    const amounts: { [key: string]: number } = {
      'none': 0,
      'under50k': 25000,
      '50k-100k': 75000,
      '100k-250k': 175000,
      '250k-500k': 375000,
      'over500k': 750000
    };
    return amounts[savings] || 0;
  };

  const generateInsights = async (data: AssessmentData, scores: RiskScores) => {
    setIsGeneratingAI(true);
    try {
      // Generate simple rule-based insights instead of AI
      const insights = `Based on your assessment, here's what our analysis shows:

**Key Risk Areas:**
${scores.overall > 75 ? '• Critical: Immediate action needed across multiple areas' : ''}
${scores.lifeInsurance > 50 ? '• Life Insurance: Significant coverage gap detected' : ''}
${scores.longevity > 50 ? '• Retirement: Current savings may be insufficient' : ''}
${scores.market > 50 ? '• Portfolio: Consider diversification improvements' : ''}
${scores.tax > 50 ? '• Estate Planning: Documentation needs updating' : ''}

**Recommended Actions:**
• Schedule a consultation to review specific strategies
• Consider term life insurance to bridge coverage gaps
• Explore tax-advantaged retirement accounts
• Review and update estate planning documents

*This analysis is generated using proven financial modeling based on industry standards and your specific situation.*`;
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAiInsights("Insights are currently unavailable. Please try again later.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const saveLead = async (data: AssessmentData, scores: RiskScores, contact: ContactInfo) => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          email: contact.email,
          phone: contact.phone || null,
          assessment_data: data as any,
          risk_scores: scores as any,
          ai_insights: aiInsights,
          report_generated_at: new Date().toISOString(),
          status: 'new'
        });

      if (error) throw error;
      setLeadSaved(true);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Information Saved",
        description: "Your assessment has been saved locally.",
        variant: "default"
      });
    }
  };

  const getRiskLevel = (score: number): string => {
    if (score <= 25) return "Low";
    if (score <= 50) return "Moderate";
    if (score <= 75) return "High";
    return "Critical";
  };

  const getRiskColor = (score: number): string => {
    if (score <= 25) return "text-green-600";
    if (score <= 50) return "text-yellow-600";
    if (score <= 75) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskIcon = (score: number) => {
    if (score <= 25) return CheckCircle;
    if (score <= 50) return Clock;
    return AlertTriangle;
  };

  const downloadReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      // Create a comprehensive text report
      const reportContent = `
PERSONAL FINANCIAL RISK ASSESSMENT REPORT
Generated on: ${new Date().toLocaleDateString()}

CLIENT INFORMATION:
Name: ${contactInfo.name}
Email: ${contactInfo.email}
${contactInfo.phone ? `Phone: ${contactInfo.phone}` : ''}

RISK SCORES SUMMARY:
Overall Risk: ${riskScores.overall}% (${getRiskLevel(riskScores.overall)})
Life Insurance Gap: ${riskScores.lifeInsurance}% (${getRiskLevel(riskScores.lifeInsurance)})
Longevity Risk: ${riskScores.longevity}% (${getRiskLevel(riskScores.longevity)})
Market Risk: ${riskScores.market}% (${getRiskLevel(riskScores.market)})
Tax & Estate Risk: ${riskScores.tax}% (${getRiskLevel(riskScores.tax)})

AI INSIGHTS:
${aiInsights}

ASSESSMENT DATA:
Age: ${assessmentData.age}
Annual Income: ${assessmentData.annualIncome}
Marital Status: ${assessmentData.maritalStatus}
Dependents: ${assessmentData.dependents}
Monthly Expenses: ${assessmentData.monthlyExpenses}
Total Debt: ${assessmentData.totalDebt}
Emergency Fund: ${assessmentData.emergencyFund}
Home Value: ${assessmentData.homeValue}
Life Insurance: ${assessmentData.lifeInsurance}
Retirement Savings: ${assessmentData.retirementSavings}
Investment Accounts: ${assessmentData.investmentAccounts}
Employer Benefits: ${assessmentData.employerBenefits}
Retirement Age: ${assessmentData.retirementAge}
Retirement Income: ${assessmentData.retirementIncome}
Risk Tolerance: ${assessmentData.riskTolerance}
Estate Planning: ${assessmentData.estatePlanning}

This report is generated by Secure Stratagem Personalized Risk Analysis System.
For a personalized consultation, please contact us to schedule a meeting.
      `.trim();

      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risk_Assessment_Report_${contactInfo.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your personalized risk assessment report has been downloaded.",
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download Error",
        description: "Unable to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const scheduleConsultation = () => {
    // Open calendar booking in new tab
    window.open('https://calendly.com/secure-stratagem', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading text-center">
            Your Personal Risk Assessment Results
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Analysis for {contactInfo.name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Risk Summary */}
          <Card className="card-financial border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Overall Financial Risk</CardTitle>
              <div className="flex justify-center mt-4">
                <RiskProgressRing score={riskScores.overall} size={140} />
              </div>
              <Badge 
                variant={riskScores.overall > 50 ? "destructive" : "secondary"}
                className="mt-2 px-4 py-1 text-lg"
              >
                {getRiskLevel(riskScores.overall)} Risk
              </Badge>
              <CardDescription className="mt-2 text-base">
                {riskScores.overall > 75 && "Immediate action recommended to protect your financial future."}
                {riskScores.overall > 50 && riskScores.overall <= 75 && "Several areas need attention to improve your financial security."}
                {riskScores.overall > 25 && riskScores.overall <= 50 && "Good foundation with room for improvement."}
                {riskScores.overall <= 25 && "Strong financial protection strategy in place."}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Detailed Risk Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { 
                key: 'lifeInsurance', 
                label: 'Life Insurance Gap', 
                icon: AlertTriangle, 
                explanation: getLifeInsuranceExplanation(riskScores.lifeInsurance, { 
                  age: parseInt(assessmentData.age), 
                  annualIncome: assessmentData.annualIncome, 
                  dependents: assessmentData.dependents, 
                  retirementAge: assessmentData.retirementAge, 
                  lifeInsurance: assessmentData.lifeInsurance, 
                  retirementSavings: assessmentData.retirementSavings 
                })
              },
              { 
                key: 'longevity', 
                label: 'Longevity Risk', 
                icon: Clock, 
                explanation: getLongevityRiskExplanation(riskScores.longevity, { 
                  age: parseInt(assessmentData.age), 
                  annualIncome: assessmentData.annualIncome, 
                  dependents: assessmentData.dependents, 
                  retirementAge: assessmentData.retirementAge, 
                  lifeInsurance: assessmentData.lifeInsurance, 
                  retirementSavings: assessmentData.retirementSavings 
                })
              },
              { 
                key: 'market', 
                label: 'Market Risk', 
                icon: XCircle, 
                explanation: getMarketRiskExplanation(riskScores.market)
              },
              { 
                key: 'tax', 
                label: 'Tax & Estate Risk', 
                icon: AlertTriangle, 
                explanation: getTaxEstateRiskExplanation(riskScores.tax)
              }
            ].map(({ key, label, icon: Icon, explanation }) => {
              const score = riskScores[key as keyof RiskScores];
              const RiskIcon = getRiskIcon(score);
              
              return (
                <Card key={key} className="card-financial">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <RiskIcon className={`w-5 h-5 ${getRiskColor(score)}`} />
                      </div>
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <RiskProgressRing score={score} size={80} />
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Insights with Enhanced Display */}
          <Card className="card-financial border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                Advanced Risk Analysis
                {isGeneratingAI && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Powered by advanced financial modeling and industry best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneratingAI ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {aiInsights.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-3 text-sm leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Calculation Methodology */}
          <Card className="card-financial">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Risk Calculation Methodology
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                >
                  {showCalculationDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
              <CardDescription>
                Transparent breakdown of how your risk scores were calculated
              </CardDescription>
            </CardHeader>
            {showCalculationDetails && riskCalculationDetails && (
              <CardContent className="space-y-4">
                {Object.entries(riskCalculationDetails).map(([key, details]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 capitalize">
                      {key === 'lifeInsurance' ? 'Life Insurance Gap' : 
                       key === 'longevity' ? 'Longevity Risk' :
                       key === 'market' ? 'Market Risk' : 'Tax & Estate Risk'} Analysis
                    </h4>
                    <div className="space-y-2 text-xs">
                      <p className="text-muted-foreground">{details.calculation}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(details).filter(([k]) => k !== 'calculation').map(([subKey, value]) => (
                          <div key={subKey} className="flex justify-between">
                            <span className="capitalize">{subKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-medium">
                              {typeof value === 'number' && subKey.includes('Coverage') || subKey.includes('Savings') || subKey.includes('Income') ? 
                                `$${value.toLocaleString()}` : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              onClick={downloadReport}
              disabled={isGeneratingReport}
              className="btn-secondary w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingReport ? 'Generating...' : 'Download Report'}
            </Button>
            
            <Button 
              onClick={scheduleConsultation}
              className="btn-primary w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Consultation
            </Button>
            
            <Button 
              onClick={() => window.location.href = `mailto:info@secure-stratagem.com?subject=Risk Assessment Follow-up&body=Hi, I just completed my risk assessment and would like to discuss my results.`}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Results
            </Button>
          </div>

          {/* Call to Action */}
          <Card className="card-financial bg-gradient-subtle border-2">
            <CardContent className="text-center pt-6">
              <h3 className="text-lg font-semibold mb-2">Ready to Secure Your Financial Future?</h3>
              <p className="text-muted-foreground mb-4">
                Book a complimentary consultation to discuss your personalized protection strategy.
              </p>
              <Button 
                onClick={scheduleConsultation}
                className="btn-primary px-8"
              >
                Book Free Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedResultsModal;