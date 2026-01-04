import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Shield, DollarSign, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPercentage } from '@/utils/riskComputation';
import jsPDF from 'jspdf';
import BookingCalendar from '@/components/BookingCalendar';
import { RetirementScoreRing } from './RetirementScoreRing';

import type { 
  ComputedMetrics,
  ProfileGoalsData,
  IncomeExpensesData, 
  AssetFormData,
  LiabilityFormData,
  ProtectionHealthData
} from '@/types/financial';

import type { RetirementReadinessResult } from '@/types/retirement';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  metrics: ComputedMetrics;
  retirementResult?: RetirementReadinessResult | null;
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
  retirementResult,
  profileData,
  incomeData,
  assets,
  liabilities,
  protectionData
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Get client email from profile data
  const clientEmail = profileData.email || '';
  const clientName = `${profileData.name_first} ${profileData.name_last}`;

  // Helper to get risk level label
  const getRiskLevelLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Minimal';
  };

  // Generate PDF as base64 for email attachment
  const generatePDFBase64 = async (): Promise<string> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    const checkPageBreak = (height: number) => {
      if (yPos + height > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const drawSectionHeader = (title: string) => {
      checkPageBreak(20);
      yPos += 8;
      pdf.setFillColor(41, 128, 185);
      pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPos + 2);
      pdf.setTextColor(0, 0, 0);
      yPos += 12;
    };

    // Cover Page
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text('Financial Risk Assessment Report', margin, 20);
    pdf.setFontSize(12);
    pdf.text(clientName, margin, 30);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 30, { align: 'right' });
    
    yPos = 50;
    pdf.setTextColor(0, 0, 0);

    // =====================
    // SUMMARY SECTION
    // =====================
    drawSectionHeader('Executive Summary');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Overall Risk Score: ${metrics.scores_jsonb.overall}/100 (${getRiskLevelLabel(metrics.scores_jsonb.overall)})`, margin, yPos);
    yPos += 8;
    
    if (retirementResult) {
      pdf.text(`Retirement Readiness: ${retirementResult.overall_score}/100 (Grade: ${retirementResult.overall_grade})`, margin, yPos);
      yPos += 8;
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const summaryData = [
      ['Net Worth', formatCurrency(metrics.net_worth)],
      ['Protection Gap', formatCurrency(DIME.protection_gap)],
      ['Liquidity Runway', `${metrics.liquidity_runway_months} months`],
      ['Tax-Free Allocation', `${metrics.tax_bucket_never_pct}%`]
    ];
    
    summaryData.forEach(([label, value]) => {
      checkPageBreak(7);
      pdf.text(`${label}:`, margin, yPos);
      pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    });

    // =====================
    // RETIREMENT SECTION
    // =====================
    if (retirementResult) {
      drawSectionHeader('Retirement Readiness Assessment');

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Overall Score: ${retirementResult.overall_score}/100`, margin, yPos);
      pdf.text(`Grade: ${retirementResult.overall_grade}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub-Score', margin, yPos);
      pdf.text('Score', pageWidth - margin - 30, yPos);
      pdf.text('Status', pageWidth - margin, yPos, { align: 'right' });
      yPos += 2;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      const subScores = [
        { label: 'Income Adequacy', score: retirementResult.sub_scores.income_adequacy },
        { label: 'Tax Risk', score: retirementResult.sub_scores.tax_risk },
        { label: 'Sequence Risk', score: retirementResult.sub_scores.sequence_risk },
        { label: 'Longevity Risk', score: retirementResult.sub_scores.longevity_risk },
        { label: 'Liquidity', score: retirementResult.sub_scores.liquidity },
        { label: 'Protection', score: retirementResult.sub_scores.protection }
      ];

      subScores.forEach(({ label, score }) => {
        checkPageBreak(7);
        const status = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Attention';
        pdf.text(label, margin, yPos);
        pdf.text(`${score}`, pageWidth - margin - 30, yPos);
        pdf.text(status, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      });

      // Income Projection
      checkPageBreak(30);
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Retirement Income Projection', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const projectionData = [
        ['Projected Monthly Income', formatCurrency(retirementResult.projection.monthly_income_projected)],
        ['Target Monthly Income', formatCurrency(retirementResult.projection.monthly_income_target)],
        ['Monthly Gap/Surplus', `${retirementResult.projection.monthly_gap > 0 ? '-' : '+'}${formatCurrency(Math.abs(retirementResult.projection.monthly_gap))}`]
      ];

      projectionData.forEach(([label, value]) => {
        checkPageBreak(7);
        pdf.text(label, margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    // =====================
    // RECOMMENDATIONS SECTION
    // =====================
    const recommendations = generateRecommendations();
    drawSectionHeader('Recommendations');

    recommendations.forEach((rec, index) => {
      checkPageBreak(25);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${rec.title}`, margin, yPos);
      yPos += 7;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(rec.description, pageWidth - 2 * margin - 5);
      descLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 5;
    });

    // =====================
    // TAX BUCKETS SECTION
    // =====================
    drawSectionHeader('Tax Diversification Strategy');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const taxData = [
      ['Tax Now (Taxable)', `${metrics.tax_bucket_now_pct}%`, 'Savings, brokerage accounts'],
      ['Tax Later (Tax-Deferred)', `${metrics.tax_bucket_later_pct}%`, '401(k), Traditional IRA'],
      ['Tax Never (Tax-Free)', `${metrics.tax_bucket_never_pct}%`, 'Roth IRA, IUL, HSA']
    ];

    taxData.forEach(([label, value, description]) => {
      checkPageBreak(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPos);
      pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(description, margin + 5, yPos);
      pdf.setFontSize(10);
      yPos += 6;
    });

    // =====================
    // COVERAGE SECTION
    // =====================
    drawSectionHeader('DIME Life Insurance Needs Analysis');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
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

    // Disclaimer
    checkPageBreak(30);
    yPos += 10;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const disclaimer = 'DISCLAIMER: This report is for educational purposes only and does not constitute financial, tax, or legal advice. Consult with qualified professionals before making financial decisions. Past performance does not guarantee future results. Insurance products involve costs, fees, and risks.';
    const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
    disclaimerLines.forEach((line: string) => {
      checkPageBreak(4);
      pdf.text(line, margin, yPos);
      yPos += 4;
    });

    // Footer on all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text('The Prosperity Financial', margin, pageHeight - 10);
      pdf.text('theprosperityfinancial.com', pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Return as base64 (without data URL prefix)
    const pdfOutput = pdf.output('datauristring');
    return pdfOutput.split(',')[1]; // Remove the data:application/pdf;base64, prefix
  };

  // Send email with PDF attachment
  const sendReportEmail = async () => {
    if (!clientEmail || emailSent || isSendingEmail) return;
    
    setIsSendingEmail(true);
    
    try {
      const pdfBase64 = await generatePDFBase64();
      const recommendations = generateRecommendations();
      
      const summary = {
        overallRiskScore: metrics.scores_jsonb.overall,
        riskLevel: getRiskLevelLabel(metrics.scores_jsonb.overall),
        retirementScore: retirementResult?.overall_score,
        retirementGrade: retirementResult?.overall_grade,
        protectionGap: DIME.protection_gap,
        netWorth: metrics.net_worth,
        liquidityMonths: metrics.liquidity_runway_months,
        keyRecommendations: recommendations.slice(0, 3).map(r => r.title)
      };

      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          clientEmail,
          clientName,
          summary,
          pdfBase64
        }
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Report Sent",
        description: `Email sent to ${clientEmail} with your comprehensive report.`
      });
    } catch (error) {
      console.error('Error sending report email:', error);
      toast({
        title: "Email Failed",
        description: "Could not send the report email. You can still download the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Auto-send email when modal opens (only once per session)
  useEffect(() => {
    if (isOpen && clientEmail && !emailSent && !isSendingEmail) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        sendReportEmail();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, clientEmail]);

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

      // Helper to draw a section header
      const drawSectionHeader = (title: string) => {
        checkPageBreak(20);
        yPos += 8;
        pdf.setFillColor(41, 128, 185);
        pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPos + 2);
        pdf.setTextColor(0, 0, 0);
        yPos += 12;
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

      // =====================
      // RETIREMENT READINESS SECTION
      // =====================
      if (retirementResult) {
        drawSectionHeader('Retirement Readiness Assessment');

        // Score and Grade
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Overall Score: ${retirementResult.overall_score}/100`, margin, yPos);
        pdf.text(`Grade: ${retirementResult.overall_grade}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 10;

        // Sub-scores table
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sub-Score', margin, yPos);
        pdf.text('Score', pageWidth - margin - 30, yPos);
        pdf.text('Status', pageWidth - margin, yPos, { align: 'right' });
        yPos += 2;
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        pdf.setFont('helvetica', 'normal');
        const subScores = [
          { label: 'Income Adequacy', score: retirementResult.sub_scores.income_adequacy },
          { label: 'Tax Risk', score: retirementResult.sub_scores.tax_risk },
          { label: 'Sequence Risk', score: retirementResult.sub_scores.sequence_risk },
          { label: 'Longevity Risk', score: retirementResult.sub_scores.longevity_risk },
          { label: 'Liquidity', score: retirementResult.sub_scores.liquidity },
          { label: 'Protection', score: retirementResult.sub_scores.protection }
        ];

        subScores.forEach(({ label, score }) => {
          checkPageBreak(7);
          const status = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Attention';
          pdf.text(label, margin, yPos);
          pdf.text(`${score}`, pageWidth - margin - 30, yPos);
          pdf.text(status, pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });

        // Income Projection
        checkPageBreak(30);
        yPos += 8;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Retirement Income Projection', margin, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const incomeData = [
          ['Projected Monthly Income', formatCurrency(retirementResult.projection.monthly_income_projected)],
          ['Target Monthly Income', formatCurrency(retirementResult.projection.monthly_income_target)],
          ['Monthly Gap/Surplus', `${retirementResult.projection.monthly_gap > 0 ? '-' : '+'}${formatCurrency(Math.abs(retirementResult.projection.monthly_gap))}`]
        ];

        incomeData.forEach(([label, value]) => {
          checkPageBreak(7);
          pdf.text(label, margin, yPos);
          pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });

        // Income Sources Breakdown
        checkPageBreak(40);
        yPos += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Income Sources Breakdown:', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');

        const sources = retirementResult.projection.income_sources;
        const sourceData = [
          ['Social Security', formatCurrency(sources.social_security)],
          ['Pension', formatCurrency(sources.pension)],
          ['Annuity Income', formatCurrency(sources.annuity)],
          ['Portfolio Withdrawal', formatCurrency(sources.portfolio_withdrawal)],
          ['Part-time Income', formatCurrency(sources.part_time)]
        ];

        sourceData.forEach(([label, value]) => {
          checkPageBreak(6);
          pdf.text(`  • ${label}`, margin, yPos);
          pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        });

        // Stress Test Scenarios
        if (retirementResult.scenarios.length > 0) {
          checkPageBreak(50);
          yPos += 8;
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Stress Test Scenarios', margin, yPos);
          yPos += 8;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Scenario', margin, yPos);
          pdf.text('Success', margin + 55, yPos);
          pdf.text('Shortfall Age', margin + 80, yPos);
          pdf.text('End Balance', margin + 110, yPos);
          yPos += 2;
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;

          pdf.setFont('helvetica', 'normal');
          retirementResult.scenarios.forEach((scenario) => {
            checkPageBreak(6);
            pdf.text(scenario.scenario_name, margin, yPos);
            pdf.text(`${scenario.success_probability}%`, margin + 55, yPos);
            pdf.text(scenario.projected_shortfall_age ? `Age ${scenario.projected_shortfall_age}` : 'None', margin + 80, yPos);
            pdf.text(formatCurrency(scenario.ending_balance_at_90), margin + 110, yPos);
            yPos += 5;
          });
        }

        // Product Recommendations
        if (retirementResult.recommendations.length > 0) {
          checkPageBreak(40);
          yPos += 10;
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Product Suitability Analysis', margin, yPos);
          yPos += 8;

          retirementResult.recommendations.forEach((rec) => {
            checkPageBreak(25);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            const fitLabel = rec.fit === 'strong' ? '★★★ Strong Fit' : 
                            rec.fit === 'moderate' ? '★★ Moderate Fit' : 
                            rec.fit === 'weak' ? '★ Weak Fit' : '○ Not Recommended';
            pdf.text(`${rec.product} - ${fitLabel}`, margin, yPos);
            yPos += 6;

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            
            // Why bullets
            rec.whyBullets.slice(0, 2).forEach((bullet) => {
              checkPageBreak(5);
              const lines = pdf.splitTextToSize(`✓ ${bullet}`, pageWidth - 2 * margin - 5);
              lines.forEach((line: string) => {
                pdf.text(line, margin + 5, yPos);
                yPos += 4;
              });
            });

            // Not if bullets
            rec.notIfBullets.slice(0, 1).forEach((bullet) => {
              checkPageBreak(5);
              const lines = pdf.splitTextToSize(`⚠ ${bullet}`, pageWidth - 2 * margin - 5);
              lines.forEach((line: string) => {
                pdf.text(line, margin + 5, yPos);
                yPos += 4;
              });
            });

            yPos += 3;
          });
        }

        // Key Insights
        if (retirementResult.key_insights.length > 0) {
          checkPageBreak(30);
          yPos += 8;
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Key Insights & Action Items', margin, yPos);
          yPos += 8;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          retirementResult.key_insights.forEach((insight, i) => {
            checkPageBreak(10);
            const lines = pdf.splitTextToSize(`${i + 1}. ${insight}`, pageWidth - 2 * margin);
            lines.forEach((line: string) => {
              pdf.text(line, margin, yPos);
              yPos += 5;
            });
            yPos += 2;
          });
        }
      }

      // =====================
      // DIME ANALYSIS SECTION
      // =====================
      drawSectionHeader('DIME Life Insurance Needs Analysis');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
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
      drawSectionHeader('Overall Risk Assessment');

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Risk Score: ${metrics.scores_jsonb.overall}/100`, margin, yPos);
      pdf.text(`Level: ${getRiskLevel(metrics.scores_jsonb.overall).label}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 12;

      // Key Metrics
      pdf.setFontSize(11);
      pdf.text('Key Financial Metrics', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const keyMetricsData = [
        ['Net Worth', formatCurrency(metrics.net_worth)],
        ['Liquidity Runway', `${metrics.liquidity_runway_months} months`],
        ['Tax-Never Allocation', `${metrics.tax_bucket_never_pct}%`],
        ['Retirement Gap (Monthly)', formatCurrency(metrics.retirement_gap_mo)]
      ];

      keyMetricsData.forEach(([label, value]) => {
        checkPageBreak(7);
        pdf.text(`${label}:`, margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      });

      // Tax Diversification
      drawSectionHeader('Tax Diversification Strategy');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const taxData = [
        ['Tax Now (Taxable)', `${metrics.tax_bucket_now_pct}%`, 'Savings, brokerage accounts'],
        ['Tax Later (Tax-Deferred)', `${metrics.tax_bucket_later_pct}%`, '401(k), Traditional IRA'],
        ['Tax Never (Tax-Free)', `${metrics.tax_bucket_never_pct}%`, 'Roth IRA, IUL, HSA']
      ];

      taxData.forEach(([label, value, description]) => {
        checkPageBreak(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(description, margin + 5, yPos);
        pdf.setFontSize(10);
        yPos += 6;
      });

      // Recommendations
      drawSectionHeader('Recommendations');

      const recommendations = generateRecommendations();
      recommendations.forEach((rec, index) => {
        checkPageBreak(25);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        pdf.text(`${index + 1}. ${rec.title}`, margin, yPos);
        yPos += 7;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(rec.description, pageWidth - 2 * margin - 5);
        descLines.forEach((line: string) => {
          checkPageBreak(5);
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
        yPos += 5;
      });

      // Disclaimer
      checkPageBreak(30);
      yPos += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const disclaimer = 'DISCLAIMER: This report is for educational purposes only and does not constitute financial, tax, or legal advice. Consult with qualified professionals before making financial decisions. Past performance does not guarantee future results. Insurance products involve costs, fees, and risks.';
      const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      disclaimerLines.forEach((line: string) => {
        checkPageBreak(4);
        pdf.text(line, margin, yPos);
        yPos += 4;
      });

      // Footer on all pages
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

      // Save to database with retirement data
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
        retirement_readiness: retirementResult ? {
          overall_score: retirementResult.overall_score,
          overall_grade: retirementResult.overall_grade,
          sub_scores: retirementResult.sub_scores,
          projection: retirementResult.projection,
          scenarios: retirementResult.scenarios,
          recommendations: retirementResult.recommendations,
          key_insights: retirementResult.key_insights
        } : null,
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
        description: "Your comprehensive financial assessment report has been downloaded."
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
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="tax-buckets">Tax Buckets</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="appendix">Appendix</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-4 pr-2">
            {/* Retirement Readiness Tab */}
            <TabsContent value="retirement" className="space-y-6">
              {retirementResult ? (
                <>
                  {/* Score Ring and Grade - Compact */}
                  <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-4">
                        <RetirementScoreRing 
                          score={retirementResult.overall_score} 
                          grade={retirementResult.overall_grade}
                          size={80}
                          strokeWidth={8}
                          animated={true}
                        />
                        <div className="space-y-1">
                          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Retirement Readiness Score
                          </h2>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Based on income, protection, taxes, and risk factors.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Recommendations - Moved before Income Gap */}
                  {retirementResult.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Fit Analysis</CardTitle>
                        <CardDescription>Based on your profile and goals</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {retirementResult.recommendations.map((rec) => (
                          <Card key={rec.product} className={`border-2 ${
                            rec.fit === 'strong' ? 'border-green-300 bg-green-50' :
                            rec.fit === 'moderate' ? 'border-blue-300 bg-blue-50' :
                            rec.fit === 'weak' ? 'border-yellow-300 bg-yellow-50' :
                            'border-red-300 bg-red-50'
                          }`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{rec.product}</CardTitle>
                                <Badge className={
                                  rec.fit === 'strong' ? 'bg-green-600' :
                                  rec.fit === 'moderate' ? 'bg-blue-600' :
                                  rec.fit === 'weak' ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }>{rec.fit === 'not_recommended' ? 'Not Yet' : rec.fit}</Badge>
                              </div>
                              {rec.score !== undefined && (
                                <div className="text-xs text-muted-foreground">Score: {rec.score}/100</div>
                              )}
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                              {/* Not Recommended State - Show Why & Fix First */}
                              {rec.fit === 'not_recommended' ? (
                                <>
                                  {rec.disqualification_reason && (
                                    <div className="p-2 bg-red-100 rounded-lg border border-red-200">
                                      <p className="font-medium text-red-800 text-xs flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Why It Doesn't Fit
                                      </p>
                                      <p className="text-xs text-red-700 mt-1">{rec.disqualification_reason}</p>
                                    </div>
                                  )}
                                  {rec.fixFirstBullets && rec.fixFirstBullets.length > 0 && (
                                    <div className="p-2 bg-amber-100 rounded-lg border border-amber-200">
                                      <p className="font-medium text-amber-800 text-xs flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> What to Fix First
                                      </p>
                                      <ul className="list-disc list-inside text-xs text-amber-700 mt-1 space-y-0.5">
                                        {rec.fixFirstBullets.map((b, i) => <li key={i}>{b}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {rec.nextSteps.length > 0 && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs">Next Steps:</p>
                                      <ul className="list-disc list-inside text-xs text-gray-600">
                                        {rec.nextSteps.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {/* Regular State - Show Why It Fits */}
                                  <div>
                                    <p className="font-medium text-green-700">Why it fits:</p>
                                    <ul className="list-disc list-inside text-xs">
                                      {rec.whyBullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                  </div>
                                  {rec.notIfBullets.length > 0 && (
                                    <div>
                                      <p className="font-medium text-amber-700">Consider if:</p>
                                      <ul className="list-disc list-inside text-xs">
                                        {rec.notIfBullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Income Gap - Moved after Product Fit Analysis */}
                  <Card className={retirementResult.projection.monthly_gap > 0 ? 'border-2 border-red-300' : 'border-2 border-green-300'}>
                    <CardHeader>
                      <CardTitle>Projected Monthly Retirement Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">Projected Income</p>
                          <p className="text-2xl font-bold text-blue-900">{formatCurrency(retirementResult.projection.monthly_income_projected)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">Target Income</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(retirementResult.projection.monthly_income_target)}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${retirementResult.projection.monthly_gap > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                          <p className={`text-sm ${retirementResult.projection.monthly_gap > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {retirementResult.projection.monthly_gap > 0 ? 'Monthly Gap' : 'Surplus'}
                          </p>
                          <p className={`text-2xl font-bold ${retirementResult.projection.monthly_gap > 0 ? 'text-red-900' : 'text-green-900'}`}>
                            {formatCurrency(Math.abs(retirementResult.projection.monthly_gap))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>


                  {/* Key Insights */}
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" /> Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {retirementResult.key_insights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    Retirement readiness data not available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

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
                onClick={() => setBookingOpen(true)}
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
      
      <BookingCalendar open={bookingOpen} onOpenChange={setBookingOpen} />
    </Dialog>
  );
}
