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
import { ScenarioComparisonCard } from './ScenarioComparisonCard';
import { RetirementTimeline } from './RetirementTimeline';
import { AllocationInputCard, AllocationSources } from './AllocationInputCard';
import { computeScenarioComparison } from '@/engine/retirement/scenarioSimulator';
import { computeAllocationSources } from '@/engine/retirement/allocationEngine';

import type { 
  ComputedMetrics,
  ProfileGoalsData,
  IncomeExpensesData, 
  AssetFormData,
  LiabilityFormData,
  ProtectionHealthData,
  PlanningReadinessData
} from '@/types/financial';

import type { RetirementReadinessResult, ScenarioComparison, RetirementPreferencesData, DEFAULT_RETIREMENT_PREFERENCES } from '@/types/retirement';

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
  planningReadiness?: PlanningReadinessData;
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
  protectionData,
  planningReadiness: externalPlanningReadiness
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Client allocation inputs for IUL/Annuity
  const [iulAllocation, setIulAllocation] = useState(0);
  const [annuityAllocation, setAnnuityAllocation] = useState(0);

  // Get client email from profile data
  const clientEmail = profileData.email || '';
  const clientName = `${profileData.name_first} ${profileData.name_last}`;

  // Compute scenario comparison for "Current Path vs Optimized Strategy"
  const scenarioComparison = useMemo<ScenarioComparison | null>(() => {
    if (!retirementResult) return null;
    
    try {
      // Map profileData to RetirementPreferencesData
      const preferences: RetirementPreferencesData = {
        retirement_lifestyle: profileData.retirement_lifestyle || 'comfortable',
        spending_target_method: profileData.spending_target_method || 'fixed',
        spending_percent_of_income: profileData.spending_percent_of_income || 80,
        planned_retirement_state: profileData.planned_retirement_state || profileData.state,
        annual_retirement_contribution: incomeData.annual_retirement_contribution || 0,
        contribution_growth_rate: incomeData.contribution_growth_rate || 2,
        social_security_confidence: incomeData.social_security_confidence || 'medium',
        expected_part_time_income: incomeData.expected_part_time_income || 0,
        prefers_guaranteed_income: protectionData.prefers_guaranteed_income || false,
        liquidity_need_next_5yr: protectionData.liquidity_need_next_5yr || 'medium',
        can_commit_10yr_contributions: protectionData.can_commit_10yr_contributions || false,
        open_to_tax_diversification: protectionData.open_to_tax_diversification || false
      };
      
      // Build planning readiness - USE ACTUAL DATA if provided, otherwise use sensible defaults
      // CRITICAL: If externalPlanningReadiness is provided, use it. Otherwise mark as incomplete.
      const planningReadiness: PlanningReadinessData = externalPlanningReadiness || {
        // Mark as needing data collection if not provided
        income_stability: 'stable',
        funding_commitment_years: protectionData.can_commit_10yr_contributions ? '10-20' : '5-10',
        funding_discipline: 'medium',
        near_term_liquidity_need: protectionData.liquidity_need_next_5yr || 'medium',
        short_term_cash_needs_1_3yr: 'low',
        contributing_to_401k_match: incomeData.employer_match_pct > 0,
        maxing_qualified_plans: 'some',
        current_tax_bracket: 'not_sure', // Don't assume - mark as unknown
        tax_concern_level: 'medium',
        wants_tax_free_bucket: protectionData.open_to_tax_diversification || false,
        expects_higher_future_taxes: false,
        rmd_concern: 'low',
        sequence_risk_concern: 'medium',
        legacy_priority: 'medium',
        permanent_coverage_need: protectionData.permanent_life_cv > 0 || protectionData.permanent_life_db > 0,
        debt_pressure_level: 'low',
        // CRITICAL: Don't assume health data - use undefined to trigger education mode
        self_assessed_health: undefined,
        family_longevity_history: undefined,
        longevity_concern: undefined,
        // CRITICAL: Don't assume behavior - use undefined to trigger education mode
        goal_priorities: undefined,
        investment_experience_level: undefined,
        comfort_with_complex_products: undefined,
        willingness_illiquidity_years: undefined,
        behavior_in_down_market: undefined,
        wants_monthly_paycheck_feel: undefined,
        sleep_at_night_priority: undefined,
        survivor_income_need: undefined
      };
      
      return computeScenarioComparison(
        profileData,
        incomeData,
        assets,
        preferences,
        retirementResult.projection,
        metrics,
        protectionData,
        planningReadiness
      );
    } catch (error) {
      console.error('Error computing scenario comparison:', error);
      return null;
    }
  }, [retirementResult, profileData, incomeData, assets, metrics, protectionData]);

  // Helper to get risk level label
  const getRiskLevelLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Minimal';
  };

  // Get product recommendations
  const getProductRecommendations = () => {
    const iulRec = retirementResult?.recommendations.find(r => r.product === 'IUL');
    const fiaRec = retirementResult?.recommendations.find(r => r.product === 'Annuity');
    
    return {
      iul: {
        fit: iulRec?.fit || 'not_recommended',
        score: iulRec?.score || 0,
        positives: iulRec?.whyBullets || [],
        negatives: iulRec?.notIfBullets || []
      },
      fia: {
        fit: fiaRec?.fit || 'not_recommended',
        score: fiaRec?.score || 0,
        strategy: (fiaRec as any)?.strategy,
        positives: (fiaRec as any)?.positives || fiaRec?.whyBullets || [],
        negatives: (fiaRec as any)?.negatives || fiaRec?.notIfBullets || [],
        reason: (fiaRec as any)?.reason
      }
    };
  };

  // Generate PDF as base64 for email attachment - FOCUSED VERSION
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

    const drawSectionHeader = (title: string, color: [number, number, number] = [30, 64, 175]) => {
      checkPageBreak(20);
      yPos += 8;
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPos + 2);
      pdf.setTextColor(0, 0, 0);
      yPos += 14;
    };

    const drawFitBadge = (fit: string, x: number, y: number) => {
      const fitStyles: Record<string, { bg: [number, number, number]; label: string }> = {
        'strong': { bg: [22, 163, 74], label: 'Strong Fit' },
        'moderate': { bg: [37, 99, 235], label: 'Moderate Fit' },
        'explore': { bg: [245, 158, 11], label: 'Worth Exploring' },
        'weak': { bg: [245, 158, 11], label: 'Limited Fit' },
        'not_fit_yet': { bg: [107, 114, 128], label: 'Not Yet' },
        'not_recommended': { bg: [107, 114, 128], label: 'Not Recommended' }
      };
      const style = fitStyles[fit] || fitStyles['not_recommended'];
      
      pdf.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      const badgeWidth = pdf.getTextWidth(style.label) + 8;
      pdf.roundedRect(x, y - 4, badgeWidth, 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(style.label, x + 4, y);
      pdf.setTextColor(0, 0, 0);
    };

    const productRecs = getProductRecommendations();

    // =====================
    // COVER PAGE
    // =====================
    pdf.setFillColor(30, 58, 95);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Needs Assessment', margin, 25);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(clientName, margin, 35);
    pdf.text(`The Prosperity Financial`, pageWidth - margin, 35, { align: 'right' });
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 45);
    
    yPos = 60;
    pdf.setTextColor(0, 0, 0);

    // =====================
    // SECTION 1: DIME COVERAGE ANALYSIS
    // =====================
    drawSectionHeader('Life Insurance Coverage Analysis (DIME)', [30, 64, 175]);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // DIME breakdown
    const dimeItems = [
      { label: 'D - Debts & Final Expenses', value: DIME.nonMortgageDebt + DIME.FINAL_EXPENSES },
      { label: 'I - Income Replacement (10 years)', value: DIME.incomeReplacement },
      { label: 'M - Mortgage Balance', value: DIME.mortgageBalance },
      { label: 'E - Education Expenses', value: DIME.education }
    ];

    dimeItems.forEach(item => {
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label, margin, yPos);
      pdf.text(formatCurrency(item.value), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    });

    yPos += 3;
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Summary table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Total Protection Need (DIME)', margin, yPos);
    pdf.text(formatCurrency(DIME.dime_need), pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Current Coverage', margin, yPos);
    pdf.text(formatCurrency(DIME.currentCoverage), pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    // Protection Gap - highlighted
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const gapColor = DIME.protection_gap > 0 ? [220, 38, 38] : [22, 163, 74];
    pdf.setTextColor(gapColor[0], gapColor[1], gapColor[2]);
    pdf.text('Protection Gap', margin, yPos);
    pdf.text(formatCurrency(DIME.protection_gap), pageWidth - margin, yPos, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPos += 12;

    // Assessment statement
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    const assessmentText = DIME.protection_gap > 0 
      ? `A coverage gap of ${formatCurrency(DIME.protection_gap)} exists. Consider reviewing your life insurance coverage.`
      : 'Your current coverage meets the estimated protection needs.';
    pdf.text(assessmentText, margin, yPos);
    yPos += 10;

    // =====================
    // SECTION 2: PRODUCT FIT ANALYSIS
    // =====================
    drawSectionHeader('Product Fit Analysis', [5, 150, 105]);

    // IUL Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Indexed Universal Life (IUL)', margin, yPos);
    drawFitBadge(productRecs.iul.fit, pageWidth - margin - 35, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Score: ${productRecs.iul.score}/100`, margin, yPos);
    yPos += 8;

    // IUL Positives
    if (productRecs.iul.positives.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Why It Fits:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      productRecs.iul.positives.slice(0, 3).forEach(pos => {
        checkPageBreak(6);
        const lines = pdf.splitTextToSize(`✓ ${pos}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
      });
    }

    // IUL Considerations
    if (productRecs.iul.negatives.length > 0) {
      yPos += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Considerations:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      productRecs.iul.negatives.slice(0, 2).forEach(neg => {
        checkPageBreak(6);
        const lines = pdf.splitTextToSize(`• ${neg}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
      });
    }

    yPos += 10;

    // FIA Section
    checkPageBreak(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fixed Indexed Annuity (FIA)', margin, yPos);
    drawFitBadge(productRecs.fia.fit, pageWidth - margin - 35, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Score: ${productRecs.fia.score}/100`, margin, yPos);
    
    // FIA Strategy
    if (productRecs.fia.strategy) {
      const strategyLabels: Record<string, string> = {
        'FIA_BUFFER_REDZONE': 'Buffer Zone Strategy',
        'FIA_INCOME_FLOOR': 'Income Floor Strategy',
        'FIA_GROWTH_PROTECTION': 'Growth Protection',
        'FIA_OPTIONAL': 'Optional Enhancement',
        'FIA_NOT_FIT_YET': 'Build Foundation First'
      };
      const strategyLabel = strategyLabels[productRecs.fia.strategy] || productRecs.fia.strategy;
      pdf.text(`  |  Strategy: ${strategyLabel}`, margin + 35, yPos);
    }
    yPos += 8;

    // FIA Positives
    if (productRecs.fia.positives.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Why It Fits:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      productRecs.fia.positives.slice(0, 3).forEach(pos => {
        checkPageBreak(6);
        const lines = pdf.splitTextToSize(`✓ ${pos}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
      });
    }

    // FIA Considerations
    if (productRecs.fia.negatives.length > 0) {
      yPos += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Considerations:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      productRecs.fia.negatives.slice(0, 2).forEach(neg => {
        checkPageBreak(6);
        const lines = pdf.splitTextToSize(`• ${neg}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });
      });
    }

    // FIA One-line reason
    if (productRecs.fia.reason) {
      yPos += 5;
      pdf.setFont('helvetica', 'italic');
      const reasonLines = pdf.splitTextToSize(productRecs.fia.reason, pageWidth - 2 * margin);
      reasonLines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 5;

    // =====================
    // SECTION 3: TAX BUCKET ANALYSIS
    // =====================
    drawSectionHeader('Tax Diversification Analysis', [124, 58, 237]);

    const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    const taxNowAmount = assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + (a.current_value || 0), 0);
    const taxLaterAmount = assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + (a.current_value || 0), 0);
    const taxNeverAmount = assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + (a.current_value || 0), 0);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Allocation', margin, yPos);
    pdf.text('Target Range', pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    const taxBuckets = [
      { label: 'Tax Now (Taxable)', pct: metrics.tax_bucket_now_pct, amount: taxNowAmount, target: '20-30%', examples: 'Savings, Brokerage' },
      { label: 'Tax Later (Tax-Deferred)', pct: metrics.tax_bucket_later_pct, amount: taxLaterAmount, target: '40-50%', examples: '401(k), Traditional IRA' },
      { label: 'Tax Never (Tax-Free)', pct: metrics.tax_bucket_never_pct, amount: taxNeverAmount, target: '20-30%', examples: 'Roth IRA, IUL, HSA' }
    ];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    taxBuckets.forEach(bucket => {
      checkPageBreak(16);
      
      // Label and percentage
      pdf.setFont('helvetica', 'bold');
      pdf.text(bucket.label, margin, yPos);
      
      const pctColor = bucket.label.includes('Never') && bucket.pct < 20 ? [245, 158, 11] : [0, 0, 0];
      pdf.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
      pdf.text(`${bucket.pct}%`, margin + 90, yPos);
      pdf.setTextColor(0, 0, 0);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(bucket.target, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
      
      // Amount and examples
      pdf.setFontSize(9);
      pdf.text(`${formatCurrency(bucket.amount)}  •  ${bucket.examples}`, margin + 5, yPos);
      pdf.setFontSize(10);
      yPos += 10;
    });

    // Tax recommendation
    yPos += 5;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    const taxRec = metrics.tax_bucket_never_pct < 20 
      ? 'Consider increasing tax-free allocation through Roth conversions, IUL, or HSA contributions.'
      : 'Your tax diversification is well-balanced across all three buckets.';
    pdf.text(taxRec, margin, yPos);
    yPos += 10;

    // =====================
    // SECTION 4: NEXT STEPS
    // =====================
    drawSectionHeader('Next Steps', [5, 150, 105]);

    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 35, 3, 3, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(4, 120, 87);
    pdf.text('Schedule Your Free Strategy Consultation', margin, yPos + 5);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Discuss your personalized financial strategy with a licensed professional.', margin, yPos + 15);
    pdf.text('Visit: theprosperityfinancial.com/contact', margin, yPos + 23);
    
    pdf.setTextColor(0, 0, 0);
    yPos += 45;

    // =====================
    // DISCLAIMER
    // =====================
    checkPageBreak(25);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const disclaimer = 'DISCLAIMER: This report is for educational purposes only and does not constitute financial, tax, or legal advice. Consult with qualified professionals before making financial decisions. Past performance does not guarantee future results. Insurance products involve costs, fees, and risks that should be carefully considered.';
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

    const pdfOutput = pdf.output('datauristring');
    return pdfOutput.split(',')[1];
  };

  // Send email with PDF attachment - FOCUSED VERSION
  const sendReportEmail = async () => {
    if (!clientEmail || emailSent || isSendingEmail) return;
    
    setIsSendingEmail(true);
    
    try {
      const pdfBase64 = await generatePDFBase64();
      const productRecs = getProductRecommendations();
      
      const summary = {
        // Coverage Analysis
        dimeNeed: DIME.dime_need,
        currentCoverage: DIME.currentCoverage,
        protectionGap: DIME.protection_gap,
        // Product Fit - IUL
        iulFit: productRecs.iul.fit,
        iulScore: productRecs.iul.score,
        iulPositives: productRecs.iul.positives.slice(0, 3),
        // Product Fit - FIA
        fiaFit: productRecs.fia.fit,
        fiaScore: productRecs.fia.score,
        fiaStrategy: productRecs.fia.strategy,
        fiaPositives: productRecs.fia.positives.slice(0, 3),
        fiaReason: productRecs.fia.reason,
        // Tax Buckets
        taxNowPct: metrics.tax_bucket_now_pct,
        taxLaterPct: metrics.tax_bucket_later_pct,
        taxNeverPct: metrics.tax_bucket_never_pct
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
        description: `Email sent to ${clientEmail} with your financial needs assessment.`
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

  // Compute allocation sources for IUL/Annuity allocation inputs
  const allocationSources = useMemo<AllocationSources>(() => {
    const hasIncomeGap = retirementResult ? retirementResult.projection.gap_percentage > 10 : false;
    const incomeGapMonthly = retirementResult?.projection.monthly_gap || 0;
    
    // Check eligibility based on scenario comparison
    const annuityEligible = scenarioComparison?.annuity_eligibility?.is_eligible ?? false;
    const iulEligible = scenarioComparison?.iul_eligibility?.is_eligible ?? false;
    
    return computeAllocationSources(
      incomeData,
      DIME.protection_gap,
      incomeGapMonthly,
      hasIncomeGap,
      annuityEligible,
      iulEligible
    );
  }, [incomeData, DIME.protection_gap, retirementResult, scenarioComparison]);

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

      const checkPageBreak = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const drawSectionHeader = (title: string, color: [number, number, number] = [30, 64, 175]) => {
        checkPageBreak(20);
        yPos += 8;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPos + 2);
        pdf.setTextColor(0, 0, 0);
        yPos += 14;
      };

      const drawFitBadge = (fit: string, x: number, y: number) => {
        const fitStyles: Record<string, { bg: [number, number, number]; label: string }> = {
          'strong': { bg: [22, 163, 74], label: 'Strong Fit' },
          'moderate': { bg: [37, 99, 235], label: 'Moderate Fit' },
          'explore': { bg: [245, 158, 11], label: 'Worth Exploring' },
          'weak': { bg: [245, 158, 11], label: 'Limited Fit' },
          'not_fit_yet': { bg: [107, 114, 128], label: 'Not Yet' },
          'not_recommended': { bg: [107, 114, 128], label: 'Not Recommended' }
        };
        const style = fitStyles[fit] || fitStyles['not_recommended'];
        
        pdf.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
        const badgeWidth = pdf.getTextWidth(style.label) + 8;
        pdf.roundedRect(x, y - 4, badgeWidth, 6, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(style.label, x + 4, y);
        pdf.setTextColor(0, 0, 0);
      };

      const productRecs = getProductRecommendations();

      // =====================
      // COVER PAGE
      // =====================
      pdf.setFillColor(30, 58, 95);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Needs Assessment', margin, 25);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(clientName, margin, 35);
      pdf.text(`The Prosperity Financial`, pageWidth - margin, 35, { align: 'right' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 45);
      
      yPos = 60;
      pdf.setTextColor(0, 0, 0);

      // =====================
      // SECTION 1: DIME COVERAGE ANALYSIS
      // =====================
      drawSectionHeader('Life Insurance Coverage Analysis (DIME)', [30, 64, 175]);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const dimeItems = [
        { label: 'D - Debts & Final Expenses', value: DIME.nonMortgageDebt + DIME.FINAL_EXPENSES },
        { label: 'I - Income Replacement (10 years)', value: DIME.incomeReplacement },
        { label: 'M - Mortgage Balance', value: DIME.mortgageBalance },
        { label: 'E - Education Expenses', value: DIME.education }
      ];

      dimeItems.forEach(item => {
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, margin, yPos);
        pdf.text(formatCurrency(item.value), pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      });

      yPos += 3;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total Protection Need (DIME)', margin, yPos);
      pdf.text(formatCurrency(DIME.dime_need), pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Current Coverage', margin, yPos);
      pdf.text(formatCurrency(DIME.currentCoverage), pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      const gapColor = DIME.protection_gap > 0 ? [220, 38, 38] : [22, 163, 74];
      pdf.setTextColor(gapColor[0], gapColor[1], gapColor[2]);
      pdf.text('Protection Gap', margin, yPos);
      pdf.text(formatCurrency(DIME.protection_gap), pageWidth - margin, yPos, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      yPos += 12;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      const assessmentText = DIME.protection_gap > 0 
        ? `A coverage gap of ${formatCurrency(DIME.protection_gap)} exists. Consider reviewing your life insurance coverage.`
        : 'Your current coverage meets the estimated protection needs.';
      pdf.text(assessmentText, margin, yPos);
      yPos += 10;

      // =====================
      // SECTION 2: PRODUCT FIT ANALYSIS
      // =====================
      drawSectionHeader('Product Fit Analysis', [5, 150, 105]);

      // IUL Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indexed Universal Life (IUL)', margin, yPos);
      drawFitBadge(productRecs.iul.fit, pageWidth - margin - 35, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score: ${productRecs.iul.score}/100`, margin, yPos);
      yPos += 8;

      if (productRecs.iul.positives.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Why It Fits:', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        productRecs.iul.positives.slice(0, 3).forEach(pos => {
          checkPageBreak(6);
          const lines = pdf.splitTextToSize(`✓ ${pos}`, pageWidth - 2 * margin - 10);
          lines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 5;
          });
        });
      }

      if (productRecs.iul.negatives.length > 0) {
        yPos += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Considerations:', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        productRecs.iul.negatives.slice(0, 2).forEach(neg => {
          checkPageBreak(6);
          const lines = pdf.splitTextToSize(`• ${neg}`, pageWidth - 2 * margin - 10);
          lines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 5;
          });
        });
      }

      yPos += 10;

      // FIA Section
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fixed Indexed Annuity (FIA)', margin, yPos);
      drawFitBadge(productRecs.fia.fit, pageWidth - margin - 35, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score: ${productRecs.fia.score}/100`, margin, yPos);
      
      if (productRecs.fia.strategy) {
        const strategyLabels: Record<string, string> = {
          'FIA_BUFFER_REDZONE': 'Buffer Zone Strategy',
          'FIA_INCOME_FLOOR': 'Income Floor Strategy',
          'FIA_GROWTH_PROTECTION': 'Growth Protection',
          'FIA_OPTIONAL': 'Optional Enhancement',
          'FIA_NOT_FIT_YET': 'Build Foundation First'
        };
        const strategyLabel = strategyLabels[productRecs.fia.strategy] || productRecs.fia.strategy;
        pdf.text(`  |  Strategy: ${strategyLabel}`, margin + 35, yPos);
      }
      yPos += 8;

      if (productRecs.fia.positives.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Why It Fits:', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        productRecs.fia.positives.slice(0, 3).forEach(pos => {
          checkPageBreak(6);
          const lines = pdf.splitTextToSize(`✓ ${pos}`, pageWidth - 2 * margin - 10);
          lines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 5;
          });
        });
      }

      if (productRecs.fia.negatives.length > 0) {
        yPos += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Considerations:', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        productRecs.fia.negatives.slice(0, 2).forEach(neg => {
          checkPageBreak(6);
          const lines = pdf.splitTextToSize(`• ${neg}`, pageWidth - 2 * margin - 10);
          lines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 5;
          });
        });
      }

      if (productRecs.fia.reason) {
        yPos += 5;
        pdf.setFont('helvetica', 'italic');
        const reasonLines = pdf.splitTextToSize(productRecs.fia.reason, pageWidth - 2 * margin);
        reasonLines.forEach((line: string) => {
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
      }

      yPos += 5;

      // =====================
      // SECTION 3: TAX BUCKET ANALYSIS
      // =====================
      drawSectionHeader('Tax Diversification Analysis', [124, 58, 237]);

      const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
      const taxNowAmount = assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + (a.current_value || 0), 0);
      const taxLaterAmount = assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + (a.current_value || 0), 0);
      const taxNeverAmount = assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + (a.current_value || 0), 0);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Current Allocation', margin, yPos);
      pdf.text('Target Range', pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      const taxBuckets = [
        { label: 'Tax Now (Taxable)', pct: metrics.tax_bucket_now_pct, amount: taxNowAmount, target: '20-30%', examples: 'Savings, Brokerage' },
        { label: 'Tax Later (Tax-Deferred)', pct: metrics.tax_bucket_later_pct, amount: taxLaterAmount, target: '40-50%', examples: '401(k), Traditional IRA' },
        { label: 'Tax Never (Tax-Free)', pct: metrics.tax_bucket_never_pct, amount: taxNeverAmount, target: '20-30%', examples: 'Roth IRA, IUL, HSA' }
      ];

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      taxBuckets.forEach(bucket => {
        checkPageBreak(16);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(bucket.label, margin, yPos);
        
        const pctColor = bucket.label.includes('Never') && bucket.pct < 20 ? [245, 158, 11] : [0, 0, 0];
        pdf.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
        pdf.text(`${bucket.pct}%`, margin + 90, yPos);
        pdf.setTextColor(0, 0, 0);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(bucket.target, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        pdf.setFontSize(9);
        pdf.text(`${formatCurrency(bucket.amount)}  •  ${bucket.examples}`, margin + 5, yPos);
        pdf.setFontSize(10);
        yPos += 10;
      });

      yPos += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      const taxRec = metrics.tax_bucket_never_pct < 20 
        ? 'Consider increasing tax-free allocation through Roth conversions, IUL, or HSA contributions.'
        : 'Your tax diversification is well-balanced across all three buckets.';
      pdf.text(taxRec, margin, yPos);
      yPos += 10;

      // =====================
      // SECTION 4: NEXT STEPS
      // =====================
      drawSectionHeader('Next Steps', [5, 150, 105]);

      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 35, 3, 3, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(4, 120, 87);
      pdf.text('Schedule Your Free Strategy Consultation', margin, yPos + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Discuss your personalized financial strategy with a licensed professional.', margin, yPos + 15);
      pdf.text('Visit: theprosperityfinancial.com/contact', margin, yPos + 23);
      
      pdf.setTextColor(0, 0, 0);
      yPos += 45;

      // =====================
      // DISCLAIMER
      // =====================
      checkPageBreak(25);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const disclaimer = 'DISCLAIMER: This report is for educational purposes only and does not constitute financial, tax, or legal advice. Consult with qualified professionals before making financial decisions. Past performance does not guarantee future results. Insurance products involve costs, fees, and risks that should be carefully considered.';
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

      // Save to database
      const productRecsData = getProductRecommendations();
      const reportData = {
        summary: {
          client_name: `${profileData.name_first} ${profileData.name_last}`,
          generated_date: new Date().toISOString()
        },
        coverage_analysis: {
          dime_need: DIME.dime_need,
          current_coverage: DIME.currentCoverage,
          protection_gap: DIME.protection_gap
        },
        product_fit: {
          iul: productRecsData.iul,
          fia: productRecsData.fia
        },
        tax_buckets: {
          tax_now: { percent: metrics.tax_bucket_now_pct, amount: taxNowAmount },
          tax_later: { percent: metrics.tax_bucket_later_pct, amount: taxLaterAmount },
          tax_never: { percent: metrics.tax_bucket_never_pct, amount: taxNeverAmount }
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
        description: "Your financial needs assessment has been downloaded."
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

                  {/* Scenario Comparison - "What happens if you don't change vs what improves" */}
                  {scenarioComparison && (
                    <>
                      {/* Allocation Sources & Input Card */}
                      <AllocationInputCard
                        allocationSources={allocationSources}
                        protectionGap={DIME.protection_gap}
                        incomeGapMonthly={retirementResult?.projection.monthly_gap || 0}
                        onIULAllocationChange={setIulAllocation}
                        onAnnuityAllocationChange={setAnnuityAllocation}
                        iulAllocation={iulAllocation}
                        annuityAllocation={annuityAllocation}
                        iulEligible={scenarioComparison.iul_eligibility?.is_eligible ?? false}
                        annuityEligible={scenarioComparison.annuity_eligibility?.is_eligible ?? false}
                        iulExclusionReason={scenarioComparison.iul_eligibility?.exclusion_reason}
                        annuityExclusionReason={scenarioComparison.annuity_eligibility?.exclusion_reason}
                      />
                      
                      {/* Side-by-Side Comparison Table */}
                      <ScenarioComparisonCard 
                        comparison={scenarioComparison} 
                        clientAllocations={{ iul: iulAllocation, annuity: annuityAllocation }}
                      />
                      
                      {/* Timeline Visualization */}
                      <RetirementTimeline 
                        scenarioA={scenarioComparison.scenario_a}
                        scenarioB={scenarioComparison.scenario_b}
                        retirementAge={profileData.retirement_age || 65}
                      />
                      
                      {/* Plain-English Explanation */}
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-700" />
                            What This Means For You
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">
                            {scenarioComparison.plain_english_summary}
                          </p>
                        </CardContent>
                      </Card>
                      
                      {/* Why IUL/Annuity Exists (Soft Positioning) */}
                      {(scenarioComparison.includes_iul || scenarioComparison.includes_annuity) && (
                        <Card className="bg-muted/50">
                          <CardHeader>
                            <CardTitle>Why These Strategies Exist in Your Plan</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {scenarioComparison.product_positioning.iul_explanation && (
                              <div className="flex items-start gap-3">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                                  Tax-Free Income
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {scenarioComparison.product_positioning.iul_explanation}
                                </p>
                              </div>
                            )}
                            {scenarioComparison.product_positioning.annuity_explanation && (
                              <div className="flex items-start gap-3">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 shrink-0">
                                  Guaranteed Income
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {scenarioComparison.product_positioning.annuity_explanation}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Disclaimer */}
                      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                        {scenarioComparison.disclaimer}
                      </div>
                    </>
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
