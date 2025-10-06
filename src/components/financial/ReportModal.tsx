import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Shield, DollarSign, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPercentage } from '@/utils/riskComputation';
import jsPDF from 'jspdf';
import type { 
  ComputedMetrics,
  ProfileGoalsData,
  IncomeExpensesData, 
  AssetFormData,
  LiabilityFormData,
  ProtectionHealthData
} from '@/types/financial';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  metrics: ComputedMetrics;
  profileData: ProfileGoalsData;
  incomeData: IncomeExpensesData;
  assets: AssetFormData[];
  liabilities: LiabilityFormData[];
  protectionData: ProtectionHealthData;
}

interface RiskRecommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  nextSteps: string[];
  estimatedCost?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  clientId,
  metrics,
  profileData,
  incomeData,
  assets,
  liabilities,
  protectionData
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Show CTA after 10 seconds
      const timer = setTimeout(() => {
        setShowCTA(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setShowCTA(false);
    }
  }, [isOpen]);

  // ----------------------------
  // ONE SOURCE OF TRUTH: DIME
  // ----------------------------
  const DIME = useMemo(() => {
    const FINAL_EXPENSES = 15000;   // keep final expenses in D
    const INCOME_YEARS   = 10;      // standard DIME
    const REPLACEMENT_RT = 1.0;     // 100% replacement (set to 0.8 if desired)
    const EDU_PER_CHILD  = 100000;  // pick a number and be consistent

    const nonMortgageDebt = liabilities
      .filter(l => l.type !== 'mortgage_primary' && l.type !== 'mortgage_rental')
      .reduce((sum, l) => sum + (l.balance || 0), 0);

    const mortgageBalance = liabilities
      .filter(l => l.type === 'mortgage_primary' || l.type === 'mortgage_rental')
      .reduce((sum, l) => sum + (l.balance || 0), 0);

    const annualIncome = (incomeData.w2_income || 0) + (incomeData.business_income || 0);
    const incomeReplacement = annualIncome * INCOME_YEARS * REPLACEMENT_RT; // annual

    const education = (profileData.dependents || 0) * EDU_PER_CHILD;

    const dime_need =
      nonMortgageDebt +
      FINAL_EXPENSES +
      incomeReplacement +
      mortgageBalance +
      education;

    const currentCoverage =
      (protectionData.term_life_coverage || 0) +
      (protectionData.permanent_life_db || 0);

    const protection_gap = Math.max(0, dime_need - currentCoverage);

    return {
      FINAL_EXPENSES,
      EDU_PER_CHILD,
      nonMortgageDebt,
      mortgageBalance,
      incomeReplacement,
      education,
      dime_need,
      currentCoverage,
      protection_gap
    };
  }, [liabilities, incomeData, profileData, protectionData]);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { 
      label: 'Critical', 
      color: 'bg-red-500', 
      badgeClass: 'bg-red-600 hover:bg-red-700 text-white font-bold shadow-md'
    };
    if (score >= 60) return { 
      label: 'High', 
      color: 'bg-orange-500', 
      badgeClass: 'bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md'
    };
    if (score >= 40) return { 
      label: 'Moderate', 
      color: 'bg-yellow-500', 
      badgeClass: 'bg-yellow-600 hover:bg-yellow-700 text-white font-bold shadow-md'
    };
    if (score >= 20) return { 
      label: 'Low', 
      color: 'bg-blue-500', 
      badgeClass: 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md'
    };
    return { 
      label: 'Minimal', 
      color: 'bg-green-500', 
      badgeClass: 'bg-green-600 hover:bg-green-700 text-white font-bold shadow-md'
    };
  };

  const generateRecommendations = (): RiskRecommendation[] => {
    const recommendations: RiskRecommendation[] = [];
    
    // Use DIME (single source) instead of metrics for consistency
    const totalGaps = [
      DIME.protection_gap > 0,
      metrics.liquidity_runway_months < 6,
      metrics.tax_bucket_never_pct < 20,
      metrics.retirement_gap_mo > 1000
    ].filter(Boolean).length;

    if (totalGaps > 0) {
      recommendations.push({
        id: 'general-recommendation',
        title: 'Financial Planning Consultation Recommended',
        priority: 'high',
        category: 'General',
        description: `Based on your DIME inputs and financial assessment, ${totalGaps > 1 ? 'several areas' : 'an area'} may need attention.`,
        impact: 'Addressing these gaps can help protect your family and secure your retirement.',
        nextSteps: [
          'Review your DIME calculation results carefully',
          'Consider consulting with a licensed financial professional',
          'Explore our calculators to understand different planning strategies',
          'Evaluate your current insurance coverage and retirement savings'
        ]
      });
    }

    if (DIME.protection_gap > 0) {
      recommendations.push({
        id: 'protection-gap-info',
        title: 'Life Insurance Coverage Gap Identified',
        priority: 'high',
        category: 'Protection',
        description: `Based on your DIME calculation, there is a protection gap of ${formatCurrency(DIME.protection_gap)}.`,
        impact: `Your total family needs are estimated at ${formatCurrency(DIME.dime_need)}.`,
        nextSteps: [
          'Review your current life insurance coverage',
          'Discuss coverage options with a licensed insurance agent',
          'Consider your family\'s long-term financial security needs'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Header
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text('Financial Risk Assessment Report', margin, 20);
      pdf.setFontSize(12);
      pdf.text(`${profileData.name_first} ${profileData.name_last}`, margin, 30);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 30, { align: 'right' });
      
      yPos = 50;
      pdf.setTextColor(0, 0, 0);

      // DIME Analysis Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DIME Life Insurance Needs Analysis', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // DIME Components
      const dimeData = [
        ['Component', 'Amount'],
        ['Debt (Non-Mortgage) + Final Expenses', formatCurrency(DIME.nonMortgageDebt + DIME.FINAL_EXPENSES)],
        ['Income Replacement (10 years)', formatCurrency(DIME.incomeReplacement)],
        ['Mortgage Balance', formatCurrency(DIME.mortgageBalance)],
        ['Education Expenses', formatCurrency(DIME.education)],
        ['', ''],
        ['Total DIME Need', formatCurrency(DIME.dime_need)],
        ['Current Coverage', formatCurrency(DIME.currentCoverage)],
        ['Protection Gap', formatCurrency(DIME.protection_gap)]
      ];

      dimeData.forEach((row, index) => {
        checkPageBreak(8);
        if (index === 0 || index === 6) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        pdf.text(row[0], margin, yPos);
        pdf.text(row[1], pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
        if (index === 4 || index === 8) {
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
        }
      });

      // Overall Risk Score
      checkPageBreak(30);
      yPos += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Risk Assessment', margin, yPos);
      yPos += 10;

      pdf.setFontSize(12);
      pdf.text(`Risk Score: ${metrics.scores_jsonb.overall}/100`, margin, yPos);
      pdf.text(`Level: ${getRiskLevel(metrics.scores_jsonb.overall).label}`, margin, yPos + 7);
      yPos += 20;

      // Key Metrics
      pdf.setFontSize(14);
      pdf.text('Key Financial Metrics', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const metricsData = [
        ['Net Worth', formatCurrency(metrics.net_worth)],
        ['Liquidity Runway', `${metrics.liquidity_runway_months} months`],
        ['Tax-Never Allocation', `${metrics.tax_bucket_never_pct}%`],
        ['Retirement Gap', formatCurrency(metrics.retirement_gap_mo)]
      ];

      metricsData.forEach(([label, value]) => {
        checkPageBreak(7);
        pdf.text(`${label}:`, margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      });

      // Recommendations
      checkPageBreak(30);
      yPos += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommendations', margin, yPos);
      yPos += 10;

      const recommendations = generateRecommendations();
      recommendations.forEach((rec, index) => {
        checkPageBreak(25);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${rec.title}`, margin, yPos);
        yPos += 7;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(rec.description, pageWidth - 2 * margin);
        descLines.forEach((line: string) => {
          checkPageBreak(7);
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
        yPos += 5;
      });

      // Tax Buckets
      checkPageBreak(40);
      yPos += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tax Diversification', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const taxData = [
        ['Tax Now (Taxable)', `${metrics.tax_bucket_now_pct}%`],
        ['Tax Later (Tax-Deferred)', `${metrics.tax_bucket_later_pct}%`],
        ['Tax Never (Tax-Free)', `${metrics.tax_bucket_never_pct}%`]
      ];

      taxData.forEach(([label, value]) => {
        checkPageBreak(7);
        pdf.text(label, margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      });

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('The Prosperity Financial', margin, pageHeight - 10);
        pdf.text('theprosperityfinancial.com', pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      // Save the PDF
      pdf.save(`Financial-Assessment-${profileData.name_last}-${new Date().toISOString().split('T')[0]}.pdf`);

      // Also save to database
      const reportData = {
        summary: {
          client_name: `${profileData.name_first} ${profileData.name_last}`,
          generated_date: new Date().toISOString(),
          overall_risk_score: metrics.scores_jsonb.overall,
          net_worth: metrics.net_worth,
          key_metrics: {
            protection_gap: DIME.protection_gap,
            liquidity_months: metrics.liquidity_runway_months,
            concentration_pct: metrics.top_concentration_pct,
            retirement_gap: metrics.retirement_gap_mo
          }
        },
        recommendations: generateRecommendations(),
        tax_buckets: {
          tax_now: { percent: metrics.tax_bucket_now_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + a.current_value, 0) },
          tax_later: { percent: metrics.tax_bucket_later_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + a.current_value, 0) },
          tax_never: { percent: metrics.tax_bucket_never_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + a.current_value, 0) }
        },
        coverage_analysis: {
          dime_need: DIME.dime_need,
          protection_gap: DIME.protection_gap,
          disability_gap: metrics.disability_gap,
          ltc_gap: metrics.ltc_gap
        }
      };

      await supabase
        .from('reports')
        .insert([{
          client_id: clientId,
          report_jsonb: reportData as any,
          pdf_url: null
        }]);

      toast({
        title: "PDF Generated",
        description: "Your financial assessment report has been downloaded."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const recommendations = generateRecommendations();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Financial Risk Assessment Report
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                {profileData.name_first} {profileData.name_last} • Generated {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToPDF} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="tax-buckets">Tax Buckets</TabsTrigger>
            <TabsTrigger value="coverage">Coverage & Income</TabsTrigger>
            <TabsTrigger value="appendix">Appendix</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-4 pr-2">
            <TabsContent value="summary" className="space-y-6">
              {/* DIME Calculation Summary - Prominent Display */}
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    DIME Life Insurance Needs Analysis
                  </CardTitle>
                  <CardDescription className="text-base">
                    Your comprehensive protection needs based on the DIME method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* DIME Components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                          <h4 className="font-bold text-blue-900">Debt (Non-Mortgage)</h4>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">Credit cards, auto loans, etc. + final expenses</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(DIME.nonMortgageDebt + DIME.FINAL_EXPENSES)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                          <h4 className="font-bold text-green-900">Income Replacement</h4>
                        </div>
                        <p className="text-sm text-green-700 mb-2">10 × Annual Income (100% replacement)</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(DIME.incomeReplacement)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200 bg-purple-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-6 h-6 text-purple-600" />
                          <h4 className="font-bold text-purple-900">Mortgage Balance</h4>
                        </div>
                        <p className="text-sm text-purple-700 mb-2">Primary & rental property mortgages</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatCurrency(DIME.mortgageBalance)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                          <h4 className="font-bold text-orange-900">Education & Final Expenses</h4>
                        </div>
                        <p className="text-sm text-orange-700 mb-2">{profileData.dependents} dependents + final costs</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {formatCurrency(DIME.education + DIME.FINAL_EXPENSES)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total DIME Need */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Total DIME Need</h3>
                        <p className="text-white/90 text-sm">Recommended life insurance coverage</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">{formatCurrency(DIME.dime_need)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Coverage vs Need */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-blue-700 mb-1">Current Coverage</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(DIME.currentCoverage)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`border-2 ${DIME.protection_gap > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <CardContent className="pt-6 text-center">
                        <p className={`text-sm mb-1 ${DIME.protection_gap > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          Protection Gap
                        </p>
                        <p className={`text-2xl font-bold ${DIME.protection_gap > 0 ? 'text-red-900' : 'text-green-900'}`}>
                          {formatCurrency(DIME.protection_gap)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-green-700 mb-1">Coverage Ratio</p>
                        <p className="text-2xl font-bold text-green-900">
                          {DIME.dime_need > 0 ? Math.round((DIME.currentCoverage / DIME.dime_need) * 100) : 0}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* General Recommendation */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-2">Financial Planning Recommendation</h4>
                        <p className="text-amber-800">
                          Based on your DIME inputs, {DIME.protection_gap > 0 ? 'you may have a gap.' : 'your coverage appears adequate.'} 
                          {' '}For a full strategy solution, please consult a licensed financial professional.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Risk Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getRiskLevel(metrics.scores_jsonb.overall).color}`} />
                    <span>Overall Risk Score: {metrics.scores_jsonb.overall}/100</span>
                    <Badge className={getRiskLevel(metrics.scores_jsonb.overall).badgeClass}>
                      {getRiskLevel(metrics.scores_jsonb.overall).label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive risk assessment across all financial planning areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.net_worth)}</div>
                      <div className="text-sm text-gray-600">Net Worth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatPercentage(metrics.liquid_pct)}</div>
                      <div className="text-sm text-gray-600">Liquid Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.liquidity_runway_months.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Months Liquidity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.top_concentration_pct)}</div>
                      <div className="text-sm text-gray-600">Top Concentration</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries({
                      'Protection': metrics.scores_jsonb.protection,
                      'Liquidity': metrics.scores_jsonb.liquidity,
                      'Concentration': metrics.scores_jsonb.concentration,
                      'Volatility/Sequence': metrics.scores_jsonb.volatility_sequence,
                      'Longevity': metrics.scores_jsonb.longevity,
                      'Inflation': metrics.scores_jsonb.inflation,
                      'Tax': metrics.scores_jsonb.tax
                     }).map(([category, score]) => {
                      const level = getRiskLevel(score);
                      return (
                        <div key={category} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium w-40">{category}</span>
                            <Progress value={score} className="flex-1" />
                            <span className="text-sm font-medium w-16">{score}/100</span>
                          </div>
                          <Badge className={level.badgeClass}>
                            {level.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-semibold">#{index + 1}</div>
                        {rec.priority === 'high' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {rec.priority === 'medium' && <Info className="h-5 w-5 text-yellow-500" />}
                        {rec.priority === 'low' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        <span>{rec.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge 
                          variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{rec.description}</p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Expected Impact</h4>
                      <p className="text-blue-800">{rec.impact}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Next Steps:</h4>
                      <ul className="space-y-1">
                        {rec.nextSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rec.estimatedCost && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Estimated Cost:</strong> {rec.estimatedCost}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tax-buckets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Bucket Strategy: The 3-Bucket Approach</CardTitle>
                  <CardDescription>
                    Optimize tax efficiency by strategically allocating assets across three tax treatment categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tax Now Bucket */}
                    <Card className="border-2 border-red-200">
                      <CardHeader className="bg-red-50">
                        <CardTitle className="text-lg text-red-800">TAX NOW (Taxable)</CardTitle>
                        <CardDescription className="text-red-700">
                          Pay taxes annually on growth and income
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-red-800">
                            {formatPercentage(metrics.tax_bucket_now_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Liquidity and flexibility</li>
                              <li>• Short-term goals</li>
                              <li>• Tax-loss harvesting</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Brokerage accounts</li>
                              <li>• Savings accounts</li>
                              <li>• Taxable bonds</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Later Bucket */}
                    <Card className="border-2 border-yellow-200">
                      <CardHeader className="bg-yellow-50">
                        <CardTitle className="text-lg text-yellow-800">TAX LATER (Deferred)</CardTitle>
                        <CardDescription className="text-yellow-700">
                          Defer taxes until withdrawal in retirement
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-yellow-800">
                            {formatPercentage(metrics.tax_bucket_later_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Current tax deductions</li>
                              <li>• Long-term growth</li>
                              <li>• Retirement income</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• 401(k) / 403(b)</li>
                              <li>• Traditional IRA</li>
                              <li>• Annuities</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Never Bucket */}
                    <Card className="border-2 border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg text-green-800">TAX NEVER (Tax-Free)</CardTitle>
                        <CardDescription className="text-green-700">
                          Tax-free growth and tax-free distributions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-green-800">
                            {formatPercentage(metrics.tax_bucket_never_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Legacy planning</li>
                              <li>• Sequence risk buffer</li>
                              <li>• Tax diversification</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Roth IRA/401(k)</li>
                              <li>• HSA</li>
                              <li>• Life insurance CV</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Suggested Optimization Strategy</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Target Allocation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX NOW (Liquidity)</span>
                            <span className="font-semibold">20-30%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX LATER (Growth)</span>
                            <span className="font-semibold">40-50%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX NEVER (Protection)</span>
                            <span className="font-semibold">20-30%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Action Items</h4>
                        <ul className="space-y-2 text-sm">
                          {metrics.tax_bucket_never_pct < 20 && (
                            <li className="flex items-start space-x-2">
                              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>Increase tax-free bucket via Roth conversions</span>
                            </li>
                          )}
                          {metrics.tax_bucket_now_pct > 40 && (
                            <li className="flex items-start space-x-2">
                              <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                              <span>Reduce taxable exposure through tax-advantaged accounts</span>
                            </li>
                          )}
                          <li className="flex items-start space-x-2">
                            <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Consider life insurance for additional tax-free growth</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage" className="space-y-6">
              {/* DIME Calculation Summary - Simplified and Clear */}
              <Card className="border-4 border-primary shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Shield className="h-8 w-8" />
                    <span>DIME Life Insurance Need Assessment</span>
                  </CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    Simple calculation of your total family protection need
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  {/* DIME Components in Large, Clear Cards */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-700">What Makes Up Your Protection Need:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">D</span> 
                          <span>Debts & Final Expenses</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(DIME.nonMortgageDebt + DIME.FINAL_EXPENSES)}
                        </div>
                        <div className="text-blue-100 text-sm">
                          All non-mortgage debts + ${DIME.FINAL_EXPENSES.toLocaleString()} final expenses
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">I</span>
                          <span>Income Replacement</span>
                        </div>
                        <div className="text-4xl font-black mb-1">
                          {formatCurrency(DIME.incomeReplacement)}
                        </div>
                        <div className="text-purple-100 text-xs">
                          ≈ {formatCurrency(DIME.incomeReplacement / 12)}/mo (display only)
                        </div>
                        <div className="text-purple-100 text-sm">
                          10 years of income at 100% replacement
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">M</span>
                          <span>Mortgage Balance</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(DIME.mortgageBalance)}
                        </div>
                        <div className="text-green-100 text-sm">
                          Outstanding home loan balance
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">E</span>
                          <span>Education Expenses</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(DIME.education)}
                        </div>
                        <div className="text-orange-100 text-sm">
                          ${DIME.EDU_PER_CHILD.toLocaleString()} per dependent
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Line Results - Big and Clear */}
                  <div className="border-t-4 border-dashed border-gray-300 pt-8">
                    <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Your Protection Summary:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-md">
                        <div className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Total Need (DIME)</div>
                        <div className="text-5xl font-black text-blue-900 mb-2">{formatCurrency(DIME.dime_need)}</div>
                        <div className="text-xs text-blue-600">What your family needs</div>
                      </div>
                      
                      <div className="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200 shadow-md">
                        <div className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">Current Coverage</div>
                        <div className="text-5xl font-black text-green-900 mb-2">
                          {formatCurrency(DIME.currentCoverage)}
                        </div>
                        <div className="text-xs text-green-600">What you have now</div>
                      </div>
                      
                      <div className="text-center p-8 bg-red-50 rounded-xl border-4 border-red-400 shadow-lg">
                        <div className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wide flex items-center justify-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Protection Gap
                        </div>
                        <div className="text-5xl font-black text-red-900 mb-2">{formatCurrency(DIME.protection_gap)}</div>
                        <div className="text-xs text-red-700 font-semibold">Additional coverage needed</div>
                      </div>
                    </div>
                  </div>

                  {/* General Recommendation - Clear and Simple */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-amber-300 p-8 rounded-xl shadow-lg">
                    <h4 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      What This Means For You
                    </h4>
                    <p className="text-lg text-amber-900 leading-relaxed mb-4">
                      {DIME.protection_gap > 0 
                        ? `Based on your DIME calculation, you may have a protection gap of ${formatCurrency(DIME.protection_gap)}. This means your family may not be fully protected if something happens to you.` 
                        : 'Based on your DIME calculation, your current life insurance coverage appears adequate for your family\'s needs.'}
                    </p>
                    <p className="text-base text-amber-800 font-semibold bg-white/50 p-4 rounded-lg">
                      📋 <strong>Next Step:</strong> For a complete strategy tailored to your specific situation, please consult with a licensed financial professional who can review all your options.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <Card>
                  <CardHeader>
                    <CardTitle>Retirement Income Planning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Monthly Income Goal</div>
                        <div className="text-2xl font-bold">{formatCurrency(profileData.desired_monthly_income)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Projected Sources</div>
                        <div className="text-2xl font-bold">{formatCurrency(incomeData.social_security + incomeData.pension_income)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-yellow-700 font-medium">Monthly Gap</div>
                      <div className="text-3xl font-bold text-yellow-800">{formatCurrency(metrics.retirement_gap_mo)}</div>
                    </div>

                    <div className="text-sm space-y-2">
                      <div>• <strong>Social Security:</strong> {formatCurrency(incomeData.social_security)}/mo</div>
                      <div>• <strong>Pension:</strong> {formatCurrency(incomeData.pension_income)}/mo</div>
                      <div>• <strong>Portfolio Withdrawal:</strong> Need to fund gap</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disability Protection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Monthly Income Need (60%)</div>
                        <div className="text-2xl font-bold">{formatCurrency((incomeData.w2_income + incomeData.business_income) * 0.6)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Current Coverage</div>
                        <div className="text-2xl font-bold">{formatCurrency(0)}</div>
                      </div>
                    </div>
                    
                    {metrics.disability_gap > 0 ? (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-sm text-red-700 font-medium">Coverage Gap</div>
                        <div className="text-3xl font-bold text-red-800">{formatCurrency(metrics.disability_gap)}</div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Coverage Status</div>
                        <div className="text-lg font-bold text-green-800">Adequate</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long-Term Care Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Average LTC Cost</div>
                        <div className="text-2xl font-bold">{formatCurrency(5000)}/mo</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Current Coverage</div>
                        <div className="text-2xl font-bold">{formatCurrency(protectionData.ltc_daily_benefit * 30)}/mo</div>
                      </div>
                    </div>
                    
                    {metrics.ltc_gap > 0 ? (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-700 font-medium">Coverage Gap</div>
                        <div className="text-3xl font-bold text-orange-800">{formatCurrency(metrics.ltc_gap)}</div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Coverage Status</div>
                        <div className="text-lg font-bold text-green-800">Adequate</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appendix" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Assumptions & Disclosures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Planning Assumptions:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Average portfolio return: 6% annually</li>
                      <li>• Inflation rate: 3% annually</li>
                      <li>• Life expectancy: Age 92</li>
                      <li>• Income replacement in retirement: 80%</li>
                      <li>• Education costs: $100,000 per dependent (shown in DIME)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Risk Score Methodology:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Scores range from 0 (no risk) to 100 (critical risk)</li>
                      <li>• Overall score is weighted average of individual risk categories</li>
                      <li>• Weightings: Protection 20%, Volatility 20%, Longevity 15%, Tax 15%, Liquidity 10%, Concentration 10%, Inflation 10%</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Important Disclosures:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• This analysis is for educational purposes only and does not constitute investment advice</li>
                      <li>• All projections are hypothetical and not guaranteed</li>
                      <li>• Insurance products require underwriting and suitability analysis</li>
                      <li>• Consult qualified professionals before making financial decisions</li>
                      <li>• Past performance does not guarantee future results</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Action CTAs at Bottom */}
        {showCTA && (
          <div className="sticky bottom-0 bg-gradient-to-r from-primary/5 to-secondary/5 border-t-2 border-primary/20 p-6 mt-8 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ready to Implement These Recommendations?
              </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Buy Insurance CTA */}
              <Button 
                size="lg" 
                className="h-auto py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all group"
                onClick={() => window.open('https://agents.ethoslife.com/invite/6b8bb', '_blank')}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-bold text-base">Get Term Quote Now</div>
                    <div className="text-xs text-white/90">Compare rates • Instant approval</div>
                  </div>
                </div>
              </Button>

              {/* Schedule Strategy Call CTA */}
              <Button 
                size="lg" 
                className="h-auto py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all group"
                onClick={() => {
                  const event = new CustomEvent('openBooking');
                  window.dispatchEvent(event);
                }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-bold text-base">Book Strategy Session</div>
                    <div className="text-xs text-white/90">Free consultation • Expert advice</div>
                  </div>
                </div>
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              ✓ No obligation • ✓ Licensed advisors • ✓ Personalized solutions
            </p>
          </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
