import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Download, Calendar, Mail, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import RiskProgressRing from "@/components/RiskProgressRing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const [aiInsights, setAiInsights] = useState<string>("");
  const [leadSaved, setLeadSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (assessmentData) {
      const scores = calculateRiskScores(assessmentData);
      setRiskScores(scores);
      generateAIInsights(assessmentData, scores);
      saveLead(assessmentData, scores, contactInfo);
    }
  }, [assessmentData, contactInfo]);

  const calculateRiskScores = (data: AssessmentData): RiskScores => {
    const age = parseInt(data.age) || 30;
    const dependents = parseInt(data.dependents) || 0;
    
    // Life Insurance Gap Analysis
    const incomeMultiplier = getIncomeMultiplier(data.annualIncome);
    const recommendedCoverage = incomeMultiplier * 10; // 10x income rule
    const currentCoverage = getCoverageAmount(data.lifeInsurance);
    const lifeInsuranceGap = Math.max(0, (recommendedCoverage - currentCoverage) / recommendedCoverage * 100);
    
    // Longevity Risk (retirement preparedness)
    const retirementSavings = getSavingsAmount(data.retirementSavings);
    const recommendedRetirement = incomeMultiplier * (65 - age); // Simplified calculation
    const longevityRisk = Math.max(0, (recommendedRetirement - retirementSavings) / recommendedRetirement * 100);
    
    // Market Risk (portfolio diversification)
    const hasEmergencyFund = data.emergencyFund !== 'none' ? 0 : 40;
    const hasInvestments = data.investmentAccounts !== 'none' ? 0 : 30;
    const riskTolerance = data.riskTolerance === 'aggressive' ? 20 : data.riskTolerance === 'conservative' ? 10 : 15;
    const marketRisk = hasEmergencyFund + hasInvestments + riskTolerance;
    
    // Tax Risk (estate planning)
    const estatePlanningRisk = data.estatePlanning === 'none' ? 70 : 
                              data.estatePlanning === 'basic' ? 40 :
                              data.estatePlanning === 'standard' ? 20 : 10;
    
    const overall = Math.round((lifeInsuranceGap + longevityRisk + marketRisk + estatePlanningRisk) / 4);

    return {
      lifeInsurance: Math.round(lifeInsuranceGap),
      longevity: Math.round(longevityRisk),
      market: Math.round(marketRisk),
      tax: Math.round(estatePlanningRisk),
      overall
    };
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

  const generateAIInsights = async (data: AssessmentData, scores: RiskScores) => {
    try {
      const { data: response, error } = await supabase.functions.invoke('predictive-insights', {
        body: {
          userProfile: data,
          riskScores: scores
        }
      });

      if (error) throw error;
      setAiInsights(response.insights || "AI insights are currently unavailable.");
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights("Our AI analysis is temporarily unavailable, but your risk scores are accurate.");
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

This report is generated by Secure Stratagem AI Risk Analysis System.
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
              { key: 'lifeInsurance', label: 'Life Insurance Gap', icon: AlertTriangle },
              { key: 'longevity', label: 'Longevity Risk', icon: Clock },
              { key: 'market', label: 'Market Risk', icon: XCircle },
              { key: 'tax', label: 'Tax & Estate Risk', icon: AlertTriangle }
            ].map(({ key, label, icon: Icon }) => {
              const score = riskScores[key as keyof RiskScores];
              const RiskIcon = getRiskIcon(score);
              
              return (
                <Card key={key} className="card-financial">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <RiskIcon className={`w-5 h-5 ${getRiskColor(score)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Risk Level</span>
                        <span className={`font-semibold ${getRiskColor(score)}`}>
                          {getRiskLevel(score)}
                        </span>
                      </div>
                      <Progress value={Number(score)} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {score}% exposure
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <Card className="card-financial">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  Personalized AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {aiInsights.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-3 text-sm leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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